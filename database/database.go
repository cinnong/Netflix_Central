package database

import (
	"database/sql"
	"log"
	"os"
	"path/filepath"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

func InitDB() {
	dbDir := "database"
	dbPath := filepath.Join(dbDir, "app.db")

	if err := os.MkdirAll(dbDir, os.ModePerm); err != nil {
		log.Fatalf("failed to create database directory: %v", err)
	}

	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		file, err := os.Create(dbPath)
		if err != nil {
			log.Fatalf("failed to create database file: %v", err)
		}
		if err := file.Close(); err != nil {
			log.Fatalf("failed to close database file: %v", err)
		}
	}

	sqlDB, err := sql.Open("sqlite3", dbPath)
	if err != nil {
		log.Fatalf("failed to open database: %v", err)
	}

	if _, err := sqlDB.Exec("PRAGMA foreign_keys=ON;"); err != nil {
		log.Printf("warning: failed to enable foreign keys: %v", err)
	}

	if _, err := sqlDB.Exec("PRAGMA journal_mode=WAL;"); err != nil {
		log.Printf("warning: failed to enable WAL mode: %v", err)
	}

	const usersSchema = `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT NOT NULL UNIQUE,
		password_hash TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`

	if _, err := sqlDB.Exec(usersSchema); err != nil {
		log.Fatalf("failed to create users table: %v", err)
	}

	if _, err := sqlDB.Exec(accountsSchema); err != nil {
		log.Fatalf("failed to apply accounts schema: %v", err)
	}
	ensureAccountsUserID(sqlDB)
	ensureAccountsStatus(sqlDB)

	if _, err := sqlDB.Exec(tabsSchema); err != nil {
		log.Fatalf("failed to apply tabs schema: %v", err)
	}

	db = sqlDB
}

func GetDB() *sql.DB {
	return db
}

func ensureAccountsUserID(sqlDB *sql.DB) {
	rows, err := sqlDB.Query(`PRAGMA table_info(accounts);`)
	if err != nil {
		log.Printf("warning: cannot inspect accounts schema: %v", err)
		return
	}
	defer rows.Close()

	hasUserID := false
	for rows.Next() {
		var cid int
		var name, colType string
		var notNull int
		var dfltValue sql.NullString
		var pk int
		if err := rows.Scan(&cid, &name, &colType, &notNull, &dfltValue, &pk); err != nil {
			log.Printf("warning: scan accounts schema: %v", err)
			return
		}
		if name == "user_id" {
			hasUserID = true
		}
	}

	if !hasUserID {
		if _, err := sqlDB.Exec(`ALTER TABLE accounts ADD COLUMN user_id INTEGER;`); err != nil {
			log.Printf("warning: add user_id to accounts: %v", err)
		} else {
			hasUserID = true
		}
	}

	if hasUserID {
		if _, err := sqlDB.Exec(`CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);`); err != nil {
			log.Printf("warning: create accounts user index: %v", err)
		}
	}

	var uid int64
	if err := sqlDB.QueryRow(`SELECT id FROM users ORDER BY id ASC LIMIT 1;`).Scan(&uid); err == nil {
		if _, err := sqlDB.Exec(`UPDATE accounts SET user_id = ? WHERE user_id IS NULL;`, uid); err != nil {
			log.Printf("warning: backfill accounts user_id: %v", err)
		}
	}
}

func ensureAccountsStatus(sqlDB *sql.DB) {
	rows, err := sqlDB.Query(`PRAGMA table_info(accounts);`)
	if err != nil {
		log.Printf("warning: cannot inspect accounts schema: %v", err)
		return
	}
	defer rows.Close()

	hasStatus := false
	for rows.Next() {
		var cid int
		var name, colType string
		var notNull int
		var dfltValue sql.NullString
		var pk int
		if err := rows.Scan(&cid, &name, &colType, &notNull, &dfltValue, &pk); err != nil {
			log.Printf("warning: scan accounts schema: %v", err)
			return
		}
		if name == "status" {
			hasStatus = true
		}
	}

	if !hasStatus {
		if _, err := sqlDB.Exec(`ALTER TABLE accounts ADD COLUMN status TEXT NOT NULL DEFAULT 'active';`); err != nil {
			log.Printf("warning: add status to accounts: %v", err)
			return
		}
	}

	if _, err := sqlDB.Exec(`UPDATE accounts SET status = 'active' WHERE status IS NULL OR status = '';`); err != nil {
		log.Printf("warning: backfill accounts status: %v", err)
	}
}

const accountsSchema = `
CREATE TABLE IF NOT EXISTS accounts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL,
	label TEXT NOT NULL,
	netflix_email TEXT NOT NULL,
	status TEXT NOT NULL DEFAULT 'active',
	chrome_profile TEXT NOT NULL UNIQUE,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
`

const tabsSchema = `
CREATE TABLE IF NOT EXISTS tabs (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	account_id INTEGER NOT NULL,
	title TEXT NOT NULL,
	url TEXT NOT NULL,
	position INTEGER NOT NULL,
	FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tabs_account_id ON tabs(account_id);
`

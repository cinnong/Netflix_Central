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

	if _, err := sqlDB.Exec(accountsSchema); err != nil {
		log.Fatalf("failed to apply accounts schema: %v", err)
	}

	if _, err := sqlDB.Exec(tabsSchema); err != nil {
		log.Fatalf("failed to apply tabs schema: %v", err)
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

	db = sqlDB
}

func GetDB() *sql.DB {
	return db
}

const accountsSchema = `
CREATE TABLE IF NOT EXISTS accounts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	label TEXT NOT NULL,
	netflix_email TEXT NOT NULL,
	chrome_profile TEXT NOT NULL UNIQUE,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
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

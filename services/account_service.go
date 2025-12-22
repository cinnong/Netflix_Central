package services

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"netflix_central/models"
)

// ListAccounts returns accounts owned by the authenticated user.
func ListAccounts(ctx context.Context, db *sql.DB, userID int64) ([]models.Account, error) {
	rows, err := db.QueryContext(ctx, `SELECT id, user_id, label, netflix_email, chrome_profile, created_at FROM accounts WHERE user_id = ? ORDER BY created_at DESC;`, userID)
	if err != nil {
		return nil, fmt.Errorf("query accounts: %w", err)
	}
	defer rows.Close()

	var accounts []models.Account
	for rows.Next() {
		var acc models.Account
		var created string
		if err := rows.Scan(&acc.ID, &acc.UserID, &acc.Label, &acc.NetflixEmail, &acc.ChromeProfile, &created); err != nil {
			return nil, fmt.Errorf("scan account: %w", err)
		}
		acc.CreatedAt = parseSQLiteTime(created)
		accounts = append(accounts, acc)
	}

	return accounts, rows.Err()
}

// GetAccount ensures the account belongs to the given user.
func GetAccount(ctx context.Context, db *sql.DB, id, userID int64) (models.Account, error) {
	var acc models.Account
	var created string
	if err := db.QueryRowContext(
		ctx,
		`SELECT id, user_id, label, netflix_email, chrome_profile, created_at FROM accounts WHERE id = ? AND user_id = ?;`,
		id,
		userID,
	).Scan(&acc.ID, &acc.UserID, &acc.Label, &acc.NetflixEmail, &acc.ChromeProfile, &created); err != nil {
		return acc, err
	}
	acc.CreatedAt = parseSQLiteTime(created)
	return acc, nil
}

// CreateAccount inserts a new account tied to the user.
func CreateAccount(ctx context.Context, db *sql.DB, userID int64, label, email string) (models.Account, error) {
	label = strings.TrimSpace(label)
	email = strings.TrimSpace(email)

	if label == "" || email == "" {
		return models.Account{}, fmt.Errorf("label and email are required")
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return models.Account{}, err
	}

	profileName := generateProfileName(label, email)
	createdAt := time.Now().UTC().Format(time.RFC3339Nano)

	result, err := tx.ExecContext(
		ctx,
		`INSERT INTO accounts (user_id, label, netflix_email, chrome_profile, created_at) VALUES (?, ?, ?, ?, ?);`,
		userID,
		label,
		email,
		profileName,
		createdAt,
	)
	if err != nil {
		tx.Rollback()
		return models.Account{}, fmt.Errorf("insert account: %w", err)
	}

	accountID, err := result.LastInsertId()
	if err != nil {
		tx.Rollback()
		return models.Account{}, fmt.Errorf("get account id: %w", err)
	}

	if err := InsertDefaultTabs(ctx, tx, accountID); err != nil {
		tx.Rollback()
		return models.Account{}, err
	}

	if err := tx.Commit(); err != nil {
		return models.Account{}, fmt.Errorf("commit account: %w", err)
	}

	return models.Account{
		ID:            accountID,
		UserID:        userID,
		Label:         label,
		NetflixEmail:  email,
		ChromeProfile: profileName,
		CreatedAt:     parseSQLiteTime(createdAt),
	}, nil
}

// UpdateAccount edits an account owned by the user.
func UpdateAccount(ctx context.Context, db *sql.DB, id, userID int64, label, email string) (models.Account, error) {
	label = strings.TrimSpace(label)
	email = strings.TrimSpace(email)

	result, err := db.ExecContext(
		ctx,
		`UPDATE accounts SET label = ?, netflix_email = ? WHERE id = ? AND user_id = ?;`,
		label,
		email,
		id,
		userID,
	)
	if err != nil {
		return models.Account{}, fmt.Errorf("update account: %w", err)
	}

	if rows, _ := result.RowsAffected(); rows == 0 {
		return models.Account{}, sql.ErrNoRows
	}

	return GetAccount(ctx, db, id, userID)
}

// DeleteAccount removes an account owned by the user.
func DeleteAccount(ctx context.Context, db *sql.DB, id, userID int64) error {
	_, err := db.ExecContext(ctx, `DELETE FROM tabs WHERE account_id = ?;`, id)
	if err != nil {
		return fmt.Errorf("delete tabs for account: %w", err)
	}

	result, err := db.ExecContext(ctx, `DELETE FROM accounts WHERE id = ? AND user_id = ?;`, id, userID)
	if err != nil {
		return fmt.Errorf("delete account: %w", err)
	}

	if rows, _ := result.RowsAffected(); rows == 0 {
		return sql.ErrNoRows
	}
	return nil
}

func generateProfileName(label, email string) string {
	base := strings.ToLower(strings.ReplaceAll(label, " ", "-"))
	if base == "" {
		parts := strings.Split(email, "@")
		base = parts[0]
	}
	base = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			return r
		}
		return '-'
	}, base)
	return fmt.Sprintf("profile-%s-%d", base, time.Now().UnixNano())
}

func parseSQLiteTime(value string) time.Time {
	if value == "" {
		return time.Time{}
	}

	if t, err := time.Parse(time.RFC3339Nano, value); err == nil {
		return t
	}

	if t, err := time.Parse("2006-01-02 15:04:05", value); err == nil {
		return t
	}

	return time.Time{}
}

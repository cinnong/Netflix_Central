package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"netflix_central/models"
)

var defaultTabs = []models.Tab{
	{Title: "Netflix Account", URL: "https://www.netflix.com/account", Position: 1},
	{Title: "Netflix Password", URL: "https://www.netflix.com/password", Position: 2},
	{Title: "Netflix Login Help", URL: "https://www.netflix.com/id/loginhelp", Position: 3},
	{Title: "Gmail", URL: "https://mail.google.com/", Position: 4},
	{Title: "Netflix TV", URL: "https://www.netflix.com/tv2", Position: 5},
}

func InsertDefaultTabs(ctx context.Context, tx *sql.Tx, accountID int64) error {
	for _, tab := range defaultTabs {
		if _, err := tx.ExecContext(
			ctx,
			`INSERT INTO tabs (account_id, title, url, position) VALUES (?, ?, ?, ?);`,
			accountID,
			tab.Title,
			tab.URL,
			tab.Position,
		); err != nil {
			return fmt.Errorf("insert default tab: %w", err)
		}
	}
	return nil
}

func GetTabs(ctx context.Context, db *sql.DB, accountID int64) ([]models.Tab, error) {
	rows, err := db.QueryContext(
		ctx,
		`SELECT id, account_id, title, url, position FROM tabs WHERE account_id = ? ORDER BY position ASC;`,
		accountID,
	)
	if err != nil {
		return nil, fmt.Errorf("query tabs: %w", err)
	}
	defer rows.Close()

	var tabs []models.Tab
	for rows.Next() {
		var tab models.Tab
		if err := rows.Scan(&tab.ID, &tab.AccountID, &tab.Title, &tab.URL, &tab.Position); err != nil {
			return nil, fmt.Errorf("scan tab: %w", err)
		}
		tabs = append(tabs, tab)
	}

	return tabs, rows.Err()
}

func CreateTab(ctx context.Context, db *sql.DB, accountID int64, title, url string) (models.Tab, error) {
	var tab models.Tab
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return tab, err
	}

	var nextPos sql.NullInt64
	if err := tx.QueryRowContext(
		ctx,
		`SELECT COALESCE(MAX(position), 0) + 1 FROM tabs WHERE account_id = ?;`,
		accountID,
	).Scan(&nextPos); err != nil {
		tx.Rollback()
		return tab, fmt.Errorf("get next position: %w", err)
	}

	result, err := tx.ExecContext(
		ctx,
		`INSERT INTO tabs (account_id, title, url, position) VALUES (?, ?, ?, ?);`,
		accountID,
		title,
		url,
		nextPos.Int64,
	)
	if err != nil {
		tx.Rollback()
		return tab, fmt.Errorf("insert tab: %w", err)
	}

	id, err := result.LastInsertId()
	if err != nil {
		tx.Rollback()
		return tab, fmt.Errorf("get tab id: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return tab, fmt.Errorf("commit tab: %w", err)
	}

	tab = models.Tab{ID: id, AccountID: accountID, Title: title, URL: url, Position: int(nextPos.Int64)}
	return tab, nil
}

func UpdateTab(ctx context.Context, db *sql.DB, tabID, accountID int64, title, url string) (models.Tab, error) {
	result, err := db.ExecContext(
		ctx,
		`UPDATE tabs SET title = ?, url = ? WHERE id = ? AND account_id = ?;`,
		title,
		url,
		tabID,
		accountID,
	)
	if err != nil {
		return models.Tab{}, fmt.Errorf("update tab: %w", err)
	}

	if rows, _ := result.RowsAffected(); rows == 0 {
		return models.Tab{}, sql.ErrNoRows
	}

	var tab models.Tab
	if err := db.QueryRowContext(
		ctx,
		`SELECT id, account_id, title, url, position FROM tabs WHERE id = ? AND account_id = ?;`,
		tabID,
		accountID,
	).Scan(&tab.ID, &tab.AccountID, &tab.Title, &tab.URL, &tab.Position); err != nil {
		return models.Tab{}, fmt.Errorf("reload tab: %w", err)
	}

	return tab, nil
}

func DeleteTab(ctx context.Context, db *sql.DB, tabID, accountID int64) error {
	result, err := db.ExecContext(
		ctx,
		`DELETE FROM tabs WHERE id = ? AND account_id = ?;`,
		tabID,
		accountID,
	)
	if err != nil {
		return fmt.Errorf("delete tab: %w", err)
	}

	if rows, _ := result.RowsAffected(); rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}

func ReorderTabs(ctx context.Context, db *sql.DB, accountID int64, orderedIDs []int64) error {
	if len(orderedIDs) == 0 {
		return errors.New("no tab ids provided")
	}

	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	for idx, id := range orderedIDs {
		if _, err := tx.ExecContext(
			ctx,
			`UPDATE tabs SET position = ? WHERE id = ? AND account_id = ?;`,
			idx+1,
			id,
			accountID,
		); err != nil {
			tx.Rollback()
			return fmt.Errorf("reorder tab %d: %w", id, err)
		}
	}

	return tx.Commit()
}

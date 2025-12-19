package models

// Tab represents a saved tab for an account.
type Tab struct {
	ID        int64  `json:"id"`
	AccountID int64  `json:"account_id"`
	Title     string `json:"title"`
	URL       string `json:"url"`
	Position  int    `json:"position"`
}

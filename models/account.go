package models

import "time"

type Account struct {
	ID            int64     `json:"id"`
	UserID        int64     `json:"-"`
	Label         string    `json:"label"`
	NetflixEmail  string    `json:"netflix_email"`
	ChromeProfile string    `json:"chrome_profile"`
	CreatedAt     time.Time `json:"created_at"`
}

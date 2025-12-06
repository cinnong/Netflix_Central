package models

import "time"

type Account struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	Email              string    `gorm:"uniqueIndex;not null" json:"email"`
	DisplayName        string    `gorm:"not null" json:"display_name"`
	NetflixProfileName string    `gorm:"not null" json:"netflix_profile_name"`
	GmailIndex         int       `gorm:"not null" json:"gmail_index"`
	CreatedAt          time.Time `gorm:"autoCreateTime" json:"created_at"`
}

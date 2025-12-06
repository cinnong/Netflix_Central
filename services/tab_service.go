package services

import (
	"fmt"

	"netflix_central/models"
)

type TabLinks struct {
	NetflixAccount  string `json:"netflix_account"`
	NetflixPassword string `json:"netflix_password"`
	NetflixHelp     string `json:"netflix_help"`
	Gmail           string `json:"gmail"`
	NetflixTV       string `json:"netflix_tv"`
}

func BuildTabLinks(account models.Account) TabLinks {
	return TabLinks{
		NetflixAccount:  "https://www.netflix.com/account",
		NetflixPassword: "https://www.netflix.com/password",
		NetflixHelp:     "https://www.netflix.com/id/loginhelp",
		Gmail:           fmt.Sprintf("https://mail.google.com/mail/u/%d/", account.GmailIndex),
		NetflixTV:       "https://www.netflix.com/tv2",
	}
}

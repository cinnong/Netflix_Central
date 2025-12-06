package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"netflix_central/database"
	"netflix_central/models"
	"netflix_central/services"
)

/*
Example JSON input for POST /accounts and PUT /accounts/:id:
{
   "email": "akunA@gmail.com",
   "display_name": "Akun A",
   "netflix_profile_name": "Profile A",
   "gmail_index": 0
}
*/

type AccountInput struct {
	Email              string `json:"email" binding:"required,email"`
	DisplayName        string `json:"display_name" binding:"required"`
	NetflixProfileName string `json:"netflix_profile_name" binding:"required"`
	GmailIndex         int    `json:"gmail_index" binding:"required"`
}

func GetAccounts(c *gin.Context) {
	var accounts []models.Account
	if err := database.GetDB().Find(&accounts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, accounts)
}

func CreateAccount(c *gin.Context) {
	var input AccountInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	account := models.Account{
		Email:              input.Email,
		DisplayName:        input.DisplayName,
		NetflixProfileName: input.NetflixProfileName,
		GmailIndex:         input.GmailIndex,
	}

	if err := database.GetDB().Create(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, account)
}

func GetAccountByID(c *gin.Context) {
	account, err := fetchAccountByID(c.Param("id"))
	if err != nil {
		handleAccountError(c, err)
		return
	}
	c.JSON(http.StatusOK, account)
}

func UpdateAccount(c *gin.Context) {
	account, err := fetchAccountByID(c.Param("id"))
	if err != nil {
		handleAccountError(c, err)
		return
	}

	var input AccountInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	account.Email = input.Email
	account.DisplayName = input.DisplayName
	account.NetflixProfileName = input.NetflixProfileName
	account.GmailIndex = input.GmailIndex

	if err := database.GetDB().Save(account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, account)
}

func DeleteAccount(c *gin.Context) {
	account, err := fetchAccountByID(c.Param("id"))
	if err != nil {
		handleAccountError(c, err)
		return
	}

	if err := database.GetDB().Delete(account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func GetAccountTabs(c *gin.Context) {
	account, err := fetchAccountByID(c.Param("id"))
	if err != nil {
		handleAccountError(c, err)
		return
	}

	tabs := services.BuildTabLinks(*account)
	c.JSON(http.StatusOK, tabs)
}

func fetchAccountByID(idParam string) (*models.Account, error) {
	id, err := strconv.Atoi(idParam)
	if err != nil {
		return nil, fmt.Errorf("invalid id: %w", err)
	}

	var account models.Account
	dbErr := database.GetDB().First(&account, id).Error
	if dbErr != nil {
		return nil, dbErr
	}

	return &account, nil
}

func handleAccountError(c *gin.Context, err error) {
	var numErr *strconv.NumError
	switch {
	case errors.As(err, &numErr):
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid account id"})
	case errors.Is(err, gorm.ErrRecordNotFound):
		c.JSON(http.StatusNotFound, gin.H{"error": "account not found"})
	default:
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	}
}

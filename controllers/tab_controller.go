package controllers

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"netflix_central/database"
	"netflix_central/services"
)

type tabPayload struct {
	Title string `json:"title" binding:"required"`
	URL   string `json:"url" binding:"required"`
}

type reorderPayload struct {
	Order []int64 `json:"order" binding:"required"`
}

func GetTabsByAccount(c *gin.Context) {
	accountID, err := parseID(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid account id"})
		return
	}

	tabs, err := services.GetTabs(c.Request.Context(), database.GetDB(), accountID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, tabs)
}

func CreateTabForAccount(c *gin.Context) {
	accountID, err := parseID(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid account id"})
		return
	}

	var payload tabPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tab, err := services.CreateTab(c.Request.Context(), database.GetDB(), accountID, payload.Title, payload.URL)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, tab)
}

func UpdateTabForAccount(c *gin.Context) {
	accountID, err := parseID(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid account id"})
		return
	}

	tabID, err := strconv.ParseInt(c.Param("tabId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tab id"})
		return
	}

	var payload tabPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tab, err := services.UpdateTab(c.Request.Context(), database.GetDB(), tabID, accountID, payload.Title, payload.URL)
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "tab not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, tab)
}

func DeleteTabForAccount(c *gin.Context) {
	accountID, err := parseID(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid account id"})
		return
	}

	tabID, err := strconv.ParseInt(c.Param("tabId"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid tab id"})
		return
	}

	if err := services.DeleteTab(c.Request.Context(), database.GetDB(), tabID, accountID); err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "tab not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

func ReorderTabsForAccount(c *gin.Context) {
	accountID, err := parseID(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid account id"})
		return
	}

	var payload reorderPayload
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := services.ReorderTabs(c.Request.Context(), database.GetDB(), accountID, payload.Order); err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, gin.H{"error": "tab not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Status(http.StatusNoContent)
}

package controllers

import "github.com/gin-gonic/gin"

// currentUserID retrieves the authenticated user id from context.
func currentUserID(c *gin.Context) (int64, bool) {
	val, ok := c.Get("user_id")
	if !ok {
		return 0, false
	}
	id, ok := val.(int64)
	return id, ok
}

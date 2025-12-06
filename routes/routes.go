package routes

import (
	"github.com/gin-gonic/gin"

	"netflix_central/controllers"
)

func SetupRouter() *gin.Engine {
	router := gin.Default()

	accounts := router.Group("/accounts")
	{
		accounts.GET("", controllers.GetAccounts)
		accounts.POST("", controllers.CreateAccount)
		accounts.GET("/:id", controllers.GetAccountByID)
		accounts.PUT("/:id", controllers.UpdateAccount)
		accounts.DELETE("/:id", controllers.DeleteAccount)
		accounts.GET("/:id/tabs", controllers.GetAccountTabs)
	}

	return router
}

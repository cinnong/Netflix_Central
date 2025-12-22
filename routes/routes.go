package routes

import (
	"net/http"
	"netflix_central/controllers"
	"netflix_central/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {
	router := gin.Default()
	router.Use(cors())

	router.POST("/auth/register", controllers.Register)
	router.POST("/auth/login", controllers.Login)

	protected := router.Group("/")
	protected.Use(middleware.AuthRequired())

	accounts := protected.Group("/accounts")
	{
		accounts.GET("", controllers.GetAccounts)
		accounts.POST("", controllers.CreateAccount)
		accounts.GET("/:id", controllers.GetAccountByID)
		accounts.PUT("/:id", controllers.UpdateAccount)
		accounts.DELETE("/:id", controllers.DeleteAccount)
		accounts.POST("/:id/open", controllers.OpenAccountSession)
		accounts.GET("/:id/tabs", controllers.GetTabsByAccount)
		accounts.POST("/:id/tabs", controllers.CreateTabForAccount)
		accounts.PUT("/:id/tabs/:tabId", controllers.UpdateTabForAccount)
		accounts.DELETE("/:id/tabs/:tabId", controllers.DeleteTabForAccount)
		accounts.PATCH("/:id/tabs/reorder", controllers.ReorderTabsForAccount)
	}
	return router
}

func cors() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH,OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

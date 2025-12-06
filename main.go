package main

import (
	"log"

	"netflix_central/database"
	"netflix_central/routes"
)

func main() {
	database.InitDB()

	router := routes.SetupRouter()

	if err := router.Run(); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}

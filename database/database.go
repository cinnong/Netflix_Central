package database

import (
	"log"
	"os"
	"path/filepath"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"

	"netflix_central/models"
)

var DB *gorm.DB

func InitDB() {
	dbDir := "database"
	dbPath := filepath.Join(dbDir, "app.db")

	if err := os.MkdirAll(dbDir, os.ModePerm); err != nil {
		log.Fatalf("failed to create database directory: %v", err)
	}

	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		file, err := os.Create(dbPath)
		if err != nil {
			log.Fatalf("failed to create database file: %v", err)
		}
		if err := file.Close(); err != nil {
			log.Fatalf("failed to close database file: %v", err)
		}
	}

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}

	if err := db.AutoMigrate(&models.Account{}); err != nil {
		log.Fatalf("failed to migrate database: %v", err)
	}

	DB = db
}

func GetDB() *gorm.DB {
	return DB
}

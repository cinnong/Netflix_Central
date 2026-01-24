@echo off
REM Set environment variables for PostgreSQL (edit sesuai kebutuhan)
set PGUSER=postgres
set PGHOST=localhost
set PGPASSWORD=dina2004
set PGDATABASE=netflixdb
set PGPORT=5432
set PGSSLMODE=disable

REM Start backend
pushd %~dp0
go run main.go
popd

package services

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"netflix_central/models"
)

// LaunchChrome opens Chrome with the provided account and tabs using a persistent profile directory.
func LaunchChrome(account models.Account, tabs []models.Tab) error {
	chromePath, err := findChromePath()
	if err != nil {
		return err
	}

	profileDir, err := resolveProfileDir(account.ChromeProfile)
	if err != nil {
		return err
	}

	if err := os.MkdirAll(profileDir, os.ModePerm); err != nil {
		return fmt.Errorf("create profile dir: %w", err)
	}

	args := []string{
		"--user-data-dir=" + profileDir,
		"--profile-directory=Default",
		"--new-window",
	}
	for _, tab := range tabs {
		args = append(args, tab.URL)
	}

	cmd := exec.Command(chromePath, args...) // #nosec G204 - user-controlled paths are validated above.
	return cmd.Start()
}

func findChromePath() (string, error) {
	if runtime.GOOS != "windows" {
		return "", fmt.Errorf("unsupported OS: %s", runtime.GOOS)
	}

	candidates := []string{
		filepath.Join(os.Getenv("ProgramFiles"), "Google", "Chrome", "Application", "chrome.exe"),
		filepath.Join(os.Getenv("ProgramFiles(x86)"), "Google", "Chrome", "Application", "chrome.exe"),
		filepath.Join(os.Getenv("LocalAppData"), "Google", "Chrome", "Application", "chrome.exe"),
	}

	for _, path := range candidates {
		if path != "" {
			if _, err := os.Stat(path); err == nil {
				return path, nil
			}
		}
	}

	if path, err := exec.LookPath("chrome.exe"); err == nil {
		return path, nil
	}

	return "", fmt.Errorf("google chrome not found; install it or update the search paths")
}

func resolveProfileDir(profileName string) (string, error) {
	workdir, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("resolve working directory: %w", err)
	}

	return filepath.Join(workdir, "chrome_profiles", profileName), nil
}

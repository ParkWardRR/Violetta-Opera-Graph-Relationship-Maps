package main

import (
	"fmt"
	"log"

	"github.com/playwright-community/playwright-go"
)

type BrowserManager struct {
	pw      *playwright.Playwright
	browser playwright.Browser
}

func NewBrowserManager() (*BrowserManager, error) {
	return &BrowserManager{}, nil
}

func (bm *BrowserManager) Start(headless bool) error {
	var err error
	bm.pw, err = playwright.Run()
	if err != nil {
		return fmt.Errorf("could not start playwright: %w", err)
	}

	bm.browser, err = bm.pw.Chromium.Launch(playwright.BrowserTypeLaunchOptions{
		Headless: playwright.Bool(headless),
	})
	if err != nil {
		bm.pw.Stop()
		return fmt.Errorf("could not launch browser: %w", err)
	}

	return nil
}

func (bm *BrowserManager) Stop() {
	if bm.browser != nil {
		if err := bm.browser.Close(); err != nil {
			log.Printf("Error closing browser: %v", err)
		}
	}
	if bm.pw != nil {
		if err := bm.pw.Stop(); err != nil {
			log.Printf("Error stopping playwright: %v", err)
		}
	}
}

func (bm *BrowserManager) NewPage(userAgent string) (playwright.Page, error) {
	context, err := bm.browser.NewContext(playwright.BrowserNewContextOptions{
		UserAgent: playwright.String(userAgent),
	})
	if err != nil {
		return nil, fmt.Errorf("could not create context: %w", err)
	}

	page, err := context.NewPage()
	if err != nil {
		context.Close()
		return nil, fmt.Errorf("could not create page: %w", err)
	}

	return page, nil
}

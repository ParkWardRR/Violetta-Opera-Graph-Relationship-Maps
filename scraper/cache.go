package main

import (
	"crypto/sha256"
	"encoding/hex"
	"io/ioutil"
	"os"
	"path/filepath"
	"time"
)

type HTMLCache struct {
	baseDir string
	ttl     time.Duration
}

func NewHTMLCache(baseDir string, ttlHours int) *HTMLCache {
	return &HTMLCache{
		baseDir: baseDir,
		ttl:     time.Duration(ttlHours) * time.Hour,
	}
}

func (c *HTMLCache) Get(url string) ([]byte, bool) {
	path := c.getFilePath(url)
	info, err := os.Stat(path)
	if os.IsNotExist(err) {
		return nil, false
	}

	if time.Since(info.ModTime()) > c.ttl {
		return nil, false
	}

	data, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, false
	}

	return data, true
}

func (c *HTMLCache) Put(url string, content []byte) error {
	path := c.getFilePath(url)
	return ioutil.WriteFile(path, content, 0644)
}

func (c *HTMLCache) getFilePath(url string) string {
	hash := sha256.Sum256([]byte(url))
	filename := hex.EncodeToString(hash[:]) + ".html"
	return filepath.Join(c.baseDir, filename)
}

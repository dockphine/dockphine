# VHS tape script — generates the real README demo GIF from an actual terminal session.
#
# Install VHS: https://github.com/charmbracelet/vhs
#   brew install vhs        (macOS)
#   go install github.com/charmbracelet/vhs@latest
#
# Then, from the repo root (with the CLI already built + `npm link`'d):
#   vhs docs/demo.tape
#
# This writes docs/demo.gif, which README.md already references.

Output docs/demo.gif

Set Theme "Dracula"
Set FontSize 16
Set Width 1200
Set Height 700
Set Padding 20
Set TypingSpeed 60ms

Type "npx create-dockphine-strapi"
Sleep 500ms
Enter
Sleep 2s

# --- Walk through the prompts ---
# Mode: New Project
Down 0
Enter
Sleep 800ms

# Project name (accept default, or type your own)
Type "my-blog-api"
Enter
Sleep 800ms

# Strapi version: v5
Enter
Sleep 800ms

# Database: Postgres
Enter
Sleep 800ms

# Port: accept default
Enter
Sleep 800ms

# Deploy target: Generic VPS
Enter
Sleep 800ms

# Build mode: build now
Enter
Sleep 800ms

# Use AI agent context files: yes
Enter
Sleep 800ms

# Pick Claude Code
Space
Enter
Sleep 2s

Sleep 3s

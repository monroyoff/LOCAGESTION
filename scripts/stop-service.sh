#!/bin/bash
# ===================================================================
# LOCAGESTION - Arrêt du Service
# ===================================================================

PROJECT_DIR="/Users/MAC/LOCAGESTION"
cd "$PROJECT_DIR" || exit 1

echo "Arrêt du service LOCAGESTION..."
launchctl unload ~/Library/LaunchAgents/com.locagestion.server.plist 2>/dev/null || true

# Arrêter d'éventuels processus résiduels sur le port 3001
EXISTING_PID=$(lsof -ti:3001 2>/dev/null)
if [ -n "$EXISTING_PID" ]; then
    kill -9 $EXISTING_PID 2>/dev/null || true
fi

# Nettoyer également PM2 si jamais un process résiduel subsiste
which pm2 >/dev/null 2>&1 && pm2 delete locagestion 2>/dev/null || true

echo "✓ Service LOCAGESTION arrêté."

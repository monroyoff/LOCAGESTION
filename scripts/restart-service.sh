#!/bin/bash
# ===================================================================
# LOCAGESTION - Redémarrage du Service
# ===================================================================

PROJECT_DIR="/Users/MAC/LOCAGESTION"
cd "$PROJECT_DIR" || exit 1

echo "Redémarrage du service LOCAGESTION..."
launchctl unload ~/Library/LaunchAgents/com.locagestion.server.plist 2>/dev/null || true

# Arrêter d'éventuels processus orphelins sur le port 3001
EXISTING_PID=$(lsof -ti:3001 2>/dev/null)
if [ -n "$EXISTING_PID" ]; then
    kill -9 $EXISTING_PID 2>/dev/null || true
fi

sleep 1
launchctl load ~/Library/LaunchAgents/com.locagestion.server.plist 2>/dev/null || true

echo "✓ Service LOCAGESTION relancé."

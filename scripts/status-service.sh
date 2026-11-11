#!/bin/bash
# ===================================================================
# LOCAGESTION - Statut du Service
# ===================================================================

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/portal 2>/dev/null)
PID=$(lsof -ti:3001 2>/dev/null)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✓ LOCAGESTION est ACTIF et répond sur http://localhost:3001/portal"
    echo "  PID du serveur : $PID"
else
    echo "✗ LOCAGESTION est INACTIF ou ne répond pas (Code HTTP: $HTTP_CODE)"
fi


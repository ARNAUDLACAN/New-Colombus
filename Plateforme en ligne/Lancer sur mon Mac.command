#!/bin/bash
cd "$(dirname "$0")"
if ! command -v node >/dev/null; then echo "Installez d'abord Node.js (https://nodejs.org, version LTS)."; read -p "Entrée pour fermer"; exit 1; fi
[ -d node_modules ] || npm install --omit=dev
IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null)
echo ""
echo "  Animateur : http://localhost:3000/animateur"
[ -n "$IP" ] && echo "  Équipes   : http://$IP:3000   (même réseau Wi-Fi)"
[ -z "$ANTHROPIC_API_KEY" ] && echo "  Entretiens : mode sans IA (aucune clé ANTHROPIC_API_KEY définie)"
echo "  (fermez cette fenêtre pour arrêter le serveur)"
echo ""
(sleep 2; open "http://localhost:3000/animateur") &
npm start

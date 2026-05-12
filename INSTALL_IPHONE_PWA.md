# Night Case Calendar auf dem iPhone installieren

## Wichtig
Die PWA-Funktionen funktionieren auf dem iPhone nur richtig, wenn die App über **HTTPS** oder `localhost` geöffnet wird. Direkt aus der Dateien-App per `file://` kann Safari den Service Worker nicht aktivieren.

## Installation auf dem iPhone 16 Pro
1. Lade den entpackten Projektordner auf einen HTTPS-Host, zum Beispiel GitHub Pages, Netlify, Vercel oder einen eigenen Webspace.
2. Öffne die `index.html`-Adresse in **Safari** auf dem iPhone.
3. Tippe unten auf den **Teilen-Button**.
4. Wähle **Zum Home-Bildschirm**.
5. Tippe auf **Hinzufügen**.
6. Starte Night Case über das neue Icon auf dem Home-Bildschirm.

## Danach
- Die App startet im Standalone-Modus ohne Safari-Leiste.
- Die wichtigsten Dateien werden offline gecacht.
- Deine Kalenderdaten bleiben lokal im Browser-Speicher des iPhones.
- Exportiere regelmäßig ein JSON-Backup.

## Kostenlos hosten
Für private Tests reicht normalerweise ein kostenloser Anbieter wie GitHub Pages, Netlify oder Vercel.

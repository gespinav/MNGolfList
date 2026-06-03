# Minnesota Public Golf — Master Rankings 2025–26

A fully self-contained single-page web app for ranking, tracking, and exploring Minnesota's public golf courses.

🌐 **Live Site:** [View on GitHub Pages](https://YOUR-USERNAME.github.io/MNGolfList/)

---

## Features

- Master rankings of Minnesota public golf courses
- Personal bucket list tracker with played/unplayed status
- Interactive course detail modals with Leaflet maps
- Scorecard data and course metadata
- Round logging and photo upload (stored in IndexedDB — private to your browser)
- Fully offline-capable after first load (PWA-ready)
- No backend, no database, no dependencies to install

## Usage

Open `index.html` in any modern browser — or visit the live GitHub Pages link above.

All personal data (played courses, rounds, photos) is saved **locally in your browser** via `localStorage` and `IndexedDB`. Nothing is sent to a server.

## Tech Stack

- Vanilla HTML / CSS / JavaScript (zero build tools)
- [Leaflet.js](https://leafletjs.com/) — loaded on-demand for maps
- [IBM Plex Sans & Libre Baskerville](https://fonts.google.com/) — typography
- [OpenStreetMap](https://www.openstreetmap.org/) — map tile provider

## Local Development

No build step needed. Just open the file:

```bash
# Option 1 — direct file open
open index.html

# Option 2 — local dev server (avoids any browser file:// restrictions)
npx serve .
# or
python3 -m http.server 8080
```

## Deployment

This site is deployed via **GitHub Pages** from the `main` branch root.

To deploy your own copy:
1. Fork or clone this repository
2. Go to **Settings → Pages**
3. Set source to `main` branch, `/ (root)` folder
4. Save — your site will be live at `https://YOUR-USERNAME.github.io/MNGolfList/`

## License

Personal project. Course data is compiled from public sources. All rights reserved.

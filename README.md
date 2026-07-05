# JR Terminal - Bloomberg-style Portfolio

A single-page personal website for **Jiwesh Rajbhandari** that looks and behaves like a
Bloomberg Terminal. Built with plain HTML/CSS/JS (zero dependencies, zero build step) so it
can be dropped on any static host and shared via an NFC tag.

## Features

- **Boot / login sequence** with typed lines, blinking cursor, and CRT scanlines.
- **Command line** (`CMD>`): type a command and press `ENTER`.
  - Autocomplete (ghost text) - press `Tab` or `→` to accept.
  - Command history via `↑` / `↓`.
- **Function keys** `F1`-`F8` (and clickable buttons) jump between screens.
- **Live ticker tape**: real market quotes (SPY, QQQ, AAPL, NVDA, BTC, VIX, US10Y, ...)
  from Yahoo Finance via the free allorigins.win CORS proxy - no API key needed, refreshed
  every 60s. Click a symbol to open its Yahoo Finance page. If the feed is unreachable the
  tape falls back to simulated skill quotes.
- **Interactive canvas charts** for project metrics (GNN accuracy vs baseline, strategy
  equity curve) with hover (desktop) / tap (mobile) crosshair tooltips.
- **Draggable, resizable panels** on desktop; `TILE` arranges them in a grid.
- **Live clock + market status** (NYSE-style open/closed) in the header.
- **Keypress beeps** (toggle with the `SND` button or the `MUTE` command).
- **Mobile-adapted**: on phones (the main NFC use case) panels stack in a single tap-friendly
  column, the boot sequence is shortened, and charts respond to tap.

## Commands

| Command        | Action                                   |
| -------------- | ---------------------------------------- |
| `HELP` / `?`   | Show the command menu                    |
| `BIO` / `DES`  | Professional summary                     |
| `EXP`          | Work experience                          |
| `EDU`          | Education                                |
| `PROJ [n]`     | Projects (`PROJ 1` / `PROJ 2` = chart)   |
| `SKILL`        | Live skills monitor                      |
| `GIP` / `CHART`| Open project metric charts               |
| `MSG`/`CONTACT`| Contact details                          |
| `CV` / `PRINT` | Open / download the resume PDF           |
| `TILE`         | Arrange open panels in a grid            |
| `CLS`/`CLEAR`  | Close all panels                         |
| `MUTE`         | Toggle sound                             |

## Run locally

No build needed. Because the browser blocks loading the PDF from `file://` in some cases,
serve it over a tiny local HTTP server:

```powershell
# From this folder (Python 3)
python -m http.server 8000
```

Then open http://localhost:8000. (Opening `index.html` directly usually works too, but the
resume download is more reliable when served.)

## File structure

```
website/
  index.html          # terminal shell
  css/styles.css      # Bloomberg theme, panels, ticker, responsive layout
  js/content.js       # ALL resume data lives here - edit this to update the site
  js/ticker.js        # live skill price ticker
  js/charts.js        # canvas chart renderer
  js/panels.js        # draggable / resizable panel manager
  js/terminal.js      # boot, commands, keyboard nav, clock, orchestration
  assets/Jiwesh_Rajbhandari_Resume.pdf
```

To update any content (jobs, projects, skills, contact), edit **`js/content.js`** only.

## Deploy (pick one)

### GitHub Pages
1. Create a repo and push these files.
2. Repo **Settings -> Pages -> Build and deployment -> Source: Deploy from a branch**,
   branch `main`, folder `/ (root)`.
3. Your site will be at `https://<username>.github.io/<repo>/`.

### Netlify / Vercel
- Drag-and-drop the folder into Netlify, or `vercel` / import the repo. No build command,
  publish directory = project root.

## NFC tag

NFC tags just store a URL. After deploying, write your live URL (e.g. the GitHub Pages link)
to the tag with any NFC writer app ("Write URL / URI record"). Tapping the tag opens the site.
Use the HTTPS deployed URL, not `localhost`.

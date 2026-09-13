# chatgpt-thread-exporter

A fast, local-first tool for exporting ChatGPT shared-link conversations into clean **Markdown** or styled, print-friendly **PDF** files.

Use it two ways:
- **Web UI** — paste a ChatGPT share link in your browser and download the PDF instantly
- **CLI** — run it from the terminal for scripting and automation

---

## Requirements

- **Node.js** `v20.0.0` or higher
- **npm** `v9.0.0` or higher (bundled with Node.js)
- **Chrome / Chromium** — downloaded automatically by Puppeteer on `npm install`

---

## Quick Start (Web UI)

The fastest way to use this tool — no command-line required.

### Step 1 — Install dependencies

```bash
cd chatgpt-thread-exporter-main
npm install
```

### Step 2 — Start the web server

```bash
npm run web
```

You will see:

```
  ChatGPT-to-PDF converter
  ► http://localhost:3000/chatgpt-to-pdf
```

### Step 3 — Open your browser

Go to **http://localhost:3000/chatgpt-to-pdf**

1. In ChatGPT, open the conversation you want to export
2. Click **Share → Copy link** to get a URL like `https://chatgpt.com/share/…`
3. Paste that URL into the input field
4. Click **Convert to PDF**
5. Click **Download PDF** when it appears

> **Note:** The share link must be publicly accessible (the same link you would send to a friend).

---

## Quick Start (CLI)

### Install & build

```bash
npm install
npm run build
```

### Export as Markdown (default)

Saves to your `Downloads` folder:

```bash
npm run dev -- --url "https://chatgpt.com/share/your-share-id"
```

### Export as PDF

```bash
npm run dev -- --url "https://chatgpt.com/share/your-share-id" --format pdf
```

### Print Markdown to terminal

```bash
npm run dev -- --url "https://chatgpt.com/share/your-share-id" --stdout
```

### Save to a custom path

```bash
npm run dev -- --url "https://chatgpt.com/share/your-share-id" --out "./exports/chat.md"
```

Overwrite an existing file:

```bash
npm run dev -- --url "https://chatgpt.com/share/your-share-id" --out "./exports/chat.md" --force
```

### Export to a GitHub repository

```bash
export GITHUB_TOKEN="your_personal_access_token"
npm run dev -- --url "https://chatgpt.com/share/your-share-id" \
  --repo "username/repo" \
  --repo-path "exports/my-chat.md"
```

---

## Environment Variables

| Variable   | Description                                        | Default                      |
|------------|----------------------------------------------------|------------------------------|
| `PORT`     | Port the web server listens on                     | `3000`                       |
| `SITE_URL` | Full production URL (used in sitemap / canonical)  | `http://localhost:<PORT>`    |
| `GITHUB_TOKEN` | GitHub personal access token (CLI only)        | —                            |

Example for production:

```bash
SITE_URL=https://yourdomain.com PORT=8080 npm run web:prod
```

---

## NPM Scripts Reference

| Script           | Description                                          |
|------------------|------------------------------------------------------|
| `npm run web`    | **Start the web server (development)**               |
| `npm run web:prod` | Start the web server using the compiled `dist/`   |
| `npm run dev -- <args>` | Run the CLI in development mode              |
| `npm run build`  | Compile TypeScript → `dist/`                         |
| `npm run check`  | Type-check without emitting files                    |
| `npm test`       | Run the test suite with Vitest                       |

---

## CLI Options Reference

| Option                    | Description                                           |
|---------------------------|-------------------------------------------------------|
| `--url <url>`             | ChatGPT share URL *(required)*                        |
| `--format <markdown\|pdf>` | Output format: `markdown` (default) or `pdf`         |
| `--out <path>`            | Custom output file path                               |
| `--stdout`                | Print Markdown to terminal (not compatible with PDF)  |
| `--force`                 | Overwrite an existing local or remote file            |
| `--repo <owner/repo>`     | Destination GitHub repository                         |
| `--repo-path <path>`      | Path within the GitHub repository                     |
| `--branch <branch>`       | GitHub branch to commit to                            |
| `--debug-html <path>`     | Save the raw fetched HTML for troubleshooting         |
| `--debug-json <path>`     | Save structured debug info for troubleshooting        |
| `--help`, `-h`            | Show help text                                        |

---

## What formatting is preserved in the PDF?

| Element       | Preserved |
|---------------|-----------|
| Headings      | ✓         |
| Paragraphs    | ✓         |
| Bullet lists  | ✓         |
| Code blocks   | ✓         |
| Blockquotes   | ✓         |
| Bold / italic | ✓         |
| Images        | ✓         |
| Attachments   | ✓         |
| Page numbers  | ✓         |
| Source URL    | ✓         |

---

## Project Structure

```
chatgpt-thread-exporter-main/
├── frontend/
│   └── index.html          # Web UI (single-file, no build step)
├── src/
│   ├── pipeline.ts          # Main conversion pipeline
│   ├── fetcher.ts           # Fetches the ChatGPT share page
│   ├── extractor.ts         # Extracts conversation data from HTML
│   ├── normalizer.ts        # Normalises raw data into a transcript
│   ├── renderer.ts          # Renders Markdown output
│   ├── types.ts             # Shared TypeScript types
│   ├── pdf/
│   │   ├── render-pdf.ts           # Puppeteer PDF generation
│   │   └── render-chatgpt-html.ts  # HTML template for the PDF
│   ├── utils/               # Args parsing, paths, dates
│   └── writers/             # Local file and GitHub writers
├── server.ts                # Express web server
├── package.json
└── tsconfig.json
```

---

## Troubleshooting

**"PDF export requires a Puppeteer browser install"**

```bash
npx puppeteer browsers install chrome
```

**Port 3000 is already in use**

```bash
PORT=3001 npm run web
```

**Share link returns an error**

- Make sure the link is publicly shared (Share → Anyone with the link)
- The URL must start with `https://chatgpt.com/share/`
- Some older share links may have expired — re-share the conversation to get a fresh link

---

## License

MIT

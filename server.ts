/**
 * server.ts — Web server for the ChatGPT-to-PDF converter.
 *
 * Serves the static frontend and exposes one API route:
 *   POST /api/convert  { url: string } → application/pdf
 *
 * The existing pipeline (fetch → extract → normalize → renderPdf) is
 * called unchanged. Nothing in src/ is modified.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { type Request, type Response, type NextFunction } from "express";
import { buildPipelineArtifacts } from "./src/pipeline.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env["PORT"] ?? 3000);

// ─── Production base URL for sitemap / canonical (no trailing slash) ─────────
const SITE_URL = (process.env["SITE_URL"] ?? `http://localhost:${PORT}`).replace(/\/$/, "");

// ─── Middleware ───────────────────────────────────────────────────────────────

// Parse JSON request bodies (only for the API route)
app.use("/api", express.json({ limit: "4kb" }));

// ─── Static frontend files ────────────────────────────────────────────────────

const FRONTEND_DIR = path.join(__dirname, "frontend");

// ─── Routes ───────────────────────────────────────────────────────────────────

// Redirect root to the converter page
app.get("/", (_req: Request, res: Response) => {
  res.redirect(301, "/chatgpt-to-pdf");
});

// Serve the main converter page at its canonical URL
app.get("/chatgpt-to-pdf", (_req: Request, res: Response) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// robots.txt
app.get("/robots.txt", (_req: Request, res: Response) => {
  res.type("text/plain").send(robotsTxt());
});

// sitemap.xml – single-URL sitemap for the converter page
app.get("/sitemap.xml", (_req: Request, res: Response) => {
  res.type("application/xml").send(sitemapXml(SITE_URL));
});

// ─── API – PDF conversion ─────────────────────────────────────────────────────

app.post("/api/convert", (req: Request, res: Response, next: NextFunction) => {
  convertHandler(req, res).catch(next);
});

async function convertHandler(req: Request, res: Response): Promise<void> {
  const { url } = req.body as { url?: unknown };

  // Input validation – keep it simple; the pipeline validates further
  if (typeof url !== "string" || !url.trim()) {
    res.status(400).json({ error: "A ChatGPT share URL is required." });
    return;
  }

  const trimmedUrl = url.trim();

  // Allow only http/https URLs to prevent SSRF via other protocols
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    res.status(400).json({ error: "URL must start with http:// or https://" });
    return;
  }

  // Soft allowlist: warn when the URL looks nothing like a ChatGPT share link
  // but still proceed — the pipeline will produce a meaningful error if it fails.

  let pdfBytes: Uint8Array;
  try {
    const artifacts = await buildPipelineArtifacts({
      url: trimmedUrl,
      format: "pdf"
    });

    if (!(artifacts.outputContent instanceof Uint8Array)) {
      res.status(500).json({ error: "PDF generation returned unexpected output." });
      return;
    }

    pdfBytes = artifacts.outputContent;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Conversion failed.";
    res.status(422).json({ error: message });
    return;
  }

  // Stream PDF back to the browser as a download
  const filename = "chatgpt-conversation.pdf";
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.setHeader("Content-Length", pdfBytes.byteLength);
  res.send(Buffer.from(pdfBytes));
}

// ─── Global error handler ─────────────────────────────────────────────────────

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[server] Unhandled error:", err);
  if (!res.headersSent) {
    res.status(500).json({ error: "An unexpected server error occurred." });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n  ChatGPT-to-PDF converter`);
  console.log(`  ► http://localhost:${PORT}/chatgpt-to-pdf\n`);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function robotsTxt(): string {
  return [
    "User-agent: *",
    "Allow: /chatgpt-to-pdf",
    "Disallow: /api/",
    "",
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    ""
  ].join("\n");
}

function sitemapXml(baseUrl: string): string {
  const lastmod = new Date().toISOString().split("T")[0];
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    "  <url>",
    `    <loc>${baseUrl}/chatgpt-to-pdf</loc>`,
    `    <lastmod>${lastmod}</lastmod>`,
    "    <changefreq>monthly</changefreq>",
    "    <priority>1.0</priority>",
    "  </url>",
    "</urlset>",
    ""
  ].join("\n");
}

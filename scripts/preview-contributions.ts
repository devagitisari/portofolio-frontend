/**
 * Renders the GitHub contribution wrapper into a local HTML file so the
 * output can be inspected in a browser without running the whole app.
 *
 *   npx tsx scripts/preview-contributions.ts [username] [theme] [outFile]
 */
import { writeFileSync } from "node:fs";
import { wrapContributionsHtml } from "../src/lib/api/handlers/github";

async function main() {
  const username = process.argv[2] ?? "devagitisari";
  const theme = process.argv[3] ?? "dark";
  const outFile = process.argv[4] ?? "contributions-preview.html";

  const response = await fetch(`https://github.com/users/${username}/contributions`, {
    headers: { Accept: "text/html", "User-Agent": "DevaPortfolio/1.0" },
  });

  if (!response.ok) {
    console.error(`GitHub responded with ${response.status}`);
    process.exit(1);
  }

  const html = await response.text();
  writeFileSync(outFile, wrapContributionsHtml(html, username, theme), "utf8");
  console.log(`Wrote ${outFile}`);
}

void main();

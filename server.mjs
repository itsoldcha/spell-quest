import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve } from "node:path";

const root = resolve(".");
const port = Number(process.env.PORT || 4173);
const host = "127.0.0.1";

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".png": "image/png",
  ".mp3": "audio/mpeg"
};

createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${host}:${port}`);
  const requestPath = url.pathname === "/" ? "index.html" : decodeURIComponent(url.pathname.slice(1));
  const filePath = resolve(root, requestPath);

  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream"
  });
  createReadStream(filePath).pipe(response);
}).listen(port, host, () => {
  console.log(`Spell Raid running at http://${host}:${port}/`);
});

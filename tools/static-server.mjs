import { readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const portIndex = process.argv.indexOf("--port");
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : 4173);
const MIME = new Map([
  [".css", "text/css; charset=utf-8"], [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"], [".json", "application/json; charset=utf-8"],
  [".png", "image/png"], [".svg", "image/svg+xml"], [".webp", "image/webp"],
  [".xml", "application/xml; charset=utf-8"]
]);

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const target = path.resolve(ROOT, relative);
    if (!target.startsWith(`${ROOT}${path.sep}`)) throw new Error("Path fuori root");
    const info = await stat(target);
    if (!info.isFile()) throw new Error("Non è un file");
    response.writeHead(200, { "content-type": MIME.get(path.extname(target)) || "application/octet-stream" });
    response.end(await readFile(target));
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Preview SKAPPA: http://127.0.0.1:${port}`);
});

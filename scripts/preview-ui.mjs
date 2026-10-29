import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
const root = fileURLToPath(new URL("../web/", import.meta.url));
const port = Number(process.env.WORKSPHERE_PREVIEW_PORT ?? 18110);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};
http
  .createServer(async (request, response) => {
    try {
      if (!["GET", "HEAD"].includes(request.method)) {
        response.writeHead(405);
        response.end();
        return;
      }
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname
      );
      const target = path.resolve(
        root,
        `.${pathname === "/" ? "/index.html" : pathname}`
      );
      if (!target.startsWith(root) || !types[path.extname(target)]) {
        response.writeHead(404);
        response.end();
        return;
      }
      const body = await readFile(target);
      response.writeHead(200, {
        "Content-Type": types[path.extname(target)],
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      response.end(request.method === "HEAD" ? undefined : body);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  })
  .listen(port, "127.0.0.1", () =>
    process.stdout.write(`WorkSphere UI preview: http://127.0.0.1:${port}\n`)
  );

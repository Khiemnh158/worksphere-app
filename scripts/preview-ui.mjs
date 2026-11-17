import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";
const root = fileURLToPath(new URL("../web/", import.meta.url));
const port = Number(process.env.WORKSPHERE_PREVIEW_PORT ?? 18110);
const backendPort = Number(process.env.WORKSPHERE_BACKEND_PORT ?? 18120);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};
const policy =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; object-src 'none'";
http
  .createServer(async (req, res) => {
    const base = `http://127.0.0.1:${port}`;
    if (
      ![`127.0.0.1:${port}`, `localhost:${port}`].includes(req.headers.host)
    ) {
      res.writeHead(403);
      return res.end();
    }
    if (
      req.headers.origin &&
      ![base, `http://localhost:${port}`].includes(req.headers.origin)
    ) {
      res.writeHead(403);
      return res.end();
    }
    if (req.url.startsWith("/api/v1/")) {
      const headers = { ...req.headers, host: `127.0.0.1:${backendPort}` };
      delete headers.cookie;
      delete headers["x-forwarded-for"];
      delete headers["x-forwarded-host"];
      const upstream = http.request(
        {
          hostname: "127.0.0.1",
          port: backendPort,
          path: req.url,
          method: req.method,
          headers,
        },
        (r) => {
          res.writeHead(r.statusCode, {
            ...r.headers,
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          });
          r.pipe(res);
        }
      );
      upstream.setTimeout(30000, () => upstream.destroy());
      upstream.on("error", () => {
        if (!res.headersSent)
          res.writeHead(503, {
            "Content-Type": "application/json; charset=utf-8",
          });
        res.end(
          JSON.stringify({
            success: false,
            message: "Máy chủ chưa sẵn sàng. Vui lòng thử lại.",
          })
        );
      });
      req.on("aborted", () => upstream.destroy());
      req.pipe(upstream);
      return;
    }
    if (!["GET", "HEAD"].includes(req.method)) {
      res.writeHead(405);
      return res.end();
    }
    try {
      const pathname = decodeURIComponent(new URL(req.url, base).pathname);
      const target = path.resolve(
        root,
        `.${pathname === "/" ? "/index.html" : pathname}`
      );
      const relative = path.relative(root, target);
      if (
        relative.startsWith("..") ||
        path.isAbsolute(relative) ||
        !types[path.extname(target)]
      ) {
        res.writeHead(404);
        return res.end();
      }
      const data = await readFile(target);
      res.writeHead(200, {
        "Content-Type": types[path.extname(target)],
        "Cache-Control": "no-store",
        "Content-Security-Policy": policy,
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
      });
      res.end(req.method === "HEAD" ? undefined : data);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  })
  .listen(port, "127.0.0.1", () =>
    process.stdout.write(`WorkSphere Web: http://127.0.0.1:${port}\n`)
  );

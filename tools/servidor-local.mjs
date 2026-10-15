import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { access, realpath, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const ROOT = resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
const PORT = 4173;
const ADDRESS = `http://localhost:${PORT}`;
const APP_ID = "fronteira-local-v1";
const openBrowser = process.argv.includes("--open");
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".ico": "image/x-icon", ".woff2": "font/woff2",
  ".woff": "font/woff", ".txt": "text/plain; charset=utf-8",
};

function launchBrowser() {
  if (!openBrowser) return;
  const [command, args] = process.platform === "win32" ? ["cmd", ["/c", "start", "", ADDRESS]]
    : process.platform === "darwin" ? ["open", [ADDRESS]] : ["xdg-open", [ADDRESS]];
  const child = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true });
  child.on("error", () => console.log(`Abra manualmente: ${ADDRESS}`));
  child.unref();
}

try { await access(resolve(ROOT, "index.html")); }
catch {
  console.error("A pasta dist nao foi encontrada. Prepare uma vez com internet: npm install e npm run build.");
  console.error("Ou baixe e extraia o pacote fronteira-offline completo na aba Actions do seu repositorio.");
  process.exit(1);
}
const realRoot = await realpath(ROOT);

const server = createServer(async (request, response) => {
  const respond = (code, text) => { response.writeHead(code, { "Content-Type": "text/plain; charset=utf-8" }); response.end(text); };
  if (!["localhost:4173", "127.0.0.1:4173"].includes(request.headers.host || "")) { respond(403, "Acesso apenas pelo endereco local."); return; }
  if (!["GET", "HEAD"].includes(request.method || "")) { respond(405, "Metodo nao permitido."); return; }
  let pathname;
  try { pathname = decodeURIComponent(new URL(request.url || "/", ADDRESS).pathname); }
  catch { respond(400, "Endereco invalido."); return; }
  if (pathname === "/__fronteira_health") { respond(200, APP_ID); return; }
  const candidate = resolve(ROOT, `.${pathname === "/" ? "/index.html" : pathname}`);
  if (pathname.includes("\0") || pathname.includes("\\") || !candidate.startsWith(ROOT + sep)) { respond(403, "Caminho nao permitido."); return; }
  try {
    const file = await realpath(candidate);
    if (!file.startsWith(realRoot + sep)) { respond(403, "Caminho nao permitido."); return; }
    const info = await stat(file);
    const type = TYPES[extname(file).toLowerCase()];
    if (!info.isFile() || !type) { respond(404, "Arquivo nao encontrado."); return; }
    response.writeHead(200, {
      "Content-Type": type, "Content-Length": info.size, "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer",
    });
    if (request.method === "HEAD") { response.end(); return; }
    const stream = createReadStream(file);
    stream.on("error", () => response.destroy());
    stream.pipe(response);
  } catch { respond(404, "Arquivo nao encontrado. Abra a pagina inicial do sistema."); }
});

server.on("error", async error => {
  if (error.code === "EADDRINUSE") {
    try {
      const response = await fetch(`${ADDRESS}/__fronteira_health`, { signal: AbortSignal.timeout(2000) });
      if (await response.text() === APP_ID) {
        console.log(`O sistema ja esta aberto em ${ADDRESS}. Mantenha a primeira janela do servidor aberta.`);
        launchBrowser(); process.exit(0);
      }
    } catch { /* Do not silently change the port: browser data belongs to this address. */ }
    console.error("A porta 4173 esta ocupada por outro programa. Feche-o e tente novamente.");
  } else { console.error("Nao foi possivel iniciar o servidor local:", error.message); }
  process.exit(1);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`\nFRONTEIRA - Sistema local\n\nAbra: ${ADDRESS}\nTV: ${ADDRESS}/#/painel\n`);
  console.log("Funciona sem internet. Nao feche esta janela durante o atendimento.");
  console.log("Use sempre o mesmo navegador/perfil e o endereco localhost:4173.");
  console.log("Os pedidos ficam no navegador. Exporte um backup no fim do dia.\n");
  launchBrowser();
});
process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
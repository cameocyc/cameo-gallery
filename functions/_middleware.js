// 全站瀏覽計數（伺服器端，零頁面程式）。
// 每個「成功打開的網頁」自動 +1 到 KV(VIEWS)。看數字：夥伴專區 → 使用統計。
// fail-safe：沒綁 KV 也不會壞，只是先不記數。analytics 絕不拖慢或弄壞頁面。

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|embedly|pinterest|preview|whatsapp|telegram|discord|line\b|curl|wget|python-requests|headless|lighthouse|monitor/i;

export async function onRequest(context) {
  const { request, next, env } = context;
  const res = await next();
  try {
    if (shouldCount(request, res)) {
      const path = normalize(new URL(request.url).pathname);
      // 背景計數，不拖慢回應
      context.waitUntil(bump(env, path).catch(function () {}));
    }
  } catch (e) {
    /* 統計出錯也絕不影響頁面 */
  }
  return res;
}

function shouldCount(request, res) {
  if (request.method !== "GET") return false;
  if (res.status !== 200) return false; // 擋在密碼門外的 401 不算
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("text/html")) return false; // 只算網頁，不算圖片/json/css
  const ua = request.headers.get("user-agent") || "";
  if (!ua || BOT.test(ua)) return false; // 略過爬蟲與連結預覽機器人
  const path = new URL(request.url).pathname;
  if (path.startsWith("/onboarding/stats")) return false; // 不算統計頁自己
  return true;
}

// 把 /x、/x/、/x/index.html 都視為同一頁，鍵才不會分裂
function normalize(path) {
  let p = path.replace(/index\.html$/, "");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p || "/";
}

async function bump(env, path) {
  if (!env.VIEWS) return; // 還沒綁 KV → 先不記（不報錯）
  const key = "p:" + path;
  const cur = parseInt((await env.VIEWS.get(key)) || "0", 10) || 0;
  await env.VIEWS.put(key, String(cur + 1));
}

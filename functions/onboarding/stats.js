// 使用統計儀表板 — 路徑 /onboarding/stats
// 在 /onboarding/* 底下，故自動被 functions/onboarding/_middleware.js 的密碼門保護。
// 讀 KV(VIEWS) 列出每個網址的瀏覽次數。

const SINCE = "2026/6/7"; // 起算日（與啟用日對齊）

// 已知網址的好看名稱；沒列到的就顯示原始路徑
const LABELS = {
  "/": "圖庫首頁（教學素材庫）",
  "/onboarding": "夥伴專區入口",
  "/onboarding/checklist": "課前作業檢核表",
};

export async function onRequest(context) {
  const { env } = context;
  const configured = !!env.VIEWS;
  let rows = [];
  if (configured) {
    const list = await env.VIEWS.list({ prefix: "p:" });
    for (const k of list.keys) {
      const count = parseInt((await env.VIEWS.get(k.name)) || "0", 10) || 0;
      rows.push({ path: k.name.slice(2), count: count });
    }
    rows.sort(function (a, b) { return b.count - a.count; });
  }
  const total = rows.reduce(function (s, r) { return s + r.count; }, 0);
  return new Response(page(rows, total, configured), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

function label(p) { return LABELS[p] || p; }
function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

function page(rows, total, configured) {
  let inner;
  if (!configured) {
    inner = '<div class="empty"><b>尚未綁定資料庫</b><br>到 Cloudflare 把 KV 綁定名稱 <code>VIEWS</code> 接上這個 Pages 專案，之後就會開始記數。</div>';
  } else if (rows.length === 0) {
    inner = '<div class="empty">還沒有任何瀏覽紀錄。<br>等有人打開頁面後，這裡就會出現數字。</div>';
  } else {
    const trs = rows.map(function (r) {
      const known = LABELS[r.path];
      return (
        "<tr>" +
        '<td class="name">' + esc(label(r.path)) + (known ? "" : ' <span class="raw">新頁</span>') + "</td>" +
        '<td class="path">' + esc(r.path) + "</td>" +
        '<td class="num">' + r.count.toLocaleString() + "</td>" +
        "</tr>"
      );
    }).join("");
    inner =
      '<table><thead><tr><th>資源</th><th>網址</th><th class="num">瀏覽次數</th></tr></thead>' +
      "<tbody>" + trs + "</tbody></table>";
  }

  return (
    "<!DOCTYPE html><html lang=\"zh-Hant\"><head>" +
    '<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<meta name="robots" content="noindex, nofollow"><title>使用統計 · 夥伴專區</title>' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&family=Noto+Serif+TC:wght@600;900&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">' +
    "<style>" +
    ":root{--paper:#f7f3ec;--paper-deep:#efe8dc;--ink:#1f1b16;--ink-soft:#5c544a;--vermillion:#c8401f;--line:#d8cdbb;--mono:'IBM Plex Mono',monospace}" +
    "*{margin:0;padding:0;box-sizing:border-box}" +
    "body{font-family:'Noto Sans TC',sans-serif;background:var(--paper);color:var(--ink);line-height:1.7;-webkit-font-smoothing:antialiased;min-height:100vh;background-image:radial-gradient(circle at 15% 8%,rgba(200,64,31,.04),transparent 42%),repeating-linear-gradient(0deg,transparent,transparent 31px,rgba(31,27,22,.035) 31px,rgba(31,27,22,.035) 32px)}" +
    ".wrap{max-width:760px;margin:0 auto;padding:0 22px 80px}" +
    "header{padding:52px 0 22px;border-bottom:3px solid var(--ink)}" +
    ".kicker{font-family:var(--mono);font-size:11.5px;letter-spacing:.32em;color:var(--vermillion);text-transform:uppercase;margin-bottom:12px}" +
    "h1{font-family:'Noto Serif TC',serif;font-weight:900;font-size:clamp(26px,5vw,38px);line-height:1.2}" +
    ".summary{margin-top:14px;display:flex;gap:26px;flex-wrap:wrap;font-size:14px;color:var(--ink-soft)}" +
    ".summary b{font-family:'Noto Serif TC',serif;color:var(--vermillion);font-size:22px;font-weight:900}" +
    ".summary .blk{display:flex;flex-direction:column}" +
    "table{width:100%;border-collapse:collapse;margin-top:26px;background:#fffdf8;border:1px solid var(--line);box-shadow:4px 4px 0 rgba(31,27,22,.07)}" +
    "th{background:var(--ink);color:var(--paper);text-align:left;padding:11px 16px;font-size:12.5px;letter-spacing:.12em;font-weight:700}" +
    "td{padding:13px 16px;border-top:1px solid var(--line);vertical-align:middle}" +
    "td.name{font-weight:700}" +
    ".raw{font-family:var(--mono);font-size:10px;letter-spacing:.1em;color:var(--vermillion);border:1px solid var(--line);padding:1px 6px;margin-left:6px}" +
    "td.path{font-family:var(--mono);font-size:12px;color:var(--ink-soft)}" +
    ".num{text-align:right;font-family:var(--mono);font-weight:600;white-space:nowrap}" +
    "td.num{font-size:17px}" +
    ".empty{margin-top:30px;padding:26px;background:#fffdf8;border:1px solid var(--line);text-align:center;color:var(--ink-soft);font-size:14.5px;line-height:2}" +
    "code{font-family:var(--mono);font-size:.88em;background:var(--paper-deep);padding:2px 7px;border:1px solid var(--line)}" +
    "footer{margin-top:34px;padding-top:18px;border-top:1px solid var(--line);font-family:var(--mono);font-size:11px;letter-spacing:.1em;color:var(--ink-soft);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}" +
    "footer a{color:var(--vermillion);text-decoration:none}" +
    "</style></head><body><div class=\"wrap\">" +
    '<header><div class="kicker">Cameo Partners · Usage</div><h1>使用統計</h1>' +
    '<div class="summary"><span class="blk"><b>' + total.toLocaleString() + "</b>總瀏覽次數</span>" +
    '<span class="blk"><b>' + rows.length + "</b>個網址</span>" +
    '<span class="blk" style="justify-content:flex-end"><span>統計自 ' + SINCE + "</span><span style=\"font-size:12px\">每次打開此頁為即時數字</span></span></div></header>" +
    inner +
    '<footer><a href="./">← 回夥伴專區</a><span>數字即時讀取 · 重新整理即更新</span></footer>' +
    "</div></body></html>"
  );
}

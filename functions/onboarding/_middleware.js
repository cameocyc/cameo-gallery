// Onboarding 密碼門 — Cloudflare Pages Functions middleware
// 攔截所有 /onboarding/* 請求：沒通過只回登入頁，通過才放行真正內容。
// 密碼放環境變數 ONBOARDING_PASSCODE（Pages → Settings → Variables，標記為 Secret）。
// 驗證成功後種一個 HMAC 簽章 cookie，攻擊者無法偽造（不知道 passcode 就算不出簽章）。

const COOKIE = "cameo_ob";
const TOKEN_MSG = "onboarding-authorized-v1"; // 改版號可一次踢掉所有舊登入
const MAX_AGE = 60 * 60 * 24 * 30; // cookie 有效 30 天

export async function onRequest(context) {
  const { request, env, next } = context;
  const passcode = env.ONBOARDING_PASSCODE;

  // 安全預設：沒設密碼就不放行任何內容（避免空窗期暴露）
  if (!passcode) {
    return new Response(
      "Onboarding gate 尚未設定：請在 Cloudflare Pages 設定環境變數 ONBOARDING_PASSCODE。",
      { status: 503, headers: noStore({ "Content-Type": "text/plain; charset=utf-8" }) }
    );
  }

  const expected = await sign(passcode, TOKEN_MSG);

  // 處理登入表單送出
  if (request.method === "POST") {
    const form = await request.formData();
    const tried = String(form.get("passcode") || "");
    if (safeEqual(tried, passcode)) {
      return new Response(null, {
        status: 303,
        headers: noStore({
          Location: "/onboarding/",
          "Set-Cookie": `${COOKIE}=${expected}; Path=/onboarding; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`,
        }),
      });
    }
    return new Response(loginPage(true), {
      status: 401,
      headers: noStore({ "Content-Type": "text/html; charset=utf-8" }),
    });
  }

  // 一般請求：驗 cookie
  const jar = parseCookies(request.headers.get("Cookie") || "");
  if (jar[COOKIE] && safeEqual(jar[COOKIE], expected)) {
    // 放行靜態內容，但禁止 CDN/瀏覽器快取受保護頁面
    const res = await next();
    const out = new Response(res.body, res);
    out.headers.set("Cache-Control", "no-store");
    return out;
  }

  // 未授權：回登入頁
  return new Response(loginPage(false), {
    status: 401,
    headers: noStore({ "Content-Type": "text/html; charset=utf-8" }),
  });
}

// ---- helpers ----

function noStore(extra) {
  return { "Cache-Control": "no-store", "X-Robots-Tag": "noindex", ...extra };
}

async function sign(key, msg) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// 等長字串的常數時間比對，避免時序側通道
function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function parseCookies(header) {
  const out = {};
  header.split(";").forEach((pair) => {
    const i = pair.indexOf("=");
    if (i > -1) out[pair.slice(0, i).trim()] = pair.slice(i + 1).trim();
  });
  return out;
}

function loginPage(error) {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex, nofollow">
<title>卡米爾夥伴專區 · 請輸入通行碼</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&family=Noto+Serif+TC:wght@900&family=IBM+Plex+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
  :root{--paper:#f7f3ec;--ink:#1f1b16;--ink-soft:#5c544a;--vermillion:#c8401f;--line:#d8cdbb;--mono:'IBM Plex Mono',monospace}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Noto Sans TC',sans-serif;background:var(--paper);color:var(--ink);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
    background-image:radial-gradient(circle at 15% 10%,rgba(200,64,31,.05),transparent 40%),repeating-linear-gradient(0deg,transparent,transparent 31px,rgba(31,27,22,.035) 31px,rgba(31,27,22,.035) 32px)}
  .card{width:100%;max-width:380px;background:#fffdf8;border:2px solid var(--ink);box-shadow:6px 6px 0 rgba(31,27,22,.12);padding:34px 30px 30px;position:relative}
  .kicker{font-family:var(--mono);font-size:11px;letter-spacing:.32em;color:var(--vermillion);text-transform:uppercase;margin-bottom:12px}
  h1{font-family:'Noto Serif TC',serif;font-weight:900;font-size:23px;line-height:1.35;margin-bottom:8px}
  p.sub{font-size:13.5px;color:var(--ink-soft);margin-bottom:22px;line-height:1.7}
  label{display:block;font-family:var(--mono);font-size:11px;letter-spacing:.18em;color:var(--ink-soft);margin-bottom:7px}
  input{width:100%;padding:13px 14px;border:2px solid var(--ink);background:var(--paper);font-family:var(--mono);font-size:15px;letter-spacing:.05em}
  input:focus{outline:none;border-color:var(--vermillion)}
  button{width:100%;margin-top:16px;padding:13px;border:none;background:var(--vermillion);color:#fff;font-weight:900;font-size:15px;letter-spacing:.1em;cursor:pointer;transition:background .15s}
  button:hover{background:#a33218}
  .err{margin-top:14px;padding:10px 13px;background:#fdecea;border-left:4px solid var(--vermillion);font-size:13px;color:#a33218}
  .foot{margin-top:20px;font-family:var(--mono);font-size:10.5px;color:var(--ink-soft);letter-spacing:.1em;text-align:center}
</style>
</head>
<body>
  <form class="card" method="POST" action="/onboarding/" autocomplete="off">
    <div class="kicker">Cameo Partners · Private</div>
    <h1>卡米爾夥伴專區</h1>
    <p class="sub">這份課前作業檢核表僅供內部夥伴。請輸入通行碼進入。</p>
    <label for="passcode">通行碼 · PASSCODE</label>
    <input id="passcode" name="passcode" type="password" inputmode="text" autofocus required>
    <button type="submit">進入 →</button>
    ${error ? '<div class="err">通行碼不正確，請再試一次，或向群組索取。</div>' : ""}
    <div class="foot">忘記通行碼？向卡米爾群組索取</div>
  </form>
</body>
</html>`;
}

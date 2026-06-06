import serverModule from "./server.js";

const { CREDIT_PACK, handleApiOperation } = serverModule;

const ENV_KEYS = [
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "OPENAI_BASE_URL",
  "OPENAI_API_STYLE",
  "MODEL_PROVIDER",
  "MODEL_RESPONSE_FORMAT",
  "KIMI_THINKING",
  "OPENAI_MAX_OUTPUT_TOKENS",
  "OPENAI_CHAT_MAX_TOKENS",
  "MODEL_REQUEST_TIMEOUT_MS",
  "PAYMENT_MODE",
  "PAYMENT_PROVIDER",
  "PUBLIC_SITE_URL",
  "APP_BASE_URL",
  "NOWPAYMENTS_API_BASE",
  "NOWPAYMENTS_API_KEY",
  "NOWPAYMENTS_IPN_SECRET",
  "CRYPTO_PRICE_AMOUNT",
  "CRYPTO_PRICE_CURRENCY",
  "CRYPTO_PAY_CURRENCY",
  "CRYPTO_SUCCESS_STATUSES",
];

function syncWorkerEnv(env = {}) {
  if (!globalThis.process) globalThis.process = { env: {} };
  if (!globalThis.process.env) globalThis.process.env = {};
  for (const key of ENV_KEYS) {
    const value = env[key];
    if (value !== undefined && value !== null && value !== "") {
      globalThis.process.env[key] = String(value);
    }
  }
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function readInput(request) {
  if (request.method === "GET") return {};
  const body = await request.text();
  if (!body.trim()) return {};
  return JSON.parse(body);
}

function createKvStore(env) {
  const namespace = env.MINGPANSHI_DB;
  if (!namespace) {
    const error = new Error("Cloudflare KV 未绑定，无法读写用户额度、报告和订单。");
    error.statusCode = 500;
    error.code = "KV_NOT_BOUND";
    throw error;
  }

  return {
    async readDb() {
      return (await namespace.get("state", { type: "json" })) || null;
    },
    async writeDb(db) {
      await namespace.put("state", JSON.stringify(db));
    },
  };
}

async function handleApi(request, env) {
  syncWorkerEnv(env);
  const url = new URL(request.url);

  try {
    const input = await readInput(request);
    const result = await handleApiOperation({
      method: request.method,
      pathname: url.pathname.replace(/\/+$/, "") || "/",
      input,
      headers: Object.fromEntries(request.headers.entries()),
      query: Object.fromEntries(url.searchParams.entries()),
      store: createKvStore(env),
    });
    return json(result.payload, result.status);
  } catch (error) {
    return json({
      ok: false,
      code: error.code || "REQUEST_FAILED",
      message: error.message || "请求失败",
      plan: error.code === "INSUFFICIENT_CREDITS" || error.code === "READING_LOCKED" ? CREDIT_PACK : undefined,
    }, error.statusCode || 400);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/")) {
      return handleApi(request, env);
    }

    if (env.ASSETS) return env.ASSETS.fetch(request);
    return new Response("Not found", { status: 404 });
  },
};

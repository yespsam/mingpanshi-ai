import { getStore } from "@netlify/blobs";
import serverModule from "../../server.js";

const { apiConfig, handleApiOperation } = serverModule;

function syncNetlifyEnv() {
  const env = globalThis.Netlify?.env;
  if (!env?.get) return;

  for (const key of [
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
    "OPENAI_BASE_URL",
    "OPENAI_API_STYLE",
    "MODEL_PROVIDER",
    "MODEL_RESPONSE_FORMAT",
    "KIMI_THINKING",
    "OPENAI_MAX_OUTPUT_TOKENS",
    "OPENAI_CHAT_MAX_TOKENS",
    "PAYMENT_MODE",
  ]) {
    const value = env.get(key);
    if (value && !process.env[key]) process.env[key] = value;
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

function createBlobStore() {
  const store = getStore({ name: "mingpanshi-db", consistency: "strong" });
  return {
    async readDb() {
      return (await store.get("state", { type: "json" })) || null;
    },
    async writeDb(db) {
      await store.setJSON("state", db);
    },
  };
}

export default async (request) => {
  syncNetlifyEnv();

  const url = new URL(request.url);
  const pathname = url.pathname.replace(/\/+$/, "") || "/";

  try {
    const input = request.method === "GET" ? {} : await request.json();
    const result = await handleApiOperation({
      method: request.method,
      pathname,
      input,
      headers: Object.fromEntries(request.headers.entries()),
      query: Object.fromEntries(url.searchParams.entries()),
      store: createBlobStore(),
    });
    return json(result.payload, result.status);
  } catch (error) {
    return json({
      ok: false,
      code: error.code || "REQUEST_FAILED",
      message: error.message || "请求失败",
      plan: error.code === "INSUFFICIENT_CREDITS" || error.code === "READING_LOCKED" ? serverModule.CREDIT_PACK : undefined,
    }, error.statusCode || 400);
  }
};

export const config = {
  path: ["/api/health", "/api/account", "/api/recharge", "/api/share-unlock", "/api/reading", "/api/chat"],
};

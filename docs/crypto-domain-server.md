# 命盘师稳定域名与加密支付部署

## 目标

稳定线上环境需要同时满足三件事：

1. 网站和 API 有稳定 HTTPS 域名，不依赖 `trycloudflare.com` 临时隧道。
2. 加密货币支付网关可以把支付结果回调到固定地址。
3. 问事额度只在支付回调验签成功后到账。

## 推荐架构

- 前端静态资源：Netlify Site
- API：Netlify Functions
- 数据：Netlify Blobs
- 加密支付：NOWPayments invoice + IPN webhook
- 自定义域名：Netlify Domain 或 Cloudflare DNS 指向 Netlify

当前项目已经有：

- `netlify.toml`
- `netlify/functions/api.mjs`
- `/api/recharge`
- `/api/order`
- `/api/payment-webhook/nowpayments`

## 必填环境变量

生产环境至少需要这些变量：

```bash
OPENAI_API_KEY=...
OPENAI_MODEL=kimi-k2.6
OPENAI_BASE_URL=https://api.moonshot.cn/v1
OPENAI_API_STYLE=chat
MODEL_PROVIDER=Kimi
MODEL_RESPONSE_FORMAT=json
KIMI_THINKING=disabled

PUBLIC_SITE_URL=https://你的正式域名

PAYMENT_MODE=crypto
PAYMENT_PROVIDER=nowpayments
NOWPAYMENTS_API_BASE=https://api.nowpayments.io/v1
NOWPAYMENTS_API_KEY=...
NOWPAYMENTS_IPN_SECRET=...
CRYPTO_PRICE_AMOUNT=0.70
CRYPTO_PRICE_CURRENCY=usd
CRYPTO_PAY_CURRENCY=
CRYPTO_SUCCESS_STATUSES=finished
```

`PUBLIC_SITE_URL` 很重要。NOWPayments invoice 会使用它生成：

```text
https://你的正式域名/api/payment-webhook/nowpayments
```

这个地址必须是公网可访问的 HTTPS 地址，不能是 localhost 或临时隧道。

## NOWPayments 配置

1. 注册/登录 NOWPayments。
2. 创建 API Key。
3. 设置 IPN Secret。
4. 在 Netlify 环境变量里填：
   - `NOWPAYMENTS_API_KEY`
   - `NOWPAYMENTS_IPN_SECRET`
5. 支付成功后，NOWPayments 会回调：
   - `/api/payment-webhook/nowpayments`
6. 服务端会校验 `x-nowpayments-sig`，通过后才给用户增加 10 次对话额度。

## Netlify 部署步骤

本机先登录：

```bash
npx netlify login
```

登录后确认站点状态：

```bash
npx netlify status
```

设置环境变量：

```bash
npx netlify env:set OPENAI_API_KEY "..."
npx netlify env:set PUBLIC_SITE_URL "https://你的正式域名"
npx netlify env:set PAYMENT_MODE "crypto"
npx netlify env:set PAYMENT_PROVIDER "nowpayments"
npx netlify env:set NOWPAYMENTS_API_KEY "..."
npx netlify env:set NOWPAYMENTS_IPN_SECRET "..."
npx netlify env:set CRYPTO_PRICE_AMOUNT "0.70"
npx netlify env:set CRYPTO_PRICE_CURRENCY "usd"
```

部署生产版本：

```bash
npx netlify deploy --prod
```

## 域名绑定

在 Netlify 后台添加自定义域名，例如：

```text
mingpanshi.com
www.mingpanshi.com
```

如果域名 DNS 在 Cloudflare：

1. Netlify 后台添加域名。
2. 按 Netlify 提示添加 DNS 记录。
3. 等待证书签发。
4. 确认 `https://你的正式域名/api/health` 能返回 JSON。

## 验收清单

部署完成后依次检查：

```bash
curl https://你的正式域名/api/health
```

需要看到：

```json
{
  "ok": true,
  "billing": {
    "paymentMode": "crypto",
    "paymentProvider": "nowpayments"
  }
}
```

再创建一笔订单：

```bash
curl -X POST https://你的正式域名/api/recharge \
  -H "Content-Type: application/json" \
  -d '{"clientId":"test-user","planId":"pack_5_10"}'
```

需要返回 `paymentUrl`，用户打开后进入 NOWPayments 支付页。

## 注意

- 不要把 `.env` 提交到 GitHub。
- 不要在生产环境使用 `PAYMENT_MODE=demo`。
- 不要把 `NOWPAYMENTS_IPN_SECRET` 放到前端。
- 支付平台回调可能重复发送，服务端已经做了重复回调不重复加额度的处理。

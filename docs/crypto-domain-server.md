# 命盘师：加密货币购买域名和服务器说明

## 当前结论

网页产品本身当前不做用户付费，线上模式为测试期免费体验。

你说的“加密支付”指的是我们自己采购基础设施时用加密货币付款，包括：

1. 域名注册或续费。
2. 云服务器、VPS 或独立服务器。
3. 未来可选的 CDN、防护、备份等运维服务。

这和网页里向用户收款是两回事。当前网页不需要 NOWPayments、充值订单、用户付费回调。

## 当前线上环境

```text
Cloudflare Pages 项目：mingpanshi-ai
公网地址：https://mingpanshi-ai.pages.dev
数据存储：Cloudflare KV / MINGPANSHI_DB
产品模式：PRODUCT_ACCESS_MODE=free
```

Cloudflare Pages 现在可以继续作为免费公网 H5 入口使用。它适合测试、演示和小程序 H5 容器验证。

## 重要提醒

Cloudflare 本身通常不适合作为“加密货币付款购买域名/服务器”的供应商，因为 Cloudflare 账单主要走传统支付方式。若要用加密货币付款，需要选择支持 BTC/USDT/USDC 等付款方式的域名商和服务器商。

## 采购方案

### 方案 A：继续 Cloudflare Pages 免费托管

适合阶段：

- MVP 测试。
- 临时公网展示。
- 小程序 H5 页面调试。

优点：

- 当前已经上线。
- HTTPS 自动可用。
- 不需要服务器运维。

缺点：

- 不是用加密货币付款购买的服务器。
- 如果未来流量、后端任务、数据库要求变复杂，可能需要迁移到 VPS 或云服务器。

### 方案 B：购买支持加密货币付款的 VPS

适合阶段：

- 需要独立服务器。
- 想完全控制 Node 服务、数据库、反向代理。
- 想用加密货币付款购买服务器。

部署结构：

```text
域名 -> Cloudflare DNS/CDN -> VPS Nginx/Caddy -> Node 服务
```

服务器需要安装：

- Node.js 20+
- PM2 或 systemd
- Nginx 或 Caddy
- SQLite/Postgres 或轻量 JSON 存储
- HTTPS 证书，建议用 Caddy 自动签发或 Certbot

### 方案 C：域名和服务器都用支持 crypto 的供应商

适合阶段：

- 想从采购层面尽量不走银行卡。
- 域名注册、服务器续费都希望用 BTC/USDT/USDC。

注意：

- 域名注册商和服务器商可以不是同一家。
- DNS 仍然可以接到 Cloudflare 免费层做解析和 HTTPS/CDN。
- 购买前要确认供应商当前仍支持对应币种和地区。

## 下一步需要确认

在正式购买前，需要确定：

1. 你想买的域名，例如 `mingpanshi.com` 或其他名称。
2. 支付币种：BTC、USDT、USDC 还是其他。
3. 服务器预算：每月 5-20 美元的小 VPS，还是更高规格。
4. 是否要保留 Cloudflare 做 DNS/CDN。

## 推荐落地顺序

1. 先确定域名。
2. 找支持加密货币付款的域名商购买域名。
3. 把域名 DNS 接到 Cloudflare。
4. 当前 H5 先绑定到 Cloudflare Pages 自定义域名。
5. 如果后续需要独立服务器，再购买支持 crypto 的 VPS。
6. VPS 上部署 Node 服务，并把 API 域名切过去。

## 当前代码状态

当前代码已把网页用户侧改为免费体验模式：

```json
{
  "PRODUCT_ACCESS_MODE": "free"
}
```

这表示：

- 用户生成命盘不需要付费。
- 用户追问不需要购买额度。
- 网页里不显示加密货币支付入口。
- 加密货币只用于我们自己购买域名和服务器。

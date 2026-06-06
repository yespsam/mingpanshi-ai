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

## 这次要增加什么

建议分两步：

1. 先购买域名，把域名绑定到现有 Cloudflare Pages。这样最快获得正式域名，仍然不用维护服务器。
2. 再购买支持加密货币付款的 VPS，作为未来独立后端或主站服务器。

当前我已经给项目补好了 VPS 部署模板：

```text
Dockerfile
docker-compose.yml
deploy/Caddyfile.example
deploy/mingpanshi.service.example
deploy/vps-ubuntu-setup.sh
```

买好 VPS 后，可以直接用这些文件上线 Node 版本。

## 重要提醒

Cloudflare 本身通常不适合作为“加密货币付款购买域名/服务器”的供应商，因为 Cloudflare 账单主要走传统支付方式。若要用加密货币付款，需要选择支持 BTC/USDT/USDC 等付款方式的域名商和服务器商。

Cloudflare 仍然适合做：

- DNS 解析。
- Cloudflare Pages 自定义域名。
- 免费 HTTPS。
- CDN 和基础防护。

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

## 候选供应商

购买前必须重新确认价格、退款规则、KYC 要求和支持币种，因为这类规则经常变化。

### 域名

- Namecheap：官方说明支持 Bitcoin，可用于购买域名、主机、SSL 或隐私服务；如果用于域名注册，通常需要先把 crypto 充值到 Namecheap 账户余额。

### VPS / 云服务器

- Cherry Servers：官方说明支持 Bitcoin、Ethereum、USDC、USDT 等多种加密货币，可购买 VPS 或独立服务器。
- BitLaunch：主打用加密货币购买 VPS，支持 Bitcoin、Ethereum、Litecoin 等。
- HostSailor：官方说明支持 50+ 种加密货币，可用于服务器、域名和 SSL。
- OrangeWebsite：官方说明支持 Bitcoin、Litecoin、Ethereum、Bitcoin Cash、Monero 等购买主机、Cloud VPS 和独立服务器。

### 不建议用来完成“crypto 付款”目标

- Cloudflare：适合继续做 DNS、CDN、Pages 和 HTTPS，但官方账单付款方式主要是卡、PayPal、Apple Pay、Google Pay、Stripe Link、UnionPay 等，没有把加密货币列为自助付款方式。

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

## Cloudflare Pages 绑定域名

当前 Cloudflare 项目：

```text
Project: mingpanshi-ai
Current domain: https://mingpanshi-ai.pages.dev
```

买好域名后，在 Cloudflare Dashboard 中：

1. 进入 Workers & Pages。
2. 打开 `mingpanshi-ai`。
3. 进入 Custom domains。
4. 添加你的域名，例如 `mingpanshi.com` 或 `www.mingpanshi.com`。
5. 按提示完成 DNS 记录和证书签发。

如果是根域名，例如 `mingpanshi.com`，建议整个域名接入同一个 Cloudflare 账号；如果只绑定 `www.mingpanshi.com`，可以按 Cloudflare 提示添加 CNAME。

## VPS 部署方式

### Docker

在 VPS 上：

```bash
git clone https://github.com/yespsam/mingpanshi-ai.git /opt/mingpanshi-ai
cd /opt/mingpanshi-ai
cp .env.example .env
```

填入：

```text
OPENAI_API_KEY=你的 Kimi API Key
PRODUCT_ACCESS_MODE=free
PORT=8787
```

启动：

```bash
docker compose up -d --build
```

### Ubuntu + systemd + Caddy

```bash
DOMAIN=你的域名 bash deploy/vps-ubuntu-setup.sh
```

然后填好：

```text
/opt/mingpanshi-ai/.env
```

重启：

```bash
systemctl restart mingpanshi
```

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

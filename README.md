# 命盘师 AI 命盘解析产品

一个东方玄学 + AI 科技感的命盘解析网页产品。后端会先生成结构化命理资料包，再通过 Kimi / OpenAI 兼容模型 API 输出完整报告。

> 说明：这是娱乐和自我反思用途，不替代现实判断，也不提供医疗、法律、投资等专业建议。

## 网页版运行

复制配置文件：

```bash
cd /Users/qohfq/Documents/Playground/ai-fortune
cp .env.example .env
```

填入你的模型 API key。当前示例使用 Kimi：

```bash
OPENAI_API_KEY=你的_api_key
OPENAI_MODEL=moonshot-v1-8k
OPENAI_BASE_URL=https://api.moonshot.cn/v1
OPENAI_API_STYLE=chat
MODEL_PROVIDER=Kimi
```

启动网页：

```bash
npm start
```

打开：

```text
http://localhost:8787
```

线上地址：

```text
https://mingpanshi-ai.netlify.app
```

浏览器不会直接接触 `OPENAI_API_KEY`，所有模型 API 调用都在 `server.js` 后端完成。

## 产品能力

- 命盘师品牌 UI、Logo 与轻奢周易视觉
- 后端支持 Kimi / OpenAI 兼容模型 API
- 服务端额度账户、订单记录、对话记录，本地使用 `.data/mingpanshi-db.json`，线上使用 Netlify Blobs
- 天干地支、生肖、星座、五行权重、八卦、六十四卦、六爻变爻、流年提示
- 根据问题自动判断关注重点：事业、感情、财运、学习、身心状态
- 输出命盘总览、五行分析、六爻卦象、星术参照、心理动力、领域评分、5 年流年提示、行动建议、幸运提示
- 支持复制 / 保存报告、报告后继续追问；追问按顾问式结构回复：接住问题、命理依据、心理动力、现实行动、自我提问
- 测算规则：分享给好友或朋友圈，免费解锁 1 次 AI 命盘测算
- 对话规则：5 元购买 10 次对话额度，每轮 AI 追问回复消耗 1 次
- 模型响应较慢或失败时，会先返回命盘师结构化兜底报告，避免用户一直等待空白
- 营销说明区默认隐藏，用户点击报告示例、定价说明等入口后再展开

## 配置项

- `OPENAI_API_KEY`：必填，模型 API key
- `OPENAI_MODEL`：Kimi 推荐 `moonshot-v1-8k`，响应速度更适合网页产品
- `OPENAI_BASE_URL`：Kimi 使用 `https://api.moonshot.cn/v1`
- `OPENAI_API_STYLE`：Kimi 使用 `chat`，OpenAI Responses API 可使用 `responses`
- `MODEL_PROVIDER`：页面上显示的供应商名称
- `OPENAI_MAX_OUTPUT_TOKENS`：报告输出上限，默认 `4200`
- `OPENAI_CHAT_MAX_TOKENS`：追问回复输出上限，默认 `1800`
- `MODEL_REQUEST_TIMEOUT_MS`：模型等待时间，默认约 `60000`，Kimi 建议保留 60 秒左右；超时后使用结构化兜底报告
- `PORT`：默认 `8787`

## 命令行旧版

## 快速运行

```bash
cd /Users/qohfq/Documents/Playground/ai-fortune
python3 fortune.py
```

也可以一次性传参：

```bash
python3 fortune.py \
  --name 小明 \
  --birth 1998-08-18 \
  --time 23:30 \
  --gender 男 \
  --mode career \
  --question "我最近适合换工作吗？"
```

强制本地生成：

```bash
python3 fortune.py --local --name 小明 --birth 1998-08-18 --question "最近整体运势如何？"
```

输出 JSON：

```bash
python3 fortune.py --json --local --name 小明 --birth 1998-08-18 --question "最近整体运势如何？"
```

## 配置 OpenAI

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

然后填入：

```bash
OPENAI_API_KEY=你的_api_key
OPENAI_MODEL=gpt-4.1-mini
```

如果你使用兼容 OpenAI 的网关，也可以设置：

```bash
OPENAI_BASE_URL=https://api.openai.com/v1
```

## 参数

- `--name` / `-n`：称呼或昵称
- `--birth` / `-b`：出生日期，格式 `YYYY-MM-DD`
- `--time` / `-t`：出生时间，可留空
- `--gender` / `-g`：性别或身份称呼，可留空
- `--question` / `-q`：想问的问题
- `--mode` / `-m`：解读重点，可选 `overall`、`love`、`career`、`wealth`、`study`
- `--local`：不调用 API，强制本地生成
- `--json`：输出结构化 JSON

如果没有传 `--mode`，脚本会根据问题里的关键词简单推断重点，例如“桃花”会偏向 `love`，“换工作”会偏向 `career`。

# 命盘师微信小程序

这是可导入微信开发者工具的小程序版本，复用当前网页后端 `/api/health` 和 `/api/reading`。

## 开发预览

1. 打开微信开发者工具。
2. 导入目录：

```text
/Users/qohfq/Documents/Playground/ai-fortune/wechat-miniprogram
```

3. 如果只是本地调试，可以在开发者工具里临时关闭“校验合法域名”。
4. 当前 `config.js` 默认指向 Netlify HTTPS 后端：

```text
https://mingpanshi-ai.pages.dev
```

## 正式上架前必须做

1. 把 `project.config.json` 里的 `appid` 改成你自己的小程序 AppID。
2. 在微信公众平台后台把后端 HTTPS 域名配置为 `request` 合法域名；当前测试域名是 `https://mingpanshi-ai.pages.dev`，正式提审建议换成你自己的已备案域名。
3. 后端域名需要稳定可用，不能用临时隧道。
4. 如果后续换自有域名，把 `config.js` 的 `API_BASE_URL` 改成你的正式 HTTPS 域名。
5. 按小程序后台要求完成类目、隐私、用户协议、备案和审核资料。

当前小程序没有把 Kimi API key 放到前端，所有模型调用仍然走你的 Node 后端。

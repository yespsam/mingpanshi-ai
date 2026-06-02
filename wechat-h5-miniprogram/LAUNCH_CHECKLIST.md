# 命盘师 H5 小程序上架清单

## 已完成

- H5 小程序壳：`pages/web/index`
- `web-view` 指向线上 H5：`https://mingpanshi-ai.netlify.app/?from=miniprogram`
- 分享给好友与朋友圈入口
- 线上 H5 UI、Kimi API、报告生成与对话额度逻辑
- 产品说明、用户协议、隐私政策、联系方式页面

## 需要你提供或在微信后台完成

1. 小程序 AppID
   - 修改 `project.config.json` 中的 `appid`

2. web-view 业务域名
   - 微信公众平台配置：`https://mingpanshi-ai.netlify.app`
   - 如果改自有域名，需要同步修改 `config.js`

3. 域名校验文件
   - 微信后台下载校验文件
   - 放到项目 `public/` 根目录
   - 重新部署 Netlify

4. 小程序备案与主体资料
   - 按微信后台提示完成备案、类目、主体信息、客服联系方式

5. 支付能力
   - 当前是 demo 到账
   - 正式收费前需要接微信支付或符合微信虚拟支付规则的支付方案

6. 严格分享奖励
   - 当前 H5 是点击分享按钮后奖励
   - 若要校验真实转发，需要原生小程序分享事件 + 后端邀请记录

7. 审核文案
   - 避免承诺“预测命运”“保证转运”“治疗焦虑”
   - 保持“娱乐、自我反思、不作为决策依据”的表达

## 当前导入路径

```text
/Users/qohfq/Documents/Playground/ai-fortune/wechat-h5-miniprogram
```

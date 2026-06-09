# 命盘师 H5 小程序壳

这个目录是 H5 web-view 模式：小程序只承载 `https://mingpanshi-ai.pages.dev`，页面主体仍然由线上网页提供。

## 适合场景

- 想最快复用当前网页 UI 与后端。
- 先做投放、测试、演示，不想维护两套界面。

## 上架前注意

1. 把 `project.config.json` 里的 `appid` 改成你的小程序 AppID。
2. 在微信公众平台配置 `web-view` 业务域名；当前测试域名是 `https://mingpanshi-ai.pages.dev`，正式提审建议换成你自己的已备案域名。
3. 如果微信后台要求域名校验文件，需要把校验文件放到网页根目录并重新部署。
4. H5 页面里的按钮不能像原生 `<button open-type="share">` 一样直接拉起小程序转发面板；小程序转发主要走右上角菜单或原生分享按钮。
5. 如果要做严格的“转发成功后奖励次数”，建议用原生小程序按钮 + 后端邀请关系记录。

更完整的上架待办见：

```text
LAUNCH_CHECKLIST.md
```

提交审核步骤见：

```text
SUBMIT_GUIDE.md
```

## 导入路径

```text
/Users/qohfq/Documents/Playground/ai-fortune/wechat-h5-miniprogram
```

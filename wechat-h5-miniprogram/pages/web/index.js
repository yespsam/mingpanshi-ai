const config = require("../../config");

Page({
  data: {
    webUrl: config.WEB_VIEW_URL
  },

  onLoad(options) {
    const query = [];
    if (options.from) query.push(`mp_from=${encodeURIComponent(options.from)}`);
    if (options.ref) query.push(`ref=${encodeURIComponent(options.ref)}`);

    this.setData({
      webUrl: appendQuery(config.WEB_VIEW_URL, query)
    });

    wx.showShareMenu({
      withShareTicket: true,
      menus: ["shareAppMessage", "shareTimeline"]
    });
  },

  onWebMessage(event) {
    this.webMessages = event.detail.data || [];
  },

  onShareAppMessage() {
    return {
      title: "输入出生信息，一分钟生成专属 AI 命盘报告",
      path: "/pages/web/index?from=share"
    };
  },

  onShareTimeline() {
    return {
      title: "命盘师 | AI 命盘解析",
      query: "from=timeline"
    };
  }
});

function appendQuery(url, parts) {
  const extra = parts.filter(Boolean).join("&");
  if (!extra) return url;
  return `${url}${url.indexOf("?") === -1 ? "?" : "&"}${extra}`;
}

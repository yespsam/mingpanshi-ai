const config = require("../config");

function request(path, options) {
  const opts = options || {};

  return new Promise((resolve, reject) => {
    wx.request({
      url: config.API_BASE_URL + path,
      method: opts.method || "GET",
      data: opts.data || {},
      header: Object.assign(
        {
          "Content-Type": "application/json"
        },
        opts.header || {}
      ),
      timeout: opts.timeout || 90000,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
          return;
        }

        reject(new Error((res.data && res.data.message) || "请求失败"));
      },
      fail(error) {
        reject(new Error(error.errMsg || "网络不可用"));
      }
    });
  });
}

function getHealth() {
  return request("/api/health");
}

function createReading(payload) {
  return request("/api/reading", {
    method: "POST",
    data: payload
  });
}

module.exports = {
  getHealth,
  createReading
};

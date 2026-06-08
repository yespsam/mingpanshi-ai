const root = document.querySelector("#standaloneReportRoot");
const toast = document.querySelector("#toast");
const copyBtn = document.querySelector("#reportCopyBtn");
const downloadBtn = document.querySelector("#reportDownloadBtn");

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3000);
}

function loadPayload() {
  try {
    return JSON.parse(localStorage.getItem(window.MPS_REPORT_VIEW.STORE_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function reportToText(payload = {}) {
  const report = payload.report || {};
  const profile = payload.profile || {};
  const parts = [
    window.MPS_REPORT_VIEW.normalizeReportTitle(report.title),
    "",
    "先看结论",
    window.MPS_REPORT_VIEW.plainSummaryText(profile, report),
    "",
    report.summary || "",
    "",
    `命盘：${profile.pillars?.year?.name || "--"} ${profile.pillars?.month?.name || "--"} ${profile.pillars?.day?.name || "--"} ${profile.pillars?.hour?.name || "--"}`,
    `本卦：${profile.hexagrams?.primary?.name || "--"}，变卦：${profile.hexagrams?.changed?.name || "--"}`,
  ];

  const byTitle = new Map((report.sections || []).map((item) => [item.title, item.body]));
  [
    ["针对你的问题", byTitle.get("重点问题")],
    ["命盘主线", byTitle.get("命盘总览")],
    ["交叉验证", byTitle.get("多术数交叉验证")],
  ].forEach(([title, body]) => {
    if (body) parts.push("", title, body);
  });
  if (Array.isArray(report.advice) && report.advice.length) {
    parts.push("", "下一步行动", ...report.advice.slice(0, 4).map((item, index) => `${index + 1}. ${item}`));
  }
  if (report.disclaimer) parts.push("", report.disclaimer);
  return parts.filter((part) => part !== undefined && part !== null).join("\n");
}

function renderEmpty() {
  root.innerHTML = `
    <section class="readable-report-empty">
      <span class="reader-kicker">未找到报告</span>
      <h1>还没有可读取的命盘报告</h1>
      <p>请先回到命盘终端生成报告，再打开完整报告页。</p>
      <a class="primary-button" href="/?fresh=20260602-2">返回生成报告</a>
    </section>
  `;
}

const payload = loadPayload();
if (payload?.report && payload?.profile) {
  root.innerHTML = window.MPS_REPORT_VIEW.renderReadableReport(payload);
  document.title = `${window.MPS_REPORT_VIEW.normalizeReportTitle(payload.report.title)} | 命盘师`;
} else {
  renderEmpty();
}

copyBtn?.addEventListener("click", async () => {
  if (!payload?.report) {
    showToast("还没有可复制的报告。");
    return;
  }
  try {
    await navigator.clipboard.writeText(reportToText(payload));
    showToast("完整报告已复制。");
  } catch (error) {
    showToast("当前浏览器不允许复制。");
  }
});

downloadBtn?.addEventListener("click", () => {
  if (!payload?.report) {
    showToast("还没有可保存的报告。");
    return;
  }
  const blob = new Blob([reportToText(payload)], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `命盘师完整报告-${Date.now()}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("完整报告已保存。");
});

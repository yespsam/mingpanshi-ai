const api = require("../../utils/api");

const genderOptions = ["不填写", "男", "女", "其他"];
const focusOptions = [
  { label: "根据问题自动判断", value: "auto" },
  { label: "整体格局", value: "overall" },
  { label: "事业发展", value: "career" },
  { label: "感情关系", value: "love" },
  { label: "财运规划", value: "wealth" },
  { label: "学业成长", value: "study" },
  { label: "身心状态", value: "health" }
];

Page({
  data: {
    apiReady: false,
    statusText: "检测 API",
    loading: false,
    hasReport: false,
    reportTitle: "等待解析",
    summary: "填写资料后，系统会先生成完整命理资料包，再通过模型 API 输出产品级报告。",
    coreGlyph: "玄",
    genderOptions,
    genderIndex: 0,
    focusLabels: focusOptions.map(function (item) { return item.label; }),
    focusIndex: 0,
    form: {
      name: "",
      birthDate: "",
      birthTime: "",
      birthPlace: "",
      gender: "",
      focus: "auto",
      question: ""
    },
    pillars: [],
    elements: [],
    domains: [],
    sections: [],
    advice: [],
    annualFlow: [],
    luckyText: "",
    reportText: ""
  },

  onLoad() {
    this.checkHealth();
  },

  checkHealth() {
    api.getHealth()
      .then((data) => {
        this.setData({
          apiReady: !!data.hasOpenAIKey,
          statusText: data.hasOpenAIKey
            ? `${data.provider || "模型"} ${data.model} 已就绪`
            : "模型 API 未配置"
        });
      })
      .catch(() => {
        this.setData({
          apiReady: false,
          statusText: "API 未连接"
        });
      });
  },

  onInput(event) {
    const key = event.currentTarget.dataset.key;
    this.setData({
      [`form.${key}`]: event.detail.value
    });
  },

  onBirthDateChange(event) {
    this.setData({
      "form.birthDate": event.detail.value
    });
  },

  onBirthTimeChange(event) {
    this.setData({
      "form.birthTime": event.detail.value
    });
  },

  onGenderChange(event) {
    const index = Number(event.detail.value);
    this.setData({
      genderIndex: index,
      "form.gender": index === 0 ? "" : genderOptions[index]
    });
  },

  onFocusChange(event) {
    const index = Number(event.detail.value);
    this.setData({
      focusIndex: index,
      "form.focus": focusOptions[index].value
    });
  },

  submitReading() {
    if (!this.data.form.birthDate) {
      wx.showToast({ title: "请选择出生日期", icon: "none" });
      return;
    }

    if (!this.data.apiReady) {
      wx.showToast({ title: "API 未就绪", icon: "none" });
      this.checkHealth();
      return;
    }

    this.setData({ loading: true });
    api.createReading(this.data.form)
      .then((payload) => {
        this.renderReport(payload);
        wx.showToast({ title: "报告已生成", icon: "success" });
      })
      .catch((error) => {
        wx.showToast({
          title: error.message || "生成失败",
          icon: "none"
        });
      })
      .finally(() => {
        this.setData({ loading: false });
      });
  },

  renderReport(payload) {
    const profile = payload.profile || {};
    const report = payload.report || {};
    const pillarsData = profile.pillars || {};
    const lucky = report.lucky || profile.lucky || {};
    const hexagram = profile.hexagrams && profile.hexagrams.primary;

    const pillars = [
      { label: "年柱", value: valueWithDetail(pillarsData.year) },
      { label: "月柱", value: valueWithDetail(pillarsData.month) },
      { label: "日柱", value: valueWithDetail(pillarsData.day) },
      { label: "时柱", value: valueWithDetail(pillarsData.hour) || "未知" }
    ];

    const domainReadings = report.domainReadings || [];
    const domains = (profile.domains || []).map(function (item) {
      const ai = domainReadings.find(function (reading) {
        return reading.key === item.key;
      }) || {};
      return {
        key: item.key,
        label: ai.label || item.label,
        score: ai.score || item.score,
        reading: ai.reading || "等待解读。"
      };
    });

    const annualReadings = report.annualFlow || [];
    const annualFlow = (profile.annualFlow || []).map(function (item) {
      const ai = annualReadings.find(function (reading) {
        return Number(reading.year) === Number(item.year);
      }) || {};
      return {
        year: item.year,
        theme: ai.theme || item.theme,
        score: item.score,
        reading: ai.reading || `${item.ganzhi}，适合稳步观察。`
      };
    });

    const reportText = buildReportText(profile, report);

    this.setData({
      hasReport: true,
      reportTitle: normalizedReportTitle(report.title),
      summary: report.summary || "报告已生成。",
      coreGlyph: hexagram && hexagram.trigram ? hexagram.trigram.name : "玄",
      pillars,
      elements: profile.elements || [],
      domains,
      sections: report.sections || [],
      advice: report.advice || [],
      annualFlow,
      luckyText: `幸运色：${lucky.color || "--"}｜数字：${lucky.number || "--"}｜方位：${lucky.direction || "--"}｜小物：${lucky.object || "--"}`,
      reportText
    });
  },

  copyReport() {
    if (!this.data.reportText) {
      wx.showToast({ title: "暂无报告", icon: "none" });
      return;
    }

    wx.setClipboardData({
      data: this.data.reportText,
      success() {
        wx.showToast({ title: "已复制", icon: "success" });
      }
    });
  }
});

function valueWithDetail(pillar) {
  if (!pillar) return "";
  return `${pillar.name} ${pillar.animal || ""} ${pillar.element || ""}`.trim();
}

function buildReportText(profile, report) {
  const lines = [
    normalizedReportTitle(report.title),
    "",
    report.summary || "",
    "",
    `命盘：${profile.pillars && profile.pillars.year ? profile.pillars.year.name : "--"} ${profile.pillars && profile.pillars.month ? profile.pillars.month.name : "--"} ${profile.pillars && profile.pillars.day ? profile.pillars.day.name : "--"} ${profile.pillars && profile.pillars.hour ? profile.pillars.hour.name : "--"}`
  ];

  (report.sections || []).forEach(function (section) {
    lines.push("", section.title, section.body);
  });

  if (report.advice && report.advice.length) {
    lines.push("", "行动建议");
    report.advice.forEach(function (item, index) {
      lines.push(`${index + 1}. ${item}`);
    });
  }

  if (report.disclaimer) {
    lines.push("", report.disclaimer);
  }

  return lines.filter(Boolean).join("\n");
}

function normalizedReportTitle(value) {
  const title = String(value || "").trim();
  if (!title || title.indexOf("玄策") !== -1) return "命盘师 AI 命盘报告";
  return title;
}

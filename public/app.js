const $ = (selector) => document.querySelector(selector);

const form = $("#fortuneForm");
const chatForm = $("#chatForm");
const siteHeader = $(".site-header");
const menuButton = $(".menu-button");
const submitBtn = $("#submitBtn");
const chatBtn = $("#chatBtn");
const chatInput = $("#chatInput");
const resetBtn = $("#resetBtn");
const copyBtn = $("#copyBtn");
const saveBtn = $("#saveBtn");
const againBtn = $("#againBtn");
const shareBtn = $("#shareBtn");
const openReportBtn = $("#openReportBtn");
const openReportBtnHero = $("#openReportBtnHero");
const unlockShareBtn = $("#unlockShareBtn");
const buyPackBtn = $("#buyPackBtn");
const railShareBtn = $("#railShareBtn");
const railBuyBtn = $("#railBuyBtn");
const apiState = $("#apiState");
const toast = $("#toast");
const matrixCanvas = $("#matrixRain");
const marketingSections = Array.from(document.querySelectorAll("[data-marketing-section]"));
const marketingSectionIds = new Set(marketingSections.map((section) => section.id));

const readingUnlockCount = $("#readingUnlockCount");
const chatCreditCount = $("#chatCreditCount");
const emptyState = $("#emptyState");
const loadingState = $("#loadingState");
const reportContent = $("#reportContent");
const reportTitle = $("#reportTitle");
const summary = $("#summary");
const resultMeta = $("#resultMeta");
const tagRow = $("#tagRow");
const reportBrief = $("#reportBrief");
const reportNav = $("#reportNav");
const pillarList = $("#pillarList");
const pillarCode = $("#pillarCode");
const runtimeCode = $("#runtimeCode");
const elementBars = $("#elementBars");
const domainList = $("#domainList");
const sectionList = $("#sectionList");
const annualList = $("#annualList");
const luckyBox = $("#luckyBox");
const chatMessages = $("#chatMessages");
const fullReportSection = $("#fullReportSection");
const fullReportBody = $("#fullReportBody");
const growthPanel = $("#growthPanel");
const posterPreview = $("#posterPreview");
const deepUnlockBtn = $("#deepUnlockBtn");
const posterCopyBtn = $("#posterCopyBtn");

const payModal = $("#payModal");
const payCloseBtn = $("#payCloseBtn");
const payContinueBtn = $("#payContinueBtn");
const payShareBtn = $("#payShareBtn");
const shareModal = $("#shareModal");
const shareCloseBtn = $("#shareCloseBtn");
const posterBtn = $("#posterBtn");
const inviteBtn = $("#inviteBtn");
const accessModal = $("#accessModal");
const accessForm = $("#accessForm");
const accessCodeInput = $("#accessCodeInput");

const CLIENT_ID_KEY = "mps_client_id";
const ACCESS_CODE_KEY = "mps_access_code";
const REPORT_KEY = window.MPS_REPORT_VIEW?.STORE_KEY || "mps_last_report_v1";

let lastReportText = "";
let apiReady = null;
let accessRequired = false;
let account = null;
let currentConversationId = "";
let pendingAction = null;
let enhancementRequestId = 0;
let lastPosterText = "";

const elementColors = {
  木: "var(--green)",
  火: "var(--red)",
  土: "var(--earth)",
  金: "var(--metal)",
  水: "var(--water)",
};

const fallbackDomainText = {
  career: "事业线等待解读。",
  love: "感情线等待解读。",
  wealth: "财运线等待解读。",
  study: "学业成长等待解读。",
  health: "身心状态等待解读。",
};

function bootMatrixRain() {
  if (!matrixCanvas?.getContext) return;
  const ctx = matrixCanvas.getContext("2d");
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const glyphs = "01AI命盘师乾坤震巽坎离艮兑甲乙丙丁戊己庚辛壬癸子丑寅卯辰巳午未申酉戌亥木火土金水";
  let drops = [];
  let fontSize = 16;
  let dpr = 1;
  let frame = 0;

  function resizeMatrix() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    matrixCanvas.width = Math.floor(window.innerWidth * dpr);
    matrixCanvas.height = Math.floor(window.innerHeight * dpr);
    matrixCanvas.style.width = `${window.innerWidth}px`;
    matrixCanvas.style.height = `${window.innerHeight}px`;
    fontSize = window.innerWidth < 720 ? 13 : 16;
    const columns = Math.ceil(window.innerWidth / fontSize);
    drops = Array.from({ length: columns }, () => Math.random() * (window.innerHeight / fontSize));
    drawMatrix(true);
  }

  function drawMatrix(singleFrame = false) {
    frame += 1;
    const fade = singleFrame ? 0.92 : 0.12;
    ctx.fillStyle = `rgba(0, 8, 3, ${fade})`;
    ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);
    ctx.font = `${fontSize * dpr}px "SFMono-Regular", "Cascadia Code", "Roboto Mono", Menlo, Consolas, monospace`;
    ctx.textBaseline = "top";

    for (let index = 0; index < drops.length; index += 1) {
      const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
      const x = index * fontSize * dpr;
      const y = drops[index] * fontSize * dpr;
      const isLead = frame % 9 === 0 && Math.random() > 0.82;
      ctx.fillStyle = isLead ? "rgba(218, 255, 230, 0.92)" : "rgba(0, 255, 112, 0.52)";
      ctx.shadowColor = "rgba(0, 255, 112, 0.55)";
      ctx.shadowBlur = isLead ? 16 : 7;
      ctx.fillText(glyph, x, y);

      if (y > matrixCanvas.height && Math.random() > 0.975) {
        drops[index] = 0;
      } else {
        drops[index] += Math.random() > 0.92 ? 1.8 : 1;
      }
    }

    ctx.shadowBlur = 0;
    if (!singleFrame && !reducedMotion) window.requestAnimationFrame(() => drawMatrix());
  }

  resizeMatrix();
  window.addEventListener("resize", resizeMatrix);
  if (!reducedMotion) drawMatrix();
}

function clientId() {
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 3000);
}

function revealMarketingSection(id, shouldScroll = true) {
  const target = document.getElementById(id);
  if (!target || !marketingSectionIds.has(id)) return false;
  for (const section of marketingSections) {
    section.hidden = false;
    section.classList.add("revealed");
  }
  if (shouldScroll) {
    window.setTimeout(() => target.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }
  return true;
}

function handleInternalLink(event, link) {
  const hash = link.getAttribute("href") || "";
  if (!hash.startsWith("#")) return;
  const id = hash.slice(1);
  if (revealMarketingSection(id, false)) {
    event.preventDefault();
    history.replaceState(null, "", hash);
    revealMarketingSection(id, true);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function collectForm() {
  const data = new FormData(form);
  return {
    clientId: clientId(),
    name: String(data.get("name") || "").trim(),
    birthDate: data.get("birthDate"),
    birthTime: data.get("birthTime"),
    birthPlace: String(data.get("birthPlace") || "").trim(),
    useTrueSolarTime: data.get("useTrueSolarTime") === "on",
    gender: data.get("gender"),
    focus: data.get("focus"),
    question: String(data.get("question") || "").trim(),
  };
}

function storedAccessCode() {
  return sessionStorage.getItem(ACCESS_CODE_KEY) || "";
}

function showAccessModal() {
  if (!accessModal) return;
  accessModal.hidden = false;
  window.setTimeout(() => accessCodeInput?.focus(), 0);
}

function hideAccessModal() {
  if (accessModal) accessModal.hidden = true;
}

function showModal(modal) {
  if (modal) modal.hidden = false;
}

function hideModal(modal) {
  if (modal) modal.hidden = true;
}

function showPayModal(action) {
  pendingAction = action || null;
  showModal(payModal);
}

function showShareUnlockModal(action) {
  pendingAction = action || null;
  showModal(shareModal);
}

function setResultState(state) {
  if (emptyState) emptyState.hidden = state !== "empty";
  if (loadingState) loadingState.hidden = state !== "loading";
  if (reportContent) reportContent.hidden = state !== "report";
}

function renderAccount(nextAccount) {
  if (nextAccount) account = nextAccount;
  const freeAccess = account?.freeAccess !== false;
  if (readingUnlockCount) readingUnlockCount.textContent = freeAccess ? "FREE" : String(account?.readingUnlocks ?? 0);
  if (chatCreditCount) chatCreditCount.textContent = freeAccess ? "FREE" : String(account?.chatCredits ?? account?.credits ?? 0);
}

async function loadAccount() {
  const response = await fetch(`/api/account?clientId=${encodeURIComponent(clientId())}`);
  const data = await response.json();
  if (data.ok) renderAccount(data.account);
  return data.account;
}

async function checkHealth() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    apiReady = Boolean(data.hasOpenAIKey);
    accessRequired = Boolean(data.accessRequired);

    if (apiReady) {
      apiState.textContent = "测算服务已就绪";
      apiState.classList.add("ready");
      apiState.classList.remove("warn");
      if (accessRequired && !storedAccessCode()) showAccessModal();
    } else {
      apiState.textContent = "请配置模型 API";
      apiState.classList.add("warn");
      apiState.classList.remove("ready");
    }
    await loadAccount();
    return apiReady;
  } catch (error) {
    apiReady = false;
    apiState.textContent = "API 未连接";
    apiState.classList.add("warn");
    apiState.classList.remove("ready");
    return apiReady;
  }
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("loading", isLoading);
  const label = submitBtn.querySelector(".button-label");
  if (label) label.textContent = isLoading ? "命盘推演中" : "开始起盘";
}

function setChatLoading(isLoading) {
  if (!chatBtn) return;
  chatBtn.disabled = isLoading;
  chatBtn.textContent = isLoading ? "推演回复中" : "追问命盘师";
}

function renderTags(tags = []) {
  tagRow.innerHTML = tags
    .filter(Boolean)
    .slice(0, 8)
    .map((tag) => `<span>${escapeHtml(tag)}</span>`)
    .join("");
}

function compactText(value, maxLength = 88) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

const elementExplain = {
  木: { ability: "计划、成长、学习和适应变化的能力", lack: "方向感、学习弹性或长期规划需要补", action: "把目标拆成清单，每周固定复盘一次" },
  火: { ability: "表达、行动热度和快速启动的能力", lack: "动力、表达或主动争取机会的能量需要补", action: "先做一个小的公开行动，比如沟通、投递或展示作品" },
  土: { ability: "稳定、承接、责任感和落地能力", lack: "稳定感、生活节奏或长期承接能力需要补", action: "先固定作息、预算和工作边界" },
  金: { ability: "规则、边界、判断力和复盘能力", lack: "边界、复盘、谈判和取舍能力需要补", action: "写清楚底线、成本、风险和可接受结果" },
  水: { ability: "观察、沟通、信息整合和情绪调节能力", lack: "沟通、信息整合、休息恢复或情绪流动需要补", action: "先减少噪音，找一个可信反馈源做现实校验" },
};

function elementLine(item = {}, mode = "ability") {
  const element = item.element || "";
  const detail = elementExplain[element] || { ability: "你比较容易调动的现实能力", lack: "某个现实能力需要补足", action: "把问题拆成一个能验证的小动作" };
  const percent = item.percent ? `（${item.percent}%）` : "";
  return `${element || "优势"}${percent}代表${detail[mode] || detail.ability}`;
}

function plainSummaryText(profile = {}, report = {}) {
  if (report.plainSummary) return String(report.plainSummary).trim();
  const pillars = profile.pillars || {};
  const elements = profile.elements || [];
  const strongest = elements[0] || {};
  const weakest = elements[elements.length - 1] || {};
  const focus = profile.user?.question ? `你问的“${profile.user.question}”` : (profile.user?.focusLabel || "当前问题");
  const stress = profile.psychology?.stressPattern || `弱${weakest.element || "项"}带来的不确定感`;
  const flow = profile.annualFlow?.[0]?.year ? `${profile.annualFlow[0].year}年适合分阶段验证` : "近期适合先小步验证";
  const weakAction = (elementExplain[weakest.element] || {}).action || "先做一个能拿到反馈的小动作";
  return [
    `结论：这件事先别急着定输赢，更适合稳住节奏后小步推进。${pillars.dayMaster || pillars.day?.stem ? `日主只是底色，不是最终答案。` : ""}`,
    `为什么：${elementLine(strongest, "ability")}；${elementLine(weakest, "lack")}。你有能用的优势，也有需要刻意补的短板。`,
    `注意：${focus}最容易被${stress}带偏，别在情绪很满时立刻拍板。`,
    `下一步：${flow}，先做一个能拿到反馈的小动作；${weakAction}。`,
  ].join("\n");
}

function mysticSkillRows(profile = {}) {
  const layers = profile.mysticSystems?.layers || {};
  return [
    {
      key: "bazi",
      name: "八字",
      title: `${layers.bazi?.dayMaster || profile.pillars?.dayMaster || "--"}日主`,
      detail: layers.bazi?.elementBalance?.plain || "四柱、十神、五行底盘",
    },
    {
      key: "liuyao",
      name: "六爻",
      title: `${layers.liuyao?.yongshen || "用神"} · ${layers.liuyao?.line || profile.sixYao?.lineName || "--"}`,
      detail: layers.liuyao?.lineTheme || layers.liuyao?.plain || "用神、世应、动爻事件判断",
    },
    {
      key: "meihua",
      name: "梅花",
      title: `${layers.meihua?.body || "体卦"} / ${layers.meihua?.use || "用卦"}`,
      detail: layers.meihua?.trend || layers.meihua?.plain || "体用生克与趋势验证",
    },
    {
      key: "ziwei",
      name: "紫微",
      title: layers.ziwei?.focusPalaceHint || "宫位入口",
      detail: (layers.ziwei?.fourTransformations || []).slice(0, 3).join(" · ") || layers.ziwei?.plain || "宫位与四化视角",
    },
    {
      key: "qimen",
      name: "奇门",
      title: `${layers.qimen?.palace || "九宫"} · ${layers.qimen?.door || "门"}`,
      detail: [layers.qimen?.star, layers.qimen?.deity].filter(Boolean).join(" · ") || layers.qimen?.plain || "宫门星神行动判断",
    },
    {
      key: "yinyuan",
      name: "姻缘",
      title: `${layers.yinyuan?.spouseStar || "关系星"} · ${layers.yinyuan?.spousePalace || "配偶宫"}`,
      detail: layers.yinyuan?.plain || "日支、配偶宫、关系边界",
    },
    {
      key: "fengshui",
      name: "风水",
      title: `${layers.fengshui?.weakElement || "五行"}需补 · ${layers.fengshui?.directionHint || "空间方向"}`,
      detail: layers.fengshui?.plain || "阳宅/办公环境习惯建议",
    },
    {
      key: "tarot",
      name: "塔罗",
      title: (layers.tarot?.cards || []).map((card) => `${card.name}${card.orientation || ""}`).join(" / ") || "心理镜像",
      detail: layers.tarot?.plain || "牌面作为自我观察提示",
    },
  ].filter((item) => item.title && item.title !== "--");
}

function renderMysticSkillPanel(profile = {}) {
  const rows = mysticSkillRows(profile);
  if (!rows.length) return "";
  return `
    <section class="mystic-skill-panel" aria-label="已挂载术数 Skill">
      <div class="skill-panel-head">
        <span>MYSTIC SKILLS</span>
        <strong>${rows.length} 个能力层已接入</strong>
      </div>
      <div class="skill-chip-grid">
        ${rows.map((item) => `
          <article class="skill-chip skill-${escapeHtml(item.key)}">
            <span>${escapeHtml(item.name)}</span>
            <strong>${escapeHtml(compactText(item.title, 28))}</strong>
            <small>${escapeHtml(compactText(item.detail, 48))}</small>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderResultMeta(payload = {}) {
  if (!resultMeta) return;
  const label = payload.provider ? `${payload.provider} 融合测算` : "命盘师生成";
  const status = payload.enhancement?.status || payload.conversation?.enhancement?.status || "";
  const statusLabel = {
    pending: "等待 Kimi 融合增强",
    processing: "Kimi 正在融合测算",
    complete: "Kimi 融合测算完成",
    failed: "基础报告已完成",
    unavailable: "基础报告已完成",
  }[status] || "已完成";
  resultMeta.innerHTML = `
    <span class="model-pill live">
      <i aria-hidden="true"></i>
      ${escapeHtml(label)}
    </span>
    <small>${escapeHtml(statusLabel)}</small>
  `;
}

function renderReportBrief(profile = {}, report = {}, payload = {}) {
  if (!reportBrief) return;
  const pillars = profile.pillars || {};
  const trueSolar = profile.meta?.trueSolarTime || {};
  const dayMaster = pillars.dayMaster || pillars.day?.stem || "--";
  const primary = profile.hexagrams?.primary?.name || "--";
  const changed = profile.hexagrams?.changed?.name || "--";
  const sixYao = profile.sixYao?.movement || `${primary}之${changed}`;
  const psychology = profile.psychology?.coreNeed || "等待解析";
  const focus = profile.user?.focusLabel || "重点问题";
  const focusSection = (report.sections || []).find((item) => item.title === "重点问题")?.body || report.summary || "";
  const plainSummary = plainSummaryText(profile, report);
  const timeNote = trueSolar.applied
    ? `${trueSolar.place?.name || "出生地"} · 真太阳时 ${trueSolar.correctedTime} · ${trueSolar.offsetMinutesExact >= 0 ? "+" : ""}${trueSolar.offsetMinutesExact} 分钟`
    : (trueSolar.enabled ? trueSolar.note || "真太阳时未应用" : "按标准北京时间");
  const items = [
    ["四柱", `${dayMaster}日主`, `${pillars.year?.name || "--"} · ${pillars.month?.name || "--"} · ${pillars.day?.name || "--"} · ${pillars.hour?.name || "--"} / ${timeNote}`],
    ["六爻卦象", sixYao, profile.sixYao?.lineTheme || "观察变化节点"],
    ["心理动力", psychology, profile.psychology?.stressPattern || "识别情绪与边界"],
    ["重点回应", focus, compactText(focusSection, 44)],
  ];

  reportBrief.innerHTML = `
    <article class="plain-summary-card">
      <span>先看结论</span>
      <strong>这份报告在说什么</strong>
      <p>${escapeHtml(plainSummary)}</p>
    </article>
  ` + items
    .map(([label, value, note]) => `
      <article class="brief-item">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        <small>${escapeHtml(note)}</small>
      </article>
    `)
    .join("") + renderMysticSkillPanel(profile);
}

function pillarSnapshot(profile = {}) {
  const pillars = profile.pillars || {};
  const trueSolar = profile.meta?.trueSolarTime || {};
  return {
    status: pillars.year || pillars.month || pillars.day ? "ready" : "waiting",
    engine: profile.meta?.calendarEngine || "lunar-javascript",
    year_pillar: pillars.year?.name || "--",
    month_pillar: pillars.month?.name || "--",
    day_pillar: pillars.day?.name || "--",
    hour_pillar: pillars.hour?.name || (profile.user?.birthTime && profile.user.birthTime !== "未知" ? "--" : "unknown_birth_time"),
    day_master: pillars.dayMaster || pillars.day?.stem || "--",
    na_yin: {
      year: pillars.year?.naYin || "--",
      month: pillars.month?.naYin || "--",
      day: pillars.day?.naYin || "--",
      hour: pillars.hour?.naYin || "--",
    },
    birth_place: trueSolar.place?.name || profile.user?.resolvedBirthPlace || profile.user?.birthPlace || "--",
    clock_time: trueSolar.clockTime || `${profile.user?.birthDate || "--"} ${profile.user?.birthTime || "--"}`,
    true_solar_time: trueSolar.applied ? trueSolar.correctedTime : "not_applied",
    solar_offset_minutes: trueSolar.applied ? trueSolar.offsetMinutesExact : 0,
    calibration: trueSolar.applied ? "true_solar_time" : (trueSolar.reason || "standard_time"),
  };
}

function renderPillarCode(profile = {}, report = {}) {
  if (!pillarCode) return;
  const snapshot = pillarSnapshot(profile);
  pillarCode.innerHTML = `<code>${escapeHtml(JSON.stringify(snapshot, null, 2))}</code>`;
  if (runtimeCode) {
    const lines = [
      "$ mps.read --input birth.json --format code",
      `[OK] year_pillar=${snapshot.year_pillar}`,
      `[OK] month_pillar=${snapshot.month_pillar}`,
      `[OK] day_pillar=${snapshot.day_pillar}`,
      `[OK] hour_pillar=${snapshot.hour_pillar}`,
      snapshot.true_solar_time !== "not_applied"
        ? `[OK] true_solar_time=${snapshot.true_solar_time} (${snapshot.solar_offset_minutes >= 0 ? "+" : ""}${snapshot.solar_offset_minutes}m)`
        : `[INFO] true_solar_time=${snapshot.calibration}`,
      `[OUT] ${report.title ? "report.compact.ready" : "waiting_for_operator_input"}`,
    ];
    runtimeCode.innerHTML = `<code>${escapeHtml(lines.join("\n"))}</code>`;
  }
}

function renderPillars(profile = {}) {
  const pillars = profile.pillars || {};
  const items = [
    ["年柱", pillars.year?.name, pillars.year],
    ["月柱", pillars.month?.name, pillars.month],
    ["日柱", pillars.day?.name, pillars.day],
    ["时柱", pillars.hour?.name || "未知", pillars.hour],
  ];

  pillarList.innerHTML = items
    .map(([label, value, detail]) => {
      const extra = detail ? `${detail.animal || ""} ${detail.element || ""}`.trim() : "可补充出生时间";
      const meta = [extra, detail?.naYin, detail?.shiShenGan].filter(Boolean).join(" · ");
      return `<div><dt>${label}</dt><dd>${escapeHtml(value || "--")}<small>${escapeHtml(meta || "可补充出生时间")}</small></dd></div>`;
    })
    .join("");
}

function renderElements(elements = []) {
  const order = ["木", "火", "土", "金", "水"];
  const byElement = new Map((elements || []).map((item) => [item.element, Math.max(0, Number(item.percent) || 0)]));
  const values = order.map((element) => ({ element, percent: byElement.get(element) || 0 }));
  const maxScale = Math.max(30, ...values.map((item) => item.percent));
  const center = 110;
  const radius = 72;
  const point = (index, scale = 1) => {
    const angle = (-90 + index * 72) * Math.PI / 180;
    return [
      Number((center + Math.cos(angle) * radius * scale).toFixed(1)),
      Number((center + Math.sin(angle) * radius * scale).toFixed(1)),
    ];
  };
  const polygon = values
    .map((item, index) => point(index, Math.min(1, item.percent / maxScale)).join(","))
    .join(" ");
  const rings = [0.33, 0.66, 1]
    .map((scale) => `<polygon points="${order.map((_, index) => point(index, scale).join(",")).join(" ")}"></polygon>`)
    .join("");
  const axes = order
    .map((_, index) => {
      const [x, y] = point(index, 1);
      return `<line x1="${center}" y1="${center}" x2="${x}" y2="${y}"></line>`;
    })
    .join("");
  const labels = values
    .map((item, index) => {
      const [x, y] = point(index, 1.2);
      return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle">${item.element}${item.percent}%</text>`;
    })
    .join("");
  const dots = values
    .map((item, index) => {
      const [x, y] = point(index, Math.min(1, item.percent / maxScale));
      const color = elementColors[item.element] || "var(--gold)";
      return `<circle cx="${x}" cy="${y}" r="4" style="--dot-color:${color}"></circle>`;
    })
    .join("");
  const strongest = values.reduce((max, item) => (item.percent > max.percent ? item : max), values[0] || {});
  const weakest = values.reduce((min, item) => (item.percent < min.percent ? item : min), values[0] || {});

  elementBars.innerHTML = `
    <div class="element-radar-card" aria-label="五行五维图">
      <svg class="element-radar" viewBox="0 0 220 220" role="img" aria-label="木火土金水五行能量分布">
        <g class="radar-grid">${rings}${axes}</g>
        <polygon class="radar-shape" points="${polygon}"></polygon>
        <g class="radar-dots">${dots}</g>
        <g class="radar-labels">${labels}</g>
      </svg>
      <div class="element-radar-note">
        <strong>${escapeHtml(strongest.element || "--")}最强 · ${escapeHtml(weakest.element || "--")}需补</strong>
        <span>五维图按五行占比缩放，越靠外代表该能力越容易被调用。</span>
      </div>
    </div>
  `;
}

function renderDomains(profile = {}, report = {}) {
  const aiReadings = new Map((report.domainReadings || []).map((item) => [item.key, item]));
  domainList.innerHTML = (profile.domains || [])
    .map((item) => {
      const ai = aiReadings.get(item.key) || {};
      const score = Number(ai.score || item.score || 0);
      const reading = ai.reading || fallbackDomainText[item.key] || "等待解读。";
      return `
        <article class="domain-card">
          <strong>${escapeHtml(ai.label || item.label)}</strong>
          <p>${escapeHtml(reading)}</p>
          <span class="score">${score}</span>
        </article>
      `;
    })
    .join("");
}

function renderSections(profile = {}, report = {}) {
  const sections = Array.isArray(report.sections) ? report.sections : [];
  const advice = Array.isArray(report.advice) ? report.advice : [];
  const html = [];
  const navItems = [];
  const byTitle = new Map(sections.map((item) => [item.title, item]));
  const compactSections = [
    { source: "重点问题", title: "针对你的问题", featured: true },
    { source: "命盘总览", title: "命盘主线" },
    { source: "多术数交叉验证", title: "交叉验证" },
  ];
  const pushSection = (title, body, options = {}) => {
    if (!body && !(options.list || []).length) return;
    const index = navItems.length + 1;
    const id = `report-section-${index}`;
    navItems.push({ id, title });
    const content = options.list
      ? `<${options.ordered ? "ol" : "ul"} class="advice-list">${options.list.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${options.ordered ? "ol" : "ul"}>`
      : `<p>${escapeHtml(body || "")}</p>`;
    html.push(`
      <details class="report-section ${options.featured ? "featured" : ""}" id="${id}" ${index <= 3 ? "open" : ""}>
        <summary>
          <span>${String(index).padStart(2, "0")}</span>
          <h3>${escapeHtml(title || "命盘解读")}</h3>
          <em>toggle</em>
        </summary>
        <div class="report-section-body">${content}</div>
      </details>
    `);
  };

  pushSection("一眼结论", plainSummaryText(profile, report), { featured: true });

  for (const item of compactSections) {
    const section = byTitle.get(item.source);
    pushSection(item.title, section?.body || "", { featured: item.featured });
  }

  if (advice.length) {
    pushSection("下一步行动", "", { list: advice.slice(0, 4), ordered: true, featured: true });
  }

  sectionList.innerHTML = html.join("") || `<p class="muted">报告会显示在这里。</p>`;
  if (reportNav) {
    reportNav.innerHTML = navItems
      .map((item) => `<a href="#${item.id}">${escapeHtml(item.title)}</a>`)
      .join("");
  }
}

function renderAnnual(profile = {}, report = {}) {
  const aiFlow = new Map((report.annualFlow || []).map((item) => [Number(item.year), item]));
  annualList.innerHTML = (profile.annualFlow || [])
    .map((item) => {
      const ai = aiFlow.get(Number(item.year)) || {};
      return `
        <article class="annual-item">
          <div class="annual-top">
            <strong>${escapeHtml(item.year)} · ${escapeHtml(item.ganzhi)}</strong>
            <span>${escapeHtml(ai.theme || item.theme)} / ${Number(item.score) || 0}</span>
          </div>
          <p>${escapeHtml(ai.reading || `${item.zodiac}年，五行${item.element}，适合稳步观察。`)}</p>
        </article>
      `;
    })
    .join("");
}

function renderLucky(profile = {}, report = {}) {
  const lucky = report.lucky || profile.lucky || {};
  luckyBox.innerHTML = [
    `幸运色：${escapeHtml(lucky.color || "--")}`,
    `幸运数字：${escapeHtml(lucky.number || "--")}`,
    `幸运方向：${escapeHtml(lucky.direction || "--")}`,
    `幸运小物：${escapeHtml(lucky.object || "--")}`,
  ].join("<br />");
}

function posterKeywords(profile = {}, report = {}) {
  const focus = profile.user?.questionIntent?.label || profile.user?.focusLabel || "命盘解析";
  const elements = profile.elements || [];
  const strongest = elements[0]?.element ? `${elements[0].element}旺` : "";
  const weakest = elements[elements.length - 1]?.element ? `${elements[elements.length - 1].element}需补` : "";
  const hexagram = profile.hexagrams?.primary?.name && profile.hexagrams?.changed?.name
    ? `${profile.hexagrams.primary.name}->${profile.hexagrams.changed.name}`
    : "";
  return [focus, strongest, weakest, hexagram, ...(report.tags || [])]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item) => !/Kimi|真太阳时|多术数/.test(item))
    .slice(0, 4);
}

function buildPosterText(profile = {}, report = {}) {
  const name = profile.user?.name || "我的";
  const question = profile.user?.question || "当前问题";
  const elements = (profile.elements || []).map((item) => `${item.element}${item.percent}%`).join(" / ");
  const keywords = posterKeywords(profile, report).join(" · ");
  const firstLine = plainSummaryText(profile, report).split(/\n+/)[0] || report.summary || "命盘报告已生成。";
  return [
    `命盘师 AI 命盘报告｜${name}`,
    `问题：${question}`,
    `关键词：${keywords || "命盘解析"}`,
    `五行：${elements || "--"}`,
    `结论：${firstLine}`,
    `打开生成你的命盘：${location.origin}`,
  ].join("\n");
}

function renderGrowthPanel(profile = {}, report = {}) {
  if (!growthPanel || !posterPreview) return;
  const pillars = profile.pillars || {};
  const elements = profile.elements || [];
  const strongest = elements[0] || {};
  const weakest = elements[elements.length - 1] || {};
  const keywords = posterKeywords(profile, report);
  const firstLine = (plainSummaryText(profile, report).split(/\n+/)[0] || report.summary || "命盘报告已生成。").slice(0, 86);
  lastPosterText = buildPosterText(profile, report);
  posterPreview.innerHTML = `
    <div class="poster-top">
      <span>&lt;命盘师/&gt;</span>
      <strong>${escapeHtml(profile.user?.focusLabel || "AI 命盘解析")}</strong>
    </div>
    <h3>${escapeHtml(profile.user?.name || "我的")}命盘信号</h3>
    <p>${escapeHtml(firstLine)}</p>
    <div class="poster-keywords">
      ${keywords.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
    </div>
    <div class="poster-matrix">
      <span>四柱</span>
      <strong>${escapeHtml([pillars.year?.name, pillars.month?.name, pillars.day?.name, pillars.hour?.name].filter(Boolean).join(" / ") || "--")}</strong>
    </div>
    <div class="poster-matrix">
      <span>五行</span>
      <strong>${escapeHtml(strongest.element || "--")}旺 / ${escapeHtml(weakest.element || "--")}需补</strong>
    </div>
    <div class="poster-footer">
      <span>扫码进入小程序</span>
      <i aria-hidden="true"></i>
    </div>
  `;
  growthPanel.hidden = false;
}

function normalizedReportTitle(value) {
  const title = String(value || "").trim();
  if (!title || title.includes("玄策")) return "命盘师命盘报告";
  return title.replace(/AI\\s*/gi, "");
}

function reportToText(payload) {
  const report = payload.report || {};
  const profile = payload.profile || {};
  const parts = [
    normalizedReportTitle(report.title),
    "",
    "先看结论",
    plainSummaryText(profile, report),
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

function renderChat(messages = []) {
  if (!chatMessages) return;
  const visible = messages.slice(-10);
  chatMessages.innerHTML = visible.length
    ? visible.map((item) => `
      <div class="chat-message ${item.role === "assistant" ? "assistant" : "user"}">
        <span>${item.role === "assistant" ? "命盘师" : "我"}</span>
        <p>${escapeHtml(item.content)}</p>
      </div>
    `).join("")
    : `<p class="muted">报告生成后，可以继续问具体处境。比如：是否适合换工作、这段关系要不要继续、财运该守还是攻、今年的关键窗口在哪里。</p>`;
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function storeLatestReport(payload) {
  try {
    localStorage.setItem(REPORT_KEY, JSON.stringify(payload));
  } catch (error) {
    showToast("报告较长，当前浏览器可能无法保存完整阅读页。");
  }
}

function renderFullReadableReport(payload) {
  if (!fullReportSection || !fullReportBody || !window.MPS_REPORT_VIEW) return;
  fullReportBody.innerHTML = window.MPS_REPORT_VIEW.renderReadableReport(payload);
  fullReportSection.hidden = false;
}

function enhancementStatus(payload = {}) {
  return payload.enhancement?.status || payload.conversation?.enhancement?.status || "";
}

async function requestReportEnhancement(conversationId, requestId) {
  if (!conversationId) return;
  try {
    renderResultMeta({ enhancement: { status: "processing" } });
    const response = await fetch("/api/reading-enhancement", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Access-Code": storedAccessCode() },
      body: JSON.stringify({ clientId: clientId(), conversationId }),
    });
    const data = await response.json();
    if (requestId !== enhancementRequestId) return;
    if (!response.ok || !data.ok) throw new Error(data.message || "增强失败");
    if (data.enhancement?.status === "complete") {
      renderAccount(data.account);
      renderReport(data);
      showToast("Kimi 融合测算已完成，报告已自动更新。");
      return;
    }
    renderResultMeta(data);
  } catch (error) {
    if (requestId === enhancementRequestId) {
      renderResultMeta({ enhancement: { status: "failed" } });
    }
  }
}

function maybeStartReportEnhancement(payload = {}) {
  if (enhancementStatus(payload) !== "pending") return;
  const conversationId = payload.conversationId || payload.conversation?.id || currentConversationId;
  if (!conversationId) return;
  const requestId = ++enhancementRequestId;
  window.setTimeout(() => requestReportEnhancement(conversationId, requestId), 300);
}

function openFullReportPage() {
  if (!lastReportText) {
    showToast("请先生成一份命盘报告。");
    return;
  }
  window.open("/report.html", "_blank", "noopener");
}

function renderReport(payload) {
  const { profile = {}, report = {}, model, provider } = payload;
  const hexagram = profile.hexagrams?.primary;

  reportTitle.textContent = normalizedReportTitle(report.title);
  summary.textContent = plainSummaryText(profile, report) || report.summary || "报告已生成。";
  renderResultMeta(payload);
  renderTags([...(report.tags || []), hexagram?.name, provider || "", profile.stellar?.sign]);
  renderReportBrief(profile, report, payload);
  renderPillarCode(profile, report);
  renderPillars(profile);
  renderElements(profile.elements || []);
  renderDomains(profile, report);
  renderSections(profile, report);
  renderAnnual(profile, report);
  renderLucky(profile, report);
  renderGrowthPanel(profile, report);
  renderChat(payload.conversation?.messages || []);
  currentConversationId = payload.conversationId || payload.conversation?.id || "";
  lastReportText = reportToText(payload);
  storeLatestReport(payload);
  renderFullReadableReport(payload);
  setResultState("report");
  maybeStartReportEnhancement(payload);
  window.setTimeout(() => {
    reportContent?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 120);
}

function readingUnlocksLeft() {
  if (account?.freeAccess !== false) return Number.POSITIVE_INFINITY;
  return Number(account?.readingUnlocks ?? 0);
}

function chatCreditsLeft() {
  if (account?.freeAccess !== false) return Number.POSITIVE_INFINITY;
  return Number(account?.chatCredits ?? account?.credits ?? 0);
}

function resetView() {
  enhancementRequestId += 1;
  form.reset();
  reportTitle.textContent = "等待解析";
  summary.textContent = "等待解析结果，填写资料后生成完整命盘，再输出专属报告。";
  if (resultMeta) resultMeta.innerHTML = "";
  renderTags([]);
  if (reportBrief) reportBrief.innerHTML = "";
  if (reportNav) reportNav.innerHTML = "";
  renderPillarCode({}, {});
  pillarList.innerHTML = "";
  elementBars.innerHTML = "";
  domainList.innerHTML = "";
  sectionList.innerHTML = "";
  annualList.innerHTML = "";
  luckyBox.textContent = "幸运提示等待生成";
  currentConversationId = "";
  lastReportText = "";
  lastPosterText = "";
  if (growthPanel) growthPanel.hidden = true;
  if (posterPreview) posterPreview.innerHTML = "";
  if (fullReportBody) fullReportBody.innerHTML = "";
  if (fullReportSection) fullReportSection.hidden = true;
  renderChat([]);
  setResultState("empty");
}

async function copyReportText(successMessage = "报告已复制。") {
  if (!lastReportText) {
    showToast("还没有可保存的报告。");
    return false;
  }
  try {
    await navigator.clipboard.writeText(lastReportText);
    showToast(successMessage);
    return true;
  } catch (error) {
    showToast("当前浏览器不允许复制。");
    return false;
  }
}

function sharePayload(channel) {
  const link = location.origin;
  if (lastPosterText) {
    const prefix = channel === "timeline"
      ? "我刚生成了一份 AI 命盘报告，分享解锁深度版："
      : "这份 AI 命盘报告挺有意思，分享可解锁深度版：";
    return `${prefix}\n\n${lastPosterText}\n\n${link}`;
  }
  if (channel === "timeline") {
    return `命盘师 AI 命盘解析：分享即可解锁深度报告。${link}`;
  }
  return `我在用命盘师生成 AI 命盘报告，分享可解锁深度报告：${link}`;
}

async function copySharePayload(channel) {
  const text = sharePayload(channel);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    showToast(text);
    return false;
  }
}

function downloadReport() {
  if (!lastReportText) {
    showToast("还没有可保存的报告。");
    return;
  }
  const blob = new Blob([lastReportText], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `命盘师报告-${Date.now()}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("报告已保存。");
}

async function rechargeAccount() {
  hideModal(payModal);
  showToast("当前网页测试期免费开放，不需要购买额度。");
  const action = pendingAction;
  pendingAction = null;
  if (typeof action === "function") action();
}

async function unlockReading(channel = "friend") {
  const trigger = channel === "timeline" ? inviteBtn : posterBtn;
  if (trigger) trigger.disabled = true;
  try {
    await copySharePayload(channel);
    const response = await fetch("/api/share-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: clientId(), channel }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.message || "解锁失败");
    renderAccount(data.account);
    hideModal(shareModal);
    showToast(channel === "timeline" ? "朋友圈海报文案已复制。" : "好友分享卡片已复制。");
    const action = pendingAction;
    pendingAction = null;
    if (typeof action === "function") action();
  } catch (error) {
    showToast(error.message || "解锁失败，请稍后再试。");
  } finally {
    if (trigger) trigger.disabled = false;
  }
}

function handleInsufficientCredits(error, action) {
  if (error.code === "READING_LOCKED") {
    pendingAction = action || null;
    hideModal(shareModal);
    hideModal(payModal);
    setResultState("empty");
    loadAccount();
    showToast("当前已改为免费体验，请重新点击开始起盘。");
    return true;
  }
  if (error.code === "INSUFFICIENT_CREDITS" || error.status === 402) {
    pendingAction = action || null;
    hideModal(shareModal);
    hideModal(payModal);
    setResultState("empty");
    loadAccount();
    showToast("当前已改为免费体验，请重新点击开始起盘。");
    return true;
  }
  return false;
}

async function submitReading() {
  if (apiReady !== true) await checkHealth();
  if (apiReady !== true) {
    showToast("请先配置模型 API 密钥，再生成报告。");
    return;
  }
  if (accessRequired && !storedAccessCode()) {
    showAccessModal();
    showToast("请先输入访问码。");
    return;
  }

  const payload = collectForm();
  if (!payload.birthDate) {
    showToast("请先填写出生日期。");
    return;
  }
  setLoading(true);
  hideModal(shareModal);
  hideModal(payModal);
  setResultState("loading");
  try {
    const response = await fetch("/api/reading", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Access-Code": storedAccessCode() },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      if (response.status === 401) {
        sessionStorage.removeItem(ACCESS_CODE_KEY);
        showAccessModal();
      }
      const error = new Error(data.message || "生成失败");
      error.code = data.code;
      error.status = response.status;
      throw error;
    }

    renderAccount(data.account);
    renderReport(data);
    showToast("命盘报告已生成，可继续免费追问。");
  } catch (error) {
    if (!handleInsufficientCredits(error, () => submitReading())) {
      setResultState("empty");
      showToast(error.message || "生成失败，请稍后再试。");
    }
  } finally {
    setLoading(false);
  }
}

async function submitChat() {
  const message = chatInput.value.trim();
  if (!currentConversationId) {
    showToast("请先生成一份命盘报告。");
    return;
  }
  if (!message) {
    showToast("请输入想追问的问题。");
    return;
  }
  setChatLoading(true);
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Access-Code": storedAccessCode() },
      body: JSON.stringify({ clientId: clientId(), conversationId: currentConversationId, message }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      const error = new Error(data.message || "追问失败");
      error.code = data.code;
      error.status = response.status;
      throw error;
    }
    chatInput.value = "";
    renderAccount(data.account);
    renderChat(data.conversation?.messages || []);
    showToast("命盘师已回复。");
  } catch (error) {
    if (!handleInsufficientCredits(error, () => submitChat())) {
      showToast(error.message || "追问失败，请稍后再试。");
    }
  } finally {
    setChatLoading(false);
  }
}

menuButton?.addEventListener("click", () => siteHeader?.classList.toggle("nav-open"));
document.querySelectorAll(".topnav a").forEach((link) => {
  link.addEventListener("click", (event) => {
    handleInternalLink(event, link);
    siteHeader?.classList.remove("nav-open");
  });
});
document.querySelectorAll(".hero-actions a, .site-footer a").forEach((link) => {
  link.addEventListener("click", (event) => handleInternalLink(event, link));
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  submitReading();
});

chatForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  submitChat();
});

accessForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const code = accessCodeInput.value.trim();
  if (!code) {
    showToast("请输入访问码。");
    return;
  }
  sessionStorage.setItem(ACCESS_CODE_KEY, code);
  hideAccessModal();
  showToast("访问码已保存，可以生成报告。");
});

resetBtn?.addEventListener("click", resetView);
copyBtn?.addEventListener("click", () => copyReportText("报告已复制。"));
saveBtn?.addEventListener("click", downloadReport);
openReportBtn?.addEventListener("click", openFullReportPage);
openReportBtnHero?.addEventListener("click", openFullReportPage);
againBtn?.addEventListener("click", () => {
  document.querySelector("#analysis")?.scrollIntoView({ behavior: "smooth", block: "start" });
  $("#name")?.focus();
});
shareBtn?.addEventListener("click", () => showShareUnlockModal());
unlockShareBtn?.addEventListener("click", () => showShareUnlockModal());
deepUnlockBtn?.addEventListener("click", () => showShareUnlockModal());
posterCopyBtn?.addEventListener("click", async () => {
  if (!lastPosterText) {
    showToast("请先生成一份报告。");
    return;
  }
  try {
    await navigator.clipboard.writeText(lastPosterText);
    showToast("报告海报文案已复制。");
  } catch (error) {
    showToast(lastPosterText);
  }
});
buyPackBtn?.addEventListener("click", () => revealMarketingSection("pricing"));
railShareBtn?.addEventListener("click", () => showShareUnlockModal());
railBuyBtn?.addEventListener("click", () => revealMarketingSection("pricing"));
payCloseBtn?.addEventListener("click", () => {
  pendingAction = null;
  hideModal(payModal);
});
shareCloseBtn?.addEventListener("click", () => {
  pendingAction = null;
  hideModal(shareModal);
});
payShareBtn?.addEventListener("click", () => {
  hideModal(payModal);
  revealMarketingSection("pricing");
});
payContinueBtn?.addEventListener("click", rechargeAccount);
posterBtn?.addEventListener("click", () => unlockReading("friend"));
inviteBtn?.addEventListener("click", () => unlockReading("timeline"));

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    pendingAction = null;
    hideModal(payModal);
    hideModal(shareModal);
  }
});

bootMatrixRain();
renderAccount({ readingUnlocks: 0, chatCredits: 0, freeAccess: true });
resetView();
checkHealth();
if (location.hash && marketingSectionIds.has(location.hash.slice(1))) {
  revealMarketingSection(location.hash.slice(1), false);
}

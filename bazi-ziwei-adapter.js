const path = require("path");

const DEFAULT_SKILL_DIR = path.join(__dirname, "vendor", "bazi-ziwei-skill");
const PALACE_BY_FOCUS = {
  career: "官禄宫",
  love: "夫妻宫",
  wealth: "财帛宫",
  study: "父母宫",
  health: "疾厄宫",
  overall: "命宫",
};

let cachedCalculator = null;

function skillDir() {
  return process.env.BAZI_ZIWEI_SKILL_DIR || DEFAULT_SKILL_DIR;
}

function loadCalculator() {
  if (cachedCalculator) return cachedCalculator;
  if (!process.env.BAZI_ZIWEI_SKILL_DIR) {
    const core = require("./vendor/bazi-ziwei-skill/calculator/dist/yiqi-core/index.js");
    cachedCalculator = {
      createChart: core.createChart,
      validateBirthInfo: core.validateBirthInfo,
      getZhiCangGanFull: require("./vendor/bazi-ziwei-skill/calculator/dist/yiqi-core/bazi.js").getZhiCangGanFull,
      enrichBazi: require("./vendor/bazi-ziwei-skill/calculator/dist/bazi-enrich/enrich.js").enrichBazi,
    };
  } else {
    const distDir = path.join(skillDir(), "calculator", "dist");
    const core = require(path.join(distDir, "yiqi-core", "index.js"));
    cachedCalculator = {
      createChart: core.createChart,
      validateBirthInfo: core.validateBirthInfo,
      getZhiCangGanFull: require(path.join(distDir, "yiqi-core", "bazi.js")).getZhiCangGanFull,
      enrichBazi: require(path.join(distDir, "bazi-enrich", "enrich.js")).enrichBazi,
    };
  }
  return cachedCalculator;
}

function normalizeBaziZiweiGender(value) {
  const text = String(value || "").trim().toLowerCase();
  if (["男", "男性", "male", "m", "man"].includes(text)) return "male";
  if (["女", "女性", "female", "f", "woman"].includes(text)) return "female";
  return null;
}

function branchCenterHour(branchIndex) {
  const centers = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  return centers[((Number(branchIndex) || 0) % 12 + 12) % 12] || 0;
}

function buildBirthInfo({ birth, parsedHour, gender, trueSolarTime = {} }) {
  const corrected = trueSolarTime.applied ? trueSolarTime.corrected : null;
  return {
    year: corrected?.year || birth.year,
    month: corrected?.month || birth.month,
    day: corrected?.day || birth.day,
    hour: corrected?.hour ?? parsedHour.hour ?? branchCenterHour(parsedHour.branchIndex),
    minute: corrected?.minute ?? parsedHour.minute ?? 0,
    isLunar: false,
    gender,
    timeZone: 8,
  };
}

function withMutedConsoleLog(fn) {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const debug = [];
  console.log = (...args) => debug.push(args.map(String).join(" "));
  console.warn = (...args) => debug.push(args.map(String).join(" "));
  console.error = (...args) => debug.push(args.map(String).join(" "));
  try {
    return { value: fn(), debug };
  } finally {
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }
}

function gz(pillar = {}) {
  return `${pillar.gan || ""}${pillar.zhi || ""}`;
}

function compactDayun(dayun = []) {
  return dayun.slice(0, 10).map((item) => ({
    name: gz(item.ganZhi),
    startAge: item.startAge,
    endAge: item.endAge,
    startYear: item.startYear,
    endYear: item.endYear,
    ganShiShen: item.ganShiShen || "",
    zhiShiShen: item.zhiShiShen || "",
  }));
}

function compactEnrichment(enrichment = {}) {
  const wangShuai = enrichment.旺衰 ? {
    score: enrichment.旺衰.score,
    verdict: enrichment.旺衰.verdict || enrichment.旺衰.level || "",
    confidence: enrichment.旺衰.confidence || "",
    breakdown: enrichment.旺衰.breakdown ? {
      ...enrichment.旺衰.breakdown,
      details: (enrichment.旺衰.breakdown.details || []).slice(0, 8),
    } : undefined,
  } : undefined;

  return {
    自坐: enrichment.自坐,
    五行旺相: enrichment.五行旺相,
    五行统计: enrichment.五行统计,
    调候用神: enrichment.调候用神,
    格局: enrichment.格局,
    旺衰: wangShuai,
    天干关系: (enrichment.天干关系 || []).slice(0, 8),
    地支关系: (enrichment.地支关系 || []).slice(0, 10),
    整柱: (enrichment.整柱 || []).slice(0, 8),
  };
}

function compactPalace(gong = {}, ziwei = {}) {
  const isBody = ziwei.gongs?.[ziwei.shenGongIndex]?.gong === gong.gong;
  return {
    name: gong.gong?.endsWith("宫") ? gong.gong : `${gong.gong || ""}宫`,
    branch: gong.dizhi || "",
    stem: gong.tiangan || "",
    mainStars: gong.mainStars || [],
    auxStars: gong.auxStars || [],
    sihua: (gong.sihua || []).map((item) => `${item.star}${item.hua}`),
    daXian: gong.daXian ? {
      startAge: gong.daXian.startAge,
      endAge: gong.daXian.endAge,
      isCurrent: Boolean(gong.daXian.isCurrent),
    } : null,
    liuNian: (gong.liuNian || []).slice(0, 10),
    isBody,
  };
}

function findPalace(palaces = [], name) {
  return palaces.find((item) => item.name === name || item.name.replace(/宫$/, "") === String(name || "").replace(/宫$/, ""));
}

function fourTransformations(ziwei = {}) {
  return (ziwei.gongs || [])
    .flatMap((gong) => (gong.sihua || []).map((item) => `${item.star}${item.hua}`))
    .filter(Boolean);
}

function buildChartText(compact) {
  const bazi = compact.bazi || {};
  const ziwei = compact.ziwei || {};
  const p = bazi.pillars || {};
  const en = bazi.enrichment || {};
  const life = ziwei.lifePalace || {};
  const body = ziwei.bodyPalace || {};
  const current = ziwei.currentDaXian || {};
  return [
    "八字 + 紫微算法命盘摘要",
    `排盘源：${compact.source}；${compact.calculationPolicy}`,
    `阳历：${compact.birthInfo?.year}-${String(compact.birthInfo?.month).padStart(2, "0")}-${String(compact.birthInfo?.day).padStart(2, "0")} ${String(compact.birthInfo?.hour).padStart(2, "0")}:${String(compact.birthInfo?.minute).padStart(2, "0")}；性别：${compact.birthInfo?.gender === "male" ? "男" : "女"}`,
    `四柱：年${p.year || "--"}、月${p.month || "--"}、日${p.day || "--"}、时${p.hour || "--"}；日主：${bazi.dayMaster || "--"}`,
    `十神：年${bazi.tenGods?.year || "--"}、月${bazi.tenGods?.month || "--"}、日${bazi.tenGods?.day || "--"}、时${bazi.tenGods?.hour || "--"}`,
    `八字补层：格局${en.格局?.primary || "--"}（置信度${en.格局?.confidence || "--"}）；旺衰${en.旺衰?.verdict || "--"}（置信度${en.旺衰?.confidence || "--"}）；调候用神${(en.调候用神 || []).join("、") || "--"}`,
    en.五行统计?.withCangGan ? `五行统计含藏干：木${en.五行统计.withCangGan.木 || 0} 火${en.五行统计.withCangGan.火 || 0} 土${en.五行统计.withCangGan.土 || 0} 金${en.五行统计.withCangGan.金 || 0} 水${en.五行统计.withCangGan.水 || 0}` : "",
    en.地支关系?.length ? `地支关系：${en.地支关系.map((item) => `${item.type}${(item.zhi || []).join("")}${item.detail ? `(${item.detail})` : ""}`).join("；")}` : "",
    `大运：起运${bazi.dayunStart ?? "--"}岁；${(bazi.dayun || []).slice(0, 6).map((item) => `${item.startAge}-${item.endAge}岁 ${item.name}(${item.startYear}-${item.endYear})`).join("；")}`,
    `紫微：${ziwei.yinYang || "--"}，${ziwei.wuXingJu?.name || "--"}；命宫${life.name || "--"}[${life.stem || ""}${life.branch || ""}]主星${(life.mainStars || []).join("·") || "无"}；身宫${body.name || "--"}[${body.stem || ""}${body.branch || ""}]主星${(body.mainStars || []).join("·") || "无"}`,
    `生年四化：${(ziwei.fourTransformations || []).join(" · ") || "--"}`,
    current.name ? `当前大限：${current.name}[${current.branch || ""}] ${current.daXian?.startAge}-${current.daXian?.endAge}岁，主星${(current.mainStars || []).join("·") || "无"}` : "",
  ].filter(Boolean).join("\n");
}

function buildBaziZiweiProfile({ birth, parsedHour, gender, trueSolarTime = {}, focus = "overall" }) {
  const normalizedGender = normalizeBaziZiweiGender(gender);
  if (!parsedHour) {
    const error = new Error("请填写出生时间。八字与紫微排盘必须有时辰，不能默认子时。");
    error.statusCode = 400;
    throw error;
  }
  if (!normalizedGender) {
    const error = new Error("请选择男或女。传统八字与紫微排盘需要男/女用于大运和大限顺逆。");
    error.statusCode = 400;
    throw error;
  }

  const calculator = loadCalculator();
  const birthInfo = buildBirthInfo({ birth, parsedHour, gender: normalizedGender, trueSolarTime });
  const validation = calculator.validateBirthInfo(birthInfo);
  if (!validation.valid) {
    const error = new Error(`八字紫微排盘参数无效：${validation.errors.join("；")}`);
    error.statusCode = 400;
    throw error;
  }

  const { value: chart, debug } = withMutedConsoleLog(() => calculator.createChart(birthInfo));
  const bazi = chart.bazi;
  const z = bazi.siZhu;
  bazi.cangGan = {
    year: calculator.getZhiCangGanFull(z.year.zhi, bazi.dayMaster),
    month: calculator.getZhiCangGanFull(z.month.zhi, bazi.dayMaster),
    day: calculator.getZhiCangGanFull(z.day.zhi, bazi.dayMaster),
    hour: calculator.getZhiCangGanFull(z.hour.zhi, bazi.dayMaster),
  };
  for (const item of bazi.dayun || []) {
    if (item.startAge !== undefined && item.endAge === undefined) item.endAge = item.startAge + 9;
  }
  bazi.enrichment = calculator.enrichBazi({
    年: z.year,
    月: z.month,
    日: z.day,
    时: z.hour,
  });

  const palaces = (chart.ziwei.gongs || []).map((gong) => compactPalace(gong, chart.ziwei));
  const bodyPalace = palaces.find((item) => item.isBody) || null;
  const currentDaXian = palaces.find((item) => item.daXian?.isCurrent) || null;
  const focusPalace = findPalace(palaces, PALACE_BY_FOCUS[focus] || PALACE_BY_FOCUS.overall) || palaces[0] || null;

  const compact = {
    source: "bazi-ziwei-skill / Yiqi core + enrichBazi",
    version: "bazi-ziwei-skill-v1",
    license: "MIT; see vendor/bazi-ziwei-skill/LICENSE and NOTICE",
    calculationPolicy: trueSolarTime.applied
      ? "命盘师已先按用户显式启用的真太阳时校正，再交由 bazi-ziwei skill 按钟表时间排盘。"
      : "按用户填写的公历钟表时间排盘；bazi-ziwei skill 本身不做出生地真太阳时经度校正。",
    birthInfo,
    bazi: {
      pillars: {
        year: gz(z.year),
        month: gz(z.month),
        day: gz(z.day),
        hour: gz(z.hour),
      },
      dayMaster: bazi.dayMaster,
      tenGods: bazi.shiShen,
      zhangSheng: bazi.zhangSheng,
      naYin: bazi.naYin,
      cangGan: bazi.cangGan,
      dayunStart: bazi.dayunStart,
      dayun: compactDayun(bazi.dayun || []),
      enrichment: compactEnrichment(bazi.enrichment),
    },
    ziwei: {
      yinYang: chart.ziwei.yinYang || "",
      mingGongIndex: chart.ziwei.mingGongIndex,
      shenGongIndex: chart.ziwei.shenGongIndex,
      wuXingJu: chart.ziwei.wuXingJu || null,
      lunarDate: chart.ziwei.lunarDate || null,
      lifePalace: palaces[0] || null,
      bodyPalace,
      focusPalace,
      currentDaXian,
      fourTransformations: fourTransformations(chart.ziwei),
      palaces,
    },
    debug,
  };
  compact.chartText = buildChartText(compact);
  return compact;
}

module.exports = {
  buildBaziZiweiProfile,
  normalizeBaziZiweiGender,
};

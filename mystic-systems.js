const crypto = require("crypto");

const ELEMENT_ORDER = ["木", "火", "土", "金", "水"];
const GENERATES = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const CONTROLS = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

const QIMEN_PALACES = [
  { name: "坎一宫", element: "水", plain: "信息、风险、流动性" },
  { name: "坤二宫", element: "土", plain: "资源、承接、合作成本" },
  { name: "震三宫", element: "木", plain: "启动、变化、先手动作" },
  { name: "巽四宫", element: "木", plain: "谈判、传播、长期渗透" },
  { name: "中五宫", element: "土", plain: "核心矛盾、需要先定规则" },
  { name: "乾六宫", element: "金", plain: "决策、权责、上级资源" },
  { name: "兑七宫", element: "金", plain: "表达、交易、人际反馈" },
  { name: "艮八宫", element: "土", plain: "止损、边界、沉淀复盘" },
  { name: "离九宫", element: "火", plain: "曝光、判断、看见真相" },
];

const QIMEN_DOORS = [
  ["开门", "适合打开局面、谈条件、看机会"],
  ["休门", "适合修复关系、养精蓄锐、先稳状态"],
  ["生门", "适合求财、资源增长、经营长期收益"],
  ["伤门", "容易有摩擦，行动前先控风险"],
  ["杜门", "信息不透明，先做调查再表态"],
  ["景门", "适合展示、表达、争取可见度"],
  ["死门", "不宜硬冲，适合收尾、止损、复盘"],
  ["惊门", "变动较大，先准备应急方案"],
];

const QIMEN_STARS = [
  ["天蓬", "欲望和风险并存，先分清诱惑与真实机会"],
  ["天任", "靠耐心和承担成事，短线不宜急"],
  ["天冲", "启动快，但要防止先动后想"],
  ["天辅", "适合学习、文书、贵人和系统支持"],
  ["天英", "适合曝光和表达，也容易被评价影响"],
  ["天芮", "先处理旧问题，避免带病推进"],
  ["天柱", "规则、压力和口舌要提前说清楚"],
  ["天心", "适合专业判断、修正方案和理性决策"],
  ["天禽", "局面复杂，先抓核心矛盾"],
];

const QIMEN_DEITIES = [
  ["值符", "看主导权和关键人"],
  ["腾蛇", "看想象、担心和信息误差"],
  ["太阴", "看隐藏资源和私下沟通"],
  ["六合", "看合作、撮合和关系修复"],
  ["白虎", "看冲突、压力和硬成本"],
  ["玄武", "看隐情、误会和边界"],
  ["九地", "看沉淀、长期布局和现实基础"],
  ["九天", "看突破、远景和向上空间"],
];

const ZIWEI_PALACES = ["命宫", "兄弟宫", "夫妻宫", "子女宫", "财帛宫", "疾厄宫", "迁移宫", "交友宫", "官禄宫", "田宅宫", "福德宫", "父母宫"];
const FOUR_TRANSFORMATIONS = {
  甲: ["廉贞化禄", "破军化权", "武曲化科", "太阳化忌"],
  乙: ["天机化禄", "天梁化权", "紫微化科", "太阴化忌"],
  丙: ["天同化禄", "天机化权", "文昌化科", "廉贞化忌"],
  丁: ["太阴化禄", "天同化权", "天机化科", "巨门化忌"],
  戊: ["贪狼化禄", "太阴化权", "右弼化科", "天机化忌"],
  己: ["武曲化禄", "贪狼化权", "天梁化科", "文曲化忌"],
  庚: ["太阳化禄", "武曲化权", "太阴化科", "天同化忌"],
  辛: ["巨门化禄", "太阳化权", "文曲化科", "文昌化忌"],
  壬: ["天梁化禄", "紫微化权", "左辅化科", "武曲化忌"],
  癸: ["破军化禄", "巨门化权", "太阴化科", "贪狼化忌"],
};

const TAROT_MAJOR = [
  ["愚者", "新的开始", "先试一小步，不要一次押满"],
  ["魔术师", "把资源变成行动", "你手里已有工具，关键是开始组合"],
  ["女祭司", "直觉与隐情", "先听感觉，但要用证据复核"],
  ["女皇", "滋养与创造", "关系和资源需要被照顾，而不是被催熟"],
  ["皇帝", "规则与边界", "定规则比讲情绪更重要"],
  ["教皇", "传统与学习", "找方法论、找导师、找可验证流程"],
  ["恋人", "选择与关系", "真正的问题是价值是否一致"],
  ["战车", "推进与控制", "方向清楚后要控制节奏"],
  ["力量", "温柔的坚持", "不要硬压，用稳定感解决问题"],
  ["隐士", "独处与复盘", "先退一步看清自己的真实需要"],
  ["命运之轮", "周期变化", "机会在变化里，但要有准备"],
  ["正义", "权衡与契约", "把责任、代价和证据摆上台面"],
  ["倒吊人", "换角度", "暂缓不等于失败，可能是换解法"],
  ["死神", "结束与更新", "该结束的旧模式要让它结束"],
  ["节制", "调和与节奏", "慢一点，把极端拉回中间"],
  ["恶魔", "执念与绑定", "看清依赖、诱惑和短期快感"],
  ["高塔", "结构被打破", "先保安全，再重建秩序"],
  ["星星", "希望与修复", "用长期愿景稳定当下焦虑"],
  ["月亮", "模糊与投射", "不要把担心当事实"],
  ["太阳", "清晰与生命力", "把事情摊开说，答案会更亮"],
  ["审判", "复盘与召唤", "旧经验正在要求你升级选择"],
  ["世界", "完成与整合", "收尾、总结、进入下一阶段"],
];

const FENGSHUI_BY_ELEMENT = {
  木: { direction: "东 / 东南", action: "增加清晰规划、绿色植物或学习区，但不要堆满杂物", warning: "木弱时容易计划多、行动散" },
  火: { direction: "南", action: "补足采光、展示面和行动提醒，适合放待办板或暖色灯", warning: "火弱时动力和表达容易不足" },
  土: { direction: "东北 / 西南", action: "整理桌面中心区、建立收纳和稳定作息", warning: "土弱时秩序感和承接力容易不足" },
  金: { direction: "西 / 西北", action: "减少无用物件，强化工具、合同、预算和标准", warning: "金弱时边界和决断容易松" },
  水: { direction: "北", action: "留出安静思考位，减少信息噪音，固定复盘时间", warning: "水弱时直觉和恢复力容易不足" },
};

function stableNumber(seed, label, min, max) {
  const hash = crypto.createHash("sha256").update(`${seed}:${label}`).digest("hex");
  const value = parseInt(hash.slice(0, 8), 16);
  return min + (value % (max - min + 1));
}

function mod(value, size) {
  return ((value % size) + size) % size;
}

function stemName(pillar) {
  return pillar?.stem?.name || pillar?.stem || "";
}

function branchName(pillar) {
  return pillar?.branch?.name || pillar?.branch || "";
}

function elementName(value) {
  return typeof value === "string" ? value : value?.element || "";
}

function elementRelation(dayElement, targetElement) {
  if (!dayElement || !targetElement) return "参照";
  if (dayElement === targetElement) return "比劫";
  if (GENERATES[dayElement] === targetElement) return "食伤";
  if (GENERATES[targetElement] === dayElement) return "印星";
  if (CONTROLS[dayElement] === targetElement) return "财星";
  if (CONTROLS[targetElement] === dayElement) return "官杀";
  return "参照";
}

function relationPlain(relation) {
  return {
    比劫: "自我、同伴、竞争和主观能量",
    食伤: "表达、作品、输出和自由感",
    财星: "资源、金钱、关系中的现实交换",
    官杀: "规则、压力、承诺和外部要求",
    印星: "学习、保护、贵人和安全感",
    参照: "辅助观察项",
  }[relation] || "辅助观察项";
}

function buildTenGods({ pillars }) {
  const dayElement = pillars?.day?.stem?.element;
  return ["year", "month", "hour"].map((key) => {
    const pillar = pillars?.[key];
    const targetElement = pillar?.stem?.element;
    const relation = elementRelation(dayElement, targetElement);
    return {
      pillar: key,
      stem: stemName(pillar),
      relation,
      plain: relationPlain(relation),
    };
  }).filter((item) => item.stem);
}

function buildBaziLayer(ctx) {
  const { pillars, strongest, weakest, user, baziZiwei } = ctx;
  const skillBazi = baziZiwei?.bazi || {};
  const enrichment = skillBazi.enrichment || {};
  const tenGods = skillBazi.tenGods
    ? Object.entries(skillBazi.tenGods).map(([pillar, relation]) => ({
      pillar,
      stem: stemName(pillars?.[pillar]),
      relation,
      plain: relationPlain(relation),
    })).filter((item) => item.stem)
    : buildTenGods(ctx);
  const dayBranch = branchName(pillars?.day);
  const monthBranch = branchName(pillars?.month);
  const hourBranch = branchName(pillars?.hour);
  const geJu = enrichment.格局;
  const wangShuai = enrichment.旺衰;
  const tiaoHou = enrichment.调候用神 || [];
  const strongestStat = enrichment.五行统计?.strongest?.join("、") || strongest?.element;
  const missingStat = enrichment.五行统计?.missing?.join("、") || "";
  return {
    method: "四柱八字结构层",
    calculationPolicy: baziZiwei?.calculationPolicy || "四柱由后端确定性历法引擎计算，解读层不手算干支。",
    engine: baziZiwei?.source || "local-lunar-engine",
    dayMaster: skillBazi.dayMaster || stemName(pillars?.day),
    dayBranch,
    monthBranch,
    hourBranch: hourBranch || "未知",
    tenGods,
    geJu: geJu ? {
      primary: geJu.primary,
      confidence: geJu.confidence,
      basis: geJu.basis,
    } : null,
    wangShuai: wangShuai ? {
      verdict: wangShuai.verdict,
      score: wangShuai.score,
      confidence: wangShuai.confidence,
    } : null,
    tiaoHou,
    dayunStart: skillBazi.dayunStart,
    dayun: (skillBazi.dayun || []).slice(0, 4),
    spousePalace: {
      branch: dayBranch || "未知",
      plain: dayBranch ? `日支${dayBranch}作为关系与长期相处的观察位，重点看稳定回应、边界和生活节奏。` : "出生时辰不完整时，关系宫位只能做保守参考。",
    },
    elementBalance: {
      strongest: strongestStat,
      weakest: weakest?.element,
      missing: missingStat,
      plain: `${strongestStat || strongest?.element || "强项"}是当前较容易调用的能力，${weakest?.element || "短板"}是需要用现实习惯补足的部分${missingStat ? `；原局缺${missingStat}，对应能力要靠现实习惯补。` : "。"}`,
    },
    userQuestionAnchor: `围绕“${user?.question || "当前问题"}”，先看${geJu?.primary || "格局"}、日主${wangShuai?.verdict || "强弱"}、月支${monthBranch || "月令"}和时柱${hourBranch || "时柱"}，再落到资源、关系和行动节奏。`,
  };
}

function buildLiuyaoLayer(ctx) {
  const focus = ctx.user?.focus || "overall";
  const isFemale = /女|F/i.test(ctx.user?.gender || "");
  const yongshen = {
    career: "官鬼",
    wealth: "妻财",
    study: "父母",
    health: "父母",
    love: isFemale ? "官鬼" : "妻财",
    overall: "世爻",
  }[focus] || "世爻";
  return {
    method: "六爻用神层",
    yongshen,
    plain: `${ctx.sixYao?.movement || "本卦到变卦"}，用神取${yongshen}。白话说，先看这件事真正代表的是压力、资源、关系、学习凭证还是你自己的状态。`,
    line: ctx.sixYao?.lineName,
    lineTheme: ctx.sixYao?.lineTheme,
    action: "不要只问吉凶，先问这一爻对应的现实环节有没有被处理好。",
  };
}

function buildMeihuaLayer(ctx) {
  const body = ctx.hexagrams?.primary?.trigram || {};
  const use = ctx.hexagrams?.changed?.trigram || {};
  const relation = elementRelation(body.element, use.element);
  return {
    method: "梅花易数体用层",
    body: `${body.name || "体卦"}${body.element ? `(${body.element})` : ""}`,
    use: `${use.name || "用卦"}${use.element ? `(${use.element})` : ""}`,
    relation,
    plain: `体卦看你自己的底盘，用卦看外部事件。两者关系为${relation}，可理解为“自身状态”和“外部变化”之间的配合度。`,
    trend: relation === "官杀" || relation === "财星" ? "外部压力或现实成本更明显，适合先控风险。" : "自身可调度空间较大，适合用小行动验证。",
  };
}

function buildZiweiLayer(ctx) {
  const skillZiwei = ctx.baziZiwei?.ziwei;
  if (skillZiwei?.lifePalace) {
    const life = skillZiwei.lifePalace;
    const body = skillZiwei.bodyPalace || {};
    const focus = skillZiwei.focusPalace || life;
    const current = skillZiwei.currentDaXian || {};
    const starText = (palace) => (palace?.mainStars || []).join("·") || "无主星";
    return {
      method: "紫微斗数十二宫层",
      calculationPolicy: "紫微命宫、身宫、十二宫、生年四化与大限来自 bazi-ziwei skill 的 Yiqi 紫微算法层。",
      lifePalaceHint: `${life.name}${life.branch ? `[${life.branch}]` : ""}`,
      bodyPalaceHint: body.name ? `${body.name}${body.branch ? `[${body.branch}]` : ""}` : "",
      focusPalaceHint: `${focus.name}${focus.branch ? `[${focus.branch}]` : ""}`,
      lifePalace: life,
      bodyPalace: body,
      focusPalace: focus,
      currentDaXian: current,
      fourTransformations: skillZiwei.fourTransformations || [],
      plain: `命宫${life.name || "命宫"}主星${starText(life)}，身宫${body.name || "身宫"}主星${starText(body)}；本题重点看${focus.name || "关注宫"}，主星${starText(focus)}。${(skillZiwei.fourTransformations || []).length ? `生年四化为${skillZiwei.fourTransformations.join("、")}，用来观察机会、主导权、名声与卡点。` : "生年四化为空时不做强断。"}`,
    };
  }

  const birth = ctx.birth || {};
  const hourIndex = Math.max(0, Math.floor(Number(birth.hour || 0) / 2));
  const palaceIndex = mod((Number(birth.month || 1) - 1) - hourIndex, 12);
  const focusIndex = mod(palaceIndex + (ctx.user?.focus === "love" ? 2 : ctx.user?.focus === "wealth" ? 4 : ctx.user?.focus === "career" ? 8 : 0), 12);
  const yearStem = stemName(ctx.pillars?.year);
  const transforms = FOUR_TRANSFORMATIONS[yearStem] || [];
  return {
    method: "紫微斗数入口层",
    limitation: "当前为紫微轻量入口，用于补充宫位视角；正式紫微安星盘可在后续接入独立引擎。",
    lifePalaceHint: ZIWEI_PALACES[palaceIndex],
    focusPalaceHint: ZIWEI_PALACES[focusIndex],
    fourTransformations: transforms,
    plain: `${ZIWEI_PALACES[focusIndex]}提示这个问题要看对应生活领域的长期结构；${transforms.length ? `${yearStem}年四化可借看“机会、主导、名声、卡点”四类变化。` : "四化信息不足时不做强断。"}`,
  };
}

function buildQimenLayer(ctx) {
  const palace = QIMEN_PALACES[stableNumber(ctx.seed, "qimen-palace", 0, QIMEN_PALACES.length - 1)];
  const [door, doorPlain] = QIMEN_DOORS[stableNumber(ctx.seed, "qimen-door", 0, QIMEN_DOORS.length - 1)];
  const [star, starPlain] = QIMEN_STARS[stableNumber(ctx.seed, "qimen-star", 0, QIMEN_STARS.length - 1)];
  const [deity, deityPlain] = QIMEN_DEITIES[stableNumber(ctx.seed, "qimen-deity", 0, QIMEN_DEITIES.length - 1)];
  return {
    method: "奇门遁甲问事层",
    limitation: "当前为轻量问事九宫，用于行动判断；完整奇门转盘排局可在后续接入独立引擎。",
    palace: palace.name,
    palaceElement: palace.element,
    door,
    star,
    deity,
    plain: `${palace.name}看${palace.plain}，${door}表示${doorPlain}，${star}提醒${starPlain}，${deity}提示${deityPlain}。`,
    action: "把奇门结果当作行动地图：先找关键人、关键风险、关键窗口，而不是等待神秘答案。",
  };
}

function buildYinyuanLayer(ctx) {
  const isLove = ctx.user?.focus === "love" || /姻缘|感情|恋爱|婚|复合|对象|暧昧|桃花/.test(ctx.user?.question || "");
  const isFemale = /女|F/i.test(ctx.user?.gender || "");
  const spouseStar = isFemale ? "官杀" : "财星";
  const dayBranch = branchName(ctx.pillars?.day);
  return {
    method: "姻缘关系层",
    active: isLove,
    spouseStar,
    spousePalace: dayBranch || "未知",
    plain: isLove
      ? `感情问题重点看${spouseStar}与日支${dayBranch || "配偶宫"}：白话说，就是看承诺压力、现实交换、相处稳定度和边界是否清楚。`
      : `即使不是专问感情，日支${dayBranch || "配偶宫"}也可作为长期关系和合作边界的观察位。`,
    advice: "少用试探换安全感，多用事实看回应：对方是否持续、是否愿意沟通、是否能承担现实成本。",
  };
}

function buildFengshuiLayer(ctx) {
  const weak = ctx.weakest?.element || "土";
  const strong = ctx.strongest?.element || "木";
  const guide = FENGSHUI_BY_ELEMENT[weak] || FENGSHUI_BY_ELEMENT.土;
  return {
    method: "阳宅/办公风水轻量层",
    limitation: "没有户型、坐向、入住年份时，只给五行与空间习惯建议，不做完整玄空飞星判断。",
    weakElement: weak,
    strongElement: strong,
    directionHint: guide.direction,
    plain: `${guide.warning}，空间上可优先调整${guide.direction}相关区域：${guide.action}。这不是靠摆件改命，而是用环境降低内耗。`,
    action: "优先做清洁、动线、采光、收纳和工作区边界；摆件只是提醒物，不是决定因素。",
  };
}

function drawTarot(seed, label) {
  const card = TAROT_MAJOR[stableNumber(seed, label, 0, TAROT_MAJOR.length - 1)];
  const reversed = stableNumber(seed, `${label}-reversed`, 0, 1) === 1;
  return {
    name: card[0],
    orientation: reversed ? "逆位" : "正位",
    theme: card[1],
    plain: reversed ? `逆位提醒：${card[2]}这件事可能被拖延、误解或过度使用。` : card[2],
  };
}

function buildTarotLayer(ctx) {
  const current = drawTarot(ctx.seed, "tarot-current");
  const advice = drawTarot(ctx.seed, "tarot-advice");
  return {
    method: "塔罗心理镜像层",
    limitation: "塔罗作为心理镜像和灵感触发，不作为预测结论。",
    cards: [
      { position: "当下状态", ...current },
      { position: "行动建议", ...advice },
    ],
    plain: `当下牌是${current.name}${current.orientation}，提示${current.theme}；建议牌是${advice.name}${advice.orientation}，提醒${advice.plain}`,
  };
}

function buildCrossChecks(ctx, layers) {
  const checks = [
    `八字看底盘：${layers.bazi.elementBalance.plain}`,
    layers.ziwei?.plain ? `紫微看结构：${layers.ziwei.plain}` : "",
    `六爻/梅花看事件：${layers.liuyao.lineTheme || "变化节点"}和体用关系一起看，避免只问单一吉凶。`,
    `奇门看行动：${layers.qimen.door}与${layers.qimen.palace}提示先处理“怎么做”和“谁是关键人”。`,
    `心理层落地：${ctx.psychology?.coreNeed || "真实需要"}要通过现实证据验证，不用焦虑替代行动。`,
  ].filter(Boolean);
  if (layers.yinyuan.active) checks.push(`姻缘层补充：${layers.yinyuan.plain}`);
  return checks;
}

function buildMysticSystems(context) {
  const strongest = context.elements?.[0] || { element: "木", percent: 0 };
  const weakest = context.elements?.[context.elements.length - 1] || { element: "水", percent: 0 };
  const ctx = { ...context, strongest, weakest };
  const layers = {
    bazi: buildBaziLayer(ctx),
    liuyao: buildLiuyaoLayer(ctx),
    meihua: buildMeihuaLayer(ctx),
    ziwei: buildZiweiLayer(ctx),
    qimen: buildQimenLayer(ctx),
    yinyuan: buildYinyuanLayer(ctx),
    fengshui: buildFengshuiLayer(ctx),
    tarot: buildTarotLayer(ctx),
  };
  return {
    version: context.baziZiwei?.source ? "mystic-systems-v2+bazi-ziwei" : "mystic-systems-v1",
    licenseNote: context.baziZiwei?.license || "自研规则层：参考公开项目的工程组织方式，未复制第三方代码或长文本。",
    integrationPolicy: [
      context.baziZiwei?.source ? "八字与紫微主盘由 bazi-ziwei skill 算法层生成，模型只负责解释与对话。" : "排盘与起卦优先由确定性规则生成结构化数据，模型只负责解释与对话。",
      "术数结果必须翻译成白话，不用专业词堆砌制造权威感。",
      "感情、金钱、健康、法律等问题只给娱乐参考和现实行动建议，不做决定性断言。",
      "多术数交叉验证时，只取一致方向；互相冲突时提示用户用现实证据复核。",
    ],
    layers,
    crossChecks: buildCrossChecks(ctx, layers),
    chatGuidance: [
      "追问时先直接回答，再引用 1-2 个最相关术数层，不要把所有层都倾倒给用户。",
      "每个术语后面都要附一句白话解释。",
      "如果用户问感情，优先使用姻缘层、日支/配偶宫、紫微夫妻宫、六爻用神和心理边界。",
      "如果用户问事业/财运，优先使用八字格局/十神、紫微官禄/财帛宫、奇门门星宫、五行补足和现实验证步骤。",
    ],
  };
}

module.exports = {
  buildMysticSystems,
};

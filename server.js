const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Solar } = require("lunar-javascript");
const { buildMysticSystems } = require("./mystic-systems");

const ROOT_DIR = typeof __dirname === "string" ? __dirname : ".";
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

loadEnv(path.join(ROOT_DIR, ".env"));
loadEnv(path.join(process.cwd(), ".env"));

const PORT = Number(process.env.PORT || 8787);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};

const STEMS = [
  { name: "甲", element: "木", polarity: "阳", image: "参天之木", drive: "开创、伸展、定方向" },
  { name: "乙", element: "木", polarity: "阴", image: "藤蔓之木", drive: "协调、修复、借势生长" },
  { name: "丙", element: "火", polarity: "阳", image: "太阳之火", drive: "表达、照亮、主动推进" },
  { name: "丁", element: "火", polarity: "阴", image: "灯烛之火", drive: "洞察、审美、细处发光" },
  { name: "戊", element: "土", polarity: "阳", image: "城墙之土", drive: "承载、组织、守住边界" },
  { name: "己", element: "土", polarity: "阴", image: "田园之土", drive: "滋养、沉淀、慢慢成形" },
  { name: "庚", element: "金", polarity: "阳", image: "斧钺之金", drive: "决断、革新、破旧立新" },
  { name: "辛", element: "金", polarity: "阴", image: "珠玉之金", drive: "精修、标准、价值感" },
  { name: "壬", element: "水", polarity: "阳", image: "江河之水", drive: "流动、远行、信息交换" },
  { name: "癸", element: "水", polarity: "阴", image: "雨露之水", drive: "直觉、渗透、柔性影响" },
];

const BRANCHES = [
  { name: "子", animal: "鼠", element: "水", polarity: "阳", hidden: ["癸"], hour: "23:00-00:59", season: "仲冬" },
  { name: "丑", animal: "牛", element: "土", polarity: "阴", hidden: ["己", "癸", "辛"], hour: "01:00-02:59", season: "季冬" },
  { name: "寅", animal: "虎", element: "木", polarity: "阳", hidden: ["甲", "丙", "戊"], hour: "03:00-04:59", season: "孟春" },
  { name: "卯", animal: "兔", element: "木", polarity: "阴", hidden: ["乙"], hour: "05:00-06:59", season: "仲春" },
  { name: "辰", animal: "龙", element: "土", polarity: "阳", hidden: ["戊", "乙", "癸"], hour: "07:00-08:59", season: "季春" },
  { name: "巳", animal: "蛇", element: "火", polarity: "阴", hidden: ["丙", "戊", "庚"], hour: "09:00-10:59", season: "孟夏" },
  { name: "午", animal: "马", element: "火", polarity: "阳", hidden: ["丁", "己"], hour: "11:00-12:59", season: "仲夏" },
  { name: "未", animal: "羊", element: "土", polarity: "阴", hidden: ["己", "丁", "乙"], hour: "13:00-14:59", season: "季夏" },
  { name: "申", animal: "猴", element: "金", polarity: "阳", hidden: ["庚", "壬", "戊"], hour: "15:00-16:59", season: "孟秋" },
  { name: "酉", animal: "鸡", element: "金", polarity: "阴", hidden: ["辛"], hour: "17:00-18:59", season: "仲秋" },
  { name: "戌", animal: "狗", element: "土", polarity: "阳", hidden: ["戊", "辛", "丁"], hour: "19:00-20:59", season: "季秋" },
  { name: "亥", animal: "猪", element: "水", polarity: "阴", hidden: ["壬", "甲"], hour: "21:00-22:59", season: "孟冬" },
];

const TRIGRAMS = [
  { name: "乾", symbol: "☰", nature: "天", element: "金", meaning: "开创、主导、抬头见势" },
  { name: "兑", symbol: "☱", nature: "泽", element: "金", meaning: "表达、交换、人缘与悦纳" },
  { name: "离", symbol: "☲", nature: "火", element: "火", meaning: "看见、名声、审美与曝光" },
  { name: "震", symbol: "☳", nature: "雷", element: "木", meaning: "启动、变化、突发行动" },
  { name: "巽", symbol: "☴", nature: "风", element: "木", meaning: "渗透、协商、长期影响" },
  { name: "坎", symbol: "☵", nature: "水", element: "水", meaning: "风险、智慧、信息流动" },
  { name: "艮", symbol: "☶", nature: "山", element: "土", meaning: "止损、沉淀、边界与节制" },
  { name: "坤", symbol: "☷", nature: "地", element: "土", meaning: "承载、合作、资源与耐心" },
];

const HEXAGRAMS = [
  "乾为天", "坤为地", "水雷屯", "山水蒙", "水天需", "天水讼", "地水师", "水地比",
  "风天小畜", "天泽履", "地天泰", "天地否", "天火同人", "火天大有", "地山谦", "雷地豫",
  "泽雷随", "山风蛊", "地泽临", "风地观", "火雷噬嗑", "山火贲", "山地剥", "地雷复",
  "天雷无妄", "山天大畜", "山雷颐", "泽风大过", "坎为水", "离为火", "泽山咸", "雷风恒",
  "天山遁", "雷天大壮", "火地晋", "地火明夷", "风火家人", "火泽睽", "水山蹇", "雷水解",
  "山泽损", "风雷益", "泽天夬", "天风姤", "泽地萃", "地风升", "泽水困", "水风井",
  "泽火革", "火风鼎", "震为雷", "艮为山", "风山渐", "雷泽归妹", "雷火丰", "火山旅",
  "巽为风", "兑为泽", "风水涣", "水泽节", "风泽中孚", "雷山小过", "水火既济", "火水未济",
];

const NAYIN = [
  "海中金", "炉中火", "大林木", "路旁土", "剑锋金", "山头火", "涧下水", "城头土", "白蜡金", "杨柳木",
  "泉中水", "屋上土", "霹雳火", "松柏木", "长流水", "沙中金", "山下火", "平地木", "壁上土", "金箔金",
  "佛灯火", "天河水", "大驿土", "钗钏金", "桑柘木", "大溪水", "沙中土", "天上火", "石榴木", "大海水",
];

const WESTERN_SIGNS = [
  [[1, 20], "水瓶座"], [[2, 19], "双鱼座"], [[3, 21], "白羊座"], [[4, 20], "金牛座"],
  [[5, 21], "双子座"], [[6, 22], "巨蟹座"], [[7, 23], "狮子座"], [[8, 23], "处女座"],
  [[9, 23], "天秤座"], [[10, 24], "天蝎座"], [[11, 22], "射手座"], [[12, 22], "摩羯座"],
];

const ELEMENT_ORDER = ["木", "火", "土", "金", "水"];
const GENERATES = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
const CONTROLS = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };
const FOCUS_LABELS = {
  overall: "整体格局",
  career: "事业发展",
  love: "感情关系",
  wealth: "财运规划",
  study: "学业成长",
  health: "身心状态",
};

const CITY_COORDINATES = [
  { name: "北京", longitude: 116.4074, timezone: 8, aliases: ["北京市"] },
  { name: "上海", longitude: 121.4737, timezone: 8, aliases: ["上海市"] },
  { name: "天津", longitude: 117.2000, timezone: 8, aliases: ["天津市"] },
  { name: "重庆", longitude: 106.5516, timezone: 8, aliases: ["重庆市"] },
  { name: "哈尔滨", longitude: 126.6425, timezone: 8 },
  { name: "长春", longitude: 125.3235, timezone: 8 },
  { name: "沈阳", longitude: 123.4315, timezone: 8 },
  { name: "大连", longitude: 121.6147, timezone: 8 },
  { name: "呼和浩特", longitude: 111.7492, timezone: 8 },
  { name: "石家庄", longitude: 114.5149, timezone: 8 },
  { name: "太原", longitude: 112.5489, timezone: 8 },
  { name: "济南", longitude: 117.1201, timezone: 8 },
  { name: "青岛", longitude: 120.3826, timezone: 8 },
  { name: "郑州", longitude: 113.6254, timezone: 8 },
  { name: "西安", longitude: 108.9402, timezone: 8 },
  { name: "兰州", longitude: 103.8343, timezone: 8 },
  { name: "西宁", longitude: 101.7782, timezone: 8 },
  { name: "银川", longitude: 106.2309, timezone: 8 },
  { name: "乌鲁木齐", longitude: 87.6168, timezone: 8, aliases: ["乌市"] },
  { name: "拉萨", longitude: 91.1322, timezone: 8 },
  { name: "成都", longitude: 104.0665, timezone: 8 },
  { name: "贵阳", longitude: 106.6302, timezone: 8 },
  { name: "昆明", longitude: 102.8329, timezone: 8 },
  { name: "南宁", longitude: 108.3669, timezone: 8 },
  { name: "广州", longitude: 113.2644, timezone: 8 },
  { name: "深圳", longitude: 114.0579, timezone: 8 },
  { name: "珠海", longitude: 113.5767, timezone: 8 },
  { name: "东莞", longitude: 113.7518, timezone: 8 },
  { name: "佛山", longitude: 113.1214, timezone: 8 },
  { name: "海口", longitude: 110.1983, timezone: 8 },
  { name: "三亚", longitude: 109.5119, timezone: 8 },
  { name: "福州", longitude: 119.2965, timezone: 8 },
  { name: "厦门", longitude: 118.0894, timezone: 8 },
  { name: "杭州", longitude: 120.1551, timezone: 8 },
  { name: "宁波", longitude: 121.5503, timezone: 8 },
  { name: "南京", longitude: 118.7969, timezone: 8 },
  { name: "苏州", longitude: 120.5853, timezone: 8 },
  { name: "无锡", longitude: 120.3124, timezone: 8 },
  { name: "合肥", longitude: 117.2272, timezone: 8 },
  { name: "南昌", longitude: 115.8582, timezone: 8 },
  { name: "武汉", longitude: 114.3054, timezone: 8 },
  { name: "长沙", longitude: 112.9388, timezone: 8 },
  { name: "香港", longitude: 114.1694, timezone: 8, aliases: ["Hong Kong"] },
  { name: "澳门", longitude: 113.5439, timezone: 8, aliases: ["Macau"] },
  { name: "台北", longitude: 121.5654, timezone: 8 },
  { name: "高雄", longitude: 120.3014, timezone: 8 },
];

const ELEMENT_PSYCHOLOGY = {
  木: { drive: "成长、自主、探索", stress: "急于突破、害怕停滞", practice: "把愿望拆成下一步行动，给自己留出试错空间" },
  火: { drive: "表达、被看见、热情连接", stress: "情绪上头、过度消耗", practice: "先命名情绪，再决定是否表达，避免把即时感受当成最终结论" },
  土: { drive: "安全感、秩序、稳定承托", stress: "过度担责、害怕失控", practice: "把责任边界写清楚，区分自己能控制和不能控制的部分" },
  金: { drive: "标准、边界、价值感", stress: "过度评判、害怕不够好", practice: "用事实校验自我评价，把高标准转成可执行流程" },
  水: { drive: "理解、流动、直觉与信息", stress: "想太多、回避冲突", practice: "把模糊担忧写成具体问题，再寻找一个现实证据" },
};

const STAR_ARCHETYPES = {
  白羊座: { gift: "启动快、敢表达", shadow: "容易急于证明自己", practice: "先行动再复盘，但重大选择要设置冷静期" },
  金牛座: { gift: "稳定、耐心、重视价值", shadow: "容易固守熟悉路径", practice: "保留安全垫，同时安排小范围变化实验" },
  双子座: { gift: "信息敏感、表达灵活", shadow: "容易分心或过度分析", practice: "把信息收束成一个清晰判断" },
  巨蟹座: { gift: "共情、保护、重视关系", shadow: "容易受情绪氛围影响", practice: "先照顾感受，再确认事实边界" },
  狮子座: { gift: "创造力、领导感、需要被看见", shadow: "容易把认可等同于价值", practice: "把表达欲转成作品或成果" },
  处女座: { gift: "细致、改进、能发现问题", shadow: "容易自我挑剔", practice: "用完成标准代替完美标准" },
  天秤座: { gift: "协调、审美、关系判断", shadow: "容易回避冲突", practice: "把真实立场说出来，再谈平衡" },
  天蝎座: { gift: "洞察深、能承受复杂性", shadow: "容易过度防御", practice: "区分直觉警报和现实证据" },
  射手座: { gift: "远见、学习、自由感", shadow: "容易忽略细节和承诺成本", practice: "给愿景配一个落地计划" },
  摩羯座: { gift: "长期主义、责任感、抗压", shadow: "容易把价值感绑在成就上", practice: "把休息也纳入长期策略" },
  水瓶座: { gift: "独立、创新、系统视角", shadow: "容易与感受保持距离", practice: "表达观点前先确认情绪需求" },
  双鱼座: { gift: "想象力、共情、感受力", shadow: "容易边界模糊", practice: "把同情心和责任边界分开" },
};

const DB_VERSION = 3;
const CREDIT_PACK = { id: "pack_5_10", priceYuan: 5, credits: 10, label: "5 元 10 次" };
const FREE_PRODUCT_PLAN = { id: "free_beta", label: "测试期免费体验" };
const LOCAL_DB_PATH = path.join(ROOT_DIR, ".data", "mingpanshi-db.json");

const SYSTEM_PROMPT = [
  "你是“命盘师”的命理产品文案与分析引擎。",
  "你会基于后端给出的结构化命理资料包生成中文报告。",
  "模型输出是正式报告的主体，占 90% 以上；后端规则只提供四柱、五行、卦象、流年等确定性资料，不会替你写模板正文。",
  "重要边界：这是一份娱乐向、自我反思向报告，不声称能确定预测命运。",
  "可以使用心理咨询式倾听、情绪识别、认知-情绪-行为链路、边界感和价值澄清，但不能自称心理治疗，不能诊断疾病。",
  "不要提供医疗、法律、投资等专业结论；涉及钱、健康、重大关系时提醒用户自行判断，严重危机应建议寻求线下专业帮助或紧急支持。",
  "输出必须是合法 JSON，不要使用 Markdown 代码块，不要解释技术实现。",
  "报告需要比普通娱乐文案更具体：必须结合四柱、五行强弱、八卦六爻、变爻、星术参照、流年、用户问题和心理动力，给出分层判断和可执行建议。",
  "如果资料包包含 mysticSystems，必须把八字、六爻/梅花、奇门/紫微、姻缘、风水或塔罗中最相关的 2-4 个体系做交叉验证；不要把所有术语堆给用户，要翻译成白话。",
  "必须围绕用户原始提问展开，不要只套模板；每个结论都要有命盘依据、心理解释和现实行动三层。",
  "同一出生信息下，只要用户问题不同，报告重心、结论、建议和措辞必须明显不同；不要复用固定段落。",
  "语气：东方玄学产品感，克制、有质感、具体可执行，不恐吓用户。",
].join("\n");

const CHAT_SYSTEM_PROMPT = [
  "你是“命盘师”的对话式命盘顾问。",
  "你会基于用户已生成的命盘资料和报告继续回答追问。",
  "回答风格要白话、直接、像一个懂命盘也懂现实生活的人在解释：少用术语堆砌，术语出现后必须马上翻译成人话。",
  "不要固定套用标题模板，不要每次都用同一套 5 段结构；根据用户问题自然组织 3-5 个短段落即可。",
  "每次回答都必须先识别用户问题类型，例如换工作、复合、正缘、财务选择、学习考试、健康节奏、关系冲突、二选一决策或整体迷茫。",
  "每次回答至少引用 3 个具体命盘数据：四柱中的具体柱位/日主/月令/十神、五行最强最弱、本卦变卦/动爻、流年主题、mysticSystems 中最相关的 1-2 个体系。不能只说“你的命盘显示”。",
  "不同问题要换不同分析重心：感情问题重点看日支/姻缘层/关系边界；事业问题重点看日主承压、月柱、十神、奇门行动层；财运问题重点看财星、资源边界、风险偏好；二选一问题重点看卦象、体用和现实验证条件。",
  "必须围绕用户原话回答，不要把所有问题都回答成“先小步验证”。只有问题本身适合验证时才给验证动作。",
  "直接给出倾向性判断，但保留娱乐和现实校验边界。例如可以说“更偏向先谈条件再跳”，不要只说“看情况”。",
  "心理咨询式内容只用于解释情绪、边界、需求和行为链路，不能诊断，不能自称治疗。",
  "给建议时要具体到场景、话术、观察指标或时间窗口；不要空泛说“多沟通、稳一点、提升自己”。",
  "最后可以给 1 个继续追问的方向，但不要像模板化作业题。",
  "如果用户表达自伤、轻生或立即危险，先建议联系当地紧急服务、身边可信任的人或线下专业支持，再做简短陪伴。",
  "回答要具体、克制、可执行，不恐吓用户，不做确定性命运断言，不要像模板文案。",
  "不要提供医疗、法律、投资等专业结论；涉及钱、健康、重大关系时提醒用户自行判断。",
  "回答用中文纯文本，不要 Markdown 表格，不要编号堆砌，长度控制在 360-680 字。",
].join("\n");

const REPORT_ENHANCEMENT_PROMPT = [
  "你是“命盘师”的 Kimi 融合测算引擎。",
  "你基于结构化排盘资料生成用户最先看到的核心解读。",
  "你的输出是正式内容主体，不是给本地模板润色；不要复述 currentReport，不要套固定结构。",
  "必须按用户提示里的 XML 风格标签输出，不要 JSON，不要 Markdown 代码块，不要解释技术实现。",
  "输出要像给普通用户解释，不是把标题写成“大白话”，而是每一句都让人立刻知道是什么意思。",
  "术语必须翻译成人话：例如“火旺”要解释成行动热度、表达欲或急躁感；“金弱”要解释成规则、边界、复盘或判断力需要补。",
  "必须识别用户问题类型，并围绕用户原话重写重点判断；不要只做通用摘要。",
  "增强内容必须点名具体命盘数据，例如日柱、月柱、时柱、日主、十神、五行百分比、本卦变卦、动爻、流年主题或 mysticSystems 里的相关层。",
  "围绕用户问题、命盘总览、五行、卦象、多术数交叉验证、心理动力和行动建议生成。",
  "不要恐吓用户，不做确定性命运断言，不提供医疗、法律、投资结论。",
].join("\n");

function loadEnv(filePath) {
  let lines;
  try {
    if (!fs.existsSync(filePath)) return;
    lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/);
  } catch {
    return;
  }
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [rawKey, ...rest] = line.split("=");
    const key = rawKey.trim();
    const value = rest.join("=").trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function publicAccessCode() {
  return String(process.env.PUBLIC_ACCESS_CODE || "").trim();
}

function requestAccessCode(req) {
  const headerCode = req.headers["x-access-code"];
  if (Array.isArray(headerCode)) return String(headerCode[0] || "").trim();
  return String(headerCode || "").trim();
}

function hasApiAccess(req) {
  const code = publicAccessCode();
  return !code || requestAccessCode(req) === code;
}

function hasApiAccessFromHeaders(headers = {}) {
  const code = publicAccessCode();
  const normalized = {};
  for (const [key, value] of Object.entries(headers || {})) {
    normalized[String(key).toLowerCase()] = Array.isArray(value) ? value[0] : value;
  }
  return !code || String(normalized["x-access-code"] || "").trim() === code;
}

function createInitialDb() {
  return {
    version: DB_VERSION,
    users: {},
    conversations: {},
    orders: {},
    events: [],
  };
}

function normalizeDb(db) {
  const next = db && typeof db === "object" ? db : createInitialDb();
  next.version = DB_VERSION;
  next.users = next.users && typeof next.users === "object" ? next.users : {};
  next.conversations = next.conversations && typeof next.conversations === "object" ? next.conversations : {};
  next.orders = next.orders && typeof next.orders === "object" ? next.orders : {};
  next.events = Array.isArray(next.events) ? next.events : [];
  return next;
}

async function readLocalDb() {
  try {
    if (!fs.existsSync(LOCAL_DB_PATH)) return createInitialDb();
    return normalizeDb(JSON.parse(await fs.promises.readFile(LOCAL_DB_PATH, "utf8")));
  } catch (error) {
    return createInitialDb();
  }
}

async function writeLocalDb(db) {
  await fs.promises.mkdir(path.dirname(LOCAL_DB_PATH), { recursive: true });
  await fs.promises.writeFile(LOCAL_DB_PATH, JSON.stringify(normalizeDb(db), null, 2));
}

const localDbStore = {
  readDb: readLocalDb,
  writeDb: writeLocalDb,
};

function nowIso() {
  return new Date().toISOString();
}

function userIdFromClient(clientId) {
  const source = String(clientId || "").trim().slice(0, 160);
  if (!source) {
    const error = new Error("缺少 clientId，无法读取账户额度。");
    error.statusCode = 400;
    throw error;
  }
  return `usr_${crypto.createHash("sha256").update(source).digest("hex").slice(0, 20)}`;
}

function getOrCreateUser(db, clientId) {
  const id = userIdFromClient(clientId);
  if (!db.users[id]) {
    const createdAt = nowIso();
    db.users[id] = {
      id,
      readingUnlocks: 0,
      chatCredits: 0,
      createdAt,
      updatedAt: createdAt,
      totalChatPurchased: 0,
      totalChatUsed: 0,
      totalReadingUnlocked: 0,
      totalReadingUsed: 0,
      totalPaidFen: 0,
    };
  }
  normalizeUserLedger(db.users[id]);
  return db.users[id];
}

function normalizeUserLedger(user) {
  if (user.chatCredits === undefined) user.chatCredits = Number(user.credits) || 0;
  if (user.readingUnlocks === undefined) user.readingUnlocks = 0;
  if (user.totalChatPurchased === undefined) user.totalChatPurchased = Number(user.totalPurchased) || 0;
  if (user.totalChatUsed === undefined) user.totalChatUsed = Number(user.totalUsed) || 0;
  if (user.totalReadingUnlocked === undefined) user.totalReadingUnlocked = 0;
  if (user.totalReadingUsed === undefined) user.totalReadingUsed = 0;
  delete user.credits;
  delete user.totalPurchased;
  delete user.totalUsed;
}

function publicAccount(user) {
  normalizeUserLedger(user);
  const freeAccess = isFreeProductMode();
  return {
    userId: user.id,
    readingUnlocks: Number(user.readingUnlocks) || 0,
    chatCredits: Number(user.chatCredits) || 0,
    credits: Number(user.chatCredits) || 0,
    totalChatPurchased: Number(user.totalChatPurchased) || 0,
    totalChatUsed: Number(user.totalChatUsed) || 0,
    totalReadingUnlocked: Number(user.totalReadingUnlocked) || 0,
    totalReadingUsed: Number(user.totalReadingUsed) || 0,
    plan: freeAccess ? FREE_PRODUCT_PLAN : CREDIT_PACK,
    paymentMode: freeAccess ? "free" : process.env.PAYMENT_MODE || "demo",
    accessMode: productAccessMode(),
    freeAccess,
  };
}

function publicBilling() {
  if (isFreeProductMode()) {
    return {
      accessMode: productAccessMode(),
      paymentEnabled: false,
      plan: FREE_PRODUCT_PLAN,
      readingUnlock: "当前测试期免费生成 AI 命盘报告。",
      chatUnitCost: "当前测试期免费追问，不需要购买额度。",
      infrastructurePayment: "服务器和域名采购可单独选择支持加密货币付款的供应商。",
    };
  }

  return {
    accessMode: productAccessMode(),
    paymentEnabled: true,
    plan: CREDIT_PACK,
    paymentMode: process.env.PAYMENT_MODE || "demo",
    paymentProvider: process.env.PAYMENT_PROVIDER || "demo",
    crypto: {
      enabled: paymentMode() === "crypto",
      provider: cryptoPaymentConfig().provider,
      priceAmount: cryptoPaymentConfig().priceAmount,
      priceCurrency: cryptoPaymentConfig().priceCurrency,
      payCurrency: cryptoPaymentConfig().payCurrency,
    },
    readingUnlock: "分享给朋友或朋友圈可免费解锁 1 次 AI 命盘测算",
    chatUnitCost: "每次对话追问消耗 1 次额度",
  };
}

function pushEvent(db, event) {
  db.events.push({ id: `evt_${crypto.randomUUID()}`, at: nowIso(), ...event });
  if (db.events.length > 500) db.events = db.events.slice(-500);
}

function ensureReadingUnlock(user) {
  if (isFreeProductMode()) return;
  normalizeUserLedger(user);
  if ((Number(user.readingUnlocks) || 0) <= 0) {
    const error = new Error("请先分享给朋友或朋友圈，免费解锁 1 次 AI 命盘测算。");
    error.statusCode = 402;
    error.code = "READING_LOCKED";
    throw error;
  }
}

function ensureChatCredits(user) {
  if (isFreeProductMode()) return;
  normalizeUserLedger(user);
  if ((Number(user.chatCredits) || 0) <= 0) {
    const error = new Error("余额不足，请先购买 5 元 10 次套餐。");
    error.statusCode = 402;
    error.code = "INSUFFICIENT_CREDITS";
    throw error;
  }
}

function deductReadingUnlock(db, user, refId) {
  normalizeUserLedger(user);
  if (isFreeProductMode()) {
    user.totalReadingUsed = (Number(user.totalReadingUsed) || 0) + 1;
    user.updatedAt = nowIso();
    pushEvent(db, { type: "reading.free_used", userId: user.id, refId, balance: user.readingUnlocks });
    return;
  }
  user.readingUnlocks = Math.max(0, (Number(user.readingUnlocks) || 0) - 1);
  user.totalReadingUsed = (Number(user.totalReadingUsed) || 0) + 1;
  user.updatedAt = nowIso();
  pushEvent(db, { type: "reading.used", userId: user.id, refId, delta: -1, balance: user.readingUnlocks });
}

function deductChatCredit(db, user, refId) {
  normalizeUserLedger(user);
  if (isFreeProductMode()) {
    user.totalChatUsed = (Number(user.totalChatUsed) || 0) + 1;
    user.updatedAt = nowIso();
    pushEvent(db, { type: "chat.free_used", userId: user.id, refId, balance: user.chatCredits });
    return;
  }
  user.chatCredits = Math.max(0, (Number(user.chatCredits) || 0) - 1);
  user.totalChatUsed = (Number(user.totalChatUsed) || 0) + 1;
  user.updatedAt = nowIso();
  pushEvent(db, { type: "chat.used", userId: user.id, refId, delta: -1, balance: user.chatCredits });
}

function unlockReadingByShare(db, user, channel = "friend") {
  normalizeUserLedger(user);
  const normalizedChannel = ["friend", "timeline"].includes(channel) ? channel : "friend";
  user.readingUnlocks = (Number(user.readingUnlocks) || 0) + 1;
  user.totalReadingUnlocked = (Number(user.totalReadingUnlocked) || 0) + 1;
  user.updatedAt = nowIso();
  pushEvent(db, {
    type: "reading.unlocked",
    userId: user.id,
    channel: normalizedChannel,
    delta: 1,
    balance: user.readingUnlocks,
  });
}

function paymentMode() {
  const mode = String(process.env.PAYMENT_MODE || "demo").trim().toLowerCase();
  if (["crypto", "live"].includes(mode)) return "crypto";
  return "demo";
}

function productAccessMode() {
  const mode = String(process.env.PRODUCT_ACCESS_MODE || "free").trim().toLowerCase();
  return mode === "paid" ? "paid" : "free";
}

function isFreeProductMode() {
  return productAccessMode() === "free";
}

function cryptoPaymentConfig() {
  return {
    provider: String(process.env.PAYMENT_PROVIDER || "nowpayments").trim().toLowerCase(),
    apiBase: String(process.env.NOWPAYMENTS_API_BASE || "https://api.nowpayments.io/v1").replace(/\/$/, ""),
    apiKey: String(process.env.NOWPAYMENTS_API_KEY || "").trim(),
    ipnSecret: String(process.env.NOWPAYMENTS_IPN_SECRET || "").trim(),
    priceAmount: String(process.env.CRYPTO_PRICE_AMOUNT || "0.70"),
    priceCurrency: String(process.env.CRYPTO_PRICE_CURRENCY || "usd").toLowerCase(),
    payCurrency: String(process.env.CRYPTO_PAY_CURRENCY || "").trim().toLowerCase(),
    successStatuses: String(process.env.CRYPTO_SUCCESS_STATUSES || "finished")
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean),
  };
}

function publicOrder(order = {}) {
  return {
    id: order.id,
    provider: order.provider || order.channel || "demo",
    providerInvoiceId: order.providerInvoiceId || "",
    providerPaymentId: order.providerPaymentId || "",
    planId: order.planId,
    amountFen: order.amountFen,
    credits: order.credits,
    status: order.status,
    providerStatus: order.providerStatus || "",
    paymentUrl: order.paymentUrl || "",
    checkoutUrl: order.paymentUrl || "",
    cryptoPrice: order.cryptoPrice || null,
    createdAt: order.createdAt,
    paidAt: order.paidAt || null,
  };
}

function normalizedHeaders(headers = {}) {
  const normalized = {};
  for (const [key, value] of Object.entries(headers || {})) {
    normalized[String(key).toLowerCase()] = Array.isArray(value) ? value[0] : value;
  }
  return normalized;
}

function requestBaseUrl(headers = {}) {
  const configured = String(process.env.PUBLIC_SITE_URL || process.env.APP_BASE_URL || "").replace(/\/$/, "");
  if (configured) return configured;
  const normalized = normalizedHeaders(headers);
  const host = normalized.host || `localhost:${PORT}`;
  const proto = normalized["x-forwarded-proto"] || (String(host).includes("localhost") ? "http" : "https");
  return `${proto}://${host}`.replace(/\/$/, "");
}

function sortObjectForSignature(value) {
  if (Array.isArray(value)) return value.map(sortObjectForSignature);
  if (!value || typeof value !== "object") return value;
  return Object.keys(value).sort().reduce((result, key) => {
    result[key] = sortObjectForSignature(value[key]);
    return result;
  }, {});
}

function verifyNowPaymentsSignature(payload, signature) {
  const { ipnSecret } = cryptoPaymentConfig();
  if (!ipnSecret) {
    const error = new Error("缺少 NOWPAYMENTS_IPN_SECRET，无法验证支付回调。");
    error.statusCode = 500;
    throw error;
  }
  const expected = crypto
    .createHmac("sha512", ipnSecret)
    .update(JSON.stringify(sortObjectForSignature(payload)))
    .digest("hex");
  const received = String(signature || "").trim();
  if (!received || expected.length !== received.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

function creditOrder(db, user, order, paidAt = nowIso()) {
  if (!order || order.status === "paid") return;
  normalizeUserLedger(user);
  order.status = "paid";
  order.paidAt = paidAt;
  order.updatedAt = paidAt;
  user.chatCredits = (Number(user.chatCredits) || 0) + Number(order.credits || CREDIT_PACK.credits);
  user.totalChatPurchased = (Number(user.totalChatPurchased) || 0) + Number(order.credits || CREDIT_PACK.credits);
  user.totalPaidFen = (Number(user.totalPaidFen) || 0) + Number(order.amountFen || 0);
  user.updatedAt = paidAt;
  pushEvent(db, {
    type: "chat.recharged",
    userId: user.id,
    orderId: order.id,
    provider: order.provider || order.channel,
    delta: Number(order.credits || CREDIT_PACK.credits),
    balance: user.chatCredits,
  });
}

async function createNowPaymentsInvoice(order, headers = {}) {
  const config = cryptoPaymentConfig();
  if (!config.apiKey) {
    const error = new Error("缺少 NOWPAYMENTS_API_KEY，无法创建加密支付订单。");
    error.statusCode = 500;
    throw error;
  }
  const baseUrl = requestBaseUrl(headers);
  const payload = {
    price_amount: config.priceAmount,
    price_currency: config.priceCurrency,
    order_id: order.id,
    order_description: `命盘师 ${CREDIT_PACK.label} 问事额度`,
    ipn_callback_url: `${baseUrl}/api/payment-webhook/nowpayments`,
    success_url: `${baseUrl}/?payment=success&orderId=${encodeURIComponent(order.id)}`,
    cancel_url: `${baseUrl}/?payment=cancel&orderId=${encodeURIComponent(order.id)}`,
    is_fixed_rate: true,
    is_fee_paid_by_user: true,
  };
  if (config.payCurrency) payload.pay_currency = config.payCurrency;

  const response = await fetch(`${config.apiBase}/invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.apiKey,
    },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let data = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    data = { raw: text };
  }
  if (!response.ok) {
    const error = new Error(`NOWPayments 返回 ${response.status}: ${text.slice(0, 500)}`);
    error.statusCode = 502;
    throw error;
  }
  return data;
}

async function rechargeUser(db, user, planId = CREDIT_PACK.id, input = {}, headers = {}) {
  if (planId !== CREDIT_PACK.id) {
    const error = new Error("套餐不存在。");
    error.statusCode = 400;
    throw error;
  }
  const createdAt = nowIso();
  const mode = paymentMode();
  const order = {
    id: `ord_${crypto.randomUUID()}`,
    userId: user.id,
    planId: CREDIT_PACK.id,
    amountFen: CREDIT_PACK.priceYuan * 100,
    credits: CREDIT_PACK.credits,
    status: "pending",
    createdAt,
    paidAt: null,
    channel: mode === "crypto" ? "crypto" : "demo",
    provider: mode === "crypto" ? cryptoPaymentConfig().provider : "demo",
    providerStatus: "",
    providerInvoiceId: "",
    providerPaymentId: "",
    paymentUrl: "",
    cryptoPrice: mode === "crypto" ? {
      amount: cryptoPaymentConfig().priceAmount,
      currency: cryptoPaymentConfig().priceCurrency,
      payCurrency: input.payCurrency || cryptoPaymentConfig().payCurrency || "",
    } : null,
  };
  db.orders[order.id] = order;

  if (mode === "crypto") {
    const invoice = await createNowPaymentsInvoice(order, headers);
    order.providerInvoiceId = String(invoice.id || "");
    order.paymentUrl = invoice.invoice_url || invoice.url || "";
    order.providerPayload = invoice;
    order.updatedAt = nowIso();
    pushEvent(db, { type: "payment.created", userId: user.id, orderId: order.id, provider: order.provider });
  } else {
    creditOrder(db, user, order, createdAt);
  }

  return order;
}

function createConversation(db, user, profile, report, input, generation = {}) {
  const createdAt = nowIso();
  const title = `${profile.user.name || "有缘人"} · ${profile.user.focusLabel || "命盘解析"}`;
  const id = `conv_${crypto.randomUUID()}`;
  const question = input.question || "请解读我的整体命盘。";
  const isModelGenerated = generation.provider && generation.provider !== "命盘师";
  const conversation = {
    id,
    userId: user.id,
    title,
    profile,
    report,
    enhancement: {
      status: isModelGenerated ? "complete" : (process.env.OPENAI_API_KEY ? "pending" : "unavailable"),
      provider: generation.provider || apiConfig().provider,
      model: generation.model || apiConfig().model,
      responseId: generation.rawResponseId || null,
      updatedAt: createdAt,
      completedAt: isModelGenerated ? createdAt : "",
    },
    createdAt,
    updatedAt: createdAt,
    messages: [
      { id: `msg_${crypto.randomUUID()}`, role: "user", content: question, createdAt },
      { id: `msg_${crypto.randomUUID()}`, role: "assistant", content: report.summary || "命盘报告已生成，可以继续追问。", createdAt },
    ],
  };
  db.conversations[id] = conversation;
  return conversation;
}

function getConversationForUser(db, user, conversationId) {
  const conversation = db.conversations[String(conversationId || "")];
  if (!conversation || conversation.userId !== user.id) {
    const error = new Error("未找到这次对话记录。");
    error.statusCode = 404;
    throw error;
  }
  return conversation;
}

function publicConversation(conversation) {
  return {
    id: conversation.id,
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    enhancement: publicEnhancement(conversation.enhancement),
    messages: (conversation.messages || []).slice(-12),
  };
}

function publicEnhancement(enhancement = {}) {
  return {
    status: enhancement.status || "pending",
    provider: enhancement.provider || "",
    model: enhancement.model || "",
    updatedAt: enhancement.updatedAt || "",
    completedAt: enhancement.completedAt || "",
    message: enhancement.status === "complete"
      ? "Kimi 融合测算已完成。"
      : enhancement.status === "processing"
        ? "Kimi 正在融合排盘数据与重点问题。"
        : enhancement.status === "failed"
          ? "Kimi 融合暂未完成，基础报告已可使用。"
          : enhancement.status === "unavailable"
            ? "当前未配置模型增强。"
            : "基础报告已生成，等待 Kimi 融合增强。",
  };
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  const filePath = safePath === "/" ? path.join(PUBLIC_DIR, "index.html") : path.join(PUBLIC_DIR, safePath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const ext = path.extname(filePath);
    res.writeHead(200, {
      "Content-Type": MIME_TYPES[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600",
    });
    res.end(data);
  });
}

function readBody(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > limit) {
        reject(new Error("请求体过大"));
        req.destroy();
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function normalizeMod(value, size) {
  return ((value % size) + size) % size;
}

function hashSeed(input) {
  return crypto.createHash("sha256").update(JSON.stringify(input)).digest("hex");
}

function seededNumber(seed, salt, min, max) {
  const hex = crypto.createHash("sha256").update(`${seed}:${salt}`).digest("hex").slice(0, 12);
  const ratio = parseInt(hex, 16) / 0xffffffffffff;
  return Math.round(min + ratio * (max - min));
}

function pickBySeed(seed, salt, list) {
  return list[seededNumber(seed, salt, 0, list.length - 1)];
}

function parseBirthDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
    throw new Error("出生日期需要使用 YYYY-MM-DD 格式");
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw new Error("出生日期无效");
  }
  const nowYear = new Date().getFullYear();
  if (year < 1900 || year > nowYear) {
    throw new Error(`出生年份需要在 1900-${nowYear} 之间`);
  }
  return { year, month, day, date };
}

function parseHour(value) {
  if (!value) return null;
  const text = String(value).trim();
  const branch = BRANCHES.find((item) => text.includes(item.name) || text.includes(item.animal));
  if (branch) return { hour: null, minute: 0, branchIndex: BRANCHES.indexOf(branch), source: branch.name };

  const match = text.match(/^([01]?\d|2[0-3])(?::([0-5]\d))?$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  const branchIndex = hour === 23 ? 0 : Math.floor((hour + 1) / 2) % 12;
  return { hour, minute, branchIndex, source: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}` };
}

function parseBooleanFlag(value, defaultValue = false) {
  if (value === true || value === false) return value;
  if (value === undefined || value === null || value === "") return defaultValue;
  const text = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on", "启用", "是"].includes(text)) return true;
  if (["0", "false", "no", "off", "关闭", "否"].includes(text)) return false;
  return defaultValue;
}

function normalizePlaceText(value) {
  return String(value || "")
    .trim()
    .replace(/[省市区县\s]/g, "")
    .toLowerCase();
}

function resolveBirthPlace(value) {
  const input = String(value || "").trim().slice(0, 48);
  if (!input) {
    return {
      input: "",
      name: "未填写",
      longitude: null,
      timezone: 8,
      matched: false,
      source: "empty",
    };
  }

  const longitudeMatch = input.match(/(?:经度|東經|东经|lng|lon|longitude)?\s*[:：]?\s*([+-]?\d+(?:\.\d+)?)\s*(?:°|度|e|E)?/);
  if (longitudeMatch) {
    const longitude = Number(longitudeMatch[1]);
    if (Number.isFinite(longitude) && Math.abs(longitude) <= 180) {
      return {
        input,
        name: input.replace(longitudeMatch[0], "").trim() || `经度 ${longitude.toFixed(2)}`,
        longitude,
        timezone: 8,
        matched: true,
        source: "manual_longitude",
      };
    }
  }

  const normalized = normalizePlaceText(input);
  const city = CITY_COORDINATES.find((item) => {
    const keys = [item.name, ...(item.aliases || [])].map(normalizePlaceText);
    return keys.some((key) => key && (normalized.includes(key) || key.includes(normalized)));
  });

  if (city) {
    return {
      input,
      name: city.name,
      longitude: city.longitude,
      timezone: city.timezone || 8,
      matched: true,
      source: "city_table",
    };
  }

  return {
    input,
    name: input,
    longitude: null,
    timezone: 8,
    matched: false,
    source: "unmatched",
  };
}

function dayOfYear(year, month, day) {
  const start = Date.UTC(year, 0, 1);
  return Math.floor((Date.UTC(year, month - 1, day) - start) / 86400000) + 1;
}

function equationOfTimeMinutes(year, month, day) {
  const n = dayOfYear(year, month, day);
  const b = (2 * Math.PI * (n - 81)) / 364;
  return (9.87 * Math.sin(2 * b)) - (7.53 * Math.cos(b)) - (1.5 * Math.sin(b));
}

function formatDateTimeParts(year, month, day, hour, minute) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatOffset(minutes) {
  const rounded = Math.round(Number(minutes) || 0);
  const sign = rounded >= 0 ? "+" : "-";
  const abs = Math.abs(rounded);
  return `${sign}${abs} 分钟`;
}

function buildTrueSolarCalibration(input, birth, parsedHour) {
  const place = resolveBirthPlace(input.birthPlace || input.birthCity || input.location || "");
  const requested = parseBooleanFlag(input.useTrueSolarTime, Boolean(place.longitude && parsedHour));
  const baseHour = parsedHour ? (parsedHour.hour ?? branchCenterHour(parsedHour.branchIndex)) : null;
  const baseMinute = parsedHour ? parsedHour.minute : 0;
  const clockTime = parsedHour ? formatDateTimeParts(birth.year, birth.month, birth.day, baseHour, baseMinute) : "";

  if (!requested) {
    return {
      enabled: false,
      applied: false,
      place,
      clockTime,
      reason: "disabled",
      note: "未启用真太阳时校正，按标准北京时间排盘。",
    };
  }

  if (!parsedHour) {
    return {
      enabled: true,
      applied: false,
      place,
      clockTime,
      reason: "missing_birth_time",
      note: "未填写出生时间，无法校正真太阳时。",
    };
  }

  if (!Number.isFinite(place.longitude)) {
    return {
      enabled: true,
      applied: false,
      place,
      clockTime,
      reason: "unknown_birth_place",
      note: "出生城市未识别，暂按标准北京时间排盘；可填写城市名或经度。",
    };
  }

  const timezone = Number(place.timezone) || 8;
  const standardMeridian = timezone * 15;
  const longitudeOffset = 4 * (place.longitude - standardMeridian);
  const equationOffset = equationOfTimeMinutes(birth.year, birth.month, birth.day);
  const totalOffset = longitudeOffset + equationOffset;
  const clockMs = Date.UTC(birth.year, birth.month - 1, birth.day, baseHour, baseMinute, 0);
  const correctedDate = new Date(clockMs + Math.round(totalOffset * 60 * 1000));
  const corrected = {
    year: correctedDate.getUTCFullYear(),
    month: correctedDate.getUTCMonth() + 1,
    day: correctedDate.getUTCDate(),
    hour: correctedDate.getUTCHours(),
    minute: correctedDate.getUTCMinutes(),
  };
  const originalDay = Date.UTC(birth.year, birth.month - 1, birth.day);
  const correctedDay = Date.UTC(corrected.year, corrected.month - 1, corrected.day);
  const dayShift = Math.round((correctedDay - originalDay) / 86400000);

  return {
    enabled: true,
    applied: true,
    place,
    clockTime,
    corrected,
    correctedTime: formatDateTimeParts(corrected.year, corrected.month, corrected.day, corrected.hour, corrected.minute),
    offsetMinutes: Math.round(totalOffset),
    offsetMinutesExact: Number(totalOffset.toFixed(1)),
    longitudeOffsetMinutes: Number(longitudeOffset.toFixed(1)),
    equationOfTimeMinutes: Number(equationOffset.toFixed(1)),
    standardMeridian,
    dayShift,
    note: `按${place.name}经度 ${place.longitude.toFixed(2)}°E 校正，真太阳时较标准时间${formatOffset(totalOffset)}。`,
  };
}

function westernSign(month, day) {
  let sign = "摩羯座";
  for (const [start, name] of WESTERN_SIGNS) {
    if (month > start[0] || (month === start[0] && day >= start[1])) sign = name;
  }
  return sign;
}

function julianDayNumber(year, month, day) {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function ganzhiByIndex(index) {
  return {
    stem: STEMS[normalizeMod(index, 10)],
    branch: BRANCHES[normalizeMod(index, 12)],
    index: normalizeMod(index, 60),
    name: `${STEMS[normalizeMod(index, 10)].name}${BRANCHES[normalizeMod(index, 12)].name}`,
  };
}

function ganzhiIndex(name) {
  const text = String(name || "");
  const stemIndex = STEMS.findIndex((item) => item.name === text[0]);
  const branchIndex = BRANCHES.findIndex((item) => item.name === text[1]);
  if (stemIndex < 0 || branchIndex < 0) return null;
  for (let index = 0; index < 60; index += 1) {
    if (index % 10 === stemIndex && index % 12 === branchIndex) return index;
  }
  return null;
}

function branchCenterHour(branchIndex) {
  const centers = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22];
  return centers[normalizeMod(Number(branchIndex) || 0, 12)] || 0;
}

function pillarFromGanzhi(name, extras = {}) {
  const text = String(name || "");
  const stem = STEMS.find((item) => item.name === text[0]);
  const branch = BRANCHES.find((item) => item.name === text[1]);
  if (!stem || !branch) return null;
  return {
    stem,
    branch,
    index: ganzhiIndex(text),
    name: text,
    ...extras,
  };
}

function solarMonthNo(month, day) {
  const md = month * 100 + day;
  if (md >= 1207) return 11;
  if (md >= 1107) return 10;
  if (md >= 1008) return 9;
  if (md >= 908) return 8;
  if (md >= 808) return 7;
  if (md >= 707) return 6;
  if (md >= 606) return 5;
  if (md >= 506) return 4;
  if (md >= 405) return 3;
  if (md >= 306) return 2;
  if (md >= 204) return 1;
  if (md >= 106) return 12;
  return 11;
}

function buildPillars(birth, parsedHour, calibration = {}) {
  const corrected = calibration.applied ? calibration.corrected : null;
  const solarYear = corrected?.year || birth.year;
  const solarMonth = corrected?.month || birth.month;
  const solarDay = corrected?.day || birth.day;
  const hourValue = parsedHour
    ? (corrected?.hour ?? parsedHour.hour ?? branchCenterHour(parsedHour.branchIndex))
    : 12;
  const minuteValue = parsedHour ? (corrected?.minute ?? parsedHour.minute) : 0;
  const solar = Solar.fromYmdHms(solarYear, solarMonth, solarDay, hourValue, minuteValue, 0);
  const lunar = solar.getLunar();
  const eightChar = lunar.getEightChar();

  const year = pillarFromGanzhi(eightChar.getYear(), {
    naYin: eightChar.getYearNaYin(),
    wuXing: eightChar.getYearWuXing(),
    shiShenGan: eightChar.getYearShiShenGan(),
    shiShenZhi: eightChar.getYearShiShenZhi(),
  });
  const month = pillarFromGanzhi(eightChar.getMonth(), {
    naYin: eightChar.getMonthNaYin(),
    wuXing: eightChar.getMonthWuXing(),
    shiShenGan: eightChar.getMonthShiShenGan(),
    shiShenZhi: eightChar.getMonthShiShenZhi(),
  });
  const day = pillarFromGanzhi(eightChar.getDay(), {
    naYin: eightChar.getDayNaYin(),
    wuXing: eightChar.getDayWuXing(),
    shiShenGan: eightChar.getDayShiShenGan(),
    shiShenZhi: eightChar.getDayShiShenZhi(),
  });
  const hour = parsedHour ? pillarFromGanzhi(eightChar.getTime(), {
    naYin: eightChar.getTimeNaYin(),
    wuXing: eightChar.getTimeWuXing(),
    shiShenGan: eightChar.getTimeShiShenGan(),
    shiShenZhi: eightChar.getTimeShiShenZhi(),
    source: calibration.applied ? calibration.correctedTime : parsedHour.source,
  }) : null;

  return {
    year,
    month,
    day,
    hour,
    pillarYear: year?.name,
    engine: "lunar-javascript",
    solarText: solar.toFullString(),
    lunarText: lunar.toFullString(),
    jieQi: lunar.getJieQi() || "",
    prevJieQi: lunar.getPrevJieQi()?.toString?.() || "",
    nextJieQi: lunar.getNextJieQi()?.toString?.() || "",
    trueSolarTime: calibration,
  };
}

function buildElementWeights(pillars) {
  const scores = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const add = (element, amount) => {
    scores[element] = Number((scores[element] + amount).toFixed(3));
  };

  for (const pillar of [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean)) {
    add(pillar.stem.element, 1.25);
    add(pillar.branch.element, 1);
    for (const hiddenStem of pillar.branch.hidden) {
      const stem = STEMS.find((item) => item.name === hiddenStem);
      if (stem) add(stem.element, 0.35);
    }
  }

  const total = Object.values(scores).reduce((sum, value) => sum + value, 0) || 1;
  return ELEMENT_ORDER.map((element) => ({
    element,
    raw: scores[element],
    percent: Math.round((scores[element] / total) * 100),
  })).sort((a, b) => b.percent - a.percent);
}

function buildHexagrams(seed) {
  const primaryIndex = seededNumber(seed, "primary-hexagram", 0, 63);
  const changingLine = seededNumber(seed, "changing-line", 1, 6);
  const changedIndex = normalizeMod(primaryIndex ^ (1 << (changingLine - 1)), 64);
  const primaryTrigram = TRIGRAMS[primaryIndex % TRIGRAMS.length];
  const changedTrigram = TRIGRAMS[changedIndex % TRIGRAMS.length];
  return {
    primary: { number: primaryIndex + 1, name: HEXAGRAMS[primaryIndex], trigram: primaryTrigram },
    changingLine,
    changed: { number: changedIndex + 1, name: HEXAGRAMS[changedIndex], trigram: changedTrigram },
  };
}

function buildSixYaoInsight(hexagrams, strongest, weakest, focusLabel) {
  const lineNames = ["初爻", "二爻", "三爻", "四爻", "五爻", "上爻"];
  const lineThemes = ["起念与开局", "关系与资源", "行动与阻力", "外部环境", "主位与选择", "收束与转化"];
  const lineIndex = Math.max(0, Math.min(5, Number(hexagrams.changingLine || 1) - 1));
  const primary = hexagrams.primary || {};
  const changed = hexagrams.changed || {};
  const primaryMeaning = primary.trigram?.meaning || "观察当下格局";
  const changedMeaning = changed.trigram?.meaning || "观察变化后的走向";
  return {
    method: "六爻启发式变爻",
    line: hexagrams.changingLine,
    lineName: lineNames[lineIndex],
    lineTheme: lineThemes[lineIndex],
    movement: `${primary.name || "本卦"}${lineNames[lineIndex]}动，之${changed.name || "变卦"}`,
    primaryFocus: primaryMeaning,
    changedFocus: changedMeaning,
    counsel: `${focusLabel || "当前问题"}不宜只看结果，要看起因、关系、行动、环境、选择、收束六层。${strongest.element}强处可作为主动推进点，${weakest.element}弱处则是需要补足的心理和现实资源。`,
  };
}

function buildPsychologyLens(strongest, weakest, focusLabel, question) {
  const strong = ELEMENT_PSYCHOLOGY[strongest.element] || ELEMENT_PSYCHOLOGY.土;
  const weak = ELEMENT_PSYCHOLOGY[weakest.element] || ELEMENT_PSYCHOLOGY.水;
  return {
    lens: "咨询式自我反思",
    coreNeed: strong.drive,
    stressPattern: weak.stress,
    regulation: weak.practice,
    behaviorLoop: `在“${focusLabel || "当前重点"}”上，先识别触发事件，再写下自动想法、情绪强度、身体感受和可选择行动。`,
    reflectionQuestion: `如果把“${question || "这个问题"}”当成一次自我理解，你真正想守住的价值是什么？`,
  };
}

function buildStellarInsight(sign, focusLabel) {
  const star = STAR_ARCHETYPES[sign] || {
    gift: "观察力与适应力",
    shadow: "容易在压力下失去节奏",
    practice: "先稳定节奏，再做选择",
  };
  return {
    method: "星术参照",
    sign,
    gift: star.gift,
    shadow: star.shadow,
    practice: star.practice,
    counsel: `${sign}的星术参照更像性格侧影，不作为定论；放在${focusLabel || "当前重点"}里，可用来观察表达方式、压力反应和行动节奏。`,
  };
}

function buildAnnualFlow(seed, startYear) {
  return Array.from({ length: 5 }, (_, offset) => {
    const year = startYear + offset;
    const index = normalizeMod(year - 4, 60);
    const gz = ganzhiByIndex(index);
    return {
      year,
      ganzhi: gz.name,
      zodiac: gz.branch.animal,
      element: gz.stem.element,
      theme: pickBySeed(seed, `flow-theme-${year}`, ["启局", "蓄势", "转折", "守成", "破局", "收获", "修正", "远行"]),
      score: seededNumber(seed, `flow-score-${year}`, 62, 92),
    };
  });
}

function buildDomainScores(seed, strongest, weakest, focus) {
  const base = {
    career: strongest.element === "木" || strongest.element === "火" ? 78 : 70,
    love: strongest.element === "水" || strongest.element === "金" ? 76 : 69,
    wealth: strongest.element === "土" || strongest.element === "金" ? 79 : 68,
    study: strongest.element === "木" || strongest.element === "水" ? 78 : 70,
    health: weakest.element === "火" || weakest.element === "水" ? 66 : 73,
  };
  return Object.entries(base).map(([key, value]) => {
    const focusBonus = key === focus ? 6 : 0;
    const jitter = seededNumber(seed, `domain-${key}`, -5, 7);
    return {
      key,
      label: FOCUS_LABELS[key],
      score: Math.max(45, Math.min(96, value + focusBonus + jitter)),
    };
  });
}

function inferFocus(focus, question) {
  if (focus && focus !== "auto") return focus;
  const text = question || "";
  if (/桃花|感情|恋爱|婚|复合|对象|暧昧/.test(text)) return "love";
  if (/工作|事业|跳槽|升职|项目|创业|老板|岗位/.test(text)) return "career";
  if (/财|钱|收入|工资|投资|副业|生意|买房/.test(text)) return "wealth";
  if (/学习|考试|考研|证书|课程|读书|上岸/.test(text)) return "study";
  if (/健康|睡眠|身体|焦虑|压力|状态/.test(text)) return "health";
  return "overall";
}

function inferQuestionIntent(question, focus = "overall") {
  const text = String(question || "");
  const make = (key, label, evidenceFocus, answerMode, actionFrame) => ({
    key,
    label,
    evidenceFocus,
    answerMode,
    actionFrame,
  });

  if (/换工作|跳槽|离职|转岗|辞职|offer|面试|升职|老板|同事|职场|项目|创业/.test(text)) {
    return make("career_move", "事业变动/工作选择", "日主承压方式、月柱/时柱十神、五行行动力与承接力、奇门行动层、流年事业窗口", "判断更适合主动推进、谈条件、等待时机还是先补筹码", "给出 7-30 天内可验证的投递、谈判、作品整理或沟通动作");
  }
  if (/复合|前任|分手|和好|挽回|冷战/.test(text)) {
    return make("love_reconcile", "复合/关系修复", "日支关系宫、姻缘层、六爻世应关系、五行情绪流动和边界感", "判断是否适合主动联系、先观察、定边界或放下消耗", "给出一次沟通话术、观察对方回应的指标和止损边界");
  }
  if (/正缘|对象|脱单|桃花|恋爱|结婚|婚姻|暧昧|喜欢的人/.test(text) || focus === "love") {
    return make("love_future", "姻缘/长期关系", "日支、配偶星/关系用神、姻缘层、星术表达方式和心理需求", "判断关系机会来自哪里、适合什么相处模式、要避开什么消耗", "给出筛选关系、表达需求和观察稳定回应的方法");
  }
  if (/钱|财|收入|工资|副业|生意|投资|理财|买房|负债|合作赚钱/.test(text) || focus === "wealth") {
    return make("wealth_choice", "财运/资源选择", "财星、食伤输出、五行土金水的资源边界、奇门生门/开门、流年财务节奏", "判断更适合守、试、谈、扩张还是先控风险", "给出预算边界、试错额度、收入验证和风险止损动作");
  }
  if (/考试|学习|考研|证书|上岸|课程|读书|留学|面试准备/.test(text) || focus === "study") {
    return make("study_exam", "学习/考试/成长", "印星、食伤输出、木水学习吸收力、时柱长期规划和流年学习窗口", "判断适合冲刺、补基础、换方法还是先稳定节奏", "给出复习周期、输出检查和反馈机制");
  }
  if (/健康|身体|睡眠|焦虑|抑郁|压力|状态|情绪|累|内耗/.test(text) || focus === "health") {
    return make("health_rhythm", "身心节奏/压力", "五行弱项、心理动力、风水环境层、日主恢复力和生活节奏", "判断压力来源、节奏漏洞和需要优先恢复的部分", "给出非医疗的作息、记录、沟通边界和求助提醒");
  }
  if (/选|选择|要不要|该不该|适不适合|能不能|会不会|什么时候|时机|方向/.test(text)) {
    return make("decision_timing", "选择/时机判断", "本卦变卦、动爻、体用关系、流年主题和现实前置条件", "判断现在适合行动、等待、谈条件、止损还是分阶段推进", "给出决策前置条件、验证动作和时间窗口");
  }
  return make(focus === "overall" ? "overall_reading" : `${focus}_reading`, FOCUS_LABELS[focus] || "整体问题", "日主、月令、五行强弱、卦象变化、心理动力和流年主题", "先回答用户原问题，再说明盘面依据和现实可执行路径", "给出一条当前最重要的现实动作和一条需要避开的坑");
}

function intentRealityCheck(intent = {}) {
  return {
    career_move: "谈判筹码、岗位反馈、作品成果和离职成本",
    love_reconcile: "对方是否稳定回应、是否愿意沟通、关系边界和止损线",
    love_future: "稳定回应、价值观匹配、相处边界和现实安排",
    wealth_choice: "现金流、合约责任、试错额度和退出条件",
    study_exam: "复习节奏、输出质量、模拟反馈和薄弱环节",
    health_rhythm: "睡眠、压力触发点、身体反馈和求助资源",
    decision_timing: "前置条件、外部回应、最坏结果和时间窗口",
  }[intent.key] || "现实回应、资源边界和行动条件";
}

function intentActionText(intent = {}, weakestElement = "") {
  return {
    career_move: "先整理可展示成果，再试投或约一次行业沟通，拿真实反馈判断要不要跳",
    love_reconcile: "先写清楚想表达的感受、事实和请求，只做一次低压沟通，再看对方是否持续回应",
    love_future: "把筛选标准写成三条底线和三条期待，观察对方是否尊重边界、是否稳定投入",
    wealth_choice: "先划出不可动资金和可试错额度，任何合作都先看合同、回款和退出条件",
    study_exam: "把目标拆成每日输出、错题复盘和每周模拟反馈，不只用学习时长安慰自己",
    health_rhythm: "先记录 7 天睡眠、饮食、压力触发点和情绪波动，必要时找线下专业支持",
    decision_timing: "先列出推进必须满足的三个条件，满足再行动，不满足就先谈条件或暂缓",
  }[intent.key] || (weakestElement ? `${elementExplain(weakestElement).action}` : "先做一个能拿到现实反馈的小动作");
}

function buildFortuneProfile(input) {
  const name = String(input.name || "").trim().slice(0, 24) || "有缘人";
  const gender = String(input.gender || "").trim().slice(0, 20) || "未填写";
  const question = String(input.question || "").trim().slice(0, 300) || "最近整体运势如何？";
  const focus = inferFocus(String(input.focus || "auto"), question);
  const birth = parseBirthDate(input.birthDate);
  const parsedHour = parseHour(input.birthTime);
  const trueSolarTime = buildTrueSolarCalibration(input, birth, parsedHour);
  const pillars = buildPillars(birth, parsedHour, trueSolarTime);
  const elements = buildElementWeights(pillars);
  const seed = hashSeed({
    name,
    gender,
    question,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    birthPlace: trueSolarTime.place?.name || input.birthPlace,
    trueSolarTime: trueSolarTime.applied ? trueSolarTime.correctedTime : false,
    focus,
  });
  const strongest = elements[0];
  const weakest = elements[elements.length - 1];
  const hexagrams = buildHexagrams(seed);
  const annualFlow = buildAnnualFlow(seed, new Date().getFullYear());
  const domains = buildDomainScores(seed, strongest, weakest, focus);
  const nayin = pillars.year?.naYin || NAYIN[Math.floor((pillars.year?.index || 0) / 2)];
  const focusLabel = FOCUS_LABELS[focus] || FOCUS_LABELS.overall;
  const questionIntent = inferQuestionIntent(question, focus);
  const sign = westernSign(birth.month, birth.day);
  const sixYao = buildSixYaoInsight(hexagrams, strongest, weakest, focusLabel);
  const psychology = buildPsychologyLens(strongest, weakest, focusLabel, question);
  const stellar = buildStellarInsight(sign, focusLabel);
  const userProfile = {
    name,
    gender,
    question,
    focus,
    focusLabel,
    questionIntent,
    birthDate: input.birthDate,
    birthTime: input.birthTime || "未知",
    birthPlace: trueSolarTime.place?.input || "",
    resolvedBirthPlace: trueSolarTime.place?.name || "",
    useTrueSolarTime: trueSolarTime.enabled,
  };
  const mysticSystems = buildMysticSystems({
    user: userProfile,
    pillars,
    elements,
    hexagrams,
    sixYao,
    psychology,
    stellar,
    annualFlow,
    domains,
    seed,
    focus,
    focusLabel,
    question,
    birth: { ...birth, hour: Number(parsedHour || 0) },
    trueSolarTime,
  });

  return {
    user: userProfile,
    meta: {
      generatedAt: new Date().toISOString(),
      engine: "命盘师 AI 命盘资料包 v0.6 / lunar-javascript + true solar time",
      accuracyNote: "四柱由 lunar-javascript 按公历时间与节气计算；如填写出生城市并启用真太阳时，会按出生地经度与均时差修正时间。当前版本未接入夏令时、海拔与人工校盘。",
      calendarEngine: pillars.engine,
      solarText: pillars.solarText,
      lunarText: pillars.lunarText,
      jieQi: pillars.jieQi,
      prevJieQi: pillars.prevJieQi,
      nextJieQi: pillars.nextJieQi,
      trueSolarTime: pillars.trueSolarTime,
    },
    western: {
      sign,
    },
    pillars: {
      year: pillarView(pillars.year),
      month: pillarView(pillars.month),
      day: pillarView(pillars.day),
      hour: pillars.hour ? pillarView(pillars.hour) : null,
      nayin,
      dayMaster: pillars.day.stem.name,
    },
    elements,
    relations: {
      strongest: strongest.element,
      weakest: weakest.element,
      generates: GENERATES[strongest.element],
      controls: CONTROLS[strongest.element],
    },
    hexagrams,
    sixYao,
    psychology,
    stellar,
    mysticSystems,
    trigrams: TRIGRAMS,
    annualFlow,
    domains,
    lucky: {
      color: pickBySeed(seed, "lucky-color", ["玄金", "松墨", "朱砂", "月白", "青黛", "古铜", "沉香褐"]),
      number: seededNumber(seed, "lucky-number", 1, 9),
      direction: pickBySeed(seed, "direction", ["东", "东南", "南", "西南", "西", "西北", "北", "东北"]),
      object: pickBySeed(seed, "object", ["一枚硬币", "一本黑色笔记本", "一盏暖灯", "一支顺手的笔", "一张清空的桌面", "一杯温茶"]),
    },
    seed: seed.slice(0, 12),
  };
}

function pillarView(pillar) {
  return {
    name: pillar.name,
    stem: pillar.stem.name,
    branch: pillar.branch.name,
    animal: pillar.branch.animal,
    element: `${pillar.stem.element}/${pillar.branch.element}`,
    polarity: `${pillar.stem.polarity}/${pillar.branch.polarity}`,
    image: pillar.stem.image,
    drive: pillar.stem.drive,
    hidden: pillar.branch.hidden,
    season: pillar.branch.season,
    naYin: pillar.naYin || "",
    wuXing: pillar.wuXing || "",
    shiShenGan: pillar.shiShenGan || "",
    shiShenZhi: pillar.shiShenZhi || [],
  };
}

function compactMysticSystemsForPrompt(mysticSystems = {}) {
  const layers = mysticSystems.layers || {};
  return {
    version: mysticSystems.version,
    policy: (mysticSystems.integrationPolicy || []).slice(0, 3),
    bazi: {
      dayMaster: layers.bazi?.dayMaster,
      spousePalace: layers.bazi?.spousePalace,
      elementBalance: layers.bazi?.elementBalance,
      tenGods: layers.bazi?.tenGods,
    },
    liuyao: layers.liuyao ? {
      yongshen: layers.liuyao.yongshen,
      line: layers.liuyao.line,
      lineTheme: layers.liuyao.lineTheme,
      plain: layers.liuyao.plain,
    } : undefined,
    meihua: layers.meihua ? {
      body: layers.meihua.body,
      use: layers.meihua.use,
      relation: layers.meihua.relation,
      trend: layers.meihua.trend,
    } : undefined,
    ziwei: layers.ziwei ? {
      lifePalaceHint: layers.ziwei.lifePalaceHint,
      focusPalaceHint: layers.ziwei.focusPalaceHint,
      fourTransformations: layers.ziwei.fourTransformations,
      plain: layers.ziwei.plain,
    } : undefined,
    qimen: layers.qimen ? {
      palace: layers.qimen.palace,
      door: layers.qimen.door,
      star: layers.qimen.star,
      deity: layers.qimen.deity,
      plain: layers.qimen.plain,
    } : undefined,
    yinyuan: layers.yinyuan,
    fengshui: layers.fengshui ? {
      weakElement: layers.fengshui.weakElement,
      directionHint: layers.fengshui.directionHint,
      plain: layers.fengshui.plain,
    } : undefined,
    tarot: layers.tarot ? {
      cards: layers.tarot.cards,
      plain: layers.tarot.plain,
    } : undefined,
    crossChecks: (mysticSystems.crossChecks || []).slice(0, 5),
    chatGuidance: (mysticSystems.chatGuidance || []).slice(0, 4),
  };
}

function compactProfileForPrompt(profile) {
  return {
    user: profile.user,
    meta: {
      generatedAt: profile.meta?.generatedAt,
      engine: profile.meta?.engine,
      trueSolarTime: profile.meta?.trueSolarTime,
      lunarText: profile.meta?.lunarText,
      jieQi: profile.meta?.jieQi,
    },
    western: profile.western,
    pillars: profile.pillars,
    elements: profile.elements,
    relations: profile.relations,
    hexagrams: profile.hexagrams,
    sixYao: profile.sixYao,
    psychology: profile.psychology,
    stellar: profile.stellar,
    mysticSystems: compactMysticSystemsForPrompt(profile.mysticSystems),
    annualFlow: profile.annualFlow,
    domains: profile.domains,
    lucky: profile.lucky,
  };
}

function compactFusionProfileForPrompt(profile) {
  const { user, pillars, elements, strongest, weakest, primary, changed, sixYao, psychology, stellar, mysticSystems, firstFlow, trueSolarTime } = reportContext(profile);
  const layers = mysticSystems.layers || {};
  return {
    user,
    anchors: profileAnchors(profile),
    trueSolarTime,
    fourPillars: {
      year: pillarLabel(pillars.year),
      month: pillarLabel(pillars.month),
      day: pillarLabel(pillars.day),
      hour: pillarLabel(pillars.hour),
      dayMaster: pillars.dayMaster || pillars.day?.stem || "",
    },
    elements,
    strongest,
    weakest,
    hexagram: {
      primary: primary.name || "",
      changed: changed.name || "",
      movement: sixYao.movement || "",
      lineTheme: sixYao.lineTheme || "",
    },
    psychology: {
      coreNeed: psychology.coreNeed || "",
      stressPattern: psychology.stressPattern || "",
      regulation: psychology.regulation || "",
      reflectionQuestion: psychology.reflectionQuestion || "",
    },
    stellar: {
      sign: stellar.sign || profile.western?.sign || "",
      gift: stellar.gift || "",
      shadow: stellar.shadow || "",
      practice: stellar.practice || "",
    },
    mysticLayers: [
      layers.bazi?.userQuestionAnchor ? `八字：${layers.bazi.userQuestionAnchor}` : "",
      layers.liuyao?.plain ? `六爻：${layers.liuyao.plain}` : "",
      layers.meihua?.plain ? `梅花：${layers.meihua.plain}` : "",
      layers.qimen?.plain ? `奇门：${layers.qimen.plain}` : "",
      layers.ziwei?.plain ? `紫微：${layers.ziwei.plain}` : "",
      layers.yinyuan?.active && layers.yinyuan?.plain ? `姻缘：${layers.yinyuan.plain}` : "",
      layers.tarot?.plain ? `塔罗：${layers.tarot.plain}` : "",
    ].filter(Boolean).slice(0, 4),
    crossChecks: (mysticSystems.crossChecks || []).slice(0, 3),
    annualFlow: firstFlow.year ? {
      year: firstFlow.year,
      ganzhi: firstFlow.ganzhi,
      theme: firstFlow.theme,
      score: firstFlow.score,
    } : null,
  };
}

function buildPrompt(profile) {
  const schema = {
    title: "命盘师 AI 命盘报告",
    plainSummary: "4 行以内的阅读前置结论。每行都要直接回答：结论、依据、风险、下一步；不要写成标题口号",
    summary: "160-220 字总论。先给结论，再点名日柱/月柱/时柱、五行强弱、卦象变爻和用户问题",
    tags: ["6-8 个关键词"],
    keyPoints: ["5-6 条命盘要点。每条先说现实含义，再括号补充具体命盘依据"],
    elementInsight: "140-190 字。把五行强弱翻译为现实能力，并说明最强最弱如何影响本次问题",
    domainReadings: [
      { key: "career/love/wealth/study/health", label: "中文名称", score: 80, reading: "80-120 字，必须贴合该领域，不要泛泛而谈" },
    ],
    annualFlow: [
      { year: 2026, theme: "主题", reading: "50-80 字，说明年份节奏、适合做什么、避免什么" },
    ],
    sections: [
      { title: "重点问题", body: "180-260 字。第一句必须直接回答用户该怎么看；后面讲命理依据、心理解释、现实行动、前置条件和时间窗口" },
      { title: "命盘主线", body: "100-150 字。说明这个人的盘面主线，不要套通用性格" },
      { title: "五行五维", body: "100-150 字。把五行强弱翻译成这次问题里的现实能力和短板" },
      { title: "卦象与变化点", body: "100-150 字。把本卦、变卦、动爻解释成处境、变化点和动作" },
      { title: "多术数交叉验证", body: "120-180 字。只结合最相关 2-3 个体系，说明共同指向和现实检验方式" },
      { title: "现实行动", body: "100-150 字。给出 7 天或 30 天内能执行的动作、观察指标和边界提醒" },
    ],
    advice: ["4-6 条具体行动建议，要能在 7 天或 30 天内执行"],
    counselingPrompts: ["2-3 个咨询式自我提问，用于复盘情绪、边界和价值选择"],
    lucky: { color: "颜色", number: 8, direction: "方向", object: "小物" },
    disclaimer: "娱乐向解读，不替代现实判断。",
  };

  return [
    "请基于以下结构化资料包生成产品报告。",
    "Kimi 的文字就是用户最终看到的正式报告，占内容权重 90% 以上；后端只会保留你的结论并补极少量缺失结构。",
    "要求：回答用户具体问题；不要编造真实外部数据；不要说自己无法算命；保持娱乐边界；输出严格 JSON。",
    "内容要丰富但不空泛，避免只说“稳步观察”“注意沟通”这类泛句。每个模块都要落到用户可以理解和执行的场景。",
    "不要把“白话总结”当标题卖点；要把所有内容写得像普通人能理解的解释。",
    "写法固定：先给结论，再说依据，再说行动。术语出现后立刻解释它代表的现实含义。",
    "如果 profile.meta.trueSolarTime.applied 为 true，必须在命盘总览或重点问题里简短说明排盘采用了真太阳时校正，并引用校正后的时间。",
    "如果 profile.mysticSystems 存在，必须输出“多术数交叉验证”章节；只选最相关的体系，不要把所有层逐条罗列。",
    "心理内容只做自我反思、情绪识别、边界澄清和行动建议，不做诊断，不替代心理治疗或线下专业支持。",
    "重点问题必须直接回应用户原话，每个判断都尽量写出：命盘依据、心理动力、现实检验方式。",
    "必须使用 personalizationAnchors 和 questionSpecificReadingSeed；不要把不同用户或不同问题写成同一套答案。",
    "如果同一个生日换了不同问题，报告重点必须明显变化：事业问筹码和行动窗口，复合问关系回应和边界，财运问现金流和风险，健康问节奏和支持。",
    "不要使用固定开场、固定结尾或固定 advice。每次都要围绕用户问题重新组织语言。",
    "禁止把 outputSchema 里的说明文字改写成正文；schema 只是格式要求，正文必须来自 profile 的排盘数据和用户原问题。",
    "不要反复使用“先小步验证、稳住节奏”作为万能结论；只有当问题意图和盘面依据支持时才使用。",
    "",
    JSON.stringify({ profile: compactProfileForPrompt(profile), outputSchema: schema }),
    "",
    "personalizationAnchors:",
    JSON.stringify(profileAnchors(profile), null, 2),
    "",
    "questionSpecificReadingSeed:",
    intentSpecificReading(profile),
  ].join("\n");
}

function apiConfig() {
  const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const requestedStyle = (process.env.OPENAI_API_STYLE || "").toLowerCase();
  const chatCompatible = requestedStyle === "chat" || baseUrl.includes("moonshot.cn");
  const provider = process.env.MODEL_PROVIDER || (/moonshot\.(cn|ai)/.test(baseUrl) ? "Kimi" : "OpenAI");
  const endpoint = chatCompatible
    ? (baseUrl.endsWith("/chat/completions") ? baseUrl : `${baseUrl}/chat/completions`)
    : (baseUrl.endsWith("/responses") ? baseUrl : `${baseUrl}/responses`);

  return {
    model,
    baseUrl,
    endpoint,
    provider,
    style: chatCompatible ? "chat" : "responses",
    endpointLabel: chatCompatible ? "Chat Completions API" : "Responses API",
  };
}

function extractOutputText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text.trim();

  const chatContent = payload.choices?.[0]?.message?.content;
  if (typeof chatContent === "string") return chatContent.trim();
  if (Array.isArray(chatContent)) {
    return chatContent
      .map((item) => (typeof item === "string" ? item : item.text || ""))
      .join("")
      .trim();
  }

  const chunks = [];
  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if ((content.type === "output_text" || content.type === "text") && content.text) {
        chunks.push(content.text);
      }
    }
  }
  return chunks.join("\n").trim();
}

function buildRequestPayload(config, profile, forcePlainText = false) {
  if (config.style === "chat") {
    const payload = {
      model: config.model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(profile) },
      ],
      max_tokens: Number(process.env.OPENAI_REPORT_MAX_TOKENS || 3600),
    };

    const isKimiK2 = config.provider === "Kimi" && /^kimi-k2\.(5|6)/.test(config.model);
    if (isKimiK2) {
      payload.thinking = { type: process.env.KIMI_THINKING || "disabled" };
    } else {
      payload.temperature = Number(process.env.MODEL_TEMPERATURE || 0.72);
    }

    if (!forcePlainText && (process.env.MODEL_RESPONSE_FORMAT || "json").toLowerCase() === "json") {
      payload.response_format = { type: "json_object" };
    }

    return payload;
  }

  const payload = {
    model: config.model,
    input: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildPrompt(profile) },
    ],
    max_output_tokens: Number(process.env.OPENAI_REPORT_MAX_TOKENS || 3600),
  };

  const effort = process.env.OPENAI_REASONING_EFFORT || "low";
  if (/^gpt-5/i.test(config.model) && effort !== "none") {
    payload.reasoning = { effort };
  }

  return payload;
}

function buildChatPrompt({ profile, report, history, message }) {
  const compactHistory = (history || [])
    .slice(-8)
    .map((item) => `${item.role === "assistant" ? "命盘师" : "用户"}：${item.content}`)
    .join("\n");

  return [
    "请基于以下命盘资料和历史对话，回答用户的新问题。",
    "",
    JSON.stringify({
      user: profile?.user,
      personalizationAnchors: profileAnchors(profile, message),
      questionSpecificReadingSeed: intentSpecificReading(profile, message),
      meta: profile?.meta,
      pillars: profile?.pillars,
      elements: profile?.elements,
      relations: profile?.relations,
      hexagrams: profile?.hexagrams,
      sixYao: profile?.sixYao,
      psychology: profile?.psychology,
      stellar: profile?.stellar,
      mysticSystems: profile?.mysticSystems,
      annualFlow: profile?.annualFlow,
      reportSummary: report?.summary,
      reportSections: report?.sections,
      reportAdvice: report?.advice,
    }, null, 2),
    "",
    "历史对话：",
    compactHistory || "暂无",
    "",
    `用户新问题：${message}`,
    "",
    [
      "请直接回答用户的新问题，不要重新生成整份报告。",
      "历史报告只当背景资料；本次回答必须根据用户新问题重新推理，不要复述报告原句，也不要沿用上次回答结构。",
      "请先按 personalizationAnchors.intent 判断问题类型，并围绕该类型切换分析重心。",
      "请用白话回答，像在认真给朋友解释，不要堆玄学术语；必须先给倾向性结论，再解释依据。",
      "不要固定输出【直接结论】【为什么这么看】等模板标题；可用自然段，也可用 2-4 个短标题，但标题要贴合本次问题。",
      "回答中必须明确引用至少 3 个具体资料点，例如：日柱/日主、月柱或时柱十神、五行最强最弱、本卦变卦/动爻、流年主题、mysticSystems 的相关层。",
      "不能只说“你的命盘显示”“适合小步验证”。要说清楚：这个人的哪一柱、哪一类五行、哪一个卦象变化，为什么会落到这个问题上。",
      "如果用户问“该不该/能不能/会不会/什么时候”，要给出偏向判断和前置条件，不要只说看情况。",
      "如果用户问感情，必须落到关系回应、边界、沟通或止损；如果问事业，必须落到筹码、岗位、行动窗口或谈判；如果问财运，必须落到现金流、合约、试错额度和风险边界。",
      "建议要具体到场景、话术、观察指标或时间窗口；不要空泛说“多沟通、稳一点、提升自己”。",
      "不要诊断，不做确定性命运断言；涉及钱、健康、重大关系时提醒用户用现实证据复核。",
    ].join("\n"),
  ].join("\n");
}

function buildChatRequestPayload(config, input) {
  const userPrompt = buildChatPrompt(input);
  if (config.style === "chat") {
    const payload = {
      model: config.model,
      messages: [
        { role: "system", content: CHAT_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_tokens: Number(process.env.OPENAI_CHAT_MAX_TOKENS || 1800),
    };

    const isKimiK2 = config.provider === "Kimi" && /^kimi-k2\.(5|6)/.test(config.model);
    if (isKimiK2) {
      payload.thinking = { type: process.env.KIMI_THINKING || "disabled" };
    } else {
      payload.temperature = Number(process.env.MODEL_TEMPERATURE || 0.72);
    }

    return payload;
  }

  const payload = {
    model: config.model,
    input: [
      { role: "system", content: CHAT_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_output_tokens: Number(process.env.OPENAI_CHAT_MAX_TOKENS || 1800),
  };

  const effort = process.env.OPENAI_REASONING_EFFORT || "low";
  if (/^gpt-5/i.test(config.model) && effort !== "none") {
    payload.reasoning = { effort };
  }
  return payload;
}

async function postModelRequest(config, apiKey, payload, options = {}) {
  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs || process.env.MODEL_REQUEST_TIMEOUT_MS || 60_000);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(config.endpoint, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } finally {
    clearTimeout(timeout);
  }
}

function parseReport(text, profile) {
  const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return normalizeReport(JSON.parse(cleaned), profile);
  } catch (error) {
    return normalizeReport({
      title: "命盘师 AI 命盘报告",
      summary: cleaned.slice(0, 500),
      tags: [profile.hexagrams.primary.name, profile.relations.strongest, profile.user.focusLabel],
      keyPoints: profile.hexagrams.primary.name ? [`本卦为${profile.hexagrams.primary.name}`, `五行偏重${profile.relations.strongest}`, "报告文本已保留原始输出"] : [],
      elementInsight: "模型输出不是严格 JSON，已以文本方式展示。",
      domainReadings: profile.domains,
      annualFlow: profile.annualFlow.map((item) => ({ year: item.year, theme: item.theme, reading: `${item.ganzhi}，${item.score} 分` })),
      sections: [{ title: "原始解读", body: cleaned }],
      advice: ["把报告当作反思线索，不替代现实判断。"],
      lucky: profile.lucky,
      disclaimer: "娱乐向解读，不替代现实判断。",
    }, profile);
  }
}

function normalizeReportBrand(report) {
  if (!report || typeof report !== "object") return report;
  if (!report.title || String(report.title).includes("玄策")) {
    report.title = "命盘师 AI 命盘报告";
  }
  return report;
}

function uniqueItems(items) {
  return [...new Set((items || []).map((item) => String(item || "").trim()).filter(Boolean))];
}

function ensureRichText(text, additions, minLength = 140) {
  const parts = [String(text || "").trim(), ...additions.map((item) => String(item || "").trim())]
    .map(softenSensitiveText)
    .filter(Boolean);
  let output = "";
  for (const part of parts) {
    if (!output.includes(part)) output = output ? `${output}${/[。！？]$/.test(output) ? "" : "。"}${part}` : part;
    if (output.length >= minLength) break;
  }
  return output || additions.filter(Boolean).join("");
}

function softenSensitiveText(text) {
  return String(text || "")
    .replace(/可能影响[^，。；]*(消化系统|心脏|肝脏|肠胃|疾病)[^，。；]*/g, "可能让生活节奏和恢复感变弱")
    .replace(/注意饮食健康/g, "注意生活节奏")
    .replace(/保持身心健康/g, "保持稳定状态");
}

const ELEMENT_EXPLAIN = {
  木: {
    ability: "计划、成长、学习和把事情往前推的弹性",
    excess: "想法多、标准变动快，容易一边规划一边焦虑",
    lack: "方向感、持续学习或适应变化的弹性需要补",
    action: "把目标拆成清单，每周固定复盘一次",
  },
  火: {
    ability: "表达、行动热度、被看见和快速启动的能力",
    excess: "容易着急、情绪上头，想马上看到结果",
    lack: "动力、表达欲或主动争取机会的能量需要补",
    action: "先做一个小的公开行动，比如沟通、投递、展示作品",
  },
  土: {
    ability: "稳定、承接、责任感和把事情落地的能力",
    excess: "容易背太多责任，想把所有不确定都扛住",
    lack: "稳定感、生活节奏或长期承接能力需要补",
    action: "先固定作息、预算和工作边界，让底盘稳下来",
  },
  金: {
    ability: "规则、边界、判断力、复盘和取舍能力",
    excess: "容易挑剔、紧绷，过度追求标准答案",
    lack: "边界、复盘、谈判和做取舍的能力需要补",
    action: "写清楚底线、成本、风险和可接受结果",
  },
  水: {
    ability: "信息流动、观察、沟通、情绪调节和转弯能力",
    excess: "容易想太多、摇摆，信息越多越难决定",
    lack: "沟通、信息整合、休息恢复或情绪流动需要补",
    action: "先减少噪音，找一个可信反馈源做现实校验",
  },
  五行: {
    ability: "你比较容易调动的现实能力",
    excess: "某种惯性被放大，容易用力过度",
    lack: "某个现实能力需要补足",
    action: "把问题拆成一个能验证的小动作",
  },
};

function elementExplain(element) {
  return ELEMENT_EXPLAIN[element] || ELEMENT_EXPLAIN.五行;
}

function elementPlainLine(item = {}, mode = "ability") {
  const element = item.element || "五行";
  const percent = Number(item.percent || 0);
  const detail = elementExplain(element);
  const suffix = percent ? `（${percent}%）` : "";
  return `${element}${suffix}代表${detail[mode] || detail.ability}`;
}

function reportContext(profile) {
  const user = profile.user || {};
  const pillars = profile.pillars || {};
  const elements = profile.elements || [];
  const strongest = elements[0] || { element: profile.relations?.strongest || "五行", percent: 0 };
  const weakest = elements[elements.length - 1] || { element: profile.relations?.weakest || "五行", percent: 0 };
  const primary = profile.hexagrams?.primary || {};
  const changed = profile.hexagrams?.changed || {};
  const sixYao = profile.sixYao || {};
  const psychology = profile.psychology || {};
  const stellar = profile.stellar || {};
  const mysticSystems = profile.mysticSystems || {};
  const firstFlow = profile.annualFlow?.[0] || {};
  const trueSolarTime = profile.meta?.trueSolarTime || {};
  return { user, pillars, elements, strongest, weakest, primary, changed, sixYao, psychology, stellar, mysticSystems, firstFlow, trueSolarTime };
}

function pillarLabel(pillar = {}) {
  const hidden = Array.isArray(pillar.hidden) && pillar.hidden.length ? `藏干${pillar.hidden.join("")}` : "";
  const tenGod = [pillar.shiShenGan, ...(Array.isArray(pillar.shiShenZhi) ? pillar.shiShenZhi : [])].filter(Boolean).join("/");
  return [pillar.name, pillar.wuXing || pillar.element, tenGod ? `十神${tenGod}` : "", hidden].filter(Boolean).join("，");
}

function profileAnchors(profile = {}, message = "") {
  const { user, pillars, strongest, weakest, primary, changed, sixYao, psychology, stellar, mysticSystems, firstFlow, trueSolarTime } = reportContext(profile);
  const intent = inferQuestionIntent(message || user.question || "", user.focus);
  const layers = mysticSystems.layers || {};
  return {
    question: message || user.question || "",
    intent,
    fourPillars: {
      year: pillarLabel(pillars.year),
      month: pillarLabel(pillars.month),
      day: pillarLabel(pillars.day),
      hour: pillarLabel(pillars.hour),
      dayMaster: pillars.dayMaster || pillars.day?.stem || "",
    },
    elementContrast: `${elementPlainLine(strongest, "ability")}；${elementPlainLine(weakest, "lack")}。`,
    hexagramSignal: `${primary.name || "本卦"} -> ${changed.name || "变卦"}；${sixYao.movement || ""}；动爻主题：${sixYao.lineTheme || "未定"}。`,
    timingSignal: firstFlow.year ? `${firstFlow.year} 年 ${firstFlow.ganzhi || ""}，主题：${firstFlow.theme || ""}` : "",
    psychologySignal: `核心需要：${psychology.coreNeed || "未定"}；压力模式：${psychology.stressPattern || "未定"}；调节方式：${psychology.regulation || "未定"}。`,
    stellarSignal: stellar.sign ? `${stellar.sign}：优势${stellar.gift || "未定"}，压力影子${stellar.shadow || "未定"}。` : "",
    relevantMysticLayers: [
      layers.bazi?.userQuestionAnchor ? `八字：${layers.bazi.userQuestionAnchor}` : "",
      layers.liuyao?.plain ? `六爻：${layers.liuyao.plain}` : "",
      layers.meihua?.plain ? `梅花：${layers.meihua.plain}` : "",
      layers.qimen?.plain ? `奇门：${layers.qimen.plain}` : "",
      layers.yinyuan?.active && layers.yinyuan?.plain ? `姻缘：${layers.yinyuan.plain}` : "",
      layers.tarot?.plain ? `塔罗：${layers.tarot.plain}` : "",
    ].filter(Boolean).slice(0, 4),
    trueSolarTime: trueSolarTime.applied ? `已按${trueSolarTime.place?.name || "出生地"}真太阳时 ${trueSolarTime.correctedTime} 校正。` : "",
  };
}

function intentSpecificReading(profile = {}, message = "") {
  const anchors = profileAnchors(profile, message);
  const { user, pillars, strongest, weakest, primary, changed, sixYao, psychology, firstFlow } = reportContext(profile);
  const question = message || user.question || "当前问题";
  const dayMaster = pillars.dayMaster || pillars.day?.stem || "日主";
  const month = pillars.month?.name || "月柱";
  const day = pillars.day?.name || "日柱";
  const hour = pillars.hour?.name || "时柱";
  const base = `你问的是“${question}”，系统识别为${anchors.intent.label}。这类问题不能只看整体运势，要重点看${anchors.intent.evidenceFocus}。你的盘面里，日柱${day}、月柱${month}、时柱${hour}，${dayMaster}日主；${anchors.elementContrast}${anchors.hexagramSignal}`;
  const yearWindow = firstFlow.year ? `流年上，${firstFlow.year} 年主题为${firstFlow.theme}，更适合把判断落到一个具体窗口。` : "";
  const risk = `心理层面最容易被${psychology.stressPattern || "不确定感"}带偏，所以判断时要区分“我真正想要什么”和“我只是想缓解焦虑”。`;

  const map = {
    career_move: `事业变动上，更关键的不是立刻跳不跳，而是你有没有谈判筹码和可见成果。${strongest.element}强说明你有一块容易调用的能力，但${weakest.element}弱会让承接、边界或复盘拖后腿；所以更适合先整理成果、试投或谈条件，再决定是否正式离开。${sixYao.lineTheme ? `动爻落在${sixYao.lineTheme}，这通常对应当下要先处理的职场环节。` : ""}${yearWindow}`,
    love_reconcile: `复合问题上，不要只看“他/她会不会回来”，而要看关系是否还有稳定回应。日支${pillars.day?.branch || ""}是长期相处位，配合${primary.name || "本卦"}到${changed.name || "变卦"}，更像是关系会被沟通方式和边界改变。适合先用一次低压沟通确认对方是否愿意承担关系成本；如果只给情绪、不改行动，就要设止损线。`,
    love_future: `姻缘问题上，重点不是“有没有桃花”，而是你适合筛选什么样的人。${dayMaster}日主配合${strongest.element}/${weakest.element}的五行差异，说明你在关系里一边需要${psychology.coreNeed || "稳定回应"}，一边要避免被${psychology.stressPattern || "不安感"}推着走。可观察对方是否稳定回应、是否尊重边界、是否能一起处理现实安排。`,
    wealth_choice: `财运和资源选择上，先守底盘，再做试错。${strongest.element}强是可用优势，${weakest.element}弱是风险来源；如果现在要投资、副业或合作，适合先设试错额度和退出条件。${primary.name || "本卦"}变${changed.name || "变卦"}提示局面会动，但不是越动越好，关键是现金流、合约和责任边界要写清楚。`,
    study_exam: `学习考试上，重点是方法和节奏，而不是单纯靠意志硬撑。${month}反映当下环境压力，${hour}看长期规划；${strongest.element}能帮你启动，${weakest.element}则提示最容易漏掉的习惯。建议把目标拆成每日输出、错题/作品复盘和一周一次模拟反馈。`,
    health_rhythm: `身心节奏上，这份盘不做医疗判断，但能提醒你压力如何影响选择。${weakest.element}弱说明恢复、秩序或情绪流动需要补，${psychology.stressPattern || "压力模式"}会让你在疲惫时更容易把事情想绝。先把睡眠、饮食、信息摄入和沟通边界稳定下来；若长期不适，优先找线下专业支持。`,
    decision_timing: `选择和时机上，卦象比五行更关键：${primary.name || "本卦"}到${changed.name || "变卦"}说明事情有变化点，${sixYao.lineTheme || "动爻位置"}就是先要处理的环节。现在更适合先确认前置条件：资源是否够、对方是否回应、最坏结果能否承受，再决定推进或暂缓。`,
  };

  return [base, map[anchors.intent.key] || `${anchors.intent.answerMode}。${anchors.intent.actionFrame}。${yearWindow}`, risk].filter(Boolean).join("\n");
}

function buildPlainSummary(profile = {}) {
  const { user, pillars, strongest, weakest, primary, changed, sixYao, psychology, firstFlow, trueSolarTime } = reportContext(profile);
  const focus = user.focusLabel || "当前问题";
  const question = user.question ? `你问的“${user.question}”` : focus;
  const dayMaster = pillars.dayMaster || pillars.day?.stem || "";
  const intent = user.questionIntent || inferQuestionIntent(user.question || "", user.focus);
  const strongText = elementPlainLine(strongest, "ability");
  const weakText = elementPlainLine(weakest, "lack");
  const nextAction = intentActionText(intent, weakest.element);
  const realityCheck = intentRealityCheck(intent);
  const hexagram = primary.name && changed.name ? `${primary.name}变${changed.name}` : (sixYao.movement || "卦象变化");
  const flow = firstFlow.year ? `${firstFlow.year}年适合分阶段处理` : "近期先围绕当前问题建立一个清晰反馈窗口";
  const solar = trueSolarTime.applied ? `本盘已按${trueSolarTime.place?.name || "出生地"}真太阳时校正。` : "";
  return [
    `结论：${question}属于${intent.label}，重点不是套整体运势，而是看${intent.evidenceFocus}。${dayMaster ? `${dayMaster}日主是你的判断底色。` : ""}`,
    `盘面依据：${strongText}；${weakText}。${hexagram ? `卦象为${hexagram}，动点在${sixYao.lineTheme || "变化位置"}。` : ""}`,
    `注意：这类问题容易被${psychology.stressPattern || "不确定感和急于求结果"}带偏，所以要看${realityCheck}。`,
    `下一步：${nextAction}。${flow}。${solar}`,
  ].map((line) => line.trim()).filter(Boolean).join("\n");
}

function mysticSynthesisText(profile) {
  const mystic = profile.mysticSystems || {};
  const layers = mystic.layers || {};
  const crossChecks = Array.isArray(mystic.crossChecks) ? mystic.crossChecks : [];
  const selected = [
    layers.bazi?.elementBalance?.plain ? `八字看底盘：${layers.bazi.elementBalance.plain}` : "",
    layers.liuyao?.plain ? `六爻看事件：${layers.liuyao.plain}` : "",
    layers.meihua?.plain ? `梅花看体用：${layers.meihua.plain}` : "",
    layers.qimen?.plain ? `奇门看行动：${layers.qimen.plain}` : "",
    layers.yinyuan?.active && layers.yinyuan?.plain ? `姻缘看关系：${layers.yinyuan.plain}` : "",
    layers.fengshui?.plain ? `风水看环境：${layers.fengshui.plain}` : "",
    layers.tarot?.plain ? `塔罗作心理镜像：${layers.tarot.plain}` : "",
  ].filter(Boolean);
  return ensureRichText("", [
    selected.slice(0, 4).join("；"),
    crossChecks.slice(0, 3).join("；"),
    "这些体系只取共同方向：先看底盘强弱，再看事件变化，最后回到现实行动。若各体系提示不一致，以现实证据和用户当下状态为准，不把任何单一术数当成绝对结论。",
  ], 220);
}

function domainFallback(profile, domain, existing = "") {
  const { user, strongest, weakest, primary, sixYao, psychology } = reportContext(profile);
  const map = {
    career: `事业上，${strongest.element}能量较显，适合把能力做成作品、案例或明确流程。${sixYao.movement || primary.name || "卦象"}提示机会不只在“换不换”，而在筹码是否可见、资源是否到位。心理动因上，你可能更在意${psychology.coreNeed || "价值感和确定性"}，风险是压力上来时急于证明自己。建议先列出可展示成果、谈判底线和 30 天试探动作，再判断跳槽、转岗或合作是否值得推进。`,
    love: `感情与人际上，${primary.name || "本卦"}提醒你先看互动是否长期稳定，${sixYao.lineName || "动爻"}对应的${sixYao.lineTheme || "变化位置"}说明关系的关键不一定是对方一句话，而是你们如何处理期待和边界。机会来自真诚沟通与共同目标，风险是把一时情绪当成结论。建议把需要、担心、底线分开说，少用试探，多看对方是否能持续回应。`,
    wealth: `财运与资源上，${strongest.element}旺说明你更适合凭专业、标准或稳定交付积累收入。机会在长期复利与资源整合，风险是用短期收益缓解不安。若${weakest.element}偏弱，代表资源盘点、现金流边界或恢复节奏需要补足。建议把必要支出、可尝试预算和不可碰底线分开，先守住底盘，再用小额试错验证新机会。`,
    study: `学习成长上，命盘适合用结构化方式吸收知识。${sixYao.lineTheme || "动爻位置"}提示你现在最需要处理的是行动阻力、环境支持或收束复盘中的一环。机会在证书、作品集、复盘笔记和阶段性目标，风险是兴趣太散导致难以沉淀。建议把一个主题连续推进 30 天，每周用可检查成果代替“我有没有努力”的模糊评价。`,
    health: `身心节奏上，${weakest.element}较弱提示你需要补足休息、饮食、运动或环境秩序。这里不做医疗判断，只提醒压力容易来自节奏失衡和长期紧绷。心理上可记录触发事件、自动想法、情绪强度与可选行动，避免在疲惫时做重大决定。建议固定睡眠边界，减少临时加码，把恢复力当成长期运势的一部分。`,
  };
  return ensureRichText(existing, [map[domain.key] || `${domain.label}需要结合当前目标稳步观察，先看资源、节奏、心理动因和现实反馈，再做下一步选择。`], 150);
}

function sectionFallback(profile, title, existing = "") {
  const existingText = String(existing || "").trim();
  if (existingText.length >= (title === "重点问题" ? 160 : 80)) {
    return softenSensitiveText(existingText);
  }

  const { user, pillars, strongest, weakest, primary, changed, sixYao, psychology, stellar, firstFlow, trueSolarTime } = reportContext(profile);
  const dayMaster = pillars.dayMaster || pillars.day?.stem || "日主";
  const solarNote = trueSolarTime.applied
    ? `本次以${trueSolarTime.place?.name || "出生地"}真太阳时 ${trueSolarTime.correctedTime} 起盘，较填写时间${formatOffset(trueSolarTime.offsetMinutesExact)}。`
    : "";
  const strongestPlain = elementPlainLine(strongest, "ability");
  const weakestPlain = elementPlainLine(weakest, "lack");
  const templates = {
    命盘总览: `${solarNote}这份命盘最核心的意思是：你不是没有机会，而是要先把节奏、边界和可验证的成果做出来。${dayMaster}日主代表你的底色，${strongestPlain}；${weakestPlain}。${primary.name || "本卦"}到${changed.name || "变卦"}的提示，用人话说就是局面会变，但变化来自你怎么沟通、怎么准备、怎么收束，而不是等一个绝对答案。`,
    五行能量: `五行不是神秘标签，而是在说你处理事情时哪些能力容易出来、哪些能力要刻意补。当前${strongestPlain}，这是优势；但${weakestPlain}，这是短板。心理上，优势会让你更想用熟悉方式解决问题，短板则容易表现为${psychology.stressPattern || "压力下急着要答案或失去节奏"}。补足方向不是迷信颜色或物件，而是补现实能力：${elementExplain(weakest.element).action}。`,
    六爻卦象: `${sixYao.movement || `${primary.name || "本卦"}之${changed.name || "变卦"}`}，如果翻译成人话，就是“现在的局面不是固定的，中间有一个能被你推动的变化点”。动在${sixYao.lineName || "动爻"}，主题落在${sixYao.lineTheme || "变化位置"}，说明你不要只问“成不成”，而要先看哪一步能改变反馈。建议把问题拆成：我能做什么、对方/环境能回应什么、下一次反馈看什么。`,
    多术数交叉验证: mysticSynthesisText(profile),
    星术参照: `${stellar.sign || profile.western?.sign || "星术参照"}带来的侧影是${stellar.gift || "观察力与适应力"}，压力下可能${stellar.shadow || "节奏不稳"}。它不决定命运，但能帮助你理解自己的表达方式和压力反应。放在${user.focusLabel || "当前重点"}里，建议采用“${stellar.practice || "先稳定节奏，再做选择"}”的策略，让星术参照服务于现实行动。`,
    心理动力: `从咨询式自我反思看，你当前更深的需要可能是${psychology.coreNeed || "安全感、价值感或方向感"}，压力模式容易表现为${psychology.stressPattern || "把不确定感放大"}。建议使用“触发事件-自动想法-情绪强度-身体感受-可选择行动”的链路复盘，不急着给自己贴标签。边界上，要区分你能控制的行动、你能协商的关系、以及你需要允许其不确定的结果。可以问自己：${psychology.reflectionQuestion || "我真正想守住的价值是什么？"}`,
    事业与学业: `事业与学业上，适合把抽象能力沉淀为作品、流程、证书或案例。若考虑跳槽、升职、转型，先确认你手里是否有可展示成果和谈判筹码。${sixYao.lineTheme ? `动爻落在${sixYao.lineTheme}，提醒你先处理这一层的阻力。` : ""}${user.question ? `围绕“${user.question}”，` : ""}更建议先做准备窗口，再选择行动窗口。`,
    感情与人际: `关系里要少猜测，多看稳定回应。${primary.name || "卦象"}强调互动的持续性，${changed.name || "变卦"}则提醒变化会来自沟通方式和边界。心理上要把“我感到不安”和“对方一定如何”分开，先表达自己的需要，再观察对方是否愿意共同承担关系成本。适合主动表达真实需求，但不宜用情绪压迫对方给出立刻承诺。`,
    财运与资源: `财运部分更偏向“资源管理”而不是突发暴富。适合通过专业能力、长期客户、稳定项目或副业试水积累收入。心理风险在于用消费、冲动投资或过度承诺来缓解焦虑；现实风险在于高估短期收益、低估时间成本。建议先做预算边界，再把小规模尝试变成可复盘数据。`,
    身心与节奏: `身心状态与节奏直接影响判断力。${weakest.element}较弱时，容易在疲惫、焦虑或信息过载时做决定。建议把休息、运动、饮食和工作边界当作基础配置，并用${psychology.regulation || "稳定节奏"}作为日常调节方向；涉及身体问题请以专业医疗意见为准。`,
    重点问题: intentSpecificReading(profile),
    趋吉避凶: `趋吉避凶的关键，是把命盘提示转化为现实动作：强项要形成稳定输出，弱项要补足机制；重要决定要留缓冲期；涉及金钱、健康和长期关系时，不把单次解读当成依据。每次行动前可自问：我现在的选择来自事实、价值，还是来自焦虑？我能做的最小验证是什么？用报告做自我复盘，会比追求绝对答案更有价值。`,
  };
  const expansions = {
    命盘总览: [
      `现实落点是：先把当下局面分为可控、可协商、不可控三类。可控部分用${strongest.element}的优势主动推进，不可控部分用${weakest.element}的补足方式降低内耗。`,
      `这会让报告从“看运气”变成“看结构”：你既看到天赋惯性，也看到可以训练的部分。`,
    ],
    五行能量: [
      `具体到行动上，强项不要只靠天赋消耗，要变成流程、作品或稳定习惯；弱项也不必焦虑，可以用环境设计来补，比如固定复盘、设置边界、减少临时决策。`,
    ],
    六爻卦象: [
      `若把六爻看成一张问题地图，${sixYao.lineName || "动爻"}就是当前最需要移动的节点。先处理这个节点，再观察外部反馈，会比同时处理所有变量更稳。`,
      `当反馈出现时，再回到变卦看下一步，不必一次性要求自己得到终局答案。`,
    ],
    星术参照: [
      `所以星术部分更适合当作“自我观察工具”：当你想快速下判断时，先看自己是出于天赋优势在行动，还是被压力阴影推着走。`,
      `把它放进日常，就是在表达前多一次觉察，在行动前多一次节奏校准。`,
    ],
    心理动力: [
      `这不是诊断，而是帮助你把内在反应说清楚。越能说清楚情绪和需要，越不容易把关系、工作或金钱选择变成单纯的逃避或证明。`,
    ],
    事业与学业: [
      `接下来最适合做的是建立一个小型验证周期：选一个明确目标，连续 7 到 30 天产出可展示结果，再用结果判断是否扩大投入。`,
      `这样能把焦虑转成证据，也能让贵人、机会和谈判空间更容易出现。`,
    ],
    感情与人际: [
      `如果关系让你反复消耗，先记录事实而不是猜测动机：对方做了什么、你感到什么、你提出了什么、对方是否愿意回应，这四项比情绪推演更可靠。`,
    ],
    财运与资源: [
      `财务决策尤其需要边界：先确定不可动用的钱，再确定可试错的钱。任何让你必须立刻决定、无法复盘成本的机会，都要放慢一步。`,
      `资源越清楚，行动越不容易被情绪带跑；这就是财运里最现实的“守”。`,
    ],
    身心与节奏: [
      `当状态变差时，不要急着解释为运势不好，先检查睡眠、饮食、工作密度和信息摄入。节奏稳定后，判断力通常会更接近真实。`,
      `如果长期不适或压力明显影响生活，优先寻求线下专业支持。`,
    ],
    重点问题: [
      `如果你问的是“现在要不要行动”，答案更偏向先做小步验证：用一次沟通、一次投递、一次预算表或一次试运行来取得现实证据。`,
      `如果你问的是“结果会不会好”，报告更建议把注意力放回过程：你能否持续输出、能否守住边界、能否在反馈不完美时继续调整。`,
    ],
    趋吉避凶: [
      `把它落实为清单：一件事先写目标，一件事先写风险，一件事先找外部反馈。不要用神秘感替代证据，也不要用焦虑替代行动。`,
    ],
  };
  const minimumLength = title === "重点问题" ? 260 : title === "心理动力" ? 220 : 190;
  return ensureRichText(existing, [templates[title], ...(expansions[title] || [])], minimumLength);
}

function cleanReportText(text, maxLength = 1200) {
  return softenSensitiveText(String(text || "").trim())
    .replace(/\n{3,}/g, "\n\n")
    .slice(0, maxLength);
}

function hasReportText(text, minLength = 32) {
  return cleanReportText(text).length >= minLength;
}

function normalizeReportTextList(items, limit = 6, maxLength = 240) {
  return uniqueItems(Array.isArray(items) ? items : [])
    .map((item) => cleanReportText(item, maxLength))
    .filter(Boolean)
    .slice(0, limit);
}

function compactSectionTitle(title = "") {
  const value = String(title || "").trim();
  return {
    命盘总览: "命盘主线",
    五行能量: "五行五维",
    六爻卦象: "卦象与变化点",
    趋吉避凶: "现实行动",
  }[value] || value || "核心解读";
}

function structuredReportAnchor(profile = {}) {
  const { user, pillars, strongest, weakest, primary, changed, sixYao, firstFlow, trueSolarTime } = reportContext(profile);
  return [
    user.question ? `用户问题：${user.question}` : "",
    `四柱：年${pillars.year?.name || "--"}、月${pillars.month?.name || "--"}、日${pillars.day?.name || "--"}、时${pillars.hour?.name || "待填写"}`,
    `日主：${pillars.dayMaster || pillars.day?.stem || "--"}`,
    `五行：${(profile.elements || []).map((item) => `${item.element}${item.percent}%`).join(" / ") || "--"}`,
    `强弱：${strongest.element || "--"}偏强，${weakest.element || "--"}需补`,
    primary.name || changed.name ? `卦象：${primary.name || "--"} -> ${changed.name || "--"}${sixYao.lineTheme ? `，动点${sixYao.lineTheme}` : ""}` : "",
    firstFlow.year ? `流年：${firstFlow.year} ${firstFlow.ganzhi || ""}，${firstFlow.theme || ""}` : "",
    trueSolarTime.applied ? `真太阳时：${trueSolarTime.place?.name || "出生地"} ${trueSolarTime.correctedTime}` : "",
  ].filter(Boolean).join("；");
}

function compactElementReport(profile = {}) {
  const { strongest, weakest } = reportContext(profile);
  const elements = (profile.elements || []).map((item) => `${item.element}${item.percent}%`).join("、");
  return `五维数据为${elements || "待计算"}。${elementPlainLine(strongest, "ability")}；${elementPlainLine(weakest, "lack")}。这里仅说明能力分布，具体判断以上方 Kimi 解读为准。`;
}

function compactDomainReading(profile = {}, domain = {}) {
  const { user } = reportContext(profile);
  const intent = user.questionIntent || inferQuestionIntent(user.question || "", user.focus);
  return `${domain.label || "该领域"}指数 ${domain.score || 0}。本项只保留结构分值，核心判断围绕“${intent.label}”和用户原问题展开。`;
}

function compactFlowReading(profile = {}, flow = {}) {
  const { user } = reportContext(profile);
  return `${flow.year} 年${flow.ganzhi ? `为${flow.ganzhi}` : ""}，主题是${flow.theme || "阶段推进"}。围绕${user.focusLabel || "当前问题"}，更适合看现实反馈和阶段窗口。`;
}

function normalizeReport(report, profile) {
  const normalized = normalizeReportBrand(report && typeof report === "object" ? { ...report } : {});
  const { user, pillars, strongest, weakest, primary, sixYao, mysticSystems, firstFlow, trueSolarTime } = reportContext(profile);
  const intent = user.questionIntent || inferQuestionIntent(user.question || "", user.focus);
  const rawSections = Array.isArray(normalized.sections) ? normalized.sections : [];
  const hasModelReport = [
    normalized.plainSummary,
    normalized.summary,
    normalized.elementInsight,
    ...rawSections.map((item) => item?.body),
    ...(Array.isArray(normalized.advice) ? normalized.advice : []),
  ].some((text) => hasReportText(text, 36));
  const anchor = structuredReportAnchor(profile);

  normalized.title = normalized.title || "命盘师 AI 命盘报告";
  normalized.summary = cleanReportText(
    normalized.summary || (hasModelReport
      ? normalized.plainSummary
      : `Kimi 暂时没有返回完整正式报告。已完成确定性排盘：${anchor}`),
    800,
  );
  normalized.plainSummary = cleanReportText(
    normalized.plainSummary || (hasModelReport
      ? normalized.summary
      : `本次正式解读未完成，请稍后重新生成。\n${anchor}`),
    520,
  );

  normalized.tags = uniqueItems([
    ...(Array.isArray(normalized.tags) ? normalized.tags.filter((tag) => tag !== "排盘资料包") : []),
    hasModelReport ? "Kimi主导" : "待重试",
    intent.label,
    user.focusLabel,
    primary.name,
    sixYao.lineName ? `六爻${sixYao.lineName}` : "",
    mysticSystems.version ? "多术数交叉" : "",
    trueSolarTime.applied ? "真太阳时" : "",
    `${strongest.element || "五行"}旺`,
    `${weakest.element || "五行"}需补`,
    firstFlow.theme,
  ]).slice(0, 8);

  const modelKeyPoints = normalizeReportTextList(normalized.keyPoints, 8, 260);
  const anchorKeyPoints = [
    `四柱锚点：年柱${pillars.year?.name || "--"}、月柱${pillars.month?.name || "--"}、日柱${pillars.day?.name || "--"}、时柱${pillars.hour?.name || "待填写"}。`,
    `五行锚点：${elementPlainLine(strongest, "ability")}；${elementPlainLine(weakest, "lack")}。`,
    primary.name ? `卦象锚点：${primary.name}${profile.hexagrams?.changed?.name ? `变${profile.hexagrams.changed.name}` : ""}${sixYao.lineTheme ? `，动点在${sixYao.lineTheme}` : ""}。` : "",
    firstFlow.year ? `流年锚点：${firstFlow.year} 年${firstFlow.ganzhi || ""}，主题为${firstFlow.theme || "阶段变化"}。` : "",
  ];
  normalized.keyPoints = uniqueItems([...modelKeyPoints, ...anchorKeyPoints]).slice(0, hasModelReport ? 6 : 5);

  normalized.elementInsight = cleanReportText(normalized.elementInsight, 700) || compactElementReport(profile);

  const aiDomains = new Map((Array.isArray(normalized.domainReadings) ? normalized.domainReadings : []).map((item) => [item.key, item]));
  normalized.domainReadings = (profile.domains || []).map((domain) => {
    const ai = aiDomains.get(domain.key) || {};
    const reading = cleanReportText(ai.reading, 320);
    return {
      key: domain.key,
      label: ai.label || domain.label,
      score: Number(ai.score || domain.score || 0),
      reading: hasReportText(reading, 24) ? reading : compactDomainReading(profile, domain),
    };
  });

  const aiFlow = new Map((Array.isArray(normalized.annualFlow) ? normalized.annualFlow : []).map((item) => [Number(item.year), item]));
  normalized.annualFlow = (profile.annualFlow || []).map((flow) => {
    const ai = aiFlow.get(Number(flow.year)) || {};
    const reading = cleanReportText(ai.reading, 260);
    return {
      year: flow.year,
      theme: ai.theme || flow.theme,
      reading: hasReportText(reading, 24) ? reading : compactFlowReading(profile, flow),
    };
  });

  let sections = rawSections
    .map((item) => ({
      title: compactSectionTitle(item?.title),
      body: cleanReportText(item?.body, 900),
    }))
    .filter((item) => item.title && hasReportText(item.body, 24));

  if (hasModelReport && sections.some((item) => item.title !== "排盘锚点")) {
    sections = sections.filter((item) => item.title !== "排盘锚点");
  }

  if (hasModelReport && !sections.some((item) => /重点|问题|结论/.test(item.title))) {
    sections.unshift({
      title: "重点问题",
      body: cleanReportText(normalized.summary || normalized.plainSummary, 700),
    });
  }

  if (!hasModelReport || !sections.length) {
    sections = [
      {
        title: "模型状态",
        body: "Kimi 暂时未完成本次正式解读。为了避免把模板当成收费报告，本次只展示已计算出的排盘锚点，请稍后重新生成。",
      },
      { title: "已完成排盘", body: anchor },
    ];
  }

  normalized.sections = [];
  const seenTitles = new Set();
  for (const section of sections) {
    if (seenTitles.has(section.title)) continue;
    seenTitles.add(section.title);
    normalized.sections.push(section);
    if (normalized.sections.length >= 7) break;
  }

  const advice = normalizeReportTextList(normalized.advice, 5, 220);
  if (advice.length < 3) {
    advice.push(intentActionText(intent, weakest.element));
    advice.push(`用${intentRealityCheck(intent)}复核本次结论，不把单次解读当成现实中的唯一依据。`);
  }
  normalized.advice = uniqueItems(advice).slice(0, 5);

  const prompts = normalizeReportTextList(normalized.counselingPrompts, 4, 180);
  if (prompts.length < 2) {
    prompts.push(`我问“${user.question || user.focusLabel || "这个问题"}”时，真正想确认的是什么？`);
    prompts.push("我现在能控制的最小行动是什么，哪些结果需要暂时允许不确定？");
  }
  normalized.counselingPrompts = uniqueItems(prompts).slice(0, 4);

  normalized.lucky = { ...profile.lucky, ...(normalized.lucky || {}) };
  normalized.disclaimer = normalized.disclaimer || "报告仅供娱乐与自我反思，不作为医疗、法律、投资或人生重大决策依据。";
  return normalized;
}

function buildKimiReportSeed(profile) {
  const anchor = structuredReportAnchor(profile);
  return {
    title: "命盘师 AI 命盘报告",
    plainSummary: "",
    summary: "",
    tags: ["排盘资料包"],
    keyPoints: [anchor],
    elementInsight: compactElementReport(profile),
    domainReadings: (profile.domains || []).map((domain) => ({
      key: domain.key,
      label: domain.label,
      score: domain.score,
      reading: "",
    })),
    annualFlow: (profile.annualFlow || []).map((flow) => ({
      year: flow.year,
      theme: flow.theme,
      reading: "",
    })),
    sections: [{ title: "排盘锚点", body: anchor }],
    advice: [],
    counselingPrompts: [],
    lucky: profile.lucky,
    disclaimer: "报告仅供娱乐与自我反思，不作为医疗、法律、投资或人生重大决策依据。",
  };
}

function compactKimiCoreForPrompt(profile) {
  const { user, pillars, elements, strongest, weakest, primary, changed, sixYao, psychology, stellar, mysticSystems, firstFlow, trueSolarTime } = reportContext(profile);
  const layers = mysticSystems.layers || {};
  return {
    question: user.question || "",
    focus: user.focusLabel || "",
    intent: user.questionIntent || inferQuestionIntent(user.question || "", user.focus),
    birth: {
      date: user.birthDate,
      time: user.birthTime,
      place: user.birthPlace,
      trueSolarTime: trueSolarTime.applied ? `${trueSolarTime.place?.name || ""} ${trueSolarTime.correctedTime}` : "",
    },
    pillars: {
      year: pillarLabel(pillars.year),
      month: pillarLabel(pillars.month),
      day: pillarLabel(pillars.day),
      hour: pillarLabel(pillars.hour),
      dayMaster: pillars.dayMaster || pillars.day?.stem || "",
    },
    elements,
    strongest: strongest.element,
    weakest: weakest.element,
    hexagram: {
      primary: primary.name || "",
      changed: changed.name || "",
      movingLine: sixYao.lineName || "",
      lineTheme: sixYao.lineTheme || "",
      movement: sixYao.movement || "",
    },
    annual: firstFlow.year ? {
      year: firstFlow.year,
      ganzhi: firstFlow.ganzhi,
      theme: firstFlow.theme,
      score: firstFlow.score,
    } : null,
    psychology: {
      need: psychology.coreNeed || "",
      stress: psychology.stressPattern || "",
      regulation: psychology.regulation || "",
    },
    stellar: stellar.sign ? {
      sign: stellar.sign,
      gift: stellar.gift,
      shadow: stellar.shadow,
    } : null,
    systems: [
      layers.bazi?.userQuestionAnchor ? `八字：${layers.bazi.userQuestionAnchor}` : "",
      layers.liuyao?.plain ? `六爻：${layers.liuyao.plain}` : "",
      layers.meihua?.plain ? `梅花：${layers.meihua.plain}` : "",
      layers.qimen?.plain ? `奇门：${layers.qimen.plain}` : "",
      layers.ziwei?.plain ? `紫微：${layers.ziwei.plain}` : "",
      layers.yinyuan?.active && layers.yinyuan?.plain ? `姻缘：${layers.yinyuan.plain}` : "",
      layers.tarot?.plain ? `塔罗：${layers.tarot.plain}` : "",
    ].filter(Boolean).slice(0, 4),
  };
}

async function callOpenAI(profile) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error("缺少 OPENAI_API_KEY，请先在 .env 中配置模型 API 密钥。");
    error.statusCode = 500;
    throw error;
  }

  const config = apiConfig();
  let payload = buildRequestPayload(config, profile);
  let response = await postModelRequest(config, apiKey, payload, {
    timeoutMs: Number(process.env.MODEL_REPORT_TIMEOUT_MS || 90_000),
  });
  let bodyText = await response.text();

  if (!response.ok && config.style === "chat" && payload.response_format && /response_format|json_object/i.test(bodyText)) {
    payload = buildRequestPayload(config, profile, true);
    response = await postModelRequest(config, apiKey, payload, {
      timeoutMs: Number(process.env.MODEL_REPORT_TIMEOUT_MS || 90_000),
    });
    bodyText = await response.text();
  }

  if (!response.ok) {
    const error = new Error(`${config.provider} API 返回 ${response.status}: ${bodyText.slice(0, 600)}`);
    error.statusCode = 502;
    throw error;
  }

  const data = JSON.parse(bodyText);
  const outputText = extractOutputText(data);
  if (!outputText) {
    const error = new Error(`${config.provider} API 返回为空，无法提取报告。`);
    error.statusCode = 502;
    throw error;
  }

  const report = parseReport(outputText, profile);
  report.tags = uniqueItems([`${config.provider}主导测算`, ...(report.tags || [])]).slice(0, 8);

  return {
    model: config.model,
    provider: config.provider,
    endpointLabel: config.endpointLabel,
    report,
    rawResponseId: data.id || null,
  };
}

function buildReportEnhancementPrompt({ profile, report }) {
  return [
    "请基于资料包生成用户最终看到的核心 AI 命盘报告。",
    "不要输出 JSON，不要 Markdown 代码块。必须严格使用下面的 XML 风格标签，标签名和 title 不要改。",
    "总字数控制在 650-850 个中文字符。不要写长篇总报告，不要套固定开场和固定结尾。",
    "第一优先级是回答用户原问题；同一生日换问题时，结论、依据、行动建议都必须随问题改变。",
    "每个结论至少挂 1 个具体依据：四柱/日主/月柱/时柱、五行强弱、本卦变卦/动爻、流年主题或相关术数层。",
    "术语出现后立刻翻译成人话；建议要具体到谈判、沟通、预算、时间窗口或观察指标。",
    "不要恐吓，不做确定性命运断言。涉及钱、健康、重大关系时提醒现实复核。",
    "",
    "输出格式：",
    "<plainSummary>",
    "3-4 行，直接说结论、命盘依据、风险、下一步。",
    "</plainSummary>",
    "<summary>",
    "100-150 字，先回答用户问题，再解释 2-3 个关键依据。",
    "</summary>",
    "<section title=\"重点问题\">120-170 字，第一句直接回答用户原问题；后面讲依据、心理动力、现实行动。</section>",
    "<section title=\"五行五维\">90-130 字，把五行强弱翻译成这次问题里的现实能力和短板。</section>",
    "<section title=\"卦象与变化点\">90-130 字，把本卦、变卦、动爻翻译成处境和变化点。</section>",
    "<section title=\"现实行动\">90-130 字，给出 7 天或 30 天内可执行动作、观察指标和边界提醒。</section>",
    "<advice>",
    "- 3 条具体建议，每条不超过 35 字",
    "</advice>",
    "<counselingPrompts>",
    "- 2 个自我提问",
    "</counselingPrompts>",
    "",
    "资料包：",
    JSON.stringify(compactKimiCoreForPrompt(profile)),
    "",
    "用户问题特化提示：",
    intentSpecificReading(profile),
  ].join("\n");
}

function buildReportEnhancementPayload(config, input, forcePlainText = false) {
  const userPrompt = buildReportEnhancementPrompt(input);
  const maxTokens = Number(process.env.OPENAI_ENHANCEMENT_MAX_TOKENS || 1000);
  if (config.style === "chat") {
    const payload = {
      model: config.model,
      messages: [
        { role: "system", content: REPORT_ENHANCEMENT_PROMPT },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
    };
    const isKimiK2 = config.provider === "Kimi" && /^kimi-k2\.(5|6)/.test(config.model);
    if (isKimiK2) {
      payload.thinking = { type: process.env.KIMI_THINKING || "disabled" };
    } else {
      payload.temperature = Number(process.env.MODEL_TEMPERATURE || 0.68);
    }
    return payload;
  }

  const payload = {
    model: config.model,
    input: [
      { role: "system", content: REPORT_ENHANCEMENT_PROMPT },
      { role: "user", content: userPrompt },
    ],
    max_output_tokens: maxTokens,
  };
  const effort = process.env.OPENAI_REASONING_EFFORT || "low";
  if (/^gpt-5/i.test(config.model) && effort !== "none") {
    payload.reasoning = { effort };
  }
  return payload;
}

function parseJsonObjectText(text) {
  const cleaned = String(text || "").replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw error;
  }
}

function normalizeEnhancementResult(value = {}) {
  const sections = Array.isArray(value.sections) ? value.sections : [];
  return {
    plainSummary: String(value.plainSummary || "").trim().slice(0, 420),
    summary: String(value.summary || "").trim().slice(0, 520),
    sections: sections
      .map((item) => ({
        title: String(item.title || "").trim().slice(0, 40),
        body: String(item.body || "").trim().slice(0, 900),
      }))
      .filter((item) => item.title && item.body)
      .slice(0, 8),
    advice: (Array.isArray(value.advice) ? value.advice : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 5),
    counselingPrompts: (Array.isArray(value.counselingPrompts) ? value.counselingPrompts : [])
      .map((item) => String(item || "").trim())
      .filter(Boolean)
      .slice(0, 4),
  };
}

function stripFusionTags(text = "") {
  return String(text || "")
    .replace(/^```(?:xml|html|text)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function extractFusionTag(text, tag) {
  const match = stripFusionTags(text).match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? match[1].trim() : "";
}

function parseFusionList(text = "") {
  return stripFusionTags(text)
    .split(/\n+/)
    .map((line) => line.replace(/^\s*[-*•]\s*/, "").trim())
    .filter(Boolean);
}

function parseTaggedEnhancementText(text = "") {
  const cleaned = stripFusionTags(text);
  const sections = [];
  const sectionPattern = /<section\s+title=["']?([^"'>]+)["']?>([\s\S]*?)<\/section>/gi;
  let match;
  while ((match = sectionPattern.exec(cleaned))) {
    sections.push({
      title: match[1].trim(),
      body: match[2].trim(),
    });
  }

  return normalizeEnhancementResult({
    plainSummary: extractFusionTag(cleaned, "plainSummary"),
    summary: extractFusionTag(cleaned, "summary"),
    sections,
    advice: parseFusionList(extractFusionTag(cleaned, "advice")),
    counselingPrompts: parseFusionList(extractFusionTag(cleaned, "counselingPrompts")),
  });
}

function parseEnhancementOutput(text = "") {
  try {
    return normalizeEnhancementResult(parseJsonObjectText(text));
  } catch (error) {
    const tagged = parseTaggedEnhancementText(text);
    if (tagged.plainSummary || tagged.summary || tagged.sections.length) return tagged;
    throw error;
  }
}

function mergeReportEnhancement(report, profile, enhancement) {
  const next = normalizeReport({ ...(report || {}) }, profile);
  if (enhancement.plainSummary) next.plainSummary = cleanReportText(enhancement.plainSummary, 520);
  if (enhancement.summary) next.summary = cleanReportText(enhancement.summary, 800);
  if (enhancement.advice?.length) {
    next.advice = normalizeReportTextList(enhancement.advice, 5, 220);
  }
  if (enhancement.counselingPrompts?.length) {
    next.counselingPrompts = normalizeReportTextList(enhancement.counselingPrompts, 4, 180);
  }
  const enhancedSections = (enhancement.sections || [])
    .map((section) => ({
      title: compactSectionTitle(section.title),
      body: cleanReportText(section.body, 900),
    }))
    .filter((section) => section.title && hasReportText(section.body, 24));
  if (enhancedSections.length) {
    const oldSections = (next.sections || []).filter((section) => {
      const title = compactSectionTitle(section.title);
      return !enhancedSections.some((enhanced) => compactSectionTitle(enhanced.title) === title);
    });
    next.sections = [...enhancedSections, ...oldSections].slice(0, 7);
  }
  next.tags = uniqueItems(["Kimi主导", ...(next.tags || [])]).slice(0, 8);
  return normalizeReport(next, profile);
}

async function callReportEnhancementAI({ profile, report }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error("缺少 OPENAI_API_KEY，无法执行报告增强。");
    error.statusCode = 500;
    throw error;
  }

  const config = apiConfig();
  let payload = buildReportEnhancementPayload(config, { profile, report });
  let response = await postModelRequest(config, apiKey, payload, {
    timeoutMs: Number(process.env.MODEL_FUSION_TIMEOUT_MS || 90_000),
  });
  let bodyText = await response.text();

  if (!response.ok && config.style === "chat" && payload.response_format && /response_format|json_object/i.test(bodyText)) {
    payload = buildReportEnhancementPayload(config, { profile, report }, true);
    response = await postModelRequest(config, apiKey, payload, {
      timeoutMs: Number(process.env.MODEL_FUSION_TIMEOUT_MS || 90_000),
    });
    bodyText = await response.text();
  }

  if (!response.ok) {
    const error = new Error(`${config.provider} API 返回 ${response.status}: ${bodyText.slice(0, 600)}`);
    error.statusCode = 502;
    throw error;
  }

  const data = JSON.parse(bodyText);
  const outputText = extractOutputText(data);
  if (!outputText) {
    const error = new Error(`${config.provider} API 返回为空，无法提取增强内容。`);
    error.statusCode = 502;
    throw error;
  }

  return {
    model: config.model,
    provider: config.provider,
    endpointLabel: config.endpointLabel,
    rawResponseId: data.id || null,
    enhancement: parseEnhancementOutput(outputText),
  };
}

function localReportResult(profile, error) {
  const anchor = structuredReportAnchor(profile);
  return {
    model: "kimi-unavailable",
    provider: "Kimi暂不可用",
    endpointLabel: "Local structured fallback",
    report: normalizeReport({
      title: "命盘师 AI 命盘报告",
      plainSummary: `Kimi 暂时没有完成本次正式报告，这次不会把本地模板伪装成测算结果。\n${anchor}`,
      summary: `模型服务暂时未返回正式解读。为了保证收费产品的内容质量，本次只展示已经计算出的排盘锚点：${anchor}`,
      tags: ["模型待重试", "排盘已完成"],
      keyPoints: [
        `四柱：年柱${profile.pillars?.year?.name || "--"}、月柱${profile.pillars?.month?.name || "--"}、日柱${profile.pillars?.day?.name || "--"}、时柱${profile.pillars?.hour?.name || "待填写"}。`,
        `五行：${(profile.elements || []).map((item) => `${item.element}${item.percent}%`).join("、") || "--"}。`,
      ],
      domainReadings: [],
      annualFlow: [],
      sections: [
        { title: "模型状态", body: "Kimi 暂时未完成正式报告。请稍后重新生成，避免把固定模板当成付费测算内容。" },
        { title: "已完成排盘", body: anchor },
      ],
      advice: ["稍后重新生成正式报告；涉及金钱、健康和重大关系时，用现实证据复核。"],
      lucky: profile.lucky,
      disclaimer: "报告仅供娱乐与自我反思，不作为医疗、法律、投资或人生重大决策依据。",
    }, profile),
    rawResponseId: null,
    internalReason: error?.message || "report_model_unavailable",
  };
}

function isCrisisText(value) {
  return /自杀|轻生|不想活|活不下去|伤害自己|结束生命|想死/.test(String(value || ""));
}

function localChatReply({ profile, report, message }) {
  const question = String(message || "").trim();
  if (isCrisisText(question)) {
    return "我先把安全放在第一位：如果你此刻有伤害自己的冲动，或觉得自己可能马上做出危险行为，请立刻联系当地紧急服务、身边可信任的人，或尽快去线下急诊/危机干预渠道。命盘解读不能替代专业支持。现在先做一个很小的动作：把危险物品放远，给一个能马上联系到你的人发消息，说“我现在不安全，需要你陪我一下”。等你处在安全环境里，我们再慢慢看这份命盘背后的压力和关系议题。";
  }

  const { user, strongest, weakest, primary, changed, sixYao, psychology, stellar, firstFlow, trueSolarTime } = reportContext(profile || {});
  const solarNote = trueSolarTime.applied ? `本盘已按${trueSolarTime.place?.name || "出生地"}真太阳时 ${trueSolarTime.correctedTime} 校正。` : "";
  const anchors = profileAnchors(profile || {}, question);
  const seedReading = intentSpecificReading(profile || {}, question);
  const nextAction = {
    career_move: "接下来别只问“要不要跳”，先做三件事：整理一份能展示成果的清单，试投 3 个目标岗位，和一个可信同行聊薪资与岗位真实情况。反馈比脑内推演更可靠。",
    love_reconcile: "如果你想联系对方，建议只发一次低压信息：说明你想沟通的具体事，不逼对方立刻表态。观察对方是否愿意持续回应，而不是只看一句情绪化回复。",
    love_future: "感情上先看稳定回应：对方是否尊重边界、是否愿意一起解决现实安排、是否只在暧昧里给情绪价值。别把短期热度当长期承诺。",
    wealth_choice: "钱的问题先设底线：不可动的钱、可试错的钱、最坏能承受的亏损分别写清楚。凡是让你必须立刻付款或无法复盘成本的机会，都先慢一步。",
    study_exam: "学习上别只靠意志。把目标拆成每日输出、每周复盘和一次模拟反馈；如果连续三天完不成，说明不是不努力，是方法或环境要改。",
    health_rhythm: "身心问题先不做医疗判断。你可以先记录 7 天睡眠、饮食、信息摄入和情绪触发点；如果压力明显影响生活，优先找线下专业支持。",
    decision_timing: "选择题先列前置条件：资源够不够、对方/环境是否有真实回应、最坏结果能不能承受。满足两项以上再推进，否则先谈条件或暂缓。",
  }[anchors.intent.key] || anchors.intent.actionFrame;

  return [
    `你这次问的是“${question || user.focusLabel || "当前问题"}”，我会按${anchors.intent.label}来看，不按通用运势套。`,
    seedReading,
    `${solarNote}再补一句心理层面的解释：你真正卡住的可能不是不知道答案，而是${psychology.coreNeed || "想要确定感"}和${psychology.stressPattern || "不确定压力"}在拉扯。${stellar.sign ? `${stellar.sign}的星术侧影也提示，压力下容易${stellar.shadow || "节奏不稳"}，所以要把感受和事实分开。` : ""}`,
    `具体做法：${nextAction}`,
    `你可以继续追问得更具体一点，比如把对象、岗位、金额、时间点或两个选项告诉我，我就能按这张盘继续往下拆。以上只作娱乐和自我反思，涉及医疗、法律、投资或重大关系决定时，要用现实证据和专业意见复核。`,
  ].join("\n\n");
}

async function callChatAI({ profile, report, history, message }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error("缺少 OPENAI_API_KEY，请先在 .env 中配置模型 API 密钥。");
    error.statusCode = 500;
    throw error;
  }

  const config = apiConfig();
  const payload = buildChatRequestPayload(config, { profile, report, history, message });
  const response = await postModelRequest(config, apiKey, payload, {
    timeoutMs: Number(process.env.MODEL_CHAT_TIMEOUT_MS || 75_000),
  });
  const bodyText = await response.text();

  if (!response.ok) {
    const error = new Error(`${config.provider} API 返回 ${response.status}: ${bodyText.slice(0, 600)}`);
    error.statusCode = 502;
    throw error;
  }

  const data = JSON.parse(bodyText);
  const outputText = extractOutputText(data);
  if (!outputText) {
    const error = new Error(`${config.provider} API 返回为空，无法提取对话回复。`);
    error.statusCode = 502;
    throw error;
  }

  return {
    model: config.model,
    provider: config.provider,
    endpointLabel: config.endpointLabel,
    reply: outputText.slice(0, 2000),
    rawResponseId: data.id || null,
  };
}

async function handleApiOperation({ method, pathname, input = {}, headers = {}, query = {}, store = localDbStore }) {
  if (pathname === "/api/health" && method === "GET") {
    const config = apiConfig();
    return {
      status: 200,
      payload: {
        ok: true,
        hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
        accessRequired: Boolean(publicAccessCode()),
        model: config.model,
        provider: config.provider,
        endpoint: config.endpointLabel,
        apiStyle: config.style,
        billing: publicBilling(),
      },
    };
  }

  if (pathname === "/api/account" && method === "GET") {
    const db = normalizeDb(await store.readDb());
    const user = getOrCreateUser(db, query.clientId || input.clientId);
    await store.writeDb(db);
    return {
      status: 200,
      payload: { ok: true, account: publicAccount(user), plan: CREDIT_PACK },
    };
  }

  if (pathname === "/api/recharge" && method === "POST") {
    if (isFreeProductMode()) {
      return {
        status: 403,
        payload: {
          ok: false,
          code: "PAYMENT_DISABLED",
          message: "当前网页测试期免费开放，不需要购买额度。",
          billing: publicBilling(),
        },
      };
    }

    const db = normalizeDb(await store.readDb());
    const user = getOrCreateUser(db, input.clientId);
    const order = await rechargeUser(db, user, input.planId || CREDIT_PACK.id, input, headers);
    await store.writeDb(db);
    return {
      status: order.status === "pending" ? 202 : 200,
      payload: { ok: true, order: publicOrder(order), account: publicAccount(user), billing: publicBilling(), plan: CREDIT_PACK },
    };
  }

  if (pathname === "/api/order" && method === "GET") {
    const db = normalizeDb(await store.readDb());
    const user = getOrCreateUser(db, query.clientId || input.clientId);
    const order = db.orders[String(query.orderId || input.orderId || "")];
    if (!order || order.userId !== user.id) {
      return { status: 404, payload: { ok: false, message: "订单不存在。" } };
    }
    return {
      status: 200,
      payload: { ok: true, order: publicOrder(order), account: publicAccount(user), billing: publicBilling(), plan: CREDIT_PACK },
    };
  }

  if (pathname === "/api/payment-webhook/nowpayments" && method === "POST") {
    const normalized = normalizedHeaders(headers);
    if (!verifyNowPaymentsSignature(input, normalized["x-nowpayments-sig"])) {
      return { status: 401, payload: { ok: false, message: "Invalid payment signature" } };
    }

    const db = normalizeDb(await store.readDb());
    const orderId = String(input.order_id || "").trim();
    let order = orderId ? db.orders[orderId] : null;
    if (!order) {
      order = Object.values(db.orders || {}).find((item) => (
        String(item.providerInvoiceId || "") === String(input.invoice_id || "")
        || String(item.providerPaymentId || "") === String(input.payment_id || "")
      ));
    }
    if (!order) {
      pushEvent(db, { type: "payment.webhook.unmatched", provider: "nowpayments", payload: input });
      await store.writeDb(db);
      return { status: 200, payload: { ok: true, matched: false } };
    }

    const user = db.users[order.userId];
    if (!user) {
      pushEvent(db, { type: "payment.webhook.user_missing", provider: "nowpayments", orderId: order.id, payload: input });
      await store.writeDb(db);
      return { status: 200, payload: { ok: true, matched: true, credited: false } };
    }

    const status = String(input.payment_status || input.invoice_status || "").toLowerCase();
    order.providerStatus = status;
    order.providerPaymentId = String(input.payment_id || order.providerPaymentId || "");
    order.providerInvoiceId = String(input.invoice_id || order.providerInvoiceId || "");
    order.providerPayload = input;
    order.updatedAt = nowIso();

    let credited = false;
    if (cryptoPaymentConfig().successStatuses.includes(status)) {
      const wasPaid = order.status === "paid";
      creditOrder(db, user, order, nowIso());
      credited = !wasPaid;
    } else if (["failed", "expired", "cancelled", "refunded"].includes(status)) {
      order.status = status;
    }

    pushEvent(db, { type: "payment.webhook", provider: "nowpayments", orderId: order.id, providerStatus: status, credited });
    await store.writeDb(db);
    return { status: 200, payload: { ok: true, matched: true, credited } };
  }

  if (pathname === "/api/share-unlock" && method === "POST") {
    const db = normalizeDb(await store.readDb());
    const user = getOrCreateUser(db, input.clientId);
    unlockReadingByShare(db, user, input.channel || "friend");
    await store.writeDb(db);
    return {
      status: 200,
      payload: { ok: true, account: publicAccount(user), channel: input.channel || "friend" },
    };
  }

  if (pathname === "/api/reading" && method === "POST") {
    if (!hasApiAccessFromHeaders(headers)) {
      return {
        status: 401,
        payload: { ok: false, code: "ACCESS_REQUIRED", message: "请输入正确访问码后再生成报告。" },
      };
    }

    const db = normalizeDb(await store.readDb());
    const user = getOrCreateUser(db, input.clientId);
    ensureReadingUnlock(user);

    const profile = buildFortuneProfile(input);
    let ai;
    try {
      const seedReport = buildKimiReportSeed(profile);
      const fusion = await callReportEnhancementAI({ profile, report: seedReport });
      const report = mergeReportEnhancement(seedReport, profile, fusion.enhancement);
      report.tags = uniqueItems([`${fusion.provider}主导测算`, ...(report.tags || [])]).slice(0, 8);
      ai = {
        model: fusion.model,
        provider: fusion.provider,
        endpointLabel: fusion.endpointLabel,
        rawResponseId: fusion.rawResponseId,
        report,
      };
    } catch (error) {
      if (process.env.OPENAI_API_KEY && (process.env.REQUIRE_AI_REPORT || "true").toLowerCase() !== "false") {
        throw error;
      }
      ai = localReportResult(profile, error);
    }
    const conversation = createConversation(db, user, profile, ai.report, input, ai);
    deductReadingUnlock(db, user, conversation.id);
    await store.writeDb(db);

    return {
      status: 200,
      payload: {
        ok: true,
        model: ai.model,
        provider: ai.provider,
        endpoint: ai.endpointLabel,
        responseId: ai.rawResponseId,
        enhancement: publicEnhancement(conversation.enhancement),
        profile,
        report: ai.report,
        conversationId: conversation.id,
        conversation: publicConversation(conversation),
        account: publicAccount(user),
      },
    };
  }

  if (pathname === "/api/reading-enhancement" && method === "POST") {
    if (!hasApiAccessFromHeaders(headers)) {
      return {
        status: 401,
        payload: { ok: false, code: "ACCESS_REQUIRED", message: "请输入正确访问码后再增强报告。" },
      };
    }

    let db = normalizeDb(await store.readDb());
    let user = getOrCreateUser(db, input.clientId);
    let conversation = getConversationForUser(db, user, input.conversationId);

    if (conversation.enhancement?.status === "complete" && !input.retry) {
      return {
        status: 200,
        payload: {
          ok: true,
          enhancement: publicEnhancement(conversation.enhancement),
          profile: conversation.profile,
          report: conversation.report,
          conversationId: conversation.id,
          conversation: publicConversation(conversation),
          account: publicAccount(user),
        },
      };
    }

    const startedAt = nowIso();
    conversation.enhancement = {
      ...(conversation.enhancement || {}),
      status: "processing",
      provider: apiConfig().provider,
      model: apiConfig().model,
      updatedAt: startedAt,
    };
    conversation.updatedAt = startedAt;
    pushEvent(db, { type: "reading.enhancement.started", userId: user.id, refId: conversation.id });
    await store.writeDb(db);

    try {
      const ai = await callReportEnhancementAI({
        profile: conversation.profile,
        report: conversation.report,
      });
      db = normalizeDb(await store.readDb());
      user = getOrCreateUser(db, input.clientId);
      conversation = getConversationForUser(db, user, input.conversationId);
      conversation.report = mergeReportEnhancement(conversation.report, conversation.profile, ai.enhancement);
      const completedAt = nowIso();
      conversation.enhancement = {
        status: "complete",
        provider: ai.provider,
        model: ai.model,
        endpoint: ai.endpointLabel,
        responseId: ai.rawResponseId,
        updatedAt: completedAt,
        completedAt,
      };
      conversation.updatedAt = completedAt;
      pushEvent(db, { type: "reading.enhancement.completed", userId: user.id, refId: conversation.id, responseId: ai.rawResponseId });
      await store.writeDb(db);
      return {
        status: 200,
        payload: {
          ok: true,
          enhancement: publicEnhancement(conversation.enhancement),
          model: ai.model,
          provider: ai.provider,
          endpoint: ai.endpointLabel,
          responseId: ai.rawResponseId,
          profile: conversation.profile,
          report: conversation.report,
          conversationId: conversation.id,
          conversation: publicConversation(conversation),
          account: publicAccount(user),
        },
      };
    } catch (error) {
      db = normalizeDb(await store.readDb());
      user = getOrCreateUser(db, input.clientId);
      conversation = getConversationForUser(db, user, input.conversationId);
      const failedAt = nowIso();
      conversation.enhancement = {
        ...(conversation.enhancement || {}),
        status: "failed",
        provider: apiConfig().provider,
        model: apiConfig().model,
        updatedAt: failedAt,
        failedAt,
      };
      conversation.updatedAt = failedAt;
      pushEvent(db, { type: "reading.enhancement.failed", userId: user.id, refId: conversation.id, reason: error?.message || "enhancement_failed" });
      await store.writeDb(db);
      return {
        status: 200,
        payload: {
          ok: true,
          enhancement: publicEnhancement(conversation.enhancement),
          profile: conversation.profile,
          report: conversation.report,
          conversationId: conversation.id,
          conversation: publicConversation(conversation),
          account: publicAccount(user),
        },
      };
    }
  }

  if (pathname === "/api/chat" && method === "POST") {
    if (!hasApiAccessFromHeaders(headers)) {
      return {
        status: 401,
        payload: { ok: false, code: "ACCESS_REQUIRED", message: "请输入正确访问码后再继续对话。" },
      };
    }

    const message = String(input.message || "").trim().slice(0, 500);
    if (!message) {
      return { status: 400, payload: { ok: false, message: "请输入想追问的问题。" } };
    }

    const db = normalizeDb(await store.readDb());
    const user = getOrCreateUser(db, input.clientId);
    ensureChatCredits(user);
    const conversation = getConversationForUser(db, user, input.conversationId);
    let ai;
    try {
      ai = await callChatAI({
        profile: conversation.profile,
        report: conversation.report,
        history: conversation.messages,
        message,
      });
    } catch (error) {
      pushEvent(db, {
        type: "chat.failed",
        userId: user.id,
        refId: conversation.id,
        reason: error?.message || "model_unavailable",
        balance: user.chatCredits,
      });
      await store.writeDb(db);
      return {
        status: 503,
        payload: {
          ok: false,
          code: "AI_TEMPORARILY_UNAVAILABLE",
          message: "命盘师当前响应繁忙，这次不会扣除对话次数。请稍后重新发送一次问题。",
          account: publicAccount(user),
        },
      };
    }

    const createdAt = nowIso();
    conversation.messages.push({ id: `msg_${crypto.randomUUID()}`, role: "user", content: message, createdAt });
    conversation.messages.push({ id: `msg_${crypto.randomUUID()}`, role: "assistant", content: ai.reply, createdAt });
    conversation.updatedAt = createdAt;
    deductChatCredit(db, user, conversation.id);
    await store.writeDb(db);

    return {
      status: 200,
      payload: {
        ok: true,
        model: ai.model,
        provider: ai.provider,
        endpoint: ai.endpointLabel,
        responseId: ai.rawResponseId,
        reply: ai.reply,
        conversation: publicConversation(conversation),
        account: publicAccount(user),
      },
    };
  }

  return { status: 404, payload: { ok: false, message: "API not found" } };
}

async function handleApi(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    const body = req.method === "GET" ? "" : await readBody(req);
    const input = body ? JSON.parse(body) : {};
    const result = await handleApiOperation({
      method: req.method,
      pathname: url.pathname.replace(/\/+$/, "") || "/",
      input,
      headers: req.headers,
      query: Object.fromEntries(url.searchParams.entries()),
      store: localDbStore,
    });
    sendJson(res, result.status, result.payload);
  } catch (error) {
    sendJson(res, error.statusCode || 400, {
      ok: false,
      code: error.code || "REQUEST_FAILED",
      message: error.message || "请求失败",
      plan: error.code === "INSUFFICIENT_CREDITS" || error.code === "READING_LOCKED" ? CREDIT_PACK : undefined,
    });
  }
}

if (typeof require !== "undefined" && require.main === module) {
  const server = http.createServer((req, res) => {
    if (req.url.startsWith("/api/")) {
      handleApi(req, res);
      return;
    }
    serveStatic(req, res);
  });

  server.listen(PORT, () => {
    console.log(`命盘师 AI 已启动：http://localhost:${PORT}`);
  });
}

module.exports = {
  apiConfig,
  buildFortuneProfile,
  callOpenAI,
  callChatAI,
  handleApi,
  handleApiOperation,
  localDbStore,
  CREDIT_PACK,
};

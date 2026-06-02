#!/usr/bin/env python3
"""
AI fortune teller CLI.

Entertainment only. It can call the OpenAI Responses API when OPENAI_API_KEY
is configured, and otherwise falls back to a deterministic local generator.
"""

import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import random
import sys
import textwrap
import urllib.error
import urllib.request


ZODIAC_ANIMALS = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"]

WESTERN_SIGNS = [
    ((1, 20), "水瓶座"),
    ((2, 19), "双鱼座"),
    ((3, 21), "白羊座"),
    ((4, 20), "金牛座"),
    ((5, 21), "双子座"),
    ((6, 22), "巨蟹座"),
    ((7, 23), "狮子座"),
    ((8, 23), "处女座"),
    ((9, 23), "天秤座"),
    ((10, 24), "天蝎座"),
    ((11, 22), "射手座"),
    ((12, 22), "摩羯座"),
]

YEAR_ELEMENTS = {
    0: "金",
    1: "金",
    2: "水",
    3: "水",
    4: "木",
    5: "木",
    6: "火",
    7: "火",
    8: "土",
    9: "土",
}

ELEMENT_PROFILES = {
    "木": {
        "tone": "生长型",
        "gift": "擅长把混乱的事慢慢理出方向",
        "shadow": "容易一边想突破，一边又被旧习惯拉住",
    },
    "火": {
        "tone": "点燃型",
        "gift": "行动快、感染力强，适合先把局面热起来",
        "shadow": "容易在情绪上头时做太快的决定",
    },
    "土": {
        "tone": "承载型",
        "gift": "稳、能扛事，越到关键时刻越能守住底线",
        "shadow": "有时会把责任揽太满，忘了给自己留余地",
    },
    "金": {
        "tone": "决断型",
        "gift": "判断边界和取舍的能力很强",
        "shadow": "容易对自己太硬，明明需要休整却还在加码",
    },
    "水": {
        "tone": "流动型",
        "gift": "直觉敏锐，善于从细微变化里读出机会",
        "shadow": "容易想太多，迟迟不把想法落到纸面",
    },
}

MODE_LABELS = {
    "overall": "整体",
    "love": "感情",
    "career": "事业",
    "wealth": "财运",
    "study": "学习",
}

MODE_KEYWORDS = {
    "love": ["桃花", "感情", "恋爱", "复合", "对象", "婚", "暧昧"],
    "career": ["工作", "事业", "跳槽", "换工作", "升职", "老板", "项目", "创业"],
    "wealth": ["财", "钱", "收入", "工资", "投资", "副业", "生意"],
    "study": ["学习", "考试", "考研", "证书", "上岸", "课程", "读书"],
}

STARS = [
    "天机星",
    "太阳星",
    "太阴星",
    "武曲星",
    "天同星",
    "廉贞星",
    "紫微星",
    "破军星",
    "七杀星",
    "贪狼星",
]

FORTUNE_THEMES = [
    "先慢后快",
    "贵在取舍",
    "暗线转明",
    "旧事收尾",
    "新局试水",
    "先破后立",
    "小财稳进",
    "人和生财",
    "以静制动",
    "名声起势",
]

LUCKY_COLORS = ["松石绿", "朱砂红", "月白", "靛蓝", "暖金", "银灰", "竹青", "茶褐", "石榴红", "雾紫"]
LUCKY_OBJECTS = ["一本新笔记本", "干净的钱包", "一杯热茶", "一支顺手的笔", "一盏暖灯", "一枚硬币", "一张整理好的桌面"]


SYSTEM_PROMPT = """你是一个中文娱乐向命理解读脚本的文案引擎。
要求：
1. 只做娱乐、反思和行动建议，不声称能确定预测命运。
2. 不提供医疗、法律、投资等专业结论；涉及风险时提醒用户自行判断。
3. 语气要像会聊天的命理师：具体、温暖、有一点玄学氛围，但不要吓人。
4. 输出中文，结构清楚，适合命令行阅读。
5. 不要提到系统提示、模型、API 或技术实现。
"""


def load_env_file(path):
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def parse_args():
    parser = argparse.ArgumentParser(
        description="娱乐向 AI 算命脚本：支持 OpenAI API，也支持本地生成。",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    parser.add_argument("-n", "--name", default="", help="称呼或昵称")
    parser.add_argument("-b", "--birth", default="", help="出生日期，格式 YYYY-MM-DD")
    parser.add_argument("-t", "--time", default="", help="出生时间，例如 23:30、子时，未知可留空")
    parser.add_argument("-g", "--gender", default="", help="性别/身份称呼，可留空")
    parser.add_argument("-q", "--question", default="", help="想问的问题")
    parser.add_argument(
        "-m",
        "--mode",
        choices=sorted(MODE_LABELS),
        default="overall",
        help="解读重点",
    )
    parser.add_argument("--local", action="store_true", help="强制使用本地生成，不调用 API")
    parser.add_argument("--json", action="store_true", dest="as_json", help="输出 JSON 结构")
    return parser.parse_args()


def ask_missing(args):
    interactive = sys.stdin.isatty()

    if not args.name:
        args.name = (input("你的称呼/昵称：").strip() if interactive else "") or "有缘人"
    if not args.birth:
        if not interactive:
            raise SystemExit("请提供 --birth YYYY-MM-DD，或在交互式终端中运行。")
        args.birth = input("出生日期 YYYY-MM-DD：").strip()
    if not args.time and interactive:
        args.time = input("出生时间（可留空）：").strip()
    if not args.gender and interactive:
        args.gender = input("性别/身份称呼（可留空）：").strip()
    if not args.question:
        args.question = (
            input("想问什么？（可留空，默认看整体）：").strip() if interactive else ""
        ) or "最近整体运势如何？"
    return args


def parse_birth_date(value):
    try:
        return dt.datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise SystemExit("出生日期格式不对，请使用 YYYY-MM-DD，例如 1998-08-18")


def chinese_zodiac(year):
    return ZODIAC_ANIMALS[(year - 4) % 12]


def western_sign(birth_date):
    month_day = (birth_date.month, birth_date.day)
    sign = "摩羯座"
    for start, name in WESTERN_SIGNS:
        if month_day >= start:
            sign = name
    return sign


def stable_seed(*parts):
    text = "|".join(str(part) for part in parts)
    return int(hashlib.sha256(text.encode("utf-8")).hexdigest(), 16)


def infer_mode(mode, question):
    if mode != "overall":
        return mode

    for candidate, keywords in MODE_KEYWORDS.items():
        if any(keyword in question for keyword in keywords):
            return candidate
    return mode


def build_profile(args):
    birth_date = parse_birth_date(args.birth)
    mode = infer_mode(args.mode, args.question)
    element = YEAR_ELEMENTS[birth_date.year % 10]
    seed = stable_seed(args.name, args.birth, args.time, args.gender, args.question, mode)
    rng = random.Random(seed)

    return {
        "name": args.name or "有缘人",
        "birth": birth_date.isoformat(),
        "birth_time": args.time or "未知",
        "gender": args.gender or "未填写",
        "question": args.question or "最近整体运势如何？",
        "mode": mode,
        "mode_label": MODE_LABELS[mode],
        "zodiac": chinese_zodiac(birth_date.year),
        "western_sign": western_sign(birth_date),
        "year_element": element,
        "element_profile": ELEMENT_PROFILES[element],
        "star": rng.choice(STARS),
        "theme": rng.choice(FORTUNE_THEMES),
        "lucky_color": rng.choice(LUCKY_COLORS),
        "lucky_number": rng.randint(1, 9),
        "lucky_object": rng.choice(LUCKY_OBJECTS),
        "seed_tail": hex(seed)[-8:],
    }


def build_ai_prompt(profile):
    return textwrap.dedent(
        f"""
        请根据下面资料写一份娱乐向命理解读。

        用户称呼：{profile["name"]}
        出生日期：{profile["birth"]}
        出生时间：{profile["birth_time"]}
        性别/身份称呼：{profile["gender"]}
        解读重点：{profile["mode_label"]}
        用户问题：{profile["question"]}

        可使用的命理风味素材：
        - 生肖：{profile["zodiac"]}
        - 星座：{profile["western_sign"]}
        - 年柱五行风味：{profile["year_element"]}，{profile["element_profile"]["tone"]}
        - 命盘关键词：{profile["star"]}、{profile["theme"]}
        - 幸运色：{profile["lucky_color"]}
        - 幸运数字：{profile["lucky_number"]}
        - 幸运小物：{profile["lucky_object"]}

        输出格式：
        1. 开头先写“娱乐向解读，不替代现实判断。”
        2. 给出“先说结论”“命盘关键词”“近期走势”“重点问题”“行动建议”“幸运提示”六段。
        3. 行动建议给 3 条，必须具体可做。
        4. 全文 600 字以内。
        """
    ).strip()


def openai_endpoint():
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")
    if base_url.endswith("/responses"):
        return base_url
    return f"{base_url}/responses"


def extract_response_text(payload):
    if isinstance(payload.get("output_text"), str):
        return payload["output_text"].strip()

    chunks = []
    for item in payload.get("output", []):
        for content in item.get("content", []):
            if content.get("type") in {"output_text", "text"} and content.get("text"):
                chunks.append(content["text"])
    return "\n".join(chunks).strip()


def call_openai(profile):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("未设置 OPENAI_API_KEY")

    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")
    payload = {
        "model": model,
        "input": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": build_ai_prompt(profile)},
        ],
        "temperature": 0.85,
    }

    request = urllib.request.Request(
        openai_endpoint(),
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            data = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"接口返回 {exc.code}: {detail[:500]}")
    except urllib.error.URLError as exc:
        raise RuntimeError(f"网络请求失败: {exc.reason}")

    text = extract_response_text(data)
    if not text:
        raise RuntimeError("接口返回为空，无法提取文本")
    return text


def local_reading(profile):
    element = profile["year_element"]
    ep = profile["element_profile"]
    name = profile["name"]
    mode = profile["mode_label"]
    rng = random.Random(stable_seed(profile["seed_tail"], "local-reading"))

    timing = rng.choice(["未来 7 到 14 天", "接下来一个月", "这个阶段", "最近三周"])
    opportunity = rng.choice(
        [
            "一次被忽略的小邀约",
            "一个旧联系人带来的新信息",
            "一件拖了很久的小事被顺手解决",
            "某个你原本没抱太大期待的尝试",
            "一次临时调整后的新安排",
        ]
    )
    warning = rng.choice(
        [
            "不要为了证明自己而硬撑",
            "别在情绪最满的时候做最终决定",
            "重要沟通尽量落到文字",
            "先看现金流和时间成本，再谈冲动",
            "少解释，多拿一个可见结果出来",
        ]
    )

    mode_focus = {
        "整体": "整体盘面像是从散乱转向收束，适合把人、事、钱的边界重新排一遍。",
        "感情": "感情上不是缺机会，而是需要更清楚地表达期待，少让对方猜。",
        "事业": "事业线有推进感，但关键不在猛冲，而在把一个可交付成果做扎实。",
        "财运": "财运偏稳进，适合整理预算、复盘支出，不适合只凭情绪重仓。",
        "学习": "学习运重在节奏，短时间高强度不如固定时段持续推进。",
    }[mode]

    advice_pool = [
        f"把最近最想推进的一件事拆成 3 个小动作，今天先完成第一个。",
        f"找一个你信任的人复述你的问题，听听自己讲到哪里会卡住。",
        f"做一次 20 分钟整理：桌面、账单、待办任选其一，清掉阻塞感。",
        f"遇到选择时先写下“不做什么”，你的运势会因为边界变清而变顺。",
        f"把{profile['lucky_color']}放进穿搭或桌面，不求玄，求提醒自己进入状态。",
    ]
    rng.shuffle(advice_pool)

    return textwrap.dedent(
        f"""
        娱乐向解读，不替代现实判断。

        【先说结论】
        {name}这一盘的主调是“{profile["theme"]}”。你不是没有机会，而是需要把节奏调准：先稳住基本盘，再让关键动作冒头。{warning}。

        【命盘关键词】
        生肖：{profile["zodiac"]}｜星座：{profile["western_sign"]}｜五行风味：{element}（{ep["tone"]}）｜主星：{profile["star"]}
        你的底色是：{ep["gift"]}。但阴影面也明显：{ep["shadow"]}。

        【近期走势】
        {timing}会出现“{opportunity}”这样的信号。它不一定很大，却像一个门缝，推开后能看到新的路径。现在最忌讳的是一边焦虑，一边什么都不落地。

        【重点问题：{mode}】
        你问的是：“{profile["question"]}”
        {mode_focus}如果要给一句卦象话，就是：先定心，再定局；先做减法，再做选择。

        【行动建议】
        1. {advice_pool[0]}
        2. {advice_pool[1]}
        3. {advice_pool[2]}

        【幸运提示】
        幸运色：{profile["lucky_color"]}｜幸运数字：{profile["lucky_number"]}｜幸运小物：{profile["lucky_object"]}
        今天的小口诀：不求一步到位，但求一步是真的。
        """
    ).strip()


def main():
    script_dir = Path(__file__).resolve().parent
    load_env_file(script_dir / ".env")
    load_env_file(Path.cwd() / ".env")

    args = ask_missing(parse_args())
    profile = build_profile(args)

    source = "local"
    try:
        if args.local:
            reading = local_reading(profile)
        else:
            reading = call_openai(profile)
            source = "openai"
    except Exception as exc:
        print(f"[提示] AI 接口不可用，已切换到本地生成：{exc}", file=sys.stderr)
        reading = local_reading(profile)

    if args.as_json:
        print(
            json.dumps(
                {
                    "source": source,
                    "profile": profile,
                    "reading": reading,
                },
                ensure_ascii=False,
                indent=2,
            )
        )
        return

    print(reading)


if __name__ == "__main__":
    main()

(function () {
  const STORE_KEY = "mps_last_report_v1";

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function text(value, fallback = "--") {
    const output = String(value ?? "").trim();
    return output || fallback;
  }

  function normalizeReportTitle(value) {
    const title = String(value || "").trim();
    if (!title || title.includes("玄策")) return "命盘师完整命盘报告";
    return title.replace(/AI\s*/gi, "");
  }

  function compact(value, max = 180) {
    const clean = String(value || "").replace(/\s+/g, " ").trim();
    return clean.length > max ? `${clean.slice(0, max)}...` : clean;
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

  function listHtml(items = [], ordered = false) {
    const tag = ordered ? "ol" : "ul";
    const safeItems = (items || []).filter(Boolean);
    if (!safeItems.length) return "";
    return `<${tag} class="reader-list">${safeItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</${tag}>`;
  }

  function paragraphHtml(body) {
    const clean = String(body || "").trim();
    if (!clean) return "";
    return clean
      .split(/\n{2,}/)
      .map((part) => `<p>${escapeHtml(part)}</p>`)
      .join("");
  }

  function sectionHtml(id, index, title, body, options = {}) {
    const content = options.list ? listHtml(options.list, options.ordered) : paragraphHtml(body);
    if (!content) return "";
    return `
      <section class="reader-section ${options.featured ? "featured" : ""}" id="${id}">
        <div class="reader-section-title">
          <span>${String(index).padStart(2, "0")}</span>
          <h3>${escapeHtml(title)}</h3>
        </div>
        <div class="reader-section-body">${content}</div>
      </section>
    `;
  }

  function metric(label, value, note = "") {
    return `
      <div class="reader-metric">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
        ${note ? `<small>${escapeHtml(note)}</small>` : ""}
      </div>
    `;
  }

  function skillRows(profile = {}) {
    const layers = profile.mysticSystems?.layers || {};
    return [
      ["八字", `${layers.bazi?.dayMaster || profile.pillars?.dayMaster || "--"}日主`, layers.bazi?.elementBalance?.plain || "四柱、十神、五行底盘"],
      ["六爻", `${layers.liuyao?.yongshen || "用神"} · ${layers.liuyao?.line || profile.sixYao?.lineName || "--"}`, layers.liuyao?.plain || "用神、世应、动爻事件判断"],
      ["梅花", `${layers.meihua?.body || "体卦"} / ${layers.meihua?.use || "用卦"}`, layers.meihua?.trend || layers.meihua?.plain || "体用生克与趋势验证"],
      ["紫微", layers.ziwei?.focusPalaceHint || "宫位入口", (layers.ziwei?.fourTransformations || []).join(" · ") || layers.ziwei?.plain || "宫位与四化视角"],
      ["奇门", `${layers.qimen?.palace || "九宫"} · ${layers.qimen?.door || "门"}`, [layers.qimen?.star, layers.qimen?.deity, layers.qimen?.plain].filter(Boolean).join(" · ")],
      ["姻缘", `${layers.yinyuan?.spouseStar || "关系星"} · ${layers.yinyuan?.spousePalace || "配偶宫"}`, layers.yinyuan?.plain || "日支、配偶宫、关系边界"],
      ["风水", `${layers.fengshui?.weakElement || "五行"}需补 · ${layers.fengshui?.directionHint || "空间方向"}`, layers.fengshui?.plain || "阳宅/办公环境习惯建议"],
      ["塔罗", (layers.tarot?.cards || []).map((card) => `${card.name}${card.orientation || ""}`).join(" / ") || "心理镜像", layers.tarot?.plain || "牌面作为自我观察提示"],
    ].filter((item) => item[1] && item[1] !== "--");
  }

  function skillOverviewHtml(profile = {}) {
    const rows = skillRows(profile);
    const checks = profile.mysticSystems?.crossChecks || [];
    if (!rows.length) return "";
    return `
      <section class="reader-section featured reader-skill-overview" id="reader-skills">
        <div class="reader-section-title">
          <span>SK</span>
          <h3>已挂载术数 Skill</h3>
        </div>
        <div class="reader-skill-grid">
          ${rows.map(([name, title, detail]) => `
            <article class="reader-skill">
              <span>${escapeHtml(name)}</span>
              <strong>${escapeHtml(title)}</strong>
              <p>${escapeHtml(detail)}</p>
            </article>
          `).join("")}
        </div>
        ${checks.length ? `
          <div class="reader-cross-checks">
            <strong>交叉验证</strong>
            ${listHtml(checks.slice(0, 5))}
          </div>
        ` : ""}
      </section>
    `;
  }

  function domainHtml(profile = {}, report = {}) {
    const profileDomains = new Map((profile.domains || []).map((item) => [item.key, item]));
    const items = (report.domainReadings || profile.domains || []).map((item) => {
      const base = profileDomains.get(item.key) || {};
      return {
        label: item.label || base.label || "维度分析",
        score: item.score || base.score || "--",
        reading: item.reading || "等待解读。",
      };
    });
    if (!items.length) return "";
    return `
      <section class="reader-section featured" id="reader-domain">
        <div class="reader-section-title">
          <span>DN</span>
          <h3>事业 / 感情 / 财运 / 学业 / 身心</h3>
        </div>
        <div class="reader-domain-grid">
          ${items.map((item) => `
            <article class="reader-domain">
              <div>
                <strong>${escapeHtml(item.label)}</strong>
                <span>${escapeHtml(item.score)}</span>
              </div>
              <p>${escapeHtml(item.reading)}</p>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function annualHtml(profile = {}, report = {}) {
    const aiFlow = new Map((report.annualFlow || []).map((item) => [Number(item.year), item]));
    const items = (profile.annualFlow || report.annualFlow || []).map((item) => {
      const ai = aiFlow.get(Number(item.year)) || {};
      return {
        year: item.year,
        ganzhi: item.ganzhi || "",
        theme: ai.theme || item.theme || "年度主题",
        score: item.score || "",
        reading: ai.reading || item.reading || "",
      };
    });
    if (!items.length) return "";
    return `
      <section class="reader-section" id="reader-annual">
        <div class="reader-section-title">
          <span>YR</span>
          <h3>流年节奏</h3>
        </div>
        <div class="reader-annual-list">
          ${items.map((item) => `
            <article class="reader-annual">
              <strong>${escapeHtml(item.year)} ${escapeHtml(item.ganzhi)}</strong>
              <span>${escapeHtml(item.theme)}${item.score ? ` / ${escapeHtml(item.score)}` : ""}</span>
              <p>${escapeHtml(item.reading)}</p>
            </article>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderReadableReport(payload = {}) {
    const profile = payload.profile || {};
    const report = payload.report || {};
    const pillars = profile.pillars || {};
    const elements = profile.elements || [];
    const strongest = elements[0] || {};
    const weakest = elements[elements.length - 1] || {};
    const trueSolar = profile.meta?.trueSolarTime || {};
    const title = normalizeReportTitle(report.title);
    const summary = report.summary || "报告已生成。";
    const plainSummary = plainSummaryText(profile, report);
    const sections = [];

    let index = 1;
    const add = (titleText, body, options = {}) => {
      const id = `reader-section-${index}`;
      const html = sectionHtml(id, index, titleText, body, options);
      if (html) {
        sections.push({ id, title: titleText, html });
        index += 1;
      }
    };

    add("先看结论", plainSummary, { featured: true });
    add("总论", summary, { featured: true });
    add("命盘要点", "", { list: report.keyPoints || [], featured: true });
    add("五行分析", report.elementInsight);
    for (const section of report.sections || []) {
      add(section.title || "命盘解读", section.body || "", {
        featured: section.title === "重点问题" || section.title === "心理动力",
      });
    }
    add("行动建议", "", { list: report.advice || [], ordered: true, featured: true });
    add("自我提问", "", { list: report.counselingPrompts || [] });
    add("边界说明", report.disclaimer || "报告仅供娱乐与自我反思，不作为医疗、法律、投资或人生重大决策依据。");

    const pillarText = [
      pillars.year?.name,
      pillars.month?.name,
      pillars.day?.name,
      pillars.hour?.name,
    ].filter(Boolean).join(" / ") || "--";
    const solarNote = trueSolar.applied
      ? `${trueSolar.place?.name || "出生地"} · ${trueSolar.correctedTime} · ${trueSolar.offsetMinutesExact >= 0 ? "+" : ""}${trueSolar.offsetMinutesExact} 分钟`
      : "标准时间";
    const hexagram = `${profile.hexagrams?.primary?.name || "--"} -> ${profile.hexagrams?.changed?.name || "--"}`;
    const tags = [
      ...(report.tags || []),
      trueSolar.applied ? "真太阳时" : "",
      profile.stellar?.sign,
    ].filter(Boolean).slice(0, 10);

    return `
      <article class="readable-report">
        <header class="reader-hero">
          <div>
            <span class="reader-kicker">FULL REPORT // READABLE MODE</span>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(compact(plainSummary, 260))}</p>
          </div>
          <div class="reader-tags">
            ${tags.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
          </div>
        </header>

        <div class="reader-metrics">
          ${metric("四柱", pillarText, `日主 ${text(pillars.dayMaster || pillars.day?.stem)}`)}
          ${metric("真太阳时", solarNote, trueSolar.applied ? "已参与排盘" : "未校正")}
          ${metric("五行信号", `${text(strongest.element)}旺 / ${text(weakest.element)}需补`, elements.map((item) => `${item.element}${item.percent}%`).join(" · "))}
          ${metric("卦象", hexagram, profile.sixYao?.movement || "")}
        </div>

        <div class="reader-layout">
          <nav class="reader-toc" aria-label="完整报告目录">
            <strong>REPORT INDEX</strong>
            <a href="#reader-skills">已挂载术数 Skill</a>
            ${sections.map((item) => `<a href="#${item.id}">${escapeHtml(item.title)}</a>`).join("")}
            <a href="#reader-domain">多维分析</a>
            <a href="#reader-annual">流年节奏</a>
          </nav>
          <div class="reader-main">
            ${skillOverviewHtml(profile)}
            ${sections.map((item) => item.html).join("")}
            ${domainHtml(profile, report)}
            ${annualHtml(profile, report)}
          </div>
        </div>
      </article>
    `;
  }

  window.MPS_REPORT_VIEW = {
    STORE_KEY,
    escapeHtml,
    plainSummaryText,
    renderReadableReport,
    normalizeReportTitle,
  };
})();

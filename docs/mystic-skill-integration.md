# 命盘师多术数能力层集成说明

本文记录 2026-06-03 对一批玄学 Skill / 排盘项目的调研结论，以及命盘师当前的集成策略。

## 集成原则

- 不复制无 License、AGPL、NC 协议仓库的代码或长文本，只学习工程结构与产品思路。
- 固定排盘、起卦、抽牌、规则判断优先由确定性程序输出结构化 JSON，模型只做解释和对话。
- 每个术数模块都要有白话解释，不用术语堆砌制造权威感。
- 感情、金钱、健康、法律等问题只做娱乐参考与自我反思，不做决定性结论。
- 多术数交叉验证时，只放大共同方向；互相冲突时提示用户用现实证据复核。

## 参考项目与使用边界

| 项目 | 许可状态 | 命盘师处理方式 |
| --- | --- | --- |
| FANzR-arch/Numerologist_skills | 未声明 License | 学习“先追问、确定性计算、结构化 references、口径声明”的工程方法，不复制代码 |
| Brhiza/mingyu | 未声明 License | 学习 API/MCP/Skill 一体化、结构化 result + prompt 流程，不复制代码 |
| jinchenma94/bazi-skill | MIT | 可参考交互收集、经典规则组织、八字解读框架；当前未复制代码 |
| gaoxin492/bazi-skill | 未声明 License | 学习“计算层 + JSON 层 + 解读层 + 存档”的产品架构，不复制代码 |
| Horace-Maxwell/horosa-skill | AGPL-3.0 | 不并入收费产品代码；学习输入契约、MCP 工具门禁、离线 runtime 思路 |
| Ming-H/yinyuan-skills | 未声明 License | 学习姻缘模块拆分：八字合婚、生肖、夫妻宫、签诗，不复制文本 |
| xr843/Master-skill | MIT | 学习 RAG、引用、角色风格审查与降级处理 |
| voidforall/fengshui.skill | 未声明 License | 学习风水问答的边界表达：风水为辅、人为为主，不复制文本 |
| zhaoolee/cyber-fortune-telling | 未声明 License | 学习日常运势、桌面风水摆件、轻娱乐化入口，不复制代码 |
| daman-ovo-0404/tarot-skill | 未声明 License | 学习塔罗作为心理镜像和牌阵结构，不复制牌义文本 |
| hhszzzz/taibu | Root AGPL，部分 package MIT | 不并入 root 代码；后续若使用 MIT package 需单独做依赖审查 |
| muyen/meihua-yishu | CC BY-NC-SA 4.0 | 非商业条款，不用于收费产品代码/文案；只学习体用生克结构 |
| qiyan233/meihua-divination | 未声明 License | 学习“可复现、可解释、偏趋势分析”的梅花式结构 |
| banderzhm/ZhouYiLab | MIT | 可作为后续多术数算法研究参考；当前未复制代码 |

## 当前已落地

代码入口：`mystic-systems.js`

- `bazi`：四柱八字结构层，输出日主、配偶宫、十神关系、五行强弱白话解释。
- `liuyao`：六爻用神层，按用户关注点选择事业、财运、感情、学习等用神。
- `meihua`：梅花体用层，用本卦/变卦的体用关系解释事件趋势。
- `ziwei`：紫微轻量入口，用宫位和四化作为补充视角，预留正式安星引擎接口。
- `qimen`：奇门轻量问事九宫，用宫、门、星、神输出行动判断，预留正式转盘排局接口。
- `yinyuan`：姻缘关系层，感情问题自动激活，结合日支/配偶宫和现实边界。
- `fengshui`：阳宅/办公轻量层，只基于五行弱项给空间习惯建议，不做完整玄空飞星。
- `tarot`：塔罗心理镜像层，使用确定性抽牌作为自我观察提示。

当前报告会自动加入“多术数交叉验证”章节；对话追问只选择最相关的 1-2 个体系解释，避免信息过载。

## 后续可做

- 接入 MIT 算法引擎时，优先做独立 adapter，不和业务逻辑耦合。
- 给 `mysticSystems.layers.ziwei` 接入完整紫微安星与四化。
- 给 `mysticSystems.layers.qimen` 接入完整奇门转盘排局。
- 给姻缘模块增加双人合盘输入与报告页。
- 给塔罗模块增加牌阵选择，但仍保持“心理镜像，不宣判命运”的边界。

# AI开发文档 · 奶茶挤挤（milktea）

> 跨设备上下文快照。新会话/换电脑优先读本文件与《项目设计文档》。详细设计分册见 `docs/`，本文件只做索引与事实快照，不替代分册。

## 1. 项目概览

- 名称：奶茶挤挤（开发名称，未做名称可用性确认）
- 类型：竖屏单人 2D 物理合成小游戏（奶茶杯投小料、同级接触升级、有限晃杯）
- 首发平台：抖音小游戏；个人主体，无营业执照
- 仓库：https://github.com/vinkinyyx/milktea （main 分支）
- 当前阶段：**P1-A 工程与物理基础（完成 + 修复）** —— 修复实现已提交（`fcd4b52`）；final14 验收证据已归档；九级小料美术源（.ora 分层）与 PNG 导出已落地；Creator 实机验收仍因本机未安装 Creator 而阻塞
- 参数基线：design-v0.1（`config/design-baseline.json` 为数值唯一来源）

## 2. 技术栈

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 引擎 | Cocos Creator 3.8 LTS（建议，补丁版待 P1 spike 锁定） | 本机尚未安装，工程未被编辑器实际打开验证 |
| 语言 | TypeScript | client 工程 |
| 物理 | 引擎集成 Box2D（JS/WASM 后端待锁定） | 不混用 Matter.js/Planck；不照搬最新 Box2D C API |
| 备选 | Phaser + Matter.js | 仅当转 H5 优先时重新评估，需重锁版本 |
| 工具链 | Python 3（仅标准库） | tools/ 下校验、同步、打包脚本 |
| 版本控制 | git + GitHub | 含 .gitattributes/.gitignore |
| 服务端（P3 才做） | TypeScript + 事务数据库 | 供应商与部署 P3 定案，P1 不引入云服务 |

## 3. 目录结构

```text
milktea/
├── AGENTS.md                 # 项目约定（强约束，开工必读）
├── README.md                 # 入口导航
├── client/                   # Cocos Creator 工程（P1-A）
│   ├── package.json          # name: milktea-p1a, uuid 固定
│   ├── tsconfig.json
│   ├── assets/
│   │   ├── scenes/           # Boot.scene、PhysicsLab.scene
│   │   ├── resources/config/ # design-baseline.json（由 config/ 同步生成）
│   │   └── scripts/
│   │       ├── bootstrap/AppRoot.ts
│   │       ├── contracts/types.ts        # 由 contracts/types.ts 同步
│   │       ├── core/Clock.ts             # 唯一物理时钟（固定步进）
│   │       ├── core/ConfigLoader.ts
│   │       ├── debug/PhysicsLab.ts
│   │       └── physics/                  # CocosPhysicsAdapter / CoordinateMapper / CupGeometry
│   └── validation/           # p1a-core-check.cjs、run-core-check.ps1 纯逻辑校验
├── config/                   # design-baseline.json（数值唯一来源）、rewarded-ad-policy.json
├── contracts/                # types.ts、api.openapi.json、schema.sql、examples.json
├── docs/                     # 17 分册设计文档 + development/ 13 阶段文档 + complete-design.md/html
├── assets/                   # image-elements.*（213项图像清单）、asset/audio manifest
│   └── art-source/           # P1-01_layered_recovery/ 九级小料 .ora 分层源 + @128/@256/@512 PNG 导出
├── tools/                    # Python 标准库脚本（见 §6）
├── evidence/<phase>/<buildId>/  # 阶段验收证据（当前有 P1-A/20261027-p1a-foundation）
├── research/                 # 上游技能快照与校验记录（仅学习资料，不执行其脚本）
└── output/                   # 交付 ZIP、playwright 阅读检查产物
```

## 4. 编码规范与项目约定（源自 AGENTS.md，必须遵守）

1. 阶段事实以 `README.md`、`docs/08-backlog-roadmap.md` 为准；**不把 P2/P3/P4 功能偷偷并入 P1**。
2. 已确认方向：个人主体、抖音首发、立体质感 2D、奶茶小料合成、逐款解锁、无限重玩、录屏奖励每日最多 5 次；**P1 无广告、无真实分享奖励**。
3. `config/design-baseline.json` 是参数唯一来源；数值是待验证初值，不得宣称平衡/性能/手感已通过。
4. **物理逻辑与表现分离**：禁止用动画直接驱动动态刚体；合成在物理步安全边界原子执行；计分只消费一次逻辑事件（幂等）。
5. 权威标识：每局唯一 runId、实体 entityId、合成 eventId、场景生命周期 epoch，字段均可序列化。
6. 缺失平台能力时明确标记不可用，**不返回假的分享成功/广告完成/排名**。
7. 物理回调顺序、接口、坐标不得凭印象猜测，以 Creator 对应安装版本官方文档为准。
8. 素材/音频/字体必须记录来源与使用权；密钥与真实用户数据不进仓库。
9. 新增功能先更新相关分册和延期表，保持需求编号、依赖、验收条件可追踪。
10. 静态检查、模拟器、真机、试玩分别记录，互不替代；未验证事项保持报告性质。

## 5. 模块信息（client 已实现部分）

| 模块 | 文件 | 职责 | 状态 |
| --- | --- | --- | --- |
| 引导 | bootstrap/AppRoot.ts | 工程入口、场景装配 | 已实现（未经编辑器验证） |
| 契约 | contracts/types.ts | 与 contracts/types.ts 同步的类型合同 | 已实现，同步校验通过 |
| 时钟 | core/Clock.ts | 唯一固定物理步时钟，防双步进 | 纯逻辑检查通过 |
| 配置 | core/ConfigLoader.ts | 加载 resources/config/design-baseline.json | 纯逻辑检查通过 |
| 物理适配 | physics/CocosPhysicsAdapter.ts | Box2D 后端封装、安全物理步边界 | 待 Creator 实机验收 |
| 坐标 | physics/CoordinateMapper.ts | 设计坐标↔物理坐标转换、重力换算 | 纯逻辑检查通过 |
| 杯几何 | physics/CupGeometry.ts | 静态杯边界 | 纯逻辑检查通过 |
| 调试 | debug/PhysicsLab.ts | PhysicsLab 场景：三圆/堆积/重力实验 | 待引擎运行验收 |

尚未开始：core 的 Session/Score/MergeRules/Rng、presentation、persistence（双槽 A/B 存档）、platform（LocalAdapter/DouyinAdapter）。

## 6. 本地启动与常用命令

前置：Python 3（仅标准库）；Node 环境用于纯逻辑校验；Cocos Creator 3.8 LTS **本机未安装**（P1-A 阻塞项）。

```powershell
# 纯逻辑校验（不需要 Creator）
powershell client/validation/run-core-check.ps1

# 图像清单 → 校验 → 生成交付
python tools/build_image_catalog.py        # 重建 assets/image-elements.*
python tools/validate_design.py --build    # 生成总案/开发手册并检查链接、配置、契约
python tools/prepare_publish.py --archive  # 生成 output/ 交付 ZIP
python tools/sync_design_config.py         # config/ → client/assets/resources/config/ 同步
python tools/sync_client_contracts.py      # contracts/types.ts → client 同步
```

验证证据归档：`evidence/<phase>/<buildId>/`（acceptance.md / environment.json / cases.csv / issues.md / screenshots/ / metrics.json）。

## 7. 第三方依赖与许可

- client 目前无 npm 运行时依赖（package.json 仅元信息）。
- research/upstream/ 保存 13 份 SKILL.md + 4 份许可证（cocos-creator-mobile-game、agent-skills、open-game-skills、ag-kit），仅作方法参考，未安装为全局技能、未执行其脚本；快照与校验见 research/skills-manifest.json。
- 第三方声明见 THIRD_PARTY_NOTICES.md。

## 8. 踩坑点与风险（继承自 docs/11）

- Creator 未安装：工程能否被编辑器打开、Box2D 场景能否运行均未实锤 —— P1-A 收口前必须先装环境。
- 不要把 GitHub 最新 Box2D C API 套进 Creator 集成后端。
- 恢复存档只保存位姿/速度，求解器内部缓存不可恢复，恢复偏差需实测。
- 客户端 "success" 回调不是服务端不可伪造证明（P3-B 验分/领券前置）。
- 游戏名未做重名/权利核查。

## 9. 历次修改记录

| 日期 | 提交 | 内容 |
| --- | --- | --- |
| 2026-11-05 | e6f9b75 | Sync current Milktea project snapshot（README/docs/tools 全量同步） |
| 2026-11-05 | fcd4b52 | Add P1-A repair implementation and final14 evidence（P1-A 修复 + final14 验收证据 + 九级小料 .ora 分层源与 PNG 导出 + 完整 QA 清单） |
| 2026-10-27 | f10b0dc | feat: P1-A Cocos 物理基础（工程骨架、Clock、ConfigLoader、物理适配、PhysicsLab、纯逻辑校验） |
| 2026-10-27 | be7a0fd | docs: v0.2 阶段拆分、开发契约与完整美术清单 |
| 2026-10-27 | 98179d7 | docs: 初始化开发交接 |
| 2026-10-27 | （本地） | 克隆仓库至本机；新增 doc/ 双文档上下文快照 |
| 2026-11-05 | （本地） | git pull 同步 origin/main（+2 commits）；增量更新 doc/ 双文档 |
| 2026-11-05 | （本地整改 R1–R4） | Tap 宿主空屏诊断加固 + 洒出复活边界修复（见下） |

### R1–R4  Tap 宿主发布整改（2026-11-05）

修复触发：docs/44-tap-host-start-review.md 验收未通过（BLOCKED）。

| 编号 | 根因 | 修复 | 文件 |
| --- | --- | --- | --- |
| R1 | Tap 宿主空屏：ArtAssets 无应用级截止/超时；GameRoot.render 缺独立错误兜底 | GameRoot 加 DiagnosticRing stages（BOOT_CONFIG/SAVE_READ/ART_CATALOG/MENU_READY）；ArtAssets 加 FOREGROUND_LOAD_TIMEOUT_MS=15s + externalGeneration 取消 | GameRoot.ts, ArtAssets.ts |
| R2 | 奖励 commit 成功后 readback 失败：内存 revision 停在旧值→CAS 冲突；retry 用旧 revision 重写冲突 | settle commit 成功先 sync revision 再 readback（readback 只是二次校验）；retrySettlement 先 readBundle 确认 receipt+used1 已落盘→免费 apply，不重新走 CAS | SpillReviveService.ts |
| R3 | 广告取消/未看完/load 失败 → clearPending 默认 resume=true → declineSpillRevive → SETTLING，违背可重试设计 | clearPending 默认 resume=false：只清 pendingAttempt 保留 pendingFailure；declineSpillRevive 仅由 closeOffer/abandonPending 显式调用 | SpillReviveService.ts |
| R4 | maxDailyRevives=3 强制阻断，未经用户授权（原需求只有"每局一次"） | ReviveLedger.checkOffer 移除 DAILY_LIMIT 阻断；SpillReviveService.settle 移除每日上限检查。保留 ledger 日键/receipt 历史用于审计 | ReviveLedger.ts, SpillReviveService.ts |

**保留项验证**：
- ✅ Tap 顶层 isEnded===true 才发奖（RewardedAdCoordinator 未改，declineSpillRevive 仍保留）
- ✅ 两广告互斥（RewardedAdCoordinator.claim/release 未改）
- ✅ 同分同 run 续玩（RunEngine.applyRevive 未改，reviveReceiptId 匹配）
- ✅ 原子存档（LocalSaveRepository.commitBundle 双槽 CAS 未改）
- ✅ 崩溃恢复（ReviveLedger pendingAttempt 保留+readback envelope 校验未改）
- ✅ 120tick 落料缓冲（RunEngine reviveOptions.autoDropDelayTicks 未改，policy 里仍是 120）
- ✅ Mock 不冒充真实广告位（provider.capability() !== 'tap' 标记 simulated=true；adUnitId=null 时策略 disabled）

**未关闭的宿主项**（无设备/真实广告位，BLOCKED）：
- Tap 宿主首条真实错误堆栈 + 上传包 SHA 核对
- 真实广告位 onClose isEnded===true 验证
- Tap 冷启/低中高机型/约400MB 峰值内存复测
- 真机晃杯/广告前后台/洒出物理验证
- probe-revive-boundaries.cjs Node 运行（本机未装 Node）

## 10. 下一步（按 13 阶段表）

1. 安装 Cocos Creator 3.8 LTS，打开 client 工程，锁定补丁版与 Box2D 后端 → 完成 P1-A 实机验收（重力转换、三圆/压力堆积不穿杯、重开不泄漏）。
2. 进入 P1-B：九级投放/合成/得分/晃杯/危险/结算、暂停、双槽存档（详见 docs/development/p1b-gameplay.md）。

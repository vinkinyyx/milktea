"""Refresh active entry points after archival; do not rewrite original evidence or supplied art documents."""
from pathlib import Path
import json, os, re, shutil, hashlib

ROOT=Path(__file__).resolve().parents[3]
ARCHIVE=ROOT.parent/'_cleanup-backups/奶茶挤挤-20261105-project-cleanup'
HERE=Path(__file__).parent
PLAN=json.loads((HERE/'plan.json').read_text(encoding='utf-8'))
TAP='20261104-spill-revive-tap-02'
SHA='f768704568d3c43a7122f2a205a79f253650026c3a6a13d4512a0e7ddcd93a3e'
updates={
'README.md':'''# 奶茶挤挤

竖屏2D奶茶小料合成游戏。Cocos Creator 3.8.8；发布目标为 TapTap 小游戏 `game.zip`。

**当前验收未通过，整改尚未执行。** Tap自测只有背景、复活领取回读失败、取消广告提前结算及未经授权的每日复活上限仍待修复。真实广告与平台启动/内存复测未完成。

- [当前事实与待办](docs/22-current-progress-and-resume.md)
- [最新验收报告](docs/44-tap-host-start-review.md)
- [下一轮开发执行提示词](evidence/Acceptance/20261105-tap-host-review/execution-prompt.md)
- [唯一候选及SHA](output/taptap-upload/CURRENT-CANDIDATE.md)
- [文档导航](docs/README.md)、[开发交接](docs/13-developer-handoff.md)、[工具命令](tools/README.md)
- [素材与来源](assets/README.md)、[历史归档与清理记录](docs/archive-location.md)

工程为 `奶茶挤挤/`。参数来源是 `config/design-baseline.json`，配置镜像校验通过；根 `contracts/types.ts` 落后于工程复活类型，合同镜像校验未通过，须后续合并，不能用旧根文件直接覆盖工程。排行榜、五款、云档、奖励券仍属于后续需求。

2026-11-05整理：旧构建和缓存已移除，历史文档、原始证据与旧ZIP移到项目外归档。保留现用源码、开发依赖、素材原稿、音频、技能、最新Web Debug/Release、一个Tap ZIP及必要派生验证快照。清理未修改游戏运行代码，未上传或发布。
''',
'AGENTS.md':'''# 奶茶挤挤项目约定

- 当前事实入口：README.md、docs/22-current-progress-and-resume.md。当前待执行整改为docs/44-tap-host-start-review.md及其中执行提示词；历史记录不能覆盖最新验收。
- 目标是Cocos Creator3.8.8经Tap扩展发布Tap小游戏，非H5托管或APK。不得擅自换引擎、恢复已暂停的抖音/APK路线或扩大核心玩法。
- 经典窄杯、定时自动落料、按住杯子真实左右移动、同级合成。复活需求是洒出时自愿完整观看激励视频，同局同分继续，每局最多一次成功复活；无授权不添加每日上限。
- 参数唯一源是config/design-baseline.json，类型唯一源是contracts/types.ts，修改时校验工程镜像。待验证初值不能宣称已通过平衡或性能验收。
- 物理与表现分离。杯子通过Kinematic刚体移动，动态小料不随节点直接平移。合成在安全物理边界原子提交，事件计分去重；动画不能驱动动态刚体。
- 按任务读取docs/10-research-skills-frameworks.md及相关技能快照；外部示例和默认数值不得覆盖项目规则。API按安装的Creator版本及实际Box2D后端核验。
- 素材取用先读assets/README.md与运行catalog。assets2、assets/library、audio中的原稿与许可证保留；新的运行导出必须记录来源。截图模板或平台合同不能冒充已接入贴图。
- 未实现内容保留需求编号和验收条件。区分静态检查、浏览器操作、实体手机、Tap宿主和真实广告证据，不互相替代。BLOCKED状态只能由对应缺陷和实测证据关闭。
- 只修改本项目，保护并发工作、原稿与用户数据。清理先核对绝对范围，历史证据/旧文档可恢复归档，缓存可删；清理入口见docs/archive-location.md。
- 涉及Tap API、SDK、广告、存档、发布或资质时，先读取对应官方Skill及最新官方文档，区分Cocos小游戏/H5/APK/Maker。不得把H5 MCP工作流套给Cocos小游戏。
- 构建与上架准备执行项目Skill taptap-release-readiness；每次用新buildId。客户端不含服务器密钥、签名密钥或令牌，报告不写原始敏感数据。
- 上传、提审、发布、删除线上数据、付费或修改线上应用前，须有用户对具体动作的明确授权；本地检查与构建不代表已上传或平台通过。
''',
'docs/22-current-progress-and-resume.md':f'''# 当前事实与继续入口

2026-11-05。**BLOCKED；最新验收的整改尚未执行。**

已具备：窄杯、自动落料、真实移杯、V2/9:20素材、局部动画、物理事务恢复、分阶段贴图加载和纹理派生；广告晃杯与洒出复活有本地实现，正式广告策略关闭。

最新复核：111/111既有自动回归、类型检查及71+7优化资源检查通过。Web Release实际开始/教程/落料/暂停/继续正常。额外故障注入发现复活奖励提交后回读失败，领取重试永久CAS冲突；取消广告直接结算和每日3次限制偏离原需求。

仍需完成：

1. Tap自测点击开始后只剩背景，需核对上传SHA和首条宿主错误，修复实际首次失败并验证杯/HUD/按钮可操作。
2. 免费恢复已提交复活凭证；未完整观看/加载失败保留同failure手动重试；撤掉未经授权的每日3次限制。
3. 真机晃杯最初物理异常、真实广告、启动速度和旧平台约400MB内存峰值复测；动画其余缺口按docs42保留。
4. 清理复核发现根contracts/types.ts尚未合入工程新增的复活/schema类型，合同镜像检查失败；两份文件与清理前哈希相同。后续正确合并并校验，不运行旧根合同直接覆盖工程的同步操作。

- [最新验收/复现/测试场景](44-tap-host-start-review.md)
- [当前开发执行提示词](../evidence/Acceptance/20261105-tap-host-review/execution-prompt.md)
- [复活产品与原子存档设计](43-spill-revive-performance-design.md)
- [平台与构建](38-taptap-minigame-current.md)

当前保留候选：

- Tap：`{TAP}`，3,021,177 bytes，SHA256 `{SHA}`。路径见[唯一候选](../output/taptap-upload/CURRENT-CANDIDATE.md)，未作为正式通过包交付。
- Web Release：`build-artifacts/cocos-p1b-build/20261104-spill-revive-web-release-02/`。
- Web Debug：`build-artifacts/cocos-p1b-build/20261104-spill-revive-debug-03/`，仅用于开发验证。
- 派生复核快照：`build-artifacts/cocos-p1b-build-source/{TAP}/`，保留assets/settings等；依赖、导入缓存和转换中间物已清除，不作为另一个开发工程。

当前未核对用户上传包SHA，不能把手机截图自动归属于上述候选。所有旧候选与阶段报告改读[项目外归档](archive-location.md)。清理没有实施上述整改，没有新打包、上传、提审或发布。
''',
'docs/13-developer-handoff.md':'''# 当前开发交接

先读[当前事实](22-current-progress-and-resume.md)和[最新验收](44-tap-host-start-review.md)，随后执行[本轮整改提示词](../evidence/Acceptance/20261105-tap-host-review/execution-prompt.md)。复活业务与持久化要求以[docs43及其分册](43-spill-revive-performance-design.md)为依据；不要执行历史归档中的旧阶段队列。

工程：`D:\\Workspace\\TapTap\\奶茶挤挤\\奶茶挤挤`，Creator3.8.8，Boot为玩家入口。唯一配置与类型源位于根config/design-baseline.json、contracts/types.ts。物理固定步、真实刚体移杯、原子合成与事件去重保持；动画不能直接驱动物理。

[工具入口](../tools/README.md)列出实际检查与构建命令；[Tap入口](38-taptap-minigame-current.md)记录唯一候选和未验证项。使用新buildId，不覆盖已有证据。不把回归通过或构建成功当作Tap真机通过。

素材原稿和运行资源保留，见[素材说明](../assets/README.md)。导入缓存已清理，首次打开编辑器会重新导入；工程及Tap扩展的现用node_modules保留。旧阶段资料和包体见[归档入口](archive-location.md)。
''',
'docs/38-taptap-minigame-current.md':f'''# TapTap小游戏当前入口

当前形态：Creator3.8.8 + 工程内taptap-minigame-tools1.2.2，经中间构建转换Tap小游戏。配置在config/taptap-minigame.json；当前不是H5托管或APK。

**BLOCKED**：用户反馈Tap自测开局只有背景；复活逻辑有新增验收缺陷；真实广告、晃杯异常根因、启动和内存平台复测均未关闭。详见[docs44](44-tap-host-start-review.md)。

唯一保留Tap候选：[game.zip](../build-artifacts/cocos-taptap-minigame-build/{TAP}/TapBuild/game.zip)，buildId `{TAP}`，3,021,177 bytes，SHA256 `{SHA}`。本地转换通过、runtimeVerified=false，复活策略enabled=false/adUnitId=null。用户已上传的文件身份仍待核对。

- [候选清单](../output/taptap-upload/CURRENT-CANDIDATE.md)
- [构建原始结果](../evidence/TapTap/{TAP}/result.json)
- [优化资产复核](../evidence/TapTap/{TAP}/optimized-asset-verification.json)
- [检查与构建命令](../tools/README.md)
- [历史包和资料归档](archive-location.md)

清理保留最新ZIP及验证所需派生快照，删除解压副本、旧转换输出和构建缓存。未重新打包、上传、提审或发布。后续构建须用新buildId；缺少真实广告配置和实测证据时保持关闭策略。
''',
'tools/README.md':'''# 工具入口

当前工作以[最新验收与提示词](../docs/44-tap-host-start-review.md)为准。清理不修改运行代码，不表示验收通过。

在项目根执行现有检查：

```powershell
python -X utf8 tools/sync_design_config.py --check
python -X utf8 tools/sync_client_contracts.py --check
npm run typecheck --prefix 奶茶挤挤
npm run verify:art --prefix 奶茶挤挤
node tools/verify_rewarded_shake.cjs
```

`verify_rewarded_shake`会重建build-artifacts/rewarded-tests；该目录是缓存。现有111项只覆盖已写场景，额外复活故障复现位于evidence/Acceptance/20261105-tap-host-review/probe-revive-boundaries.cjs。

构建每次使用新唯一ID，不能照抄现有候选ID：

```powershell
python -X utf8 tools/build_cupauto_web.py --build-id NEW_UNIQUE_WEB_ID --mode release
python -X utf8 tools/build_taptap_minigame.py --build-id NEW_UNIQUE_TAP_ID --version 0.1.3
```

版本示例不表示后台已接受。两种构建使用隔离副本，调用prepare_p1c_release_assets；Tap还使用strip_p1c_release_debug与工程内扩展，不修改原始工程和原稿。

原稿使用verify_runtime_art严格检查。优化包使用以下派生核验，不把原稿哈希直接套给缩放后的PNG：

```powershell
python -X utf8 tools/verify_optimized_assets.py --build-id 20261104-spill-revive-tap-02 --evidence-dir evidence/TapTap/20261104-spill-revive-tap-02 --package build-artifacts/cocos-taptap-minigame-build/20261104-spill-revive-tap-02/TapBuild/game.zip
```

optimize_runtime_assets只处理隔离镜像；当前保留一个最小Tap派生快照用于复核。prepare_v2_art是素材重导出工具，prepare/install均应按需使用；清理后历史output/v2-art-runtime移至归档，不要把旧安装清单覆盖当前素材。

一次性清理脚本、计划、执行日志与复核位于[清理记录](../evidence/maintenance/20261105-project-cleanup/)。历史文档与包体位置见[归档入口](../docs/archive-location.md)。
''',
'奶茶挤挤/README.md':'''# 奶茶挤挤 Cocos工程

使用Creator3.8.8打开本目录。Boot为玩家入口，源码在assets/scripts，运行图在assets/resources/art/p1/v2；构建时分配Bundle。

参数与类型由根config/design-baseline.json、contracts/types.ts同步。工程及Tap扩展依赖保留；library/temp等导入缓存已清理，首次打开会重新导入。

当前状态见[当前事实](../docs/22-current-progress-and-resume.md)，待执行整改见[最新验收](../docs/44-tap-host-start-review.md)。正式交付仍BLOCKED。原稿、许可证与旧证据见[素材入口](../assets/README.md)和[归档入口](../docs/archive-location.md)。
''',
'docs/archive-location.md':'''# 历史归档与清理

2026-11-05清理归档：

`D:\\Workspace\\TapTap\\_cleanup-backups\\奶茶挤挤-20261105-project-cleanup`

目录内保留原相对路径：旧文档、旧验收原始证据、旧Tap ZIP和旧交付文件可找回；修改前的现行入口文档位于_active-docs-before-cleanup。此归档位于项目之外，不随当前项目发布。

- [清理计划](../evidence/maintenance/20261105-project-cleanup/plan.json)
- [执行记录](../evidence/maintenance/20261105-project-cleanup/execution.jsonl)
- [归档逐文件SHA256](../evidence/maintenance/20261105-project-cleanup/archive-files.jsonl)
- [清理后验证](../evidence/maintenance/20261105-project-cleanup/validation.json)

可再生的旧Web/转换中间物、源码构建副本、node_modules副本、library/temp、测试编译缓存与临时自动化输出直接删除，不承诺从归档恢复；使用现用源码和tools中的构建脚本重新生成。原工程开发依赖及Tap扩展保留，素材原稿、许可证、音频、配置、公共类型均保留。

需要历史材料时按原相对路径从归档复制单项，先核对hash，避免整个归档覆盖当前源码。当前报告中的历史链接可能指向项目外归档；历史文档内旧可执行包路径不表示产物仍有效。

更早的2026-11-03归档仍位于 `D:\\Workspace\\TapTap\\_cleanup-backups\\奶茶挤挤-20261103-review-cleanup`。本轮不删除该归档或父目录其它项目。

当前工作只使用[最新事实](22-current-progress-and-resume.md)、[最新验收](44-tap-host-start-review.md)及[唯一候选](../output/taptap-upload/CURRENT-CANDIDATE.md)。
''',
'docs/README.md':'''# 文档导航

## 当前执行

- [当前事实与未完成项](22-current-progress-and-resume.md)
- [最新独立验收与整改设计](44-tap-host-start-review.md)
- [开发执行提示词](../evidence/Acceptance/20261105-tap-host-review/execution-prompt.md)
- [复活产品/存档/性能分册](43-spill-revive-performance-design.md)
- [动画与自然落料设计](42-animation-start-physics-design.md)，已做与未做以最新验收为准
- [开发交接](13-developer-handoff.md)、[Tap入口](38-taptap-minigame-current.md)

## 规则与参考

- [需求](01-requirements.md)、[玩法设计](02-game-design.md)、[物理规格](03-physics-spec.md)、[技术架构](06-technical-architecture.md)
- [后续进度与社交功能](07-progression-social-operations.md)、[验收要求](09-qa-acceptance.md)
- [美术制作](14-image-production.md)、[音乐设计](21-music-design.md)
- [项目简报](00-project-brief.md)、[技能快照与研究](10-research-skills-frameworks.md)、[Cocos MCP配置](23-cocos-mcp-setup.md)
- [历史资料与清理](archive-location.md)

旧阶段执行计划已经移至项目外归档，不能作为当前任务队列；基础规格如与新参数/明确需求冲突，以唯一配置源和最新验收设计为准。未实现的后续功能仍保留需求，不因清理视为已完成或取消。
'''
}

def backup(p):
    if not p.exists():return
    dest=ARCHIVE/'_active-docs-before-cleanup'/p.relative_to(ROOT)
    if not dest.exists():dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)

for rel,text in updates.items():
    p=ROOT/rel;backup(p);p.write_text(text,encoding='utf-8')
# Keep design bodies; explicitly supersede their old status and old execution prompts.
for p in (ROOT/'docs/development').rglob('*.md'):
    backup(p)
    prefix='> 当前事实与执行以[最新独立验收](../../44-tap-host-start-review.md)为准；本分册保留需求/设计依据，其中旧完成状态和旧提示词不能覆盖最新整改。\n\n'
    p.write_text(prefix+p.read_text(encoding='utf-8-sig'),encoding='utf-8')
p=ROOT/'docs/43-spill-revive-performance-design.md';backup(p)
old=p.read_text(encoding='utf-8-sig');body=old.split('## 阅读入口',1)[1]
body=body.replace('| [01 实现验收和交付判断](development/spill-revive/01-delivery-review.md) | 当前已做/未做、新旧包、缺陷、真实验证边界 |','| [最新独立验收](44-tap-host-start-review.md) | 当前缺陷、实际验证与未验证边界 |')
body=body.replace('| [05 开发执行提示词](development/spill-revive/05-execution-prompt.md) | 下一轮实际开发任务 |','| [当前开发执行提示词](../evidence/Acceptance/20261105-tap-host-review/execution-prompt.md) | 下一轮实际整改任务 |')
prefix='''# 洒出复活产品、存档与性能设计

2026-11-05：复活已有本地实现，但[最新独立验收](44-tap-host-start-review.md)未通过。用户尚未执行该轮整改；奖励回读恢复、取消广告提前结算、每日限制偏差与Tap背景空屏仍开放。正式广告关闭，真机与平台性能未验。

以下保留复活需求和设计依据。优化对照及旧复测候选属于历史证据；唯一当前候选以docs38/当前事实为准，不执行旧阶段提示词。

## 阅读入口'''
p.write_text(prefix+body,encoding='utf-8')

# Repair links in active author-maintained documents, leaving supplied sources and evidence immutable.
archived=[r['path'] for r in PLAN['actions'] if r['action']=='archive']
changed=[];missing=[]
active=list((ROOT/'docs').rglob('*.md'))+[ROOT/x for x in ['README.md','AGENTS.md','tools/README.md','奶茶挤挤/README.md']]
for md in active:
    text=md.read_text(encoding='utf-8-sig')
    def rewrite(m):
        value=m.group(1)
        if '://' in value or value.startswith('#') or value.startswith('mailto:'):return m.group(0)
        raw=value.strip('<>');pathpart,sep,anchor=raw.partition('#')
        target=Path(os.path.abspath(md.parent/pathpart))
        if target.exists():return m.group(0)
        if target.is_relative_to(ROOT):
            rel=target.relative_to(ROOT).as_posix()
            dest=ARCHIVE/rel
            if dest.exists():
                new=os.path.relpath(dest,md.parent).replace('\\','/')+(sep+anchor if sep else '')
                changed.append({'file':md.relative_to(ROOT).as_posix(),'from':value,'to':new})
                return ']('+('<'+new+'>' if ' ' in new else new)+')'
            old_archive=ROOT.parent/'_cleanup-backups/奶茶挤挤-20261103-review-cleanup'/rel
            if old_archive.exists():
                new=os.path.relpath(old_archive,md.parent).replace('\\','/')+(sep+anchor if sep else '')
                changed.append({'file':md.relative_to(ROOT).as_posix(),'from':value,'to':new})
                return ']('+('<'+new+'>' if ' ' in new else new)+')'
        missing.append({'file':md.relative_to(ROOT).as_posix(),'target':value})
        return m.group(0)
    after=re.sub(r'\]\(([^)]+)\)',rewrite,text)
    if after!=text:backup(md);md.write_text(after,encoding='utf-8')
(HERE/'document-links.json').write_text(json.dumps({'rewritten':changed,'unresolved':missing},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'entryPointsWritten':len(updates),'relocatedLinks':len(changed),'unresolvedLinks':len(missing)},ensure_ascii=False))

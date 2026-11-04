from pathlib import Path
import os,re,json,shutil
ROOT=Path(__file__).resolve().parents[3]
HERE=Path(__file__).parent
ARCHIVE=ROOT.parent/'_cleanup-backups/奶茶挤挤-20261105-project-cleanup'
def put(rel,text):
    p=ROOT/rel;dest=ARCHIVE/'_active-docs-before-cleanup'/rel
    if p.exists() and not dest.exists():dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
    p.write_text(text,encoding='utf-8')
put('assets/README.md','''# 素材入口

运行图片以[工程catalog](../奶茶挤挤/assets/resources/art/p1/catalog.json)为准：V2精选71项，来源为assets2中的六批、补充包和9:20背景；动画资源另有7项映射。实际接入及缺口以[最新验收](../docs/44-tap-host-start-review.md)和[动画设计](../docs/42-animation-start-physics-design.md)为准，不把图集存在当作全部效果完成。

- `assets2/`：六批、新背景、动画及补充素材原包，保留，不全量打包。
- [旧制作库索引](library/catalog.json)：原稿、母版、原始导出和来源/使用权；不代表当前运行绑定。
- [逐项图片规格](image-elements.json)：制作计划与后续需求，planned/deferred不表示已交付。
- 根`audio/`：正式渲染、九项运行音频、无损母版与来源，工程assets/resources/audio/p1c为运行副本。
- [音频标准](audio/production-requirements.md)、[音频设计](audio/design/README.md)、[音乐设计](../docs/21-music-design.md)。

构建工具仅在隔离副本生成较小派生纹理，原稿和根catalog保持。优化后单份RGBA预算不等于设备进程峰值，不能据此关闭平台约400MB问题；派生核验见[工具入口](../tools/README.md)。素材许可待核项不因接入或清理变为已确认。

2026-11-05清理只更新本说明，图片、音频、原始素材文档、目录索引和许可证未改；历史导出工作区与旧审查资料见[归档入口](../docs/archive-location.md)。需要重新导出时使用prepare_v2_art重新prepare，不直接安装旧归档里的选择清单。
''')
put('docs/42-animation-start-physics-design.md','''# 动画、开局与自然落料设计

本页保留2026-11-04设计依据；其中部分已在本地实现。当前缺陷、已执行验证和下一轮工作只按[最新独立验收](44-tap-host-start-review.md)，不要重跑已归档的旧执行提示词。

| 分册 | 内容 |
|---|---|
| [开局与UI可达性](development/animation-start-physics/02-start-flow.md) | 首局、教程、继续、失败出口及无按钮场景 |
| [动画接入设计](development/animation-start-physics/03-animation-integration.md) | 效果映射、资源、事件、暂停、减少动态与性能 |
| [自然落料与堆积](development/animation-start-physics/04-natural-piling.md) | 独立随机流、确定性偏移、物理和存档测试 |
| [逐项测试案例](development/animation-start-physics/test-cases.csv) | 设计用例；不等同全部已执行 |

当前本地具备加载态开局、教程出口、自动落料、真实移杯、自然微偏移及部分序列帧动画。仍需按最新验收处理Tap宿主背景空屏、真机晃杯、广告/性能，以及尚未闭合的动画与生命周期项。场景转场、猫咪动态、危险提示/连击反馈的实现边界应逐项实测，禁止因素材已拷贝就写全部完成。

旧80项/20种子/转换包的原始结果保留在[项目外历史归档](archive-location.md)，不能替代当前同SHA实体Tap宿主验收。[当前事实](22-current-progress-and-resume.md)、[当前开发提示词](../evidence/Acceptance/20261105-tap-host-review/execution-prompt.md)和[候选入口](../output/taptap-upload/CURRENT-CANDIDATE.md)为现行入口。
''')
p=ROOT/'docs/43-spill-revive-performance-design.md';text=p.read_text(encoding='utf-8')
text=text.replace('新复测候选：`20261104-recovery-memory-tap-release-02`，构建产物版本0.1.2，SHA256 `866003f6f6e667f4514b0fd2a62479534acbe4c8ca4dc2e8f82fe53c3fe956c9`。正式广告仍关闭、未加入复活、未上传。只能作为**复测候选**，不能标READY_TO_REVIEW。','上述性能对照对应历史0.1.2候选，已归档；当时尚无复活。当前唯一Tap候选及SHA见[平台入口](38-taptap-minigame-current.md)，不能将旧包描述作为当前实现状态。')
text=text.split('## 执行顺序',1)[0]+'''## 当前执行顺序

1. 按docs44定位Tap实际首次失败，加入可操作的加载/错误出口，修复背景空屏。
2. 修复已实现复活中的回读恢复、未完成视频重试和每日上限偏差；补新增故障回归。合并根合同遗漏的复活类型，不能用旧合同覆盖工程。
3. 补齐动画生命周期缺口，复测手机晃杯的最初异常；技术恢复免费，不占复活额度。
4. 用新唯一buildId生成Debug/Web/Tap；同SHA验证冷启、低中高设备内存、10分钟/20次重开及真实广告。旧平台失败在新结果出来前保持开放。
5. 更新唯一候选和交付清单。没有对应设备/广告/平台证据就保留BLOCKED；无授权不上传、提审或发布。
'''
put('docs/43-spill-revive-performance-design.md',text)
p=ROOT/'progress.md';text=p.read_text(encoding='utf-8')
put('progress.md',text+'\n2026-11-05清理：旧构建/缓存移除，旧文档/证据/ZIP项目外归档；当前入口精简。运行源码未改。合同镜像检查发现原有差异，未盲目同步；详见evidence/maintenance/20261105-project-cleanup/validation.json。\n')
mds=list((ROOT/'docs').rglob('*.md'))+[ROOT/r for r in ['README.md','tools/README.md','奶茶挤挤/README.md','assets/README.md']]
changed=[];missing=[]
for md in mds:
    before=md.read_text(encoding='utf-8-sig')
    def relink(m):
        val=m.group(1);raw=val.strip('<>')
        if '://' in val or val.startswith('#') or val.startswith('mailto:'):return m.group(0)
        path,sep,anchor=raw.partition('#');target=Path(os.path.abspath(md.parent/path))
        if target.exists():return m.group(0)
        if target.is_relative_to(ROOT):
            rel=target.relative_to(ROOT)
            for base in [ARCHIVE,ROOT.parent/'_cleanup-backups/奶茶挤挤-20261103-review-cleanup']:
                dest=base/rel
                if dest.exists():
                    new=os.path.relpath(dest,md.parent).replace('\\','/')+(sep+anchor if sep else '')
                    changed.append({'file':md.relative_to(ROOT).as_posix(),'from':val,'to':new})
                    return ']('+('<'+new+'>' if ' ' in new else new)+')'
        if raw!='../evidence/maintenance/20261105-project-cleanup/validation.json':missing.append({'file':md.relative_to(ROOT).as_posix(),'target':val})
        return m.group(0)
    after=re.sub(r'\]\(([^)]+)\)',relink,before)
    if after!=before:put(md.relative_to(ROOT).as_posix(),after)
(HERE/'final-document-links.json').write_text(json.dumps({'rewritten':changed,'unresolved':missing},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'linksRewritten':len(changed),'unresolved':missing},ensure_ascii=False))

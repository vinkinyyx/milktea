> 当前事实与执行以[最新独立验收](../../44-tap-host-start-review.md)为准；本分册保留需求/设计依据，其中旧完成状态和旧提示词不能覆盖最新整改。

# 开始后只剩背景或杯子：完整定位及修复设计

## 1. 范围与优先级

用户确认手机只有背景或杯子，没有按钮；这是P0可玩性问题。浏览器Release当前可见教程下一步/跳过，不能据此否定Tap报告。先保证开局可达，再增加动画；不依赖新特效成功来显示基础按钮。

先记录手机使用包的version/buildId/SHA、系统/机型/Tap宿主版本、首装或旧档、首次教程或已完成、点击路径及网络状态。最新截图显示正常HUD和两按钮，需区分当时是否已重开/恢复/另一版本；不能把“某次可玩”当全部入口通过。未拿到设备时，交付清晰诊断路径并保持START-01开放。

## 2. 定向排查顺序

1. **包身份**：核对测试ZIP是否当前7c1646…候选，区分Web05、Tap03、历史包；Debug/Release剥离源码一致性核对，避免拿旧截图验证新包。
2. **开局事务**：记录`start.request -> rules/art ready -> world created -> initial save -> clock ready -> UI built -> tutorial/game ready`。每步带ownerEpoch和错误分类；异步保存失败不能只留下杯体。
3. **逻辑状态**：采样screen、engine.phase、tutorialStep、clock.paused、pauseOwners、loading/artLoading、按钮id列表、加载进度。PLAYING+engine.PAUSED+MODAL+tick0可能是正常教程，但必须同时可见下一步/跳过。
4. **渲染状态**：Canvas/Camera是否有效，UIRoot active/opacity/scale、按钮节点active/opacity、SpriteFrame/Label、layer/camera visibility、sibling排序、遮罩裁切、world/screen bounds和实际safe-area。按钮存在但看不到，优先查层/相机/裁切；按钮列表为空则查状态转换/异常和render销毁。
5. **资源/剥离**：检查Tap common/classic bundle分发、button和font路径、release AST脚本是否误删运行代码；主UI贴图加载失败时纯色+Label fallback必须出现。不能因为背景加载成功就断言所有资源就绪。
6. **输入**：按钮可见后再查tap.getUILocation/触摸取消/rect；用户当前说“看不到”，不能只扩大点击区就宣称修好。

诊断是短期受控或玩家主动导出，不在Release暴露fixture/任意写档全局API；不记录登录code或广告用户信息。最低限度可在设置显示版本及构建短ID，卡点可用轻量诊断条提供build/阶段/短错误码，默认不让普通玩家看到工程术语。

## 3. 稳定状态机和开局事务

建议UI显式区分`MENU -> STARTING -> TUTORIAL | PLAYING | PAUSED | ERROR`，教程不再只靠PLAYING上的隐式tutorialStep遮罩。可继续复用engine的PhaseState，不强行同步增加所有引擎状态；UI阶段和物理状态建立不变量：

| UI阶段 | engine/clock | 必须显示的入口 |
|---|---|---|
| MENU | 无活动推进 | 开始/继续/设置 |
| STARTING | 不推进 | 进度/返回菜单；达到期限显示重试 |
| TUTORIAL | 暂停，MODAL锁 | 下一步/跳过/最后开始 |
| PLAYING | 可推进，锁为空 | 晃杯/暂停，规则提示 |
| PAUSED | 暂停 | 继续/菜单/设置 |
| ERROR | 暂停，不写坏档 | 重试/回菜单，必要时内存新局 |

构建下一页时先在独立container完成基础UI，再原子切换，失败保留旧页或可靠错误页；不要先销毁唯一可操作UI再await所有资源。背景和杯体可以准备，但新局未就绪前不能把界面标PLAYING。初始保存、生命周期和所有者检查继续遵守CAS规则。

所有路径用try/catch/finally释放loading并触发状态差量刷新；owner失效不向新页写状态。不得在finally无条件resume物理，是否开跑由最终UI阶段和pauseOwners决定。教程完成先切为可操作状态；保存教程标记失败提供可重试提示，不把界面锁在空白等待。新档/旧rules档/重看教程分别测试。

本地资源开局等待拟定10秒软超时：显示“准备时间较长，可重试或返回”，不中断仍在进行的原子写盘，不因超时假装保存成功。若服务支持取消，以generation作废旧回调；若不支持，保留pending保存直到结束，期间不允许并发新局覆盖。

## 4. 显式UI层次

建议稳定树：`Canvas -> BackgroundRoot / GameWorldRoot / GameplayFxRoot / HudRoot / PageRoot / ModalRoot / ToastRoot / RecoveryRoot`。现有物理根和前后杯层可保留，但在同一Canvas/Camera下明确排序，禁止根据音频等任意siblings动态估算“倒数第二”。所有新增UI节点继承明确UI layer/camera mask和坐标空间；杯图/背景不能在开局后盖住HUD/教程。

ModalRoot的scrim覆盖presentationSize，面板和按钮仍按逻辑750×1334及safe-area摆放。过渡只变PageVisual子节点，不移动实际触摸根或整棵Canvas；基础按钮的可见与点击坐标同源。当前长屏教程遮罩仅1334高需修，装饰区不得漏出强对比且阻止UI误触。

低成本fallback常驻RecoveryRoot，独立于特效资源和按钮皮肤：当UI阶段应有按钮但节点/边界无效或开局异常时，显示纯色按钮“重试界面”“返回菜单”。只做有限一次重建，保留本局和存档；不以无限每帧render或自动重开游戏掩盖错误。

## 5. 动画不得成为新的死锁

页面切换开始即建立最终页面、按钮和hit rect；转场仅装饰，最长0.36秒。若选择短暂阻断，须有≤0.4秒确定解锁兜底，与Tween回调解耦；减少动态/资源失败/节点销毁也解锁。Toast和特效不抢触摸，不新增全屏BlockInputEvents挡住教程。

## 6. 验收

至少：首次新档逐步教程、首次跳过、已完成教程再开、旧局继续/旧规则确认、游戏设置重看教程、返回菜单重开、初始化资源缺失、初始存档失败、教程标记保存失败、后台发生在开局各阶段、不同长宽比/安全区和Tap冷启动。每条记录可见按钮+实际tap结果+screen/phase/tick，不能只检查节点名称存在。START-01须在同SHA的实体Tap手机入口完整闭环后关闭。

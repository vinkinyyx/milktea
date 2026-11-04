> 当前事实与执行以[最新独立验收](../../44-tap-host-start-review.md)为准；本分册保留需求/设计依据，其中旧完成状态和旧提示词不能覆盖最新整改。

# 10类动画的接入、资源及运行设计

## 1. 总体方案

输入`assets2/milk_tea_v2_animations_complete`只读。MP4/GIF、qa/_temp、整页背景及TS示例只作参考；运行仅引入选定透明图集、必要猫咪副本及经过改造的控制器。现有71项美术哈希保持，不能用示例assets覆盖9:20背景/窄杯。

建议新增`presentation/effects/EffectsController.ts`、`EffectFramePlayer.ts`、`EffectsCatalog.ts`，按实际职责可合并小文件，不建立第二套玩法系统。控制器由现有GameRoot持有：接收已提交业务事件、实际物理接触反馈和UI生命周期，管理视觉子节点/池、时钟/owner和取消。

物理根负责position/angle，动画只改其独立Skin子节点的scale/opacity；当前`syncViews`直接设置视觉根变换，需拆成`IngredientVisualRoot(entity pose) -> Skin(art)`。body节点绝不参与Tween缩放。杯子表现沿用现有syncCupArt轻晃，不再启动示例另一套角度Tween。

## 2. 事件与位置映射

| ID | 接入位置和真实触发 | 表现及资源 | 接入约束 |
|---|---|---|---|
| 01 drop | `IngredientDropped`仅生成/投放音；首次有效落地接触另触发 | 落地Skin压扁后回弹约0.215s，可带contact_spark | 不用动画从杯口移动刚体到底部；首次边界底部/可靠落地定义每entity仅一次 |
| 02 collision | `GameRoot.readContactFeedback`已有接触对/法向速度/冷却 | Skin轻形变0.16s、contact_spark | 同对只在新接触或足够冲击触发；持续静置不反复抖动 |
| 03 merge | 已提交`MergeCommitted` | 父体ghost淡出、新子Skin弹出、merge_burst；真实scoreDelta漂字 | 不推迟物理合成或计分；父体销毁前保存视觉快照，无快照也可只播子体+爆点 |
| 04 combo | 本轮默认“连续合成反馈”而非新增得分规则 | 最近0.8模拟秒连续2次及以上合成时combo_star强调，可显示“连续合成×N” | 当前无正式combo业务字段；只维护短期表现计数，不倍增分数、不写排行榜。若不能确保语义则只加强合成光点，不显示数字 |
| 05 shake | 已提交`ShakeConsumed`与activeStartTick | 0.8s、6du现有回摆+弧线/短亮；不叠±7° | cup前后层同步，背景/HUD/小料物理不整体跟随视觉移位；真实施力沿用修复实现 |
| 06 danger | `DangerChanged`状态进入/退出与实际dangerTicks | danger_glow或dangerLine约1.1Hz柔和脉冲 | 只在状态变化启停，不每帧重新播；危险计时由逻辑控制，暂停冻结，无全屏闪烁 |
| 07 button | UI start/end/cancel，合法单主指 | ButtonSkin0.94倍→基线+tap_ring | 不改UiButton.rect/父根；禁用不播成功反馈；触摸取消恢复原scale |
| 08 result | `commitResult`已确认/合法内存结果，进入RESULTS | 0.72s数字滚动+settle_stars装饰 | 真实score/maxLevel/extraUsed；没有星级规则，**不画已获1～3星**；新纪录徽章按前后记录比较真实显示 |
| 09 cat | MENU闲置及真实最高级里程碑/结算 | 菜单面板内小头像轻摆约0.72s，结算轻庆祝 | 不在主杯区遮挡拖动/落料；无paw层不挥假手；低性能/减少动态静态 |
| 10 transition | screen实际变化一次 | PageVisual淡入/轻上移，≤0.36s | 不修改Canvas/物理根，不在HUD刷新/每次render时重播；新页面入口必可达 |

先接01/02/03/05/06/07/08/10；04采用不加分的连续合成强调，09菜单小头像轻动。这样10类各有明确处置，无需虚构连击奖励或星级。原示例“图鉴页面”不代表游戏已有图鉴，本轮不新建未规划页面。

## 3. 图集与播放

优先只打包6张`*_sheet_4col.png`，对应JSON作为本项目网格元数据转成自有catalog；它不是Cocos序列化SpriteAtlas/AnimationClip，不能原封不动改后缀当引擎资产。每格192×192，columns=4，frameCount/FPS按源JSON。通过经安装3.8.8 API核实的Texture2D/SpriteFrame+Rect裁切或编辑器生成正式SpriteAtlas；先用首/中/尾帧截图确认Y原点、顺序与透明混合，避免倒放/跨格。

元数据建议：`effectId,sourceRelativePath,sourceSha256,textureKey,frameSize,columns,count,fps,loop,pivot,defaultSizeDu,blend,poolCap,preloadGroup`。保存到运行`effects/v2/catalog.json`（可由构建转入common/classic）；运行目录只存这一个选定版本，不同时带独立80帧副本。所有纹理共享，SpriteFrame缓存一次创建、生命周期结束释放，池对象回收不重复创建Texture。

source帧率24FPS对应：12帧0.5s、16帧0.667s。源`effect_timings.json`把merge主要动作写0.22s，属于动作与完整光效尾迹两个时段，不硬性声称所有效果相同时长。建议merge视觉子体0.22s，爆点0.35～0.5s；result数字0.72s、星光≤0.667s。需要timeScale时明确映射播放时间，所有设备用相同配置，不受渲染FPS影响。

资源建议：tap_ring移入common供菜单；其它按classic/结算按需。动画不是开局必需资源，不把新catalog失败升级为整局ERROR。失败时fallback为原有Graphics/静态ring+短淡出，基础按钮和游戏继续；后台限一次延迟重试并可诊断，不每帧重复网络加载。

## 4. 空间、层次和父体ghost

统一DU bottom-left业务坐标转节点local：当前root以375/667为中心，改用一个`worldDuToVisualLocal`工具，不混用showTextFeedback的local与themeSprite的world参数。落地/碰撞特效挂GameplayFxRoot随世界位置；UI点击环挂UIFxRoot转换一次；结算星光挂ResultVisual子层。只有杯内效果需要时按实际cup bounds裁切，合成漂字不被无意剪掉。

`MergeCommitted`现有事件仅有parents ID和childID/位置。为取得ghost，不要求延迟删除物理父体：在合成提交前的视觉同步缓存或domain事件消费前保存两父的skin/position/angle/scale；ghost是纯Sprite短命副本，无Rigidbody/Collider。ghost即使被取消也不得回调业务销毁/加分。子体若在同一渲染帧再次合成，按entity存在性跳过已失效的子弹出，不对复用池中新entity播放旧特效。

## 5. 时间、抢占和生命周期

效果handle=`{runId,ownerEpoch,eventId,targetEntityId,kind,startTick|uiTime,generation}`。物理相关效果以模拟tick及插值alpha推进，GameRoot暂停/广告/后台时冻结；菜单/按钮/转场可用UI时钟，后台同样停。不要直接依赖默认全局Tween/组件scheduleOnce继续在广告背后播放。

普通接触被merge抢占；drop着地形变与collision按优先级合并，不能两套Tween争写同一scale。缓存不可变baseScale/baseOpacity/basePosition，取消时回基线，不能从已经压扁的当前scale再次乘倍率。节点destroy/restart/newrun/owner切换/结果页退出统一cancel相关handle，延迟回调先检查owner/generation/valid，不无差别stopAllByTarget打断不属于本控制器的动画。

每次按钮render重建不能触发转场；长期改法是稳定UI树+差量文本/状态更新。近期保留重建时要按screen generation保护effect根和按钮皮肤handle，销毁前完整取消，不能漏普通对象数字Tween。

低动态：取消大幅缩放/摇摆/旋转、危险静态、漂字短淡出，保留真实得分和状态提示。低性能档先停cat闲置/减少contact_spark，不能停关键提示、物理或按钮。

## 6. 性能和预算初值

6图集全RGBA约11.25MiB，再计其它纹理和猫咪运行副本；纹理包字节很小不代表CPU/GPU内存很小。拟定同屏总短命效果≤16，contact≤6，merge≤6，tap≤2，result≤2；cat≤1、danger≤1。多个合成可合并视觉尾迹但每个业务得分仍一次且全部计入，不能为了限特效丢逻辑事件。

池空优先跳过低优先级碰撞闪点，关键状态文本继续；不临时无限new Node。开局无新纹理解码尖峰，低端压力比较接入前/后p95/GC/decodedTexture，拟定额外表现耗时p95≤2ms为待测目标。所有动效静音不导致业务失败。重新开局20次后handle/pool/listener/纹理引用稳定，无持续增长。

## 7. 接入验证

参考[Cocos3.8缓动文档](https://docs.cocos.com/creator/3.8/manual/zh/tween/tween-example.html)，API以安装3.8.8类型定义为准，不把文档新版本示例不加验证套入。验收需要真实事件触发的逐项短视频/截图和数字回读；素材MP4/GIF不能当游戏实机取证。猫咪副本若派生，记录来源哈希/裁切缩放参数和alpha检查，不修改原稿，不新增付费生成。

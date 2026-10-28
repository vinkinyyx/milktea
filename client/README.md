# 奶茶挤挤 P1-A Cocos 工程

此目录是 Cocos Creator 3.8.8 工程根目录。2026-10-28已确认本机编辑器与引擎均为3.8.8，实际路径为C:/ProgramData/cocos/editors/Creator/3.8.8。已能从Boot进入PhysicsLab；P1-A部分运行验收通过，当前按用户要求暂停，剩余回归与构建见 [暂停记录](../docs/20-pause-handoff-2026-10-28.md)。

## 打开与运行

1. 用 Cocos Dashboard 的 **Add Project** 选择本目录，使用 Creator 3.8 LTS 打开。
2. 在 **Project → Project Settings → Feature Cropping** 启用 **2D Physics: Box2D**（或 Box2D WASM），保存设置。PhysicsLab 会拒绝 Builtin 后端。
3. 在 Assets 中打开 `assets/scenes/Boot.scene`，点击 Preview。Boot 加载并校验从根配置同步的基线，之后进入 `PhysicsLab.scene`。
4. PhysicsLab 使用键盘操作：`1`自由落体、`2`三圆、`3`九种尺寸、`4`压力、`5`设渲染30fps、`6`设渲染60fps、`V`自动120tick采样、`N`最窄杯最高级圆、`P`暂停、`R`恢复、`C`清空重建、`X`连续重建20次、`B`碰撞线、`G`素材查看（左右翻页）、`T`图片加载失败重试。

如果配置加载或后端检查失败，Boot 显示明确错误，点击错误文字重试。物理世界通过 `FixedClock` 唯一驱动；没有启用引擎自动模拟。

单位桥接集中在 `CoordinateMapper`：100 DU 作为一个规格物理米；Box2D长度是 DU/100，Cocos节点/碰撞体长度再乘引擎 PTM（通常32）；`RigidBody2D.linearVelocity` 与重力内部值按 Box2D 米制换算。场景节点位置和碰撞尺寸都走同一映射，避免只缩放重力或只缩放碰撞体。

## 已接收的美术资源

P1的81项静态资产、117张PNG位于assets/resources/art/p1；catalog.json记录文件、来源SHA256、加载key、锚点和九切。PhysicsLab现已接入九级小料、经典杯七层和背景/投影18项；`G`开发素材查看可浏览全部81项。ArtAssets从ImageAsset生成不裁切的Texture2D/SpriteFrame，按索引应用九切，不依赖预先手工配置的spriteFrame子资产。实际Creator导入、渲染与.meta仍待验证。

完整分阶段库在仓库根assets/library；取用规则见根assets/README.md。P2～P4按阶段取用，程序参考尚需Cocos适配。不要同时预加载全部分辨率。杯图保持全画布、左下锚点和世界(0,200)配准；九份小料ORA重建分层稿已收到，当前继续使用既有PNG。

## 依赖与检查

在本目录执行 `npm ci` 安装锁定的TypeScript 5.4.5与官方 `@cocos/creator-types` 3.8.8，然后执行 `npm run typecheck` 检查全部脚本、`npm run verify:art` 检查纯逻辑和图片实际文件/绑定。类型包不提供Creator编辑器或Box2D运行环境；建议先用3.8.8编辑器验证，如选其他补丁需重新对照实际引擎。完整操作见 [进展清单](../docs/19-progress-and-next-actions.md)。

## 配置同步与本地逻辑验收

仓库根 `config/design-baseline.json` 是唯一参数来源。修改后运行：

```powershell
python tools/sync_design_config.py --sync
python tools/sync_design_config.py --check
python tools/sync_client_contracts.py --sync
python tools/sync_client_contracts.py --check
```

`contracts/types.ts` 是领域类型唯一来源；同步脚本将其逐字节镜像进 Creator `assets`，使 Creator 资源导入不跨出 `assets` 根目录。从仓库根目录执行 `./client/validation/run-core-check.ps1` 可用 TypeScript 5.4.5 编译配置、时钟、坐标和杯几何纯逻辑，并运行 Node 断言。此命令不编译 `cc` 引擎适配器，也不代替 Creator 预览或 Box2D 物理验收。

## 构建

在 Creator 的 **Project → Build** 中选择实际可用的目标后构建。P1-A 证据记录中尚无 Creator 安装、目标选择或构建结果；不要将 Preview 与构建混为一项。

# 奶茶挤挤 P1-A Cocos 工程

此目录是目标为 Cocos Creator 3.8 LTS 的工程根目录。打开前请安装并记录实际的 Creator 3.8 补丁版本；本环境没有安装 Creator，因此项目暂未声明或锁定具体补丁版本。

## 打开与运行

1. 用 Cocos Dashboard 的 **Add Project** 选择本目录，使用 Creator 3.8 LTS 打开。
2. 在 **Project → Project Settings → Feature Cropping** 启用 **2D Physics: Box2D**（或 Box2D WASM），保存设置。PhysicsLab 会拒绝 Builtin 后端。
3. 在 Assets 中打开 `assets/scenes/Boot.scene`，点击 Preview。Boot 加载并校验从根配置同步的基线，之后进入 `PhysicsLab.scene`。
4. PhysicsLab 使用键盘操作：`1`自由落体、`2`三圆、`3`九种尺寸、`4`压力、`5`设渲染30fps、`6`设渲染60fps、`P`暂停、`R`恢复、`C`清空重建、`X`连续重建20次。

如果配置加载或后端检查失败，Boot 显示明确错误，点击错误文字重试。物理世界通过 `FixedClock` 唯一驱动；没有启用引擎自动模拟。

单位桥接集中在 `CoordinateMapper`：100 DU 作为一个规格物理米；Box2D长度是 DU/100，Cocos节点/碰撞体长度再乘引擎 PTM（通常32）；`RigidBody2D.linearVelocity` 与重力内部值按 Box2D 米制换算。场景节点位置和碰撞尺寸都走同一映射，避免只缩放重力或只缩放碰撞体。

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

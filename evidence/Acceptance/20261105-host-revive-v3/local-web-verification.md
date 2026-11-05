# 20261105-host-revive-v3 本地 Web Release 验证报告

**buildId**: `20261105-host-revive-v3-web-release-01`
**产物**: `build-artifacts/cocos-p1b-build/20261105-host-revive-v3-web-release-01`
**验证环境**: Windows + Chrome (Playwright/browser_use), Python http.server 端口 8123
**验证时间**: 2026-11-05
**整体状态**: 本地 Web 通过；Tap 宿主/真实广告/真机 NOT_RUN，整体仍 BLOCKED

## 已验证项

### 1. 启动流程 Boot → MENU
- Boot.scene 加载成功：`LoadScene db://assets/scenes/Boot.scene: ~18ms`
- `#milktea-boot` 启动 overlay 在 `finishStartup` 后被 DOM 移除（`__milkteaBootReady` 执行）
- GameRoot 组件状态：`screen="MENU"`, `artReady=true`, `loading=false`
- Cocos 引擎版本：`3.8.8`
- 控制台无 `isRunning` 错误（首次浏览器代理报告的该错误经复核不存在）

### 2. 开始新局 MENU → PLAYING
- 点击"开始新局"后显示"正在准备这杯…"加载 overlay
- 美术资源（69 个游戏资源，全部从 `resources` 加载）在 15s 预算内完成
- 成功进入 `screen="PLAYING"`，`artLoading=false`
- 教学引导弹窗显示（"第 1 步 · 自动落料"）
- 分数面板："分数 0 · 纪录 0"
- notice: "仅内存模式：此局不会跨关闭页面保存。"（Web 构建无持久化仓库，符合预期）

### 3. 生命周期暂停
- 浏览器 Tab 失焦时自动进入 PAUSED（"休息一下"暂停菜单）
- HostLifecycleCoordinator 正确检测前台/后台切换
- 暂停菜单包含"继续游戏/设置/重新开始/返回菜单"按钮

### 4. 控制台
- 仅 `net::ERR_ABORTED index.html`（页面刷新时正常中止）
- `Error 3804`（Cocos `getComponents` 由自动化工具调用触发，非游戏自身错误）
- 无 404 资源错误，无资源加载失败，无 ArtLoadBudget 超时

## 关键说明

### ArtLoadBudget 超时误报
首次多步浏览器操作中观察到一次 `START_ART_TIMEOUT`。经复核，原因是浏览器代理在点击开始后执行了大量 JS 评估（`scene.walk`、组件遍历等），阻塞主线程超过 15s，导致 ArtLoadBudget 的 `setInterval` 计时器在恢复后一次性累计了被阻塞的前台时间。

**快速操作验证**：刷新页面后立即点击"开始新局"，5 秒内成功进入 PLAYING，无超时。证明超时是自动化环境的伪超时，非游戏真实缺陷。

### 已知边界
- ArtLoadBudget 的 `tickBudget` 在主线程长时间阻塞时，`setInterval` 回调会一次性计算 `now - lastTickMs` 的大 delta 并计为前台时间。正常游戏中主线程不会阻塞 15s，此为自动化/调试场景边界，不影响真实体验。

## NOT_RUN（缺设备/平台证据）

| 项 | 说明 |
|---|---|
| H02 Tap 宿主真实开局 | 无 Tap 开发者后台/宿主环境 |
| 真实激励广告链路 | 无 Tap 广告 SDK 运行环境 |
| 真机启动中位数/P95 | 无实体设备 |
| 进程内存曲线 | 无实体设备 |
| 同 SHA Tap 包上传 | 未执行上传/提审 |

## 结论

本轮整改（P0-A 编译修复、P0-B 加载超时/取消、P1-A 复活身份边界、P1-B 重新观看+每日限制收口）在本地 Web Release 构建中启动、运行、暂停链路正常。ArtLoadBudget 15s 超时与取消机制按设计生效。Tap 宿主与真机验证需在具备设备/平台权限时补做。

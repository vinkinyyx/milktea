# Tasks — Tap 宿主启动注入修复

| ID | 任务 | 文件/位置 | 完成判据 |
| --- | --- | --- | --- |
| T1 | 修复注入脚本：`GameGlobal` 缺失安全、`fetch` 缺失不抛错 | `奶茶挤挤/extensions/taptap-minigame-tools/converter/wx_unity_converter/wx_unity.js` | 文件内不再存在 `throw new Error('fetch is not defined')` |
| T2 | 构建后置补丁：`game.js` 的 `sysInfo.platform` 判断改为安全版，并断言注入块已安全 | `tools/build_taptap_minigame.py`（新增 `patch_and_verify_game_js()`，在 TapBuild 生成后调用） | 断言通过；`TapBuild/game/game.js` 无裸 `GameGlobal.fetch` 赋值、无 platform 直接调用 |
| T3 | 新增启动轨迹组件 | `奶茶挤挤/assets/scripts/bootstrap/BootDiagnostics.ts`（新建） | 独立组件，Graphics + Label 自绘，自身异常不外抛 |
| T4 | 接入阶段埋点 | `奶茶挤挤/assets/scripts/bootstrap/AppRoot.ts`、`奶茶挤挤/assets/scripts/presentation/GameRoot.ts` | 阶段串 `onLoad/configLoaded/gameRootCreated/artReady/worldReady/playing/error:<msg>` 可写入 |
| T5 | 静态校验 | `npm run typecheck` | 退出码 0 |
| T6 | 新 buildId 构建 | `python tools/build_taptap_minigame.py --build ...` | `result.json` 生成，`creatorExitCode` 与历史一致（36），包大小合理（≈3.03MB） |
| T7 | 产物断言 | 解压 `game.zip` 检查 `game.js` 与 `BootDiagnostics` | 断言全过，记录 SHA256 |
| T8 | 上传/自测入口 | CLI 或开发者中心 + `get-test-qr-code` | 拿到新 `package_id` 的自测二维码 URL |
| T9 | 证据落盘 | `evidence/TapTap/<buildId>/result.json` | `runtimeVerified: false`，`status: LOCAL_CONVERSION_PASS_NOT_HOST_VALIDATED` |

## 验证顺序

1. T5 → T6 → T7（本地闭环，失败即修，最多 3 轮）。
2. T8 产出二维码，交付用户扫码自测。
3. 用户回传截图后：有顶部诊断条 → 引擎已启动，按阶段定位；仍纯背景 → 转查宿主对 `document`/`canvas`/`requestAnimationFrame` 的注入。
4. T9 更新证据，不提前写成宿主通过。

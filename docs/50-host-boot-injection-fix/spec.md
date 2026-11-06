# Tap 宿主"只有背景、无任何元素"启动注入修复 Spec

## 1. 现象与事实（已核对）

- 用户实测：TapTap 自测进入游戏后，画面只有一个奶茶店室内背景，没有标题、按钮、杯子、HUD、错误提示；1.3.0（adfix2）与 1.4.0（overlay z-order 修复包）症状完全一致。
- 平台侧已排除"包没上传/包没解析"：
  - `list-mini-app-packages` 返回 1.4.0 `package_id=443756`，`package_size=3030331`（与本地产物字节数一致）。
  - `get-test-qr-code` 返回有效自测码：`https://www.taptap.cn/qrcode/miniapp?id=tapmccrbqbepy6dfz3&type=develop&version_id=443756`。
- 资源侧已排除"美术缺失"：按 `.meta` 的 uuid 在 `game.zip` 内可定位 `bg_shop_base.jpg`、`bg_brand.jpg`、杯体分层、`ui_title_logo.png` 等关键素材。
- 场景侧已排除"背景来自 Boot.scene"：`Boot.scene` 仅含 `BootRoot`、`Main Camera`、`cc.Camera`，无任何背景 Sprite/Label。
- 代码侧已排除"错误层被遮住"：`renderError()` / `drawButtons()` / `text()` 全部使用 Label 与 Graphics 兜底（`drawButtons` 无皮肤时直接 `Graphics.roundRect`），即使美术全丢也应出现文字与按钮。
- 由此推断：**游戏在 Tap 宿主内没有绘制出任何一帧**（连 `AppRoot.showBrandFrame()` 的米色底+文字都没有），用户看到的背景是客户端启动封面；`1.3.0`/`1.4.0` 症状相同是因为两个包携带同一段启动期硬失败代码。

## 2. 根因定位

`TapBuild/game/game.zip` 的 `game.js` 顶部被扩展注入（`converter/wx_converter.py:inject_runtime_code()` 无条件前置 `converter/wx_unity_converter/wx_unity.js`）：

```js
/* Unity Converter Injection */
Error.stackTraceLimit = Infinity;

GameGlobal.oldFetch = GameGlobal.fetch;
if (!GameGlobal.oldFetch) {
    throw new Error('fetch is not defined');
}
GameGlobal.fetch = undefined; // remove fetch to follow wx
```

该段在模块加载期（`__initApp()` 之前）执行，存在三个可致整体启动失败的点：

1. `GameGlobal` 未定义 → `ReferenceError`（`GameGlobal.fetch` 取值即抛）。
2. Tap 宿主未注入 `fetch` → 主动 `throw new Error('fetch is not defined')`。
3. `game.js` 末尾 `var sysInfo = wx.getSystemInfoSync(); if (sysInfo.platform.toLocaleLowerCase() === 'android')` → 宿主若缺 `platform` 字段即 `TypeError`。

任一发生都会使 `require('./web-adapter')`、`System.warmup`、`firstScreen.start`、`Application` 全部不执行，表现为"宿主只显示启动封面"，与实测完全吻合。

## 3. 变更方案（最小、可回滚）

### 3.1 修复注入脚本（唯一根因修改）

文件：`奶茶挤挤/extensions/taptap-minigame-tools/converter/wx_unity_converter/wx_unity.js`

- 用安全的全局对象解析替代裸 `GameGlobal`：

```js
var __tapGlobal = typeof GameGlobal !== 'undefined' ? GameGlobal : (typeof globalThis !== 'undefined' ? globalThis : this);
```

- 缺 `fetch` 时不再抛错，仅跳过删除，保证后续引擎走 `wx.request` 路径：

```js
if (__tapGlobal) {
    if (typeof __tapGlobal.fetch === 'function') { __tapGlobal.oldFetch = __tapGlobal.fetch; }
    __tapGlobal.fetch = undefined;
}
```

- 保留 `Error.stackTraceLimit = Infinity;` 不变。

### 3.2 修复生成的 game.js 尾段宿主兼容

文件：`tools/build_taptap_minigame.py`（转换后置处理，新增校验/补丁步骤）

- 对 `TapBuild/game/game.js` 执行确定性后置补丁：把
  `var sysInfo = wx.getSystemInfoSync(); if (sysInfo.platform.toLocaleLowerCase() === 'android')`
  改为对 `platform` 缺失安全的写法（`String((sysInfo && sysInfo.platform) || '').toLowerCase()`）。
- 补丁后立即断言：`game.js` 中不再包含 `throw new Error('fetch is not defined')`，且包含安全版 platform 判断；断言失败则构建失败（不允许产出"看似成功"的包）。

### 3.3 增加宿主内可见启动轨迹（诊断，非玩法）

新增：`奶茶挤挤/assets/scripts/bootstrap/BootDiagnostics.ts`

- 独立组件，挂在 Canvas 节点上，`onLoad` 后自建 `Node` 并 `setSiblingIndex(children.length-1)` 置顶。
- 内容：`Graphics` 画顶部高对比色条（不依赖任何美术与字体）+ `Label` 显示 `buildId`、最后阶段名、最近一次错误前 80 字。
- 阶段写入：`onLoad` → `configLoaded` → `gameRootCreated` → `artReady` → `worldReady` → `playing`；错误写入使用 `try/catch` 包裹，自身绝不抛出。
- 在 `AppRoot.ts` 的 `onLoad()`（`showBrandFrame()` 之后）创建该组件；在 `GameRoot.ts` 的 `showStartupFailure()` / `startNew()` 成功路径写入阶段。
- 目的：若 3.1/3.2 之后仍失败，用户截图中可直接读出停在哪个阶段，避免下一轮继续推测。

### 3.4 不做的事

- 不改核心玩法、不换引擎、不恢复抖音/APK 路线。
- 不改 `config/design-baseline.json` 与 `contracts/types.ts`。
- 不删除、不移动 `assets2`、`assets/library`、`audio` 原稿。
- 不宣称 Tap 宿主已通过；未拿到同 SHA 真机证据前，状态保持 `LOCAL_CONVERSION_PASS_NOT_HOST_VALIDATED`。

## 4. 验收条件

1. `npm run typecheck` 通过。
2. 新 `buildId` 产物中 `game.js` 不含 `throw new Error('fetch is not defined')`，且 platform 判断为安全版（脚本内断言通过）。
3. 包内 `BootDiagnostics` 相关代码存在（`grep` 命中）。
4. 生成该 `package_id` 的自测二维码 URL，交付给用户。
5. 用户实测截图：能进入游戏并在顶部看到诊断色条与阶段文字（证明引擎已启动）；若仍为纯背景，则该截图即为"引擎未启动"的新证据，转而检查宿主对 `document`/`canvas` 的注入。
6. 证据写入 `evidence/TapTap/<buildId>/result.json`，不得写成已通过。

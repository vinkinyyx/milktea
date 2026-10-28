# Cocos MCP安装、配置与验证

日期：2026-10-28。按用户指定仓库实际clone、npm ci、npm run build。工具源码独立于游戏，未覆盖项目工程。使用[OpenAI官方MCP配置说明](https://developers.openai.com/codex/mcp/)核对stdio与TOML配置；沿用原有全部MCP和其他用户设置。

## 1. 安装结果

| 项目 | 实际位置/结果 |
| --- | --- |
| Creator MCP | `C:/Users/vinki/.codex/tools/cocos-creator-local-mcp`；提交`5a326291fbbbed2c1354ccfbd55e988e2b447162` |
| Asset Forge MCP | `C:/Users/vinki/.codex/tools/cocos-asset-forge-mcp`；提交`5882f6e8d8046e30c95e40d891e922fef2572423` |
| 音乐技能源仓库 | `C:/Users/vinki/.codex/tools/codex-game-music-skill`；提交`13e5236615871573f50effd75a24a7c5b5d19271` |
| 已安装skill | `C:/Users/vinki/.codex/skills/compose-game-music/SKILL.md`；通过skill-installer安装，已阅读应用 |
| Node/npm | v24.13.0 / 11.6.2，满足上游Node≥20 |
| 依赖与构建 | 两仓库均`npm ci`、`npm run build`退出0，保留原package-lock.json；无npm audit fix或版本漂移 |
| FFmpeg | imageio-ffmpeg0.7.0包内Windows FFmpeg7.1；本地`tools/audio-runtime/bin/ffmpeg.exe`，只注入Asset Forge进程PATH，未改系统PATH |
| 工程桥 | [client/extensions/codex-editor-bridge](../client/extensions/codex-editor-bridge/package.json)，4个上游生成文件，未覆盖已有扩展 |

上游地址：[Creator MCP](https://github.com/lightblink/cocos-creator-local-mcp)、[Asset Forge](https://github.com/lightblink/cocos-asset-forge-mcp)、[音乐skill](https://github.com/sora16bit/codex-game-music-skill)。均记录MIT许可。FFmpeg仅开发机本地工具，不随游戏分发；若后续分发其二进制需另审其构建许可。

## 2. Codex实际配置

用户级文件：`C:/Users/vinki/.codex/config.toml`；修改前备份：`C:/Users/vinki/.codex/backups/config-before-cocos-mcp-20261028-202102.toml`。配置只增加`cocos_creator_local`、`cocos_asset_forge`两项，TOML解析验证通过，原配置逐项保留。本机路径与PATH保存在本机文件，不把完整用户配置/可能存在的凭据复制进项目。

```toml
[mcp_servers.cocos_creator_local]
command = 'C:\Program Files\nodejs\node.exe'
args = ['C:\Users\vinki\.codex\tools\cocos-creator-local-mcp\dist\index.js']
startup_timeout_sec = 120
tool_timeout_sec = 120
enabled = true

[mcp_servers.cocos_creator_local.env]
COCOS_CREATOR_PATH = 'C:/ProgramData/cocos/editors/Creator/3.8.8/CocosCreator.exe'

[mcp_servers.cocos_asset_forge]
command = 'C:\Program Files\nodejs\node.exe'
args = ['C:\Users\vinki\.codex\tools\cocos-asset-forge-mcp\dist\index.js', '--config', 'C:\Users\vinki\.codex\tools\milktea-asset-forge.json']
startup_timeout_sec = 120
tool_timeout_sec = 120
enabled = true
# 实际配置另有env.PATH，包含本机FFmpeg目录和原继承PATH。
```

Asset Forge配置文件`C:/Users/vinki/.codex/tools/milktea-asset-forge.json`：绑定本client、Creator3.8.8、输出到`output/asset-forge-staging`；overwrite=false；当前image/audio均mock，禁止网络生成。目的是工具链可用且不覆盖现有图片；没有用户提供的真实生成提供商配置，不伪造API地址/凭据，不把mock样本混入游戏资产。真实图片已交付，本阶段优先读取/绑定，不重新生成或自动trim杯层透明画布。

## 3. 实际验证

| 检查 | 结果/证据 |
| --- | --- |
| 独立MCP SDK握手/listTools | PASS，Creator26工具、Forge11工具；[mcp-smoke.json](../evidence/tooling/20261028-cocos-mcp/mcp-smoke.json) |
| 当前聊天原生MCP工具加载 | PASS，本轮工具目录已动态出现两个namespace，原生get_environment与get_config调用成功；[native-client-smoke.json](../evidence/tooling/20261028-cocos-mcp/native-client-smoke.json) |
| 环境识别 | PASS，Creator实际Windows路径found=true；微信CLI未找到，不是本项目当前阻塞 |
| 工程扩展安装 | PASS，实际4文件存在；首次已运行编辑器未加载时ping失败，保留[mcp-initial-smoke.json](../evidence/tooling/20261028-cocos-mcp/mcp-initial-smoke.json) |
| 桥接启动 | PASS，重新打开client后日志extension enable，HTTP /health返回200且包名/版本正确 |
| 桥接读取真实场景 | PASS，POST /scene/summary返回Boot UUID `44e30fdb-084f-5609-8283-4fdd8d2fab81`及AppRoot，不只是端口可达 |
| Asset Forge上游测试 | 初次15/16通过、ffmpeg ENOENT；安装本地FFmpeg并注入PATH后16/16通过 |
| Creator MCP上游测试 | 4/7通过，3项Windows路径相关失败，保留问题，未删测试/放宽断言 |
| 场景写入/新建工程/构建工具 | 未执行；这些工具不因握手/场景读取通过就视为全部可用 |
| 游戏物理/音频质量 | 本轮没有新增验收，不由工具测试替代；音乐仍为符号草稿 |

本轮发现两个MCP已在当前聊天热加载成功，**现在不必为安装结果立即重启**。若下次工具未出现，再重载Codex；新skill安装后下一个回合可由技能目录发现，本次已显式读取使用。

## 4. Windows与平台限制

Creator MCP的三个上游失败：生成脚本路径用Windows反斜杠但测试按正斜杠查找；架构骨架同类路径断言；macOS `ps`示例的`/Users/...`被Windows path.resolve解释为`C:\Users\...`。这些说明跨平台支持未完整，不声称完整7/7通过。

源码的运行进程发现调用`ps -axo`；模板/默认场景定位使用macOS Contents/Resources布局。仅配置COCOS_CREATOR_PATH并不能修复所有Windows路径。已验证get_environment、桥接和真实场景读取；需要新建模板或自动复用编辑器时，先补Windows路径/进程适配并做针对性回归，或继续用Dashboard/现有工程，不盲调默认生成工具。本轮没有更改上游源码，clone保持干净，便于后续升级/比较。

上游build_wechatgame只代表微信目标，不是抖音或Web目标。当前项目继续抖音首发；P1-A后续先独立验证本地Web构建，不安装微信开发者工具冒充完成平台适配。

## 5. 后续使用与回退

下次先get_environment→check_editor_bridge(projectRoot=本client)→call_editor_bridge(POST /scene/summary)，校验场景/项目再操作。桥只监听127.0.0.1:17388，不开放局域网。同端口不能同时绑定其他项目；不要对未核验的场景应用blueprint或save。

本轮实际通过重定向日志启动编辑器，没有启动游戏预览或恢复物理验收。当前编辑器停在Boot供桥接读取，不复用上轮浏览器暂停现场作为当前状态。日志位于本次tooling证据目录。

复验：

```powershell
# 已安装，不需要重复clone或覆盖式安装
node C:/Users/vinki/.codex/tools/verify-cocos-mcp.mjs
# Asset Forge测试必须具有本地FFmpeg PATH
$env:PATH = 'C:\Users\vinki\.codex\tools\audio-runtime\bin;' + $env:PATH
Set-Location C:/Users/vinki/.codex/tools/cocos-asset-forge-mcp
npm.cmd test
```

如需回退，仅移除本次两个mcp_servers条目并在Creator扩展管理停用本项目桥；保留生成资产与用户其他设置。原备份用于对照，不在后续配置已变时整体覆盖回滚。没有设置任何外部发布/上传账号。

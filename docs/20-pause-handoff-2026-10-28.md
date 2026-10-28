# 2026-10-28 暂停交接记录

**状态：已按用户要求暂停，等待下一次明确继续。** 本轮不再推进测试、构建或后续玩法。当前阶段仍为P1-A，尚未达到进入P1-B的条件。

## 1. 当前运行现场

- 项目：`D:/Workspace/TapTap/奶茶挤挤`；Cocos工程：`client/`。
- Creator编辑器：**3.8.8**，实际路径 `C:/ProgramData/cocos/editors/Creator/3.8.8/CocosCreator.exe`。
- Dashboard：**2.2.2.1515**，路径 `D:/CocosDashboard/CocosDashboard.exe`。
- 已确认集成引擎package.json为3.8.8，JS物理后端为 **Box2D / @cocos/box2d 1.0.2**，PTM=32；运行日志确认2D后端注册box2d。
- 编辑器已通过Dashboard实际打开本项目；Boot.scene已在编辑器中打开，截图已存证。编辑器与浏览器保留打开状态。
- 预览服务：`http://127.0.0.1:7456/`。
- 当前可用启动链接：`http://127.0.0.1:7456/?scene=44e30fdb-084f-5609-8283-4fdd8d2fab81`。
- Playwright CLI会话名：`milktea-creator`；使用Chrome有头浏览器。下次先重新观察会话/窗口，不能复用旧元素编号或坐标。
- 已手动暂停PhysicsLab物理时钟。暂停时实际回读：`scene=PhysicsLab`、`ready=true`、`paused=true`、`tick=2425`、动态实体3、接触3、监听6，提示“已暂停：手动暂停”。这只是暂停现场，不是60秒堆积验收结果。
- 无正在等待完成的测试或构建任务；没有启动任何构建，没有提交/推送/发布/部署。

## 2. 本轮已经确认的进展

| 项目 | 实际结果 |
| --- | --- |
| 编辑器安装 | PASS，3.8.8已实际启动，不再受“缺少Creator”阻塞 |
| 工程导入 | 已完成资源导入；117张P1 PNG的.meta已由实际编辑器生成 |
| 编辑器打开Boot | PASS，有真实编辑器截图；保留原meta，没有覆盖图片源文件 |
| Boot→PhysicsLab | PASS，修复脚本类引用后真实浏览器预览进入PhysicsLab |
| 全部脚本与安装版声明核对 | PASS，使用client/temp/declarations下本机3.8.8生成的cc/cc.env/jsb声明运行tsc，退出0 |
| 图片实际加载 | PASS，PhysicsLab加载18项真实美术；九级图片、杯七层、背景/投影的接入代码沿用上一轮 |
| 正交与设计面 | 实测projection=0、design=750×1334；显示完整竖屏内容，物理参数没有修改 |
| 自由落体 | PASS，真实Box2D在30/60tick输出实际位移，与60Hz半隐式积分参照一致 |
| 30/60fps固定步 | PASS，实测每次120个tick、120次world step，30fps一次、60fps两次的最终刚体位置/速度相同 |
| 暂停冻结 | PASS，暂停700ms前后tick与刚体状态相同 |
| 后台恢复 | 尚未验证通过：自动化未能观察到真实hidden状态，等待超时；不能标为已通过或直接断言游戏后台逻辑错误 |
| 连续20次重建 | 已记录失败并定位调度问题；代码已修复且确认编辑器重新编译，但尚未用修复后的运行代码回归 |

## 3. 已取得的真实物理数据

自由落体从y=1130DU、初速度0、阻尼0开始，配置重力仍为-9.8规格单位/s²，100DU=1规格物理单位。

| 物理tick | 时间 | 解析位移DU | 引擎实测位移DU | 与解析解差DU | 半隐式积分参照DU |
| --- | --- | --- | --- | --- | --- |
| 30 | 0.5s | 122.5 | 126.58332633972168 | +4.08332633972168 | 126.583333333333 |
| 60 | 1.0s | 490 | 498.166734457016 | +8.166734457016 | 498.166666666667 |

实测与离散积分参照的差小于0.0001DU；未通过改动重力或半径使结果匹配。

固定步三次真实采样：

| 请求渲染Hz | 引擎dt采样平均Hz | 物理tick/step调用 | 最终y DU | 最终vy DU/s |
| --- | --- | --- | --- | --- |
| 30 | 30.001967342104297 | 120 / 120 | 279.2025966644287 | -1.1178965475572395e-16 |
| 60 | 60.00198353660147 | 120 / 120 | 279.2025966644287 | -1.1178965475572395e-16 |
| 60重复 | 59.99999999999996 | 120 / 120 | 279.2025966644287 | -1.1178965475572395e-16 |

采样结束自动暂停，autoSimulation=false。数据来源为实际Creator预览，不是前两轮纯逻辑模型。

## 4. 本轮修改和原因

| 文件/目录 | 修改 |
| --- | --- |
| client/assets/scenes/Boot.scene | 将自定义组件类型改为实际编译器_RF.push使用的压缩类ID；相机改正交_projection=0 |
| client/assets/scenes/PhysicsLab.scene | 同上，修复PhysicsLab组件类引用和相机投影 |
| tools/generate_cocos_scenes.py | 场景模板使用正确的压缩类ID与正交相机，防止未来再次生成错误场景 |
| client/assets/scripts/bootstrap/Viewport.ts | 新增显示适配：按配置设置750×1334、SHOW_ALL、将Canvas关联正交相机，不修改物理尺寸 |
| client/assets/scripts/bootstrap/AppRoot.ts | 配置成功后调用统一显示适配 |
| client/assets/scripts/debug/PhysicsLab.ts | 接入显示适配；调试文字限宽换行；连续重建与九尺寸的递归scheduleOnce改为新闭包 |
| client/assets/scripts/debug/ArtGallery.ts | 素材查看文字限宽，避免资源ID/说明溢出 |
| tools/sync_design_config.py | --sync在编辑器项目设置已经存在时，把设计分辨率同步为配置中的值，保留其他设置 |
| client/settings/v2/packages/project.json | 设计分辨率已由同步工具写为750×1334 |
| client/validation/creator-preview-smoke.js | 新增真实预览检查函数，通过按键驱动、读取实际刚体/世界计数，不注入物理tick |
| client/assets下.meta、library/profiles/temp等 | 实际编辑器导入/编译生成或更新；不要用旧模板覆盖这些真实导入结果 |

`client/package.json`的creator.version=3.8.8及`client/assets/migrate-canvas.ts`在本轮检查开始时已存在，是用户打开/编辑器导入后的状态。本轮没有删除或修改migrate-canvas.ts。它带来BaseNode弃用警告，当前不是阻断错误。

## 5. 已遇到的问题与处理状态

1. **完整UUID被当成组件类ID：已修复并运行验证。** 预览原来报“Can not find class”并移除BootRoot组件。现改成实际编译产物中的类ID：AppRoot=`23a90TkkpxQSKONswVIHcNR`，PhysicsLab=`65637fuh0RRH5AAn6pXFsMn`。
2. **透视相机导致竖屏裁切：已修复并运行验证。** Creator 3.8.8投影枚举0为正交，原场景写成1。现投影0，显示设计面750×1334。
3. **递归scheduleOnce：已修复，待运行回归。** 同一个一次性回调在执行中再次scheduleOnce自身，会出现“Selector already scheduled”，当前计时器随后移除，导致20次重建或九尺寸队列提前停下。现使用`() => rebuild()`/`() => dropNext()`新闭包。
4. **脚本刷新需要显式确认。** 第二次smoke运行虽然源码已修复，但检查发现preview编译产物仍是旧版`this.scheduleOnce(rebuild,...)`。随后已在编辑器资源面板点击刷新，实际产物已变为`() => rebuild()`；用户要求暂停前尚未重跑。因此不能用这次旧编译产物的失败判断当前修复失败或通过。
5. **后台自动化等待超时：尚未定位完成。** 用新标签页切换后，通过现有自动化读取两个页面都返回visible与hasFocus=true；可能是自动化聚焦行为，不能证明已发生真实后台事件。已将等待从rAF改为定时轮询并添加标签页finally清理，仍未观察到hidden。下次应先用不改变聚焦的读取方式（例如CDP只读Runtime.evaluate）或真实窗口最小化确认生命周期，再判断应用逻辑；不要发合成事件冒充真实后台验证。
6. **最初终端启动EPIPE：已恢复。** 直接通过短命终端启动Electron，终端管道关闭造成EPIPE。后续关闭本轮启动的实例，并通过Dashboard成功打开工程。已保留相关初始日志，不将其误报为编辑器未安装。

## 6. 证据位置与准确解读

根目录：`evidence/P1-A/20261028-creator-388/`。

- `runtime-smoke-before-scheduler-fix.json`：第一次运行，重力/固定步/暂停通过，后台及重建等待失败。
- `runtime-smoke.json`：第二次运行；重力、固定步、暂停仍通过，后台及重建失败。**重建使用的是未刷新的旧编译产物，不是修复后的最终回归。** `allPassed=false`必须保留。
- `gravity-test.csv`、`fixed-step-comparison.csv`：从已执行的真实采样记录提取，供后续归档。
- `runtime-console.txt`：实际预览控制台历史，包含修复前错误及后续采样，不能将历史错误当成最后一次预览的新错误。
- `screenshots/editor-boot.jpg`：实际编辑器打开Boot。
- `screenshots/physicslab-before-camera-fix.png`：修正相机前的裁切画面。
- `screenshots/physicslab-orthographic.png`：修正后的完整竖屏画面；不是完整视听验收截图。
- `editor-stdout.txt`、`editor-stderr.txt`：早期重定向启动记录；最后稳定编辑器通过Dashboard启动，最新工作日志仍在`client/temp/logs/project.log`。
- `environment.json`：本次安装、后端、导入、测试边界与暂停现场。

本轮还没有整理完整的最终验收包；下一次需要在通过剩余用例后完成acceptance/cases/issues并更新阶段结论。

## 7. 下一次从这里继续

1. 先读本记录、AGENTS.md和当前文件，重新查Creator/浏览器窗口及预览服务，不复用旧窗口句柄或元素编号。原图、已有meta和migrate-canvas.ts继续保留。
2. 若编辑器已关闭，从Dashboard打开client项目；确认3.8.8和Box2D后端。若需程序启动，将stdout/stderr重定向到文件，避免终端退出引起EPIPE。
3. 修改脚本后在编辑器资源面板刷新，并核对`client/temp/programming/packer-driver/targets/preview/chunks/4d/`中PhysicsLab编译产物已包含新闭包，再刷新预览。上次单纯切焦点未能保证刷新。
4. 浏览器先点击GameCanvas再按键。未聚焦画布时键盘可能不进入Cocos；不要把未生效的输入当成场景测试已执行。
5. **优先单独回归X连续20次重建和3九尺寸队列。** 记录实体数、接触、监听、引擎世界body数与回调清理，确认新调度修复有效。
6. 单独解决真实后台/恢复验证；读取hidden页面时避免rAF轮询和可能自动抢焦点的Page.evaluate。保留失败证据，不能以注入Game事件代替真实生命周期。
7. 完成三圆静置60秒、同/不同级碰撞、九尺寸、N最窄杯最高级圆、压力侧底不穿透、G素材查看全部81项及屏幕适配。当前这些没有正式完整通过记录。
8. 所有运行用例通过后，执行独立的本地Web构建，记录命令、目标、退出码、日志、产物及构建后运行；本轮未启动构建。编辑器已注册web-desktop/web-mobile/抖音等构建插件，不代表各原生SDK已配置。
9. 补全本次evidence中的acceptance.md、cases.csv、issues.md等；更新README、阶段文档的状态。只有P1-A门槛真实满足后才进入P1-B；不因安装成功或部分测试通过提前放行。

建议复用命令：

```powershell
# 仓库根；先确认编辑器预览服务已启动
npx --yes --package @playwright/cli playwright-cli -s=milktea-creator list
npx --yes --package @playwright/cli playwright-cli -s=milktea-creator snapshot

# client目录；对照实际安装版生成的声明
./node_modules/.bin/tsc.cmd --project tsconfig.json --types ./temp/declarations/cc,./temp/declarations/cc.env,./temp/declarations/cc.custom-macro,./temp/declarations/jsb

# 仓库根；此脚本包含尚需解决的真实后台检查，不应预期已全通过
npx --yes --package @playwright/cli playwright-cli -s=milktea-creator --raw run-code --filename=client/validation/creator-preview-smoke.js
```

桌面工具可使用computer-use-studio-pro技能与`@oai/sky`；浏览器使用playwright技能与CLI。当前没有子代理或自动继续任务。**等待用户下次明确继续。**

# P1-A 续测证据与出口判断

结论：**未通过阶段出口，不进入 P1-B。** 本次未更改玩法代码、配置、图片或 .meta；原失败证据保留。新证据按 cases.csv 分项；未完成不等于通过。

Creator 3.8.8 实际预览编译产物包含重建与九尺寸调度新闭包；安装版声明 TypeScript 检查退出0。新的 smoke 中重力、30/60 Hz固定步、手动暂停和20次重建首尾通过，后台超时，故总结果仍为 false。三圆70秒定时采样稳定；压力220圆仅采样10秒，不能证明连续不穿透。最窄杯最高级静止；九尺寸停在8级。

独立 Web Desktop 构建命令：`CocosCreator.exe --project <client> --build "platform=web-desktop;debug=true;buildPath=D:/cocos-p1a-build;outputName=resume-20261028;startScene=44e30fdb-084f-5609-8283-4fdd8d2fab81"`。退出36，产物位于 `D:/cocos-p1a-build/resume-20261028`；本机 HTTP 加载后进入 PhysicsLab，见 build-runtime.txt 和 build.png。日志中的端口冲突和子进程 SIGTERM 保留。

后台真实恢复、九尺寸完成、不同级碰撞、连续压力/碰撞录像、图库逐项视觉审查、屏幕适配和配置错误重试尚未完成；不得进入 P1-B。详细限制见 issues.md。本轮重力和固定步采样也分别导出 gravity-test.csv、fixed-step-comparison.csv。图库7页实际加载81个ID，截图保存在本目录；逐项视觉质量未完成。

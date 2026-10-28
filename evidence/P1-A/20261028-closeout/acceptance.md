# P1-A 收尾验收：未通过

**P1-A尚未满足出口，不进入P1-B。** 真实后台/恢复、最终包逐步压力、重建旧事件隔离和完整素材/异常路径仍未关闭。旧失败记录保留于 [20261028-resume](../20261028-resume/acceptance.md)。本目录的cases.csv统一使用PASS、FAIL、未执行、不适用；每项通过只覆盖该行说明的范围。

## 本次修改

- `CupGeometry.ts`右壁外法线改为从右壁切线计算；静态检查单位长度、垂直、镜像和碰撞盒内缘。保持物理配置不变。
- `PhysicsLab.ts`在图片异步完成后继承后台暂停；后台期间打开图库不会恢复旧暂停；图片错误显示高对比短提示，并支持触摸重试。
- `AppRoot.ts`在读取配置前建立错误页显示基线；错误页通过画面触摸重试，加载中拒绝重复请求，详细错误仍输出；校验失败时释放无效缓存。
- `p1a-core-check.cjs`补充几何断言；新增本目录诊断和证据。不改图片、meta或migrate-canvas.ts。

## 实测概况

引擎3.8.8、Box2D 1.0.2/PTM32；最终Web Mobile通过独立HTTP启动并进入PhysicsLab。最终cache-smoke自由落体、30/60固定步、手动暂停、20次重建首尾通过，真实后台超时，`allPassed=false`。九级独立落杯在预览通过；原队列在第9级合法阻挡。左右壁最大配置速度碰撞录屏与逐步数据保留。

三圆预览4201步，静置后60秒有连续数据；220圆4200步、24个混合圆4202步，预热后各约60秒的采样边距为正；初始负余量与首轮压力不足保留。上一构建包220圆首次在第35步触发长帧保护；关闭其他测试浏览器后该包复测4200步，预热后3600步侧底余量为正。首次失败及复测均保留，暂停原因未确定。

最终缓存修复包逐步压力复测在第102步触发补步上限暂停，短时未插桩采样保持运行；原因尚未分离。最终包通过配置404、非法数值及图片404恢复；截图显示两种错误提示，图片恢复后18项场景图加载、3实体6监听。延迟图片请求时销毁场景并重建后回读正常；首次自动化路线处理错误保留。未验证所有错误与重试路径。Web Mobile此前矩阵无滚动；Web Desktop固定画布有滚动，两个目标的差异和最终包余项见issues.md。

## 构建与证据

最终命令：`CocosCreator.exe --project <client> --build "platform=web-mobile;debug=true;buildPath=D:/cocos-p1a-build;outputName=closeout-mobile-cache-20261028;startScene=44e30fdb-084f-5609-8283-4fdd8d2fab81"`。退出36；产物 `D:/cocos-p1a-build/closeout-mobile-cache-20261028`，本机临时HTTP `http://127.0.0.1:8771/`。source-manifest.json、build-manifest.json含SHA-256；build-cache-console.txt保留构建日志。端口冲突和SIGTERM详情、未完成用例见issues.md。

运行、静态检查、桌面浏览器和真机分别解释：本次没有抖音或真机验收，也没有实施P1-B、提交、推送、发布或部署。

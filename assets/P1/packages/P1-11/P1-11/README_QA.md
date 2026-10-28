# P1-11：运行时程序绘制图元（7项）

本批原始图像资产清单中 production_method 均为 `engine`，并且 export_spec=`none`。**交付代码及静态预览，不交付伪造的运行时PNG贴图。**

## 资产与源码一一对应

| ID | 文件 | 运行行为 |
|---|---|---|
| gen_danger_line | src/gen_danger_line.mjs | 世界高度1000的警戒线；1Hz警报呼吸（≤2Hz），减少动态时静态显示 |
| gen_drop_guide | src/gen_drop_guide.mjs | 投放位置跟随、边界clamp；返回实际显示x，不影响物理 |
| gen_score_text | src/gen_score_text.mjs | 运行期绘制整数分/纪录和限时飘分，减少动态关闭飘分 |
| gen_danger_countdown | src/gen_danger_countdown.mjs | 180tick=3秒，60tick/秒，暂停冻结，0秒不显示 |
| gen_shake_count | src/gen_shake_count.mjs | 基础次数、挑战券、剩余冷却；次数=0或冷却未结束不可点击 |
| gen_modal_dim | src/gen_modal_dim.mjs | 全区纯色半透明绘制+遮罩命中拦截辅助方法 |
| gen_loading_spinner | src/gen_loading_spinner.mjs | 代码绘制加载旋转指示；减少动态时显示静态文字 |

## 运行方式

在解压目录启动静态HTTP服务器：

```sh
python -m http.server 8765
```

然后浏览器打开 `http://localhost:8765/demo/`，左侧选择7种运行元素。需要具备ES Modules和Canvas2D支持的现代浏览器。若需要导入既有工程，可从 `src/index.mjs` 按需导入函数。

```js
import {drawDangerLine,drawShakeCount,drawModalDim,hitTestModalDim} from './src/index.mjs';
// ctx是750x1334设计基准的 Canvas2D Context；外层渲染器负责HiDPI适配
const dangerState = drawDangerLine(ctx,{worldY:1000,danger:true,elapsedMs:500,reducedMotion:false});
const shakeState=drawShakeCount(ctx,{baseRemaining:2,ticketRemaining:1,cooldownTicks:0});
// 游戏引擎同时应根据 shakeState.canShake 禁用或开放按钮点击
```

### 坐标和数据契约

- 默认设计尺寸750×1334；世界y向上，屏幕y向下：`screenY = 1334 - worldY`，因此警戒线1000对应画面Y334。
- 物理碰撞与边界应使用正式CupGeometry/布局提供的参数。这里的示例绘制**不改变物理系统**；杯型仅用于预览。
- 倒计时外部主循环按固定tick维护；渲染只消费当前剩余ticks，**暂停要由游戏逻辑停tick**。
- UI按钮需绑定 `shakeViewModel().canShake`，不能仅靠变灰实现禁用。
- `drawModalDim` 只负责画遮罩；游戏输入系统还需将 `hitTestModalDim` 或等价事件拦截接入真实事件派发。
- 颜色使用奶油白/焦糖棕/警报珊瑚红风格。字形依系统字体运行渲染，实际平台发布应配合法规授权字体。
- 使用 `prefers-reduced-motion` 或游戏弱动态设置传入 `reducedMotion=true`，暂停动画位移、旋转、飘分；危险呼吸默认1Hz，不超过2Hz。

## 自动验证与剩余检查

`node tests/spec_tests.mjs` 检查碰撞边界显示、1Hz呼吸、分数整数、180tick倒计时、暂停冻结、0次晃杯禁点击、冷却逻辑、遮罩点按拦截、弱动态模式。

另有7张**截图性质的预览PNG**（`preview/`，非正式引擎素材）、综合预览和Playwright运行截图。源代码已经做浏览器加载测试，但真实游戏UI状态同步、移动端触摸、安全区、60tick模拟循环和性能仍需在目标游戏引擎内集成测试；它们不应被标记为已完成终验。

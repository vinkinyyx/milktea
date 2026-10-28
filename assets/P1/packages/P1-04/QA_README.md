# P1-04 美术与工程验收报告

交付：5 个独立PNG，各有同名SVG可编辑源。PNG为运行尺寸；SVG为2倍尺寸母版（P1-03每层完整1500×2000）。

## 每项检查

| ID | 图片尺寸 | PNG模式 | 规格 | SVG源 |
|---|---|---|---|---|
| `bg_shop_base` | 750×1334 | RGB | 通过 | 有 |
| `bg_shop_extend_top` | 750×400 | RGB | 通过 | 有 |
| `bg_shop_extend_bottom` | 750×400 | RGB | 通过 | 有 |
| `ui_title_logo` | 800×300 | RGBA | 通过 | 有 |
| `spr_cup_shadow` | 512×128 | RGBA | 通过 | 有 |

## 技术与视觉检查

- 5 separate image assets
- base+top+bottom generated from one continuous source; seam checked with adjacent rows
- logo glyphs are editable vector paths, contains only fixed original title
- no live data, QR code or brand image baked into background

上下扩展无明显边界跳跃：顶部相邻行平均RGB差异 0.100 / 255，底部 0.000 / 255。字体路径来自本地安装的 Noto Sans CJK SC，不随包分发字体文件；固定标题为‘奶茶挤挤’。

## 验收边界

静态文件的尺寸、命名、透明度、向量源、叠层/连续性已经自检通过。**真实引擎中的导入配置、物理碰撞、动态小料遮挡、长屏设备适配仍需集成验收，不冒称已通过。**

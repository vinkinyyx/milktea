# P1-03 美术与工程验收报告

交付：7 个独立PNG，各有同名SVG可编辑源。PNG为运行尺寸；SVG为2倍尺寸母版（P1-03每层完整1500×2000）。

## 每项检查

| ID | 图片尺寸 | PNG模式 | 规格 | SVG源 |
|---|---|---|---|---|
| `spr_cup_classic_back` | 750×1000 | RGBA | 通过 | 有 |
| `spr_cup_classic_tea` | 750×1000 | RGBA | 通过 | 有 |
| `spr_cup_classic_front` | 750×1000 | RGBA | 通过 | 有 |
| `spr_cup_classic_rim_back` | 750×1000 | RGBA | 通过 | 有 |
| `spr_cup_classic_rim_front` | 750×1000 | RGBA | 通过 | 有 |
| `spr_cup_classic_base` | 750×1000 | RGBA | 通过 | 有 |
| `spr_cup_classic_label` | 750×1000 | RGBA | 通过 | 有 |

## 技术与视觉检查

- 7 layers share 1500x2000 canvas, viewBox 750x1000
- image Y =1200 - worldY; physical inner top (115,635) y140, bottom (195,555) y940
- transparent center back, tea as light/static decoration behind ingredients
- front layer strong-highlight coverage ~0.6% of canvas; below 10% cup-area target
- independently editable SVG, no separate raster cropping

母版使用一个 `classic_all_layers.svg` 作为真正七图层源；各层由同一模板拆出，没有原生图层坐标漂移。原有AI栅格七图（1086×1448）作为未通过历史稿，不在合格交付包中。

## 验收边界

静态文件的尺寸、命名、透明度、向量源、叠层/连续性已经自检通过。**真实引擎中的导入配置、物理碰撞、动态小料遮挡、长屏设备适配仍需集成验收，不冒称已通过。**

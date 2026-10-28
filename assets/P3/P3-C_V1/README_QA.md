# 奶茶 P3-C｜宣传封面和商店截图模板 V1

## 交付范围
- 共6项，对齐资料库原始 image-elements.json 资产ID。
- 2张原创合成封面：marketing_cover_square、marketing_cover_landscape。采用P1原游戏字标和P3-A真实杯体素材；不是独立随机概念插画。
- 4张上架截图的可编辑模板：play、merge、stages、rank。
- 每项含运行导出PNG、1份母版PNG、1份OpenRaster(.ora)可编辑分层源；完整QA报告、独立预览图及自动替换脚本。

## 状态划分
**两张宣传封面可作为静态营销素材进入人工内容审核**；尺寸和文件验收已通过。
**四张商店截图仅完成“模板”，未完成真正的上架成品。** 原始合同规定底图必须来自真实游戏截图，当前未提供游戏实机截图；交付图中显式写明“待替换真实游戏截图”“非实机画面”“不得直接用于上架”。为防误用，不提供伪造排名、获利或平台标志。

## 尺寸合同
- square: 1600×1600 ORA/母版，800×800 PNG
- landscape: 1920×1080 ORA/母版，1280×720 PNG
- 4截图: 1500×2668 ORA/母版，750×1334 PNG
- 6份PNG均为RGB不透明，携带sRGB ICC色彩配置。

## 如何生成真正可上架截图
在目标游戏真机运行后，保存play.png / merge.png / stages.png / rank.png四张截图（分辨率至少750×1334）。
调用：`python tools/render_real_screenshots.py --captures /game/captures --out /game/store_ready`。
这会将截图填入四套宣传模板，删除显式占位区；然后必须再次检查游戏画面真实性、排行榜匿名/授权、设备安全区、平台政策和截图发布时间，未通过前不可用于上架。

## 可编辑性说明
OpenRaster ORA包含背景、装饰、杯体/展示区、标题和状态提示等分组的独立栅格图层；这不是原始SVG或PSD矢量工程。封面主视觉沿用已交付且可溯源的P1/P3素材，支持在Krita/GIMP中进一步编辑。

## 已完成QA
资产ID：6/6；尺寸：6/6；RGB+sRGB：6/6；ORA可解析且≥4层：6/6；压缩包：无损完整性检查。未验证真实游戏截图、平台上架终审；这4项明确标记BLOCKED。

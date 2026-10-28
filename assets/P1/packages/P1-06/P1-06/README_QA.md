# 奶茶｜P1-06 基础UI图标 A｜交付与验收

**9个独立asset_id，9份真正可编辑的192×192 SVG母版，9张96×96 PNG，9张48×48 PNG**。PNG是透明RGBA、sRGB目标色彩，透明画布四角已核验。各图不含文本/背景按钮皮肤，适合叠加在P1-05按钮皮肤上。

## 资产

1. `ui_icon_play` 开始三角
2. `ui_icon_continue` 继续箭头
3. `ui_icon_pause` 暂停双条
4. `ui_icon_settings` 设置齿轮
5. `ui_icon_close` 关闭叉
6. `ui_icon_back` 返回箭头
7. `ui_icon_restart` 重开回转箭头
8. `ui_icon_home` 主页小屋
9. `ui_icon_music_on` 音乐开

## 文件与尺寸

- `source_svg/ui_icon_*.svg`：独立192×192源文件；使用可编辑路径、形状与渐变。
- `export_png/96/ui_icon_*.png`：96×96 PNG，完整透明画布。
- `export_png/48/ui_icon_*.png`：48×48 PNG，运行时48×48 DU目标显示。
- `preview/P1-06_9icons_contact_sheet.png`：仅展示总览，不是游戏运行纹理。
- `preview/P1-06_48px_readability_and_button_fit.png`：真实48像素预览与P1-05按钮皮肤组合。
- `qa/asset_qa.json`、`qa/asset_manifest.csv`：逐项机器检查与源文件映射。

## 风格标准

延续P1-05棕色系（深棕轮廓、焦糖内填、奶油色局部高光），轮廓圆角、图形置中，主线在192母版保持至少14像素、在96像素输出保持至少7像素，超过清单“96档笔画至少4像素”要求。仅在界面适合的奶白按钮上直接使用；如叠放深色主按钮，应由程序指定高对比浅色方案。

## 自检与限制

- 9/9资产ID逐项对应原清单，9/9 SVG源独立。
- 9/9 @96、9/9 @48 PNG准确尺寸、RGBA、四角透明；图片内容互不重复。
- 检查真实48像素可辨识度、奶白/浅茶/深棕背景与P1-05 icon按钮叠加示意。
- 静态文件检查≠真实游戏运行测试：交互目标至少48 CSS像素、启停状态变化、弱动态处理、不同设备对比和焦点可访问性仍需要开发者集成验证。

文件名完全采用原始asset_id；`@96/@48`是目录名分档，避免两个导出覆盖同一个文件名。

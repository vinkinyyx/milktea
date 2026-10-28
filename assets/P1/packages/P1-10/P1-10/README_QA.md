# P1-10｜核心特效和新手引导｜交付与QA

- 清单来源：`/奶茶/image-elements.json`与`/奶茶/奶茶_213项资产生产批次表_V1.csv`；本批精确8个资产ID。
- 7项 new_draw 独立美术：每项1份512×512可编辑分组SVG、1张512×512源级PNG、1张256×256 sRGB RGBA独立运行PNG。画布不自动裁切，pivot (0.5,0.5)。
- 1项 engine：`ui_tutorial_merge_example`，**规范写明export_spec=none**。交付`engine/ui_tutorial_merge_example.js`以已有小料缩略图组合（`small_pearl`×2 → `coconut`，供独立演示的P1-02引用文件位于`engine/reference_assets/`）；preview中的PNG只作展示，不得放入运行时美术清单。
- 5项特效：合成柔光环、短星光、食材细屑、投放确认光点、麻薯里程碑星。程序负责缩放、alpha与旋转，无序列帧。
- 2项引导：`ui_tutorial_hand_move`与`ui_tutorial_hand_release`，SVG层组可独立编辑手、箭头、小料及高光。
- 特效调度：普通合成4～6粒，最多10粒，预算并发48；弱动态减少粒子缩放位移和数量。普通合成180～240ms，麻薯里程碑600～900ms；危险提示≤2Hz。
- 导出：PNG含sRGB ICC、RGBA straight-alpha、完全透明图像边缘；所有图中心锚点。
- QA通过：完整性、规范尺寸、颜色配置、中心配准、透明边缘、黑白棋盘和缩小预览。程序组合为样例代码和静态预览，不代表已在项目引擎中验证。
- **未执行**：游戏引擎事件绑定、弱动态运行及真实屏幕/录屏测试。
- 源文件为分组矢量SVG，不是Photoshop PSD；可使用Inkscape/Figma/Krita等转换为其他分层编辑格式，但PNG不替代可编辑源。

## 资产清单
- `fx_merge_ring` — 合成柔光环（new_draw）
- `fx_sparkle` — 短星光（new_draw）
- `fx_crumb` — 食材细屑（new_draw）
- `fx_drop_ping` — 投放确认光点（new_draw）
- `fx_mochi_star` — 麻薯里程碑星（new_draw）
- `ui_tutorial_hand_move` — 引导手指移动（new_draw）
- `ui_tutorial_hand_release` — 引导松手（new_draw）
- `ui_tutorial_merge_example` — 两同级合成示例（engine）

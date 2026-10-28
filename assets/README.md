# 素材入库与使用说明

2026-10-27补交复查完成。补交内容已归位至P4/P4-A_V2与P1/packages/P1-01_layered_recovery，原包有效源稿与运行文件继续保留。assets/library是规范素材库，client/assets/resources/art/p1是P1待导入资源；清理过期包与重复预览时保留项目外可恢复备份。没有重绘、改色或重新压缩运行图；只在审查源码后运行了P4-A的Node参考断言。

## 现在从哪里取素材
- [素材库总索引](library/catalog.json)：按asset_id查规格、审查状态、运行图、源文件、来源SHA256和引擎注意事项。
- [可浏览素材清单](image-elements.html)：全部213项的规格与本次交付状态。
- [最新补交复核与清理](../docs/18-supplement-cleanup-report.md)：当前结果；[首次检查](../docs/17-asset-intake-report.md)保留历史。
- [逐项CSV审计](../evidence/asset-supplement-2026-10-27/audit.csv)：可用Excel按UTF-8打开。
- [P1客户端资源索引](../client/assets/resources/art/p1/catalog.json)：81项静态资产、117个运行尺寸导出。选择适合屏幕的一档，不要加载所有尺寸。
- [当前开发绑定](../docs/19-progress-and-next-actions.md)：PhysicsLab代码已使用九级小料、经典杯七层、背景/投影18项，另有P1全部81项的开发素材查看；真实Creator导入/渲染仍待验证。

## 素材库结构
```text
assets/library/
  runtime/<phase>/<category>/    静态运行图及可用宣传母版导出
  source/<phase>/<category>/     SVG/ORA及暂行PNG母版；PNG不冒充分层稿
  templates/<phase>/marketing/   四张尚未替换实机内容的上架截图模板
  engine/P1|P3|P4/...            程序绘制参考及相对依赖，尚非Cocos组件
  contracts/<phase>/<asset_id>/  平台真实头像/入口码等接入约定
  licenses/                     原包已有的来源和许可声明
  catalog.json                  全213项状态与文件索引
```

## 使用规则
1. 运行图名统一为asset_id@宽x高.png。所有库内图片与来源文件逐字节相同，不把预览拼图当贴图。
2. P2～P4暂不复制到client，避免提前打进首版包。按阶段从library/runtime领取；截图模板不进入运行库。
3. Cocos需实际打开编辑器生成/核对.meta；本轮没有伪造UUID或宣称完成导入。SpriteFrame加载key见客户端catalog.json，待编辑器实际导入后验证。
4. 杯体七层锚点(0,0)，画布750×1000，放在世界(0,200)，禁自动裁切透明边；小料锚点(0.5,0.5)，精灵完整边长=2×碰撞半径/0.9。九切边距按导出图像像素设置。
5. 九级小料已收到9份ORA重建分层稿，包含独立非空base/texture/highlight及空的可选表情层；它们是编辑参考，不替换已使用PNG。合成与当前母版的微小像素取整差异、后续材质编辑、色彩元数据和真机纹理仍需确认；不要求因本次补件重画整套。
6. engine中的Canvas2D代码是参考，不能直接当cc组件执行，开发阶段须移植并接真实逻辑、触摸和暂停时钟。
7. 平台头像、二维码、广告标识必须真实取得；contract不是替代图片。两个candidate装饰槽未立项，不算漏画。
8. P4-A的8项静态素材、2项程序源码、1项平台合同已补齐；当前静态/程序/合同文件缺件为0。合同不是已发行的真实入口码，两个candidate也仍未立项。

## 更新与复查
当前审计路径由config/asset-library-settings.json指定，旧证据不覆盖。补交素材归位到对应P1～P4目录后运行（-B避免新增字节码缓存）：
```text
python -B tools/audit_asset_library.py
python -B tools/check_art_geometry.py
python -B tools/install_asset_library.py
python -B tools/build_asset_library_viewer.py
python -B tools/build_image_catalog.py
python -B tools/validate_design.py --build
python -B tools/verify_asset_library.py
```
审计/入库工具需要Python与Pillow。若规范库同名文件内容不同，安装工具会停止，防止覆盖已使用版本；先复核变更再作版本更新。规范清单生成工具和原文档检查仍只依赖Python标准库。


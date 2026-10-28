# 补交素材复查与项目清理

2026-10-27，supplement-v2。当前结论：上次P4-A缺少的11项已全部到位，九份ORA重建分层稿也已收到。可以继续开发试集成，仍不等同Cocos/真机/平台验收完成。

## 1. 补交归位与检查
- 原补交目录共51个文件。P4-A_V2移入assets/P4/P4-A_V2，9份ORA移入assets/P1/packages/P1-01_layered_recovery，补交QA保留在本轮evidence/delivery-QA。
- [归位清单](../evidence/asset-supplement-2026-10-27/normalization-plan.json)记录移动前后路径、字节和SHA256。
- P4-A随包37条文件哈希全部一致；没有缺失或错配。8项图片的13份规范导出、8份SVG、2个Canvas参考模块、1份平台合同独立存在，未从总览裁图补交。
- 经阅读两个模块和断言文件后，实际执行Node测试，15项通过。它只验证120投边界与核验前不得领先等参考函数，不证明游戏或服务端业务完成。
- P4-A独立图片已目视核对，圆角、暖棕轮廓和奶油色系与原库一致；分享卡留空动态数据区，不画假玩家/二维码。

证据：[随包哈希复核](../evidence/asset-supplement-2026-10-27/provided-hash-verification.json)、[参考源码测试](../evidence/asset-supplement-2026-10-27/runtime-reference-tests.json)、[P4-A独立图总览](../evidence/asset-supplement-2026-10-27/P4A-independent-contact.png)。

## 2. 九份ORA的准确结论
9份文件均为1024×1024，压缩包及stack.xml可读取，有base、texture、highlight、optional_face图层。前三层有不同的非空像素，optional_face是隐藏空层，符合可选表情留槽用途；不是把同一整图复制成四层。
它们由原栅格恢复分层，不是原始创作过程的独立绘制工程。可用于编辑和返修参考，材质/高光能否满足将来的具体修改仍需设计师确认，不把这一点扩大成必须重画所有配料。
合成图与当前PNG的alpha完全一致，RGB平均每通道绝对误差最高约0.0181/255，属于很小的像素量化差异。为保持已定视觉与派生图一致，本轮没有用ORA重新导出覆盖现有PNG。

证据：[图层结构与非空检查](../evidence/asset-supplement-2026-10-27/ora-layer-review.json)、[与当前母版对照](../evidence/asset-supplement-2026-10-27/ora-current-master-comparison.json)。其中补交时路径由归位清单映射到现目录。

## 3. 当前库状态
| 项目 | 当前结果 |
| --- | --- |
| 总资产ID | 213 |
| 静态素材 | 190项，含4张待实机替换的上架截图模板 |
| 程序参考 | 16项，待逐项Cocos适配 |
| 平台接入合同 | 5项，真实能力与原件仍需实际平台 |
| 未立项候选 | 2项，不要求本轮制作 |
| 静态/程序/平台合同文件缺件 | 0 |
| P1客户端资源 | 81项、117张PNG，运行版本未改变 |
| 入库复制 | 576个文件，逐个校验与来源一致 |

[浏览素材库](../assets/library/index.html)、[开发索引](../assets/library/catalog.json)、[本轮审计](../evidence/asset-supplement-2026-10-27/audit.json)、[入库记录](../evidence/asset-supplement-2026-10-27/installation-manifest.json)。

## 4. 清理范围与恢复
清理采用项目外可恢复移动，不永久删除原稿。处理对象：
- 旧浏览器自动化会话、控制台日志与Python字节码缓存。
- temp中的重复Git检出与可再生P1-A编译结果。
- 过期v0.1/v0.2设计ZIP；保留当前分册、阅读版、代码和工具。
- 已由完整V2取代、只有说明与预览的P4-A_V1。
- 与同目录保留预览SHA256完全相同的URL编码重复副本。
- 补交内容归位后留下的空包装目录。

不清理：当前工程、有效源文件、运行导出、.meta、配置/契约、授权声明、技能快照、独立验收证据，以及有用途的不同尺寸/格式导出。原包与规范库的双份文件承担追溯与取用两种用途，不能仅因字节相同就删掉。

[清理计划](../evidence/asset-supplement-2026-10-27/cleanup-plan.json)含各路径、原因和备份位置；[执行记录](../evidence/asset-supplement-2026-10-27/cleanup-execution.json)确认已从项目移出301个文件、10,710,405字节（约10.7MB），12个清理目标均完成，301个归档文件哈希全部一致，没有永久删除文件。

项目外备份根目录是D:/Workspace/TapTap/_cleanup-backups/milktea-20261027-supplement-v2。历史原包哈希中的已归档预览可通过清理清单找到，不能误报素材丢失。恢复时仅按清单将所需项目移回原路径；若目标已有新版本，应先比对，不能覆盖。

[最终完整性检查](../evidence/asset-supplement-2026-10-27/final-verification.json)核对当前运行库、源文件、归位与归档引用；[浏览器记录](../evidence/asset-supplement-2026-10-27/browser-review.json)确认190张预览均解码、P4-A筛选11项/8张图、缺件筛选0项，桌面与375px显示无横向溢出。可运行python -B tools/verify_asset_library.py重新检查；Cocos与真机验证另行执行。

## 5. 仍保留的限制
63张原运行PNG未显式标记ICC/sRGB，本次补件没有重新定义其源色彩，因此没有盲目加标或改色。四张上架图仍是模板。Cocos实际导入、物理接触、DPR/纹理压缩、真机触摸和平台审核尚未执行；这些不应再混为“素材文件缺失”。

首次检查保留在 [17号报告](17-asset-intake-report.md)，其中P4-A缺件属于当时事实，以本报告和最新素材库为当前状态。


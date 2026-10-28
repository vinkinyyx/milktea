# 进展复核与图片绑定记录

日期：2026-10-27。该目录是源码检查和图片绑定的交付记录，未生成Creator构建产物。整体阶段仍为 **P1-A待实际运行验收**，不批准进入P1-B。

## 本轮修改

- PhysicsLab的程序小料占位改为已交付的九级PNG，杯体改为经典杯七层，背景和投影使用现有图。18项进入场景初始化加载；P1全部81项可从 `G` 开发素材查看入口按需浏览。
- 新增ArtCatalog/ArtAssets：按原索引选择分辨率、锚点和九切；使用完整ImageAsset生成SpriteFrame，保留杯层透明画布。原PNG与源文件未改变。
- `B`可显示真实碰撞代理参考；`V`自动采样120tick并暂停，记录实际step调用数与引擎dt采样频率；`N`为最高级圆/最窄杯试验。它们是开发工具，不是新玩家功能。
- 修复原AppRoot未定义mapper、2D碰撞体误用material接口。新增官方3.8.8类型声明和固定的TypeScript开发依赖，完整脚本静态检查可复跑。
- 清空/重建会清理旧自由落体和采样状态，图片异步加载、素材翻页和场景销毁按generation丢弃旧结果；Clock允许在步回调内准确暂停。

## 实际检查结果

| 检查 | 状态 | 证据与范围 |
| --- | --- | --- |
| 全部客户端脚本类型检查 | PASS | `npm run typecheck`，TypeScript 5.4.5 + 官方@cocos/creator-types 3.8.8；见typecheck.txt。不是Creator编译/导入 |
| 配置、时钟、坐标、杯几何纯逻辑 | PASS | core-logic-results.json；含17/30/60fps回调内准确停在120tick |
| 素材文件与绑定 | PASS | art-binding-results.json；检查规范库PNG和P1客户端117张PNG哈希/尺寸，九级主体直径与碰撞半径映射、杯层画布/锚点、索引错误处理 |
| 已有场景JSON引用 | PASS | environment.json中的sceneStructure；只验证静态引用，没有由编辑器打开 |
| 新增脚本/PNG的实际.meta导入 | NOT RUN | 新增脚本与117张PNG由真实Creator首次导入时生成；本轮没有伪造图片UUID |
| 当前图片在Cocos中渲染、Sprite层次/九切、透明边 | NOT RUN | 无可用Creator；G/B入口代码存在，不代表已操作通过 |
| 重力/固定步/碰撞/压力/暂停/重建的引擎验收 | NOT RUN | 无可用Creator/Box2D运行环境；早期模型结果不能替代引擎实测 |
| 实际平台构建 | NOT RUN | 没有目标选择、构建日志或产物 |

复跑：在client执行 `npm ci`、`npm run typecheck`、`npm run verify:art`。依赖以package-lock.json为准。类型包为 [Cocos官方声明](https://github.com/cocos/creator-types)；图片加载依据 [Creator 3.8 SpriteFrame文档](https://docs.cocos.com/creator/3.8/manual/en/asset/sprite-frame.html)。

后续具体操作见 [当前进展与下一步](../../docs/19-progress-and-next-actions.md)。本次没有提交、推送、发布或部署；目录没有.git元数据。

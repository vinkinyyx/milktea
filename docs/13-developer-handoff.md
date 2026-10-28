# 初级开发者交接入口

交接版本 v0.2；P1-A 已建立 `client/` 下的 Cocos Creator 工程骨架、PhysicsLab 场景源、配置/坐标/时钟核心模块和 Box2D 适配器。当前环境没有安装 Creator，场景导入、运行与引擎物理验收仍未完成；不能把纯逻辑检查视作运行通过。打开步骤见 [client/README](../client/README.md)，逐项结果见 [P1-A 证据](../evidence/P1-A/20261027-p1a-foundation/acceptance.md)。

## 1. 开工顺序

最新实施状态、图片绑定与下一步操作见 [进展清单](19-progress-and-next-actions.md)。客户端现已通过官方3.8.8声明的全部脚本类型检查，PhysicsLab代码已使用真实图片；编辑器导入与运行仍待完成。

1. 读 [项目说明](00-project-brief.md)、[阶段验收](12-delivery-phases.md) 和被分配的阶段文档。
2. 读 [公共模块合同](development/common-contracts.md) 与 [TypeScript类型合同](../contracts/types.ts)。
3. 查 [参数配置](../config/design-baseline.json)，不得将半径、分数等再手抄一份硬编码。
4. 创建该阶段要求的文件/场景，遵循任务次序和自测样例。
5. 形成阶段证据，未执行项如实登记。不要把UI演示当真实平台接口完成。

完整阶段设计另提供 [开发手册阅读版](development/development-handbook.html) 和 [Markdown合并版](development/development-handbook.md)。

## 2. 全部阶段设计

- [公共模块、数据与错误合同](development/common-contracts.md)
- [P0 规格交接](development/p0-planning.md)
- [P1-A 工程与物理基础](development/p1a-foundation.md)
- [P1-B 核心循环与存档](development/p1b-gameplay.md)
- [P1-C UI、美术、动画与音频](development/p1c-presentation.md)
- [P1-D 内测与调参](development/p1d-validation.md)
- [P2 抖音封测](development/p2-douyin.md)
- [P3-A 五款、身份、云进度](development/p3a-progression-cloud.md)
- [P3-B 奖励、验分与排行榜](development/p3b-reward-ranking.md)
- [P3-C 正式发布](development/p3c-release.md)
- [P4-A 每日与好友挑战](development/p4a-challenges.md)
- [P4-B 图鉴、成就与外观](development/p4b-collection.md)
- [P4-C 自愿激励广告](development/p4c-rewarded-ads.md)
- [P4-D 多平台](development/p4d-multiplatform.md)

## 3. 契约文件

| 文件 | 用法 | 当前验证边界 |
| --- | --- | --- |
| [types.ts](../contracts/types.ts) | 共享领域数据、命令、事件、适配器接口 | 规格代码，不是已实现模块 |
| [OpenAPI](../contracts/api.openapi.json) | P3/P4请求/响应/错误/幂等约定 | JSON及引用静态检查，不代表API已运行 |
| [schema.sql](../contracts/schema.sql) | PostgreSQL表、索引、约束与事务起点 | DDL设计，未对真实数据库迁移 |
| [样例](../contracts/examples.json) | RNG、分数、排名、券边界输入输出 | 静态期望，不冒充游戏回放 |
| [配置](../config/design-baseline.json) | 参数唯一来源 | 初值，未经手感/性能验证 |
| [图像资产清单](../assets/image-elements.csv) | 每个图形的ID、尺寸、状态与制作要求 | 用户另行设计；列表不是现成图 |

## 4. 目标工程组织

阶段文档中的core/、ui/、physics/、cloud/等短路径均相对client/assets/scripts；server模块短路径相对server/src，数据库迁移统一放server/migrations。阶段表的模块名可描述职责，实际公共接口名以contracts/types.ts为准，不再创建同职责的两套服务。

```text
client/                           未来Cocos工程根目录
  assets/scenes/Boot.scene,Menu.scene,Game.scene,PhysicsLab.scene
  assets/prefabs/Ingredient.prefab,Cup.prefab,HUD.prefab,Results.prefab
  assets/scripts/core/             不依赖cc/tt的领域规则
  assets/scripts/physics/          Cocos/Box2D封装
  assets/scripts/presentation/     场景、UI、动画、音频
  assets/scripts/persistence/      本地双槽与迁移
  assets/scripts/platform/         Local与Douyin适配
  assets/scripts/services/         HTTP、身份、云存档、榜单
  assets/resources/config/         从根config同步而来
server/                           P3创建；建议TypeScript+PostgreSQL
  src/{auth,runs,progress,rewards,leaderboards,challenges,catalog,ads}
  migrations/                     将contracts/schema.sql转成受管理迁移
tests/                            未来选择一套TS测试工具后创建
evidence/                         各阶段的实际证据
```

既有 docs/assets 是设计资料，不直接当Cocos assets；正式资源按清单导入client，保持.meta与源文件配套。初次实现推荐一个小型core测试工具（可采用Vitest），锁定版本后使用，后续不再引入第二套竞争测试框架。

## 5. 每个开发任务的完成模板

```text
任务ID与目标：
影响需求与配置：
创建/修改文件：
外部依赖与实际版本：
实现步骤：
正常路径结果：
异常路径结果：
运行命令或编辑器步骤（按真实工程提供）：
截图/日志/测试证据：
剩余缺口：
```

不能猜测 `npm run dev` 或Cocos自动节点绑定。工程创建后，先在自己的package.json定义并验证实际测试脚本，再在交付说明中引用它。

## 6. 给设计师的边界

请单独交付素材，不在图片内烘焙动态分数、昵称、次数或倒计时；不生成假的二维码、平台授权标志和广告标识。清单区分“需要新画”“从母版导出”“引擎绘制”“平台提供”。对应制作说明见 [图像总规范](14-image-production.md)。

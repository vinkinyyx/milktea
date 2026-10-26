# P3-A · 五款奶茶、账号与云进度

## 前置与边界
P2真实能力可用。使用contracts/api.openapi.json、schema.sql和types.ts实施HTTP服务；建议TypeScript服务+PostgreSQL，实际框架选定后锁版本与真实脚本，不能先写不存在的运行命令。部署供应商/费用未定，不把免费额度当承诺。

## 客户端与服务端文件
| 文件/模块 | 实现职责 |
| --- | --- |
| core/StageCatalog.ts | 5款配置、前置最高分解锁、杯宽倍率 |
| ui/StageSelectPresenter.ts | 已解锁/未解锁/加载中/离线，逐款纪录与继续 |
| platform/SessionClient.ts | 平台code换会话，过期刷新、401退出重登 |
| cloud/ProgressSync.ts | 读取revision，CAS提交、冲突合并和本地缓存 |
| server/auth/SessionService.ts | 服务端平台换身份，player绑定，不信客户端openId |
| server/runs/RunService.ts | 创建run/seed/rulesVersion、归属和状态校验 |
| server/progress/ProgressService.ts | 解锁/设置/云档，revision事务 |
| server/db/migrations/001_initial.sql | 从schema设计生成可回滚迁移，先在测试库演练 |

## 五杯规则与界面
classic默认开；coconut_green需经典最高分500；taro_boba需上一款800；brown_sugar需上一款1100；mochi_special需上一款1400。宽度倍率1/.95/.90/.85/.80，只缩杯几何的横向宽，不缩配料、重力或画面中的圆形。
解锁按前一杯单局最高分，累计总分不能解锁，解锁不扣分；一次解锁永久保留。边界测499/500、799/800等。每款无限重试，记录独立最高分；经典得分不能写进其他款榜。
服务器已验证成绩可永久解锁；本地未验成绩仅可形成迁移标记/本地练习进度，不能直接写在线榜。离线允许玩本地练习，联网成功后不把它包装为服务器开局的权威成绩。

## 身份与run创建
POST /sessions/exchange仅接受平台code+appid，由服务端请求平台合法接口取得稳定身份；同一(platform,appId,subjectId)唯一。token为随机不可猜会话，只保存散列与过期，日志脱敏。
POST /runs鉴权后检查stage是否解锁、rules可用、mode允许，服务器分配seed/runId、基础2次、最多额外5、初始快照。请求重放同一Idempotency-Key返回原run而非两局。客户端提供的playerId不作为访问依据。
所有run/checkpoint/result必须先校验owner；他人的runId返回拒绝，不能因为知道UUID就能读取存档。

## 云存档CAS流程
GET /progress获得revision。PUT携带expectedRevision；数据库事务锁player_progress行，revision不等返回409 REVISION_CONFLICT并带当前revision；相等才写新档和revision+1。客户端409先拉最新，再向用户说明“其他设备已有进度”并选择继续哪一局；不能悄悄以最后时间覆盖。
永久进度合并使用解锁集合并集、各杯已验证最高分max；设置按用户最近明确选择；activeRun不同不拼接对象列表、不合并分数/RNG/剩余晃杯。每run本身checkpoint也用revision，不混两台并发命令。
导入旧本地最高分只能标imported_local，保留给玩家查看/本地练习；可信排名走新run。未知schemaVersion保留原档并提示升级；不能自动清空永久进度。

## 数据/安全与异常
数据库约束、索引和服务校验都需要，不仅前端隐藏按钮。平台token、会话明文不存客户端可读云档。限制body≤5MiB，数值finite，实体数量按合法投放日志推导；不要把任意JSON直接写数据库。
网络超时保留本地待同步，不显示“已云保存”；重试保持同一幂等键。数据库不可用返回503，不回200假成功。默认环境/密钥用.env.example描述名称，不提交真实值。
备份需演练从测试库恢复；迁移失败停止发布，旧库和旧包仍能读取旧schema。

## 开发顺序与验收
先数据库和测试身份→鉴权→创建run→进度读取/CAS→五杯界面→断网和冲突→本地迁移。使用两个设备/会话模拟同账号修改；检查真实DB行和revision，不以toast为证。
交付迁移、API服务、数据库结果样本（匿名）、五杯资源接入、冲突录屏和接口测试。必须覆盖阈值边界、重复请求、伪造身份、越权run、过期token、断网重试及多设备冲突。


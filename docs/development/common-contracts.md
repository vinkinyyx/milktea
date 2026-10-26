# 公共模块合同与开发约定

适用全部阶段。玩法真相来自配置和core；UI、音频、平台回调不得直接改分数或对象集合。字段定义以 [types.ts](../../contracts/types.ts) 为准。

## 1. 模块职责与输出

| 模块/目标文件 | 输入 | 唯一职责/输出 | 禁止做的事 |
| --- | --- | --- | --- |
| ConfigRepository | design-baseline.json | 校验并提供不可变Rules | 运行中偷偷改规则 |
| SessionController | 命令、逻辑tick | 状态转移、runId/epoch、唯一终局 | 直接播音/改贴图 |
| DropController | 指针语义命令、RNG | 检查投放间隔/占位、生成一次对象 | 用Math.random决定掉落 |
| PhysicsAdapter | 物体定义/力 | 创建/查询/安全步进/变换，统一坐标 | 修改分数、奖励 |
| ContactRegistry | begin/end接触 | 活跃接触对集合 | 接触回调中销毁刚体 |
| MergeResolver | 活跃接触、实体表 | 排序、锁父对象、生成合成事务 | 由动画回调决定生成 |
| ScoreService | MergeCommitted | eventId去重并累计分数 | 对投放、时间或分享加分 |
| DangerService | 合格物体与tick | 危险/洒出计数、终局原因 | 因贴图抖动触发失败 |
| ShakeController | Shake命令/券确认 | 唯一扣次、48tick力曲线/30tick冷却 | 每帧再施加一次冲量 |
| SaveRepository | 完整步边界快照 | 双槽写入、校验、恢复 | 把损坏当新局静默吞掉 |
| HUD/IngredientView | 只读状态/事件 | 显示和动画 | 反向改刚体半径 |
| Audio/VfxManager | 领域事件、表现RNG | 播放与资源生命周期 | 消耗掉落RNG |
| PlatformAdapter | 用户动作/平台周期 | 能力、存储、录屏/广告调用 | 伪造不支持能力成功 |
| ApiClient | 已登录会话/请求 | 超时、幂等键、重试分类 | 把平台secret写进客户端 |

## 2. ID、数值与时间

- `runId/requestId/eventId`：UUID字符串；P1可用平台安全随机生成，不能用于奖品凭证。实体ID为局内递增整数，续局恢复nextEntityId。
- tick为从0递增的安全整数，逻辑60Hz。0.45秒=27tick，3秒=180tick，0.75秒=45tick，0.8秒=48tick，0.5秒=30tick。
- DU表示设计单位。规格物理单位100DU，Cocos内部比例由P1-A校准，只在PhysicsAdapter转换。
- 在线时间统一UTC ISO8601传输；日额度用服务器 `Asia/Shanghai` 的自然日。不能以客户端日期入账。
- 分数为非负整数；level为1～9；坐标/速度需有限数。拒绝NaN、Infinity、越界数组和未知字段滥用。
- `rulesVersion` 是竞技规则，`saveSchemaVersion` 是存档格式，`appVersion` 是包体；三者不能混成一个版本。

## 3. 输入与一步执行顺序

每tick：去重并消费输入→应用外力→唯一物理step→更新活跃接触→合成事务→计分→危险/越界→终局→快照/表现事件。输入事件携带目标tick，已过期/属于旧runId/旧epoch的事件拒绝。

拖动只改瞄准DU位置；有效松手产生DROP命令，移出区域/触摸取消不投放。按钮事件先由UI消费；第二根手指不参与当前投放。暂停清掉held pointer，恢复不补一次松手。

## 4. 掉落随机算法

选定 `xorshift32_v1_nonzero_seed`。uint32状态不能为0，nextU32：

```ts
let x = state >>> 0;
x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
state = x >>> 0;
return state;
```

浮点 `u=nextU32()/4294967296`，u<0.55取1级，u<0.85取2级，否则3级。初始化依次抽current和next；成功投放才推进一次预告。测试seed=1的前五个整数为270369、67634689、2647435461、307599695、2398689233。音频变体用不同实例。

## 5. 结果、错误与UI映射

统一 `Result<T>={ok:true,data:T}|{ok:false,error:{code,message,retryable,requestId?}}`。预计拒绝不是异常崩溃：

| code | 行为 |
| --- | --- |
| INPUT_BLOCKED / COOLDOWN | 不生成对象、不扣资源；必要时轻提示 |
| NO_BASE_SHAKES / NO_COUPON | 次数不变；P1不出现线上领券入口 |
| STORAGE_CORRUPT | 提供备份恢复/新局选择，保留诊断 |
| UNSUPPORTED_CAPABILITY | 明确不可用，核心游戏可继续 |
| NETWORK_TIMEOUT | 当前结果未知时查询幂等请求，不盲目重做 |
| UNAUTHORIZED | 刷新平台会话一次，失败回登录/本地模式 |
| CONFLICT_REVISION | 回读云端并按规则合并，不覆盖新数据 |
| DAILY_LIMIT / ALREADY_CLAIMED | 回读余额，提示明确，不能再入账 |
| VERIFICATION_PENDING / REJECTED | 本地成果保留，正式榜待验证/不计榜 |
| RULES_VERSION_UNSUPPORTED | 保留档案，显示版本更新，不强行按新规则续跑旧局 |
| PHYSICS_INVARIANT_BROKEN | 暂停保存诊断，当前在线成绩不公示 |

## 6. 异步生命周期

所有异步请求捕获 `{runId,epoch,requestId}`；完成后核对当前拥有者。切局递增epoch；物理、音效、粒子和计时器停止并释放。在线资源事务若已提交，前端关闭不撤销它，恢复时查询请求结果并按命令ID应用一次。

## 7. 存档与版本

完整对象数组按entityId排序；校验内容包括对象、分数、RNG、current/next、nextEntityId、危险计数、shake状态。当前步合成提交完成后才能快照。checksum是损坏检测，不是防作弊。

双槽协议：读取两个槽→验证JSON/schema/版本/checksum→选最高完整revision；写非当前槽→回读验证→更新指针。指针写失败不删除旧槽；重开按新runId，旧回调不能覆盖新档。

云档分开存“长期进度”和“进行中的run checkpoint”。最高纪录取max、解锁取并集、设置按明确最后写入；不能对两个不同run的物体数组合并。券不在云档，由流水账单独管理。

## 8. 分支与验收

未来开发每个任务保持一份清楚变更，需求编号进提交说明。遵循仓库真实配置，不删除失败测试、不伪造平台响应。缺少外部权限时保留接口及测试替身，但交付注明真实接入未完成。

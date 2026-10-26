# P1-B · 核心玩法与本地存档

## 输入、目标及模块
输入为P1-A通过的Adapter、配置和contracts/types.ts。本阶段完成经典杯九级玩法，不做账号、榜单和真实分享。Game场景节点：AppRoot / World(CupWalls,IngredientRoot,PreviewRoot) / Presentation(FxRoot) / Canvas(SafeArea,HUD,DropInput,ModalRoot)。
| 文件 | 对外职责 |
| --- | --- |
| core/RunEngine.ts | dispatch(command)、advanceOneTick()、snapshot()、restore()；状态的唯一写入者 |
| core/DropController.ts | 校验x、间隔和出生空间，接受一次投放并推进随机队列 |
| core/MergeResolver.ts | 持续接触对→稳定排序→预留父对象→合成事务 |
| core/DangerJudge.ts | 更新资格、越线累计、溢出和失败原因 |
| core/ShakeController.ts | 校验次数/状态/冷却，计算每tick水平加速度 |
| core/ScoreLedger.ts | 消费唯一合成事件ID，累计整数分数与maxLevel |
| persistence/LocalSaveRepository.ts | 双槽/校验/迁移；不含引擎Node引用 |
| scenes/GamePresenter.ts | 将领域事件转换为节点/声音；不反写分数 |

## 状态机和命令
启动完成进PLAYING并显示首投提示；暂停进入PAUSED，恢复回原状态；失败先SETTLING再RESULTS。UI遮罩期间阻止穿透投放。RESULTS只允许重开/返回，不再接收DROP/SHAKE。
每命令含runId、commandId、sequence、tick；本地异步信封额外保存epoch，不增加网络命令字段。旧局异步结果和重复sequence均拒绝；sequence持续递增。重开先递增epoch、退订、销毁世界，再创建新seed和runId，禁止沿用旧事件队列。

## 随机与投放详细算法
使用非零seed的xorshift32，所有移位按无符号32位归一；u=nextU32/2^32，落在[0,.55)/[.55,.85)/[.85,1)分别1/2/3级。初始化先抽current，再抽next；投放成功后current=next、再抽next；无效投放不消耗随机数。化妆粒子/声音不得用这条RNG。
触摸起始若命中UI就由UI消费到底；游戏区域按拖动更新水平位置，松手投放。把屏幕点转换DU；按当前半径和杯口限制x。最小投放间隔27tick。出生区与其他刚体重叠时显示“杯口被挡住”，不创建刚体、不加dropIndex、不消耗随机；允许移动或晃杯解决，不能永久锁输入。防止同时两个touch各创建一个小料。
新实体分配递增ID、bornTick、level和units；预览始终不是刚体。一次有效投放只发一次DropAccepted。

## 每物理tick严格顺序
1. 取本tick有效命令，校验状态/顺序；DROP加入出生队列，SHAKE请求先判额度。
2. 创建已接受出生实体；给晃杯影响的实体施加F=m×a；物理世界只推进一次1/60秒。
3. 取持续接触集合，先为所有实际接触的动态实体标记dangerEligible；静态杯接触secondId=null也触发资格，但不参与合成。然后过滤已销毁、非同级、9级和未进世界实体。
4. 同级候选先按level升序、中心距升序、较小ID、较大ID排序；逐个预留两个父ID，已预留父不可再用。
5. 在安全边界原子提交父消失/子出现；清理旧接触。新增子本tick不参与第二轮预留，下tick按实际接触继续连锁。
6. 根据唯一MergeCommitted计分；更新危险资格、越线/溢出判定，必要时锁定终局。
7. 提交snapshot修订、事件；表现层最后消费。禁止接触回调直接加分或用粒子完成回调控制合成。

## 合成事务与示例
A/B同级l<9，子等级l+1；子units=A.units+B.units。位置、速度取逻辑质量权重平均并限速；角速度作限幅平均。出生位置不得穿墙，若加大圆与杯边重叠，用三条内半平面投影到可行区域；顶部保持开放，不把越线对象强行压回杯中。刚体重叠的解压交由物理求解，禁止全杯传送。
child.dangerEligible = A.dangerEligible OR B.dangerEligible；bornTick取父最早，hasEnteredCup取OR。这样合成不重复获得免判时间。
逻辑units守恒，因半径增长小于sqrt(2)，视觉占用面积释放；物理质量按密度与新面积计算，不声称真实质量守恒。
子2级+10，子3级+30，4/5/6/7/8/9级分别60/100/150/210/280/360。两次1→2再一次2→3共50分。256个1级理论合到一个9级累计9680分。9+9只碰撞，不合成、不额外得分。
事件ID采用命名空间UUID由runId/tick/parentMin/parentMax确定，保持UUID字段合同；ScoreLedger有去重集合或同tick提交账本。重复接触和重复表现播放不得再加分。

## 危险、溢出与结算
普通新投实体满45tick或首次接触后才具备危险资格。对具备资格实体检测中心y+半径>1000；连续有任意合格越线对象就累加全局dangerTicks，无越线清零。计到180tick以CUP_FULL失败，合成先于本判断。切后台/暂停冻结，晃杯不冻结。
hasEnteredCup仅当实体确实进入杯口下方的有效区域后置true；出生在杯外上方不算溢出。已入杯实体从开放杯口离开、位于杯外持续30tick才以SPILLED结束。穿过侧/底是缺陷，记录物理问题，不能包装成正常溢出。
RESULTS保存最终分、最高小料、投放次数、用券数和原因；无限模式没有通关后强制结束，合到麻薯只提示里程碑。破个人纪录算成绩进步；堆满是本局结束，可继续重开。

## 晃杯
本地每局2次基础机会，P1无额外券。48tick内按配置a(t)=3.2 sin²(πt/T) sin(2π·2.5t)计算水平加速度，T=.8秒，所有动态体F=m×a；外观轻摆≤6DU作用杯与小料的共同表现父节点，碰撞世界不动。使用一次在启动时扣，30tick冷却从结束起算，不能同时重复启动；暂停冻结时长。无实体时可拒绝且不扣次。它不保证合成、不改半径、不删除小料。

## 本地存档
双槽A/B每份{schemaVersion,revision,payload,checksum}，checksum对规范化payload做SHA256用于损坏检测，不是防作弊。先写非活动槽并回读核验，再写活动指针；恢复时取可校验且revision最高者。支持写一半、坏JSON、未知版本回退和显式告知，不能静默清档。
游戏暂停、有效投放/合成/晃杯结束时触发防抖保存；结束立即保存。snapshot保存RNG、计数、危险、每体DU位置速度资格、队列、晃杯进度；P1恢复可暂停在原处，准备完成后玩家点继续。恢复不播放历史得分/声音；重建后清空引擎接触缓存再采集。过期的后台回调按epoch丢弃。
图像/引擎Node/平台token不进存档。旧版本无法迁移时保留原字节备份，提供新开一局且保留个人纪录；云档将在P3另设计。

## 实施步骤与验收
先做单投放→同级合成→多对接触排序→计分→最高级→危险→晃杯→结算→重开→双槽保存→恢复。每步可在debug场景直接摆放坐标，不暴露调试入口给正式玩家。
必测：seed1前五随机值/等级；50分和9680理论账本；3同级只有1对合成；4同级最多2对；持续接触后可继续合；9级不合；179tick不败、180败；暂停不增长；新投出生不误判；旧回调不污染新局；损坏一槽可读另一槽。
交付核心源码、可玩Game场景、测试报告、保存样本和操作录屏。不能把理论算分测试通过写成真实物理已验证。


## 契约补充
实体units从配置level派生，不在IngredientState重复存可冲突字段；事件units必须等于派生父units之和。tutorialCompleted为当前版本布尔标记，若将来新增引导版本再迁移schema。SHAKE_PENDING是UI请求锁，持久状态仍为PAUSED并记录恢复目标。

lastDropTick必须入档，初值null表示从未投放，不能读档绕过27tick间隔。settleStartedTick和challenge保存P4最后一投的收尾起点与题目deadline/budget，经典局为null。Adapter只返回PhysicalBodyState，bornTick/资格/溢出计数由RunEngine维护，不用引擎对象覆盖逻辑字段。
ContactRegistry按contactId维护实际接触，避免同一对象接触两条杯边时一条end误清另一条。顶部离杯以已入杯实体完全越过口沿（centerY-radius>1060）且已离开有效杯内区域开始累计；侧底穿透仍是物理错误。溢出与杯满同tick满足时优先SPILLED，终局仍只提交一次。

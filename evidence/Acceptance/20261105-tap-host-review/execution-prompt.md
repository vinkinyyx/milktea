# 开发整改提示词

请在 `D:\Workspace\TapTap\奶茶挤挤` 继续实际修复，先读 AGENTS.md、docs/44-tap-host-start-review.md、docs43及相关产品/持久化分册，并遵循 taptap-release-readiness、官方Tap小游戏与Creator3.8.8规范。保护已有修改和美术原稿，不更换引擎，不擅自上传/发布。

本轮验收未通过，请完成以下事项：

1. P0：用户在Tap自测点击开始后只有背景、没有杯/HUD/按钮；Web Release正常。先核对失败上传包SHA与首条宿主错误，区分平台入口与游戏内开始，不从截图猜根因。按docs44加入Release可用的低成本阶段日志、独立于贴图/物理的状态与错误层、可取消的资源加载截止。逐步定位菜单初始化、Bundle/图片、世界/刚体、初始存档、HUD与首帧；修复首次真实失败。超时、迟到回调、后台切换和渲染异常不能空屏或创建双局。缺少设备时完成诊断候选并明确未关闭的宿主项，不冒称已修复。
2. P1：运行 evidence/Acceptance/20261105-tap-host-review/probe-revive-boundaries.cjs，复现奖励commit成功而后续readBundle失败，内存revision2/实际3，重试永久CAS冲突。重试先读可信最新信封；已存在本attempt的receipt/used1时同步revision并免费应用已提交候选，不重看、不二次发奖、不覆盖新run。补真实有价值的故障回归。
3. P1：取消/未完整观看/load或show失败，不要调用declineSpillRevive提前SETTLING；清pendingAttempt但保留同failure和used0，玩家可手动再看或明确结束。更新原RV-25中违背需求的断言，同时保留未完成不发奖、重复回调不发双奖测试。
4. P1：撤掉未经用户授权的每日3次复活上限，包括policy/loader/ledger/settle/UI；每局仅一次成功复活保持。验证同日第四局仍可获得该局一次。不得把上限改成巨大常数敷衍。
5. 保留Tap顶层isEnded===true才奖励、两广告互斥、同分同run续玩、原子存档、崩溃恢复和120tick落料缓冲；真实广告位未配置不打开策略，不拿Mock冒充验收。
6. 更新README、当前事实和唯一候选入口，统一包体路径/SHA/buildId。新Debug/Web Release/Tap包均用新唯一buildId；核对71+7派生资源及Release无Debug/Mock泄漏。旧包保留供复现。
7. 验证docs44 H01–H06/R01–R05/P01–P02。既有111项不得删掉有效断言制造通过；新增用例覆盖以上故障。实际浏览器点击并回看游戏截图；在真实Tap宿主验证同SHA冷启、可操作开局、后台与晃杯、真实广告、低中高机型内存及20次重开。构建成功不等于平台通过。

交付：根因及改动、执行过的命令/结果、首条真实错误与阶段证据、测试CSV（PASS/FAIL/NOT_RUN分开）、同SHA包/清单、残留阻断与最小补测步骤。若拿不到设备日志或真实广告位，继续完成不依赖它们的实现和验证，保持BLOCKED，不用猜测性修复结案。

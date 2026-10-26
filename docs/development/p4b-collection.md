# P4-B · 图鉴、成就与外观

## 范围与数据
依赖稳定的已验证结算事件/进度。图鉴九种小料由最高达到等级记录解锁，不出售物理优势。首批仅实现九级发现和五款解锁等已存在事实；新增成就条件/皮肤数量先登记内容配置，不能为填界面临时发明付费系统。
AchievementDefinition字段id/version/metric/threshold/reward/displayAsset；CosmeticDefinition字段id/type/assetId/unlockRule/affectsPhysics=false。外观不允许覆盖radius、density、cup_width、score或概率。

## 文件职责和事件处理
server/collection/AchievementService.ts consumeVerifiedSettlement；InventoryService.grant/equip；客户端CollectionPresenter、AchievementToastPresenter、CosmeticPreview。
消费键为(playerId,eventId,achievementId)，数据库唯一约束；同事件重放不双发。事务写player_achievements+cosmetic_inventory后才发送通知；表现弹窗失败不回滚所有权。
装备前检查归属、类型槽位和资源存在；多设备CAS更新equipmentRevision。未获物品只可预览且显示锁，不允许伪造装备接口。

## UI与资源
图鉴九宫格显示已发现原色、未发现轮廓+问号；轮廓从原图派生，不能只靠颜色区分。详情含小料名称、等级、合成下一目标；最高级显示“已到最高级”，没有不存在的第10级。
外观预览在独立静态预览世界，不替换活动run的CupGeometry。更换杯纹理只在新局或安全表现边界加载；加载失败回退默认纹理，物理不重建。
初次发现/成就提示不遮落点、不自动暂停后收取奖励；奖励如仅图鉴可即时记录。所有文案可配置，文本不烘焙在图片。

## 验收
九级发现顺序正确；最高级边界；重复事件；离线待同步不多发；未获不能装备；卸载重登从云恢复；切换外观前后同快照物理参数完全一致。交付内容配置、授权素材、数据迁移、接口与UI证据。未定美术皮肤只列候选资产，不计首发必做。


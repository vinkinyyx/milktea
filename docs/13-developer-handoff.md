# 当前开发交接

先读[当前事实](22-current-progress-and-resume.md)和[最新验收](46-v3-review-and-host-closeout-design.md)，随后执行[本轮整改提示词](46-v3-review-and-host-closeout-design.md#12-完成标准与执行提示词)。复活业务与持久化要求以[docs43及其分册](43-spill-revive-performance-design.md)为依据；不要执行历史归档中的旧阶段队列。

工程：`D:\Workspace\TapTap\奶茶挤挤\奶茶挤挤`，Creator3.8.8，Boot为玩家入口。唯一配置与类型源位于根config/design-baseline.json、contracts/types.ts。物理固定步、真实刚体移杯、原子合成与事件去重保持；动画不能直接驱动物理。

[工具入口](../tools/README.md)列出实际检查与构建命令；[Tap入口](38-taptap-minigame-current.md)记录唯一候选和未验证项。使用新buildId，不覆盖已有证据。不把回归通过或构建成功当作Tap真机通过。

素材原稿和运行资源保留，见[素材说明](../assets/README.md)。导入缓存已清理，首次打开编辑器会重新导入；工程及Tap扩展的现用node_modules保留。旧阶段资料和包体见[归档入口](archive-location.md)。

# 仓库交付、维护与验证边界

目标仓库：https://github.com/vinkinyyx/milktea 。用户已授权将奶茶挤挤整个项目上传。仓库根目录直接对应本地奶茶挤挤文件夹，避免再嵌套一层同名目录。

## 包含与排除
包含README/AGENTS、原策划、13阶段开发设计、数据契约、配置、逐项图像/音频清单、源站技能快照和许可证、生成工具、阅读版及检查证据。
排除.git内部、.playwright-cli临时会话/日志、__pycache__、构建缓存、依赖目录及任何密钥。截图证据和设计压缩包可保留，但不包含浏览器登录状态/账号资料。Git忽略规则见根.gitignore。

## 复现文档产物
需要Python3，标准库即可：
```text
python tools/build_image_catalog.py
python tools/validate_design.py --build
python tools/prepare_publish.py --archive
```
前两条重新生成清单/阅读版并验证；第三条生成ZIP及文件清单。实际游戏未来须另外安装锁定版本引擎与依赖，不把这些文档命令称为游戏构建。

## 检查含义
本轮静态检查覆盖链接、配置关系、13份技能快照及上游文件哈希、资产ID/来源/尺寸、阶段存在、API内部引用与例子，检查报告在research/document-validation.json。
浏览器检查仅验证文档/资产目录的显示、跳转和筛选；未执行真实游戏、物理集成、数据库迁移、平台审核、广告验证或玩家测试。
contracts中的TypeScript/SQL/OpenAPI为开发设计起点，不是已启动服务；source_path和API均需开发者按对应阶段实施与实际验证。

## 版权和更新
THIRD_PARTY_NOTICES.md列上游材料来源和许可证；上游MIT不意味着本项目全部原创内容或Cocos编辑器都自动MIT。未统一声明本项目代码/美术的开源许可证；上传公开GitHub不等于授权所有内容任意商用。
修改玩法先更新配置/规则版本，再同步分册、契约和样例；修改图像台账先改生成工具，再生成CSV/JSON/HTML/Markdown。生成版不手改。


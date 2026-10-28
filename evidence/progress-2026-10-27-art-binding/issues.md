# 当前问题与处理状态

| ID | 状态 | 问题/影响 | 处理方法 |
| --- | --- | --- | --- |
| ENV-01 | OPEN | 常用安装路径、PATH、卸载注册项与当前进程未发现可用Cocos Creator；无法执行实际导入、Box2D、渲染与构建 | 安装并启动Creator 3.8.8，按docs/19完成环境锁定和P1-A运行验收 |
| IMPORT-01 | OPEN | 117张PNG和新增脚本未由编辑器生成/核对.meta；场景导入兼容性尚未证明 | 保留原.meta，实际编辑器导入后保存/回读；遇错误据日志修正 |
| BOOT-01 | FIXED_STATIC_VERIFIED | AppRoot使用未定义的mapper，原核心编译范围没有包含此文件 | 声明并复用同一个CoordinateMapper；全部客户端脚本类型检查通过 |
| PHYSICS-API-01 | FIXED_STATIC_VERIFIED | 2D Collider误用3D PhysicsMaterial/material接口 | 按官方2D声明直接设置friction与restitution；类型检查通过，接触表现待运行 |
| ART-01 | IMPLEMENTED_RUNTIME_PENDING | 占位Graphics未使用已有PNG | 18项直接绑定场景，P1全81项可按需查看；静态哈希/映射通过，Cocos画面待验证 |
| AUDIO-01 | WAITING_FOR_PHASE | 音频清单仍无实文件 | 按05音频规格并行准备，P1-C接入；不阻塞当前物理验收 |

现有美术审查的色彩元数据和纹理压缩注意项继续保留，见docs/18。无需因此重新生成整套图片。四张上架截图模板要等真实可玩画面后替换。

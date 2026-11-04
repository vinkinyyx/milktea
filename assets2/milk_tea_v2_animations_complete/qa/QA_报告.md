# 动画包 V2.0｜文件与运动核验

- 10项效果，10段独立 MP4 + 10个 GIF：已检查可解码且首帧与中间帧存在差异。
- 视频规格：640×640，H.264，18FPS，每段2秒；连续展示片20秒。
- 透明特效：6类、80张逐帧 RGBA PNG、6张雪碧图（每帧192×192）；已验证解码、尺寸、模式。
- 资源：原九级小料256px精灵、经典杯7层、按钮4态等。
- 运动差异检测（越大仅表示画面变化越明显，不是美术品质评分）：
  - 01_drop: mean abs diff=0.47
  - 02_collision: mean abs diff=0.711
  - 03_merge: mean abs diff=0.895
  - 04_combo: mean abs diff=0.235
  - 05_shake: mean abs diff=0.658
  - 06_danger: mean abs diff=0.021
  - 07_button: mean abs diff=0.477
  - 08_result: mean abs diff=0.279
  - 09_cat: mean abs diff=2.135
  - 10_transition: mean abs diff=1.608

## 未执行/需联调

Cocos Creator 工程内编译运行、真实碰撞事件接线、音频同步、低端机帧率、实际9:20布局验收均未执行。猫咪轻动效仍需独立分层原画才能进行真正的骨骼挥爪动画。

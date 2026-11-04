import { Camera, Canvas, Node, ResolutionPolicy, UITransform, view } from 'cc';

const resizeHandlers = new WeakMap<Node, () => void>();

/** The fixed gameplay board stays centered; only the decorative viewing area grows. */
export function presentationSize(): { width: number; height: number } {
  const size = view.getVisibleSize();
  return { width: size.width, height: size.height };
}

export function gameUiPoint(point: { x: number; y: number }, viewport: { width_du: number; height_du: number }): { x: number; y: number } {
  const visible = view.getVisibleSize();
  return { x: point.x - (visible.width - viewport.width_du) / 2, y: point.y - (visible.height - viewport.height_du) / 2 };
}

/** Display-only adaptation. Physics positions, collider sizes and solver units stay in their own mapper. */
export function configureViewport(root: Node, viewport: { width_du: number; height_du: number }): void {
  // Avoid high-DPR color/depth buffers multiplying memory on mobile hosts.
  view.enableRetina(false);
  const applyPolicy = () => {
    const frame = view.getFrameSize();
    const policy = frame.height / frame.width >= viewport.height_du / viewport.width_du
      ? ResolutionPolicy.FIXED_WIDTH : ResolutionPolicy.SHOW_ALL;
    view.setDesignResolutionSize(viewport.width_du, viewport.height_du, policy);
  };
  const oldHandler = resizeHandlers.get(root);
  if (oldHandler) view.off('canvas-resize', oldHandler);
  applyPolicy();
  view.on('canvas-resize', applyPolicy);
  resizeHandlers.set(root, applyPolicy);
  if (!oldHandler) root.once(Node.EventType.NODE_DESTROYED, () => {
    const handler = resizeHandlers.get(root);
    if (handler) view.off('canvas-resize', handler);
    resizeHandlers.delete(root);
  });
  const transform = root.getComponent(UITransform) ?? root.addComponent(UITransform);
  transform.setContentSize(viewport.width_du, viewport.height_du);
  const canvas = root.getComponent(Canvas) ?? root.addComponent(Canvas);
  const camera = root.scene.getChildByName('Main Camera')?.getComponent(Camera);
  if (!camera) throw new Error('场景缺少Main Camera');
  camera.projection = Camera.ProjectionType.ORTHO;
  canvas.cameraComponent = camera;
  canvas.alignCanvasWithScreen = true;
}

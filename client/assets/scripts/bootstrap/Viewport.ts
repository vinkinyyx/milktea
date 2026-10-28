import { Camera, Canvas, Node, ResolutionPolicy, UITransform, view } from 'cc';

/** Display-only adaptation. Physics positions, collider sizes and solver units stay in their own mapper. */
export function configureViewport(root: Node, viewport: { width_du: number; height_du: number }): void {
  view.setDesignResolutionSize(viewport.width_du, viewport.height_du, ResolutionPolicy.SHOW_ALL);
  const transform = root.getComponent(UITransform) ?? root.addComponent(UITransform);
  transform.setContentSize(viewport.width_du, viewport.height_du);
  const canvas = root.getComponent(Canvas) ?? root.addComponent(Canvas);
  const camera = root.scene.getChildByName('Main Camera')?.getComponent(Camera);
  if (!camera) throw new Error('场景缺少Main Camera');
  camera.projection = Camera.ProjectionType.ORTHO;
  canvas.cameraComponent = camera;
  canvas.alignCanvasWithScreen = true;
}

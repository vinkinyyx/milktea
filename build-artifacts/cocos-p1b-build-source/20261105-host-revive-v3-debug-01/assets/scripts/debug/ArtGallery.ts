import { BlockInputEvents, Color, Graphics, Label, Node, UITransform, view } from 'cc';
import { ArtAssets } from '../presentation/ArtAssets';
import { ArtCatalog } from '../presentation/ArtCatalog';

/** Development-only registry preview. Viewing UI skins does not enable their future gameplay. */
export class ArtGallery {
  private readonly root: Node;
  private readonly title: Label;
  private readonly content: Node;
  private generation = 0;
  private closed = false;
  private page = 0;
  private readonly pageSize = 12;
  constructor(parent: Node, private readonly art: ArtAssets, private readonly onClose: () => void) {
    this.root = new Node('P1ArtGallery'); parent.addChild(this.root);
    this.root.addComponent(UITransform).setContentSize(750, 1334); this.root.addComponent(BlockInputEvents);
    this.content = new Node('GalleryPage'); this.root.addChild(this.content);
    this.title = this.label(this.root, 'P1素材加载中…', 26, 700, 70, 0, 490);
    this.createTouchControls();
    void this.showPage();
  }
  turn(direction: number): void {
    const total = Math.ceil(this.art.catalog.ids.length / this.pageSize);
    this.page = (this.page + direction + total) % total;
    void this.showPage();
  }
  close(): void { this.closed = true; this.generation++; this.root.destroy(); }
  private async showPage(): Promise<void> {
    const generation = ++this.generation;
    const ids = this.art.catalog.ids.slice(this.page * this.pageSize, (this.page + 1) * this.pageSize);
    this.title.string = `P1素材 ${this.page + 1}/${Math.ceil(this.art.catalog.ids.length / this.pageSize)} · 加载中`;
    try {
      await Promise.all(['ui_panel_modal', ...ids].map(id => this.art.load(id, 160)));
      if (this.closed || generation !== this.generation) return;
      for (const node of this.content.children.slice()) node.destroy();
      const panelVariant = this.art.getLoadedVariant('ui_panel_modal');
      if (!panelVariant) throw new Error('图库面板实际加载variant缺失');
      this.art.createSprite(this.content, 'ui_panel_modal', 720, 1100);
      ids.forEach((id, index) => {
        const v = this.art.getLoadedVariant(id);
        if (!v) throw new Error(`图库实际加载variant缺失: ${id}`);
        const pivot = ArtCatalog.pivot(v);
        const scale = Math.min(175 / v.size[0], 140 / v.size[1]);
        const x = (index % 3 - 1) * 225; const y = 335 - Math.floor(index / 3) * 225;
        const width = v.size[0] * scale; const height = v.size[1] * scale;
        const sprite = this.art.createSprite(this.content, id, width, height);
        sprite.setPosition(x + (0.5 - pivot[0]) * width, y + (0.5 - pivot[1]) * height, 0);
        this.label(this.content, id, 15, 215, 60, x, y - 95);
      });
      this.title.string = `P1素材 ${this.page + 1}/${Math.ceil(this.art.catalog.ids.length / this.pageSize)} · 共${this.art.catalog.ids.length}项`;
    } catch (error) {
      if (!this.closed && generation === this.generation) this.title.string = `图片读取失败：${error instanceof Error ? error.message : String(error)}\n按方向键重试`;
    }
  }
  private label(parent: Node, text: string, size: number, width: number, height: number, x: number, y: number): Label {
    const node = new Node('GalleryText'); parent.addChild(node); node.addComponent(UITransform).setContentSize(width, height);
    node.setPosition(x, y, 0);
    const label = node.addComponent(Label); label.string = text; label.fontSize = size; label.lineHeight = size + 4;
    label.overflow = Label.Overflow.CLAMP;
    label.color = new Color(61, 42, 35); label.enableWrapText = true;
    return label;
  }
  private createTouchControls(): void {
    const viewportScale = Math.min(view.getScaleX(), view.getScaleY());
    const scale = viewportScale < 0.35 ? 44 / (96 * viewportScale) : 1;
    const rows = viewportScale < 0.35 ? [-510] : [-540];
    const y = rows[0];
    const buttons: Array<[string, number, () => void]> = [
      ['‹', -180, () => this.turn(-1)], ['返回', 0, () => this.onClose()], ['›', 180, () => this.turn(1)]
    ];
    for (const [text, x, action] of buttons) {
      const button = new Node(`GalleryTouch-${text}`); this.root.addChild(button);
      button.setPosition(x, y, 0); button.setScale(scale, scale, 1);
      button.addComponent(UITransform).setContentSize(110, 96); button.addComponent(BlockInputEvents);
      const graphics = button.addComponent(Graphics); graphics.fillColor = new Color(253, 246, 230, 242);
      graphics.roundRect(-53, -46, 106, 92, 12); graphics.fill();
      const labelNode = new Node('GalleryTouchLabel'); button.addChild(labelNode);
      labelNode.addComponent(UITransform).setContentSize(110, 96);
      const label = labelNode.addComponent(Label); label.string = text; label.fontSize = 30; label.lineHeight = 36;
      label.color = new Color(61, 42, 35); label.overflow = Label.Overflow.CLAMP;
      button.on(Node.EventType.TOUCH_END, (event: any) => { event.propagationStopped = true; action(); });
    }
  }
}

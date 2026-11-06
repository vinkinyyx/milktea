import { _decorator, Color, Component, Graphics, Label, Node, UITransform, view } from 'cc';
import { AppRuntime } from '../core/AppRuntime';
const { ccclass } = _decorator;

/**
 * Host-visible boot trace. The Tap host only showed its launch cover when boot failed, so this strip is
 * drawn with Graphics plus a Label (no art, no fonts beyond the system default) and stays on top of every
 * screen change, including error screens. It must never throw into the boot path.
 */
@ccclass('BootDiagnostics')
export class BootDiagnostics extends Component {
  private static current: BootDiagnostics | null = null;
  private panel: Node | null = null;
  private label: Label | null = null;
  private stage = 'boot';
  private detail = '';

  static mark(stage: string, detail = ''): void {
    const current = BootDiagnostics.current;
    if (current?.isValid) current.apply(stage, detail);
  }

  onLoad(): void {
    BootDiagnostics.current = this;
    try { this.buildPanel(); } catch (error) { console.warn('[boot-diag] panel unavailable', error); }
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('error', (event) => this.apply('window.error', String((event as any)?.message ?? '')));
      window.addEventListener('unhandledrejection', (event) => this.apply('unhandled', String((event as any)?.reason ?? '')));
    }
  }

  onDestroy(): void { if (BootDiagnostics.current === this) BootDiagnostics.current = null; }

  private elapsed = 0;
  /** GameRoot raises its own layers on every run start; re-raise periodically so the strip stays readable. */
  update(dt: number): void {
    this.elapsed += dt;
    if (this.elapsed < 0.5) return;
    this.elapsed = 0;
    try { this.redraw(); } catch { /* diagnostics must never break boot */ }
  }

  private buildPanel(): void {
    const size = view.getVisibleSize();
    const panel = new Node('P1BBootDiagnostics');
    this.node.addChild(panel);
    panel.addComponent(UITransform).setContentSize(size.width, 72);
    panel.setPosition(0, size.height / 2 - 40, 0);
    const bar = panel.addComponent(Graphics);
    bar.fillColor = new Color(18, 18, 18, 235);
    bar.rect(-size.width / 2, -36, size.width, 72);
    bar.fill();
    const textNode = new Node('Text');
    panel.addChild(textNode);
    textNode.addComponent(UITransform).setContentSize(size.width - 24, 64);
    const label = textNode.addComponent(Label);
    label.fontSize = 22; label.lineHeight = 26; label.color = new Color(255, 235, 120);
    label.overflow = Label.Overflow.SHRINK; label.enableWrapText = true;
    this.panel = panel; this.label = label;
    this.redraw();
  }

  private apply(stage: string, detail: string): void {
    if (stage === this.stage && detail === this.detail) return;
    this.stage = stage; this.detail = detail;
    try { this.redraw(); } catch { /* diagnostics must never break boot */ }
  }

  private redraw(): void {
    if (!this.label?.isValid) return;
    this.label.string = `${AppRuntime.buildId} | ${this.stage}${this.detail ? ' | ' + this.detail.slice(0, 90) : ''}`;
    if (this.panel?.isValid && this.panel.parent) this.panel.setSiblingIndex(this.panel.parent.children.length - 1);
  }
}

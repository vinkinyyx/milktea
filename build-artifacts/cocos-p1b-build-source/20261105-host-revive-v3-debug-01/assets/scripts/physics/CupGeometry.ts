export interface PointDu { x: number; y: number }
export interface CupSegment { kind: 'left' | 'right' | 'bottom'; innerStart: PointDu; innerEnd: PointDu; center: PointDu; lengthDu: number; angleDeg: number; thicknessDu: number; outward: PointDu }
export interface CupShape { leftBottom: PointDu; rightBottom: PointDu; leftTop: PointDu; rightTop: PointDu; segments: CupSegment[]; spawnRange: { minX: number; maxX: number }; innerWidthAtBottom: number; innerWidthAtTop: number }

export class CupGeometry {
  static build(input: { centerXDu: number; bottomYDu: number; topYDu: number; bottomWidthDu: number; topWidthDu: number; widthScale: number; wallThicknessDu?: number }): CupShape {
    const { centerXDu: cx, bottomYDu: by, topYDu: ty } = input;
    const scale = input.widthScale; const t = input.wallThicknessDu ?? 16;
    if (![cx, by, ty, input.bottomWidthDu, input.topWidthDu, scale, t].every(Number.isFinite) || ty <= by || scale <= 0 || t <= 0) throw new Error('Invalid cup geometry');
    const bw = input.bottomWidthDu * scale; const tw = input.topWidthDu * scale;
    const leftBottom = { x: cx - bw / 2, y: by }; const rightBottom = { x: cx + bw / 2, y: by };
    const leftTop = { x: cx - tw / 2, y: ty }; const rightTop = { x: cx + tw / 2, y: ty };
    const make = (kind: CupSegment['kind'], a: PointDu, b: PointDu, outward: PointDu): CupSegment => {
      const dx = b.x - a.x; const dy = b.y - a.y; const lengthDu = Math.hypot(dx, dy);
      return { kind, innerStart: a, innerEnd: b, center: { x: (a.x + b.x) / 2 + outward.x * t / 2, y: (a.y + b.y) / 2 + outward.y * t / 2 }, lengthDu: lengthDu + t, angleDeg: Math.atan2(dy, dx) * 180 / Math.PI, thicknessDu: t, outward };
    };
    const dx = leftTop.x - leftBottom.x; const dy = ty - by; const len = Math.hypot(dx, dy);
    const leftOut = { x: -dy / len, y: dx / len };
    const rightDx = rightTop.x - rightBottom.x; const rightDy = rightTop.y - rightBottom.y;
    const rightLen = Math.hypot(rightDx, rightDy);
    const rightOut = { x: rightDy / rightLen, y: -rightDx / rightLen };
    return { leftBottom, rightBottom, leftTop, rightTop, innerWidthAtBottom: bw, innerWidthAtTop: tw,
      segments: [make('bottom', leftBottom, rightBottom, { x: 0, y: -1 }), make('left', leftBottom, leftTop, leftOut), make('right', rightBottom, rightTop, rightOut)],
      spawnRange: { minX: cx - tw / 2, maxX: cx + tw / 2 } };
  }
}

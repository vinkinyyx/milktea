import { CupSegment, PointDu } from './CupGeometry';

/** Output slot contract: face margin, finite wall box margin, endpoint margin, swept hit, escaped-through-wall. */
export const CUP_PROBE_FACE = 0;
export const CUP_PROBE_BOX = 1;
export const CUP_PROBE_ENDPOINT = 2;
export const CUP_PROBE_SWEPT = 3;
export const CUP_PROBE_ESCAPE = 4;

/** Allocation-free read-only geometry sample. `out` is caller-owned and reused. */
export function sampleCupSegmentSweep(segment: CupSegment, x: number, y: number, previousX: number, previousY: number,
  radius: number, hasPrevious: boolean, out: Float64Array): void {
  const ax = segment.innerStart.x; const ay = segment.innerStart.y;
  const dx = segment.innerEnd.x - ax; const dy = segment.innerEnd.y - ay;
  const length = Math.hypot(dx, dy); const tx = dx / length; const ty = dy / length;
  const nx = -segment.outward.x; const ny = -segment.outward.y;
  const rx = x - ax; const ry = y - ay;
  const u = rx * tx + ry * ty; const inward = rx * nx + ry * ny;
  const wall = segment.thicknessDu; const halfLength = (length + wall) / 2;
  const localU = u - length / 2; const localInward = inward + wall / 2;
  const du = Math.abs(localU) - halfLength; const dv = Math.abs(localInward) - wall / 2;
  const outsideU = Math.max(du, 0); const outsideV = Math.max(dv, 0);
  const boxDistance = Math.hypot(outsideU, outsideV) + Math.min(Math.max(du, dv), 0);
  const e0u = u; const e0v = inward;
  const e1u = u - length; const e1v = inward;
  out[CUP_PROBE_FACE] = u >= 0 && u <= length ? inward - radius : Number.POSITIVE_INFINITY;
  out[CUP_PROBE_BOX] = boxDistance - radius;
  out[CUP_PROBE_ENDPOINT] = Math.min(Math.hypot(e0u, e0v), Math.hypot(e1u, e1v)) - radius;
  out[CUP_PROBE_SWEPT] = hasPrevious && sweptCircleHitsSegmentBox(segment, previousX, previousY, x, y, radius) ? 1 : 0;
  let escaped = false;
  if (hasPrevious && out[CUP_PROBE_SWEPT] === 1) {
    const p0u = (previousX - ax) * tx + (previousY - ay) * ty;
    const p0v = (previousX - ax) * nx + (previousY - ay) * ny;
    if (segment.kind === 'bottom') escaped = previousY >= ay && y < ay - radius;
    else escaped = p0v >= 0 && inward < -radius;
    // Only a trajectory that began on the cup side and crossed the finite collision volume is an escape.
    if (p0u < -wall / 2 - radius || p0u > length + wall / 2 + radius) escaped = false;
  }
  out[CUP_PROBE_ESCAPE] = escaped ? 1 : 0;
}

function sweptCircleHitsSegmentBox(segment: CupSegment, x0: number, y0: number, x1: number, y1: number, radius: number): boolean {
  const ax = segment.innerStart.x; const ay = segment.innerStart.y;
  const dx = segment.innerEnd.x - ax; const dy = segment.innerEnd.y - ay;
  const length = Math.hypot(dx, dy); const tx = dx / length; const ty = dy / length;
  const nx = -segment.outward.x; const ny = -segment.outward.y;
  const wall = segment.thicknessDu;
  const u0 = (x0 - ax) * tx + (y0 - ay) * ty; const v0 = (x0 - ax) * nx + (y0 - ay) * ny;
  const u1 = (x1 - ax) * tx + (y1 - ay) * ty; const v1 = (x1 - ax) * nx + (y1 - ay) * ny;
  const minU = -wall / 2; const maxU = length + wall / 2; const minV = -wall; const maxV = 0;
  if (segmentHitsRect(u0, v0, u1, v1, minU - radius, maxU + radius, minV, maxV)
    || segmentHitsRect(u0, v0, u1, v1, minU, maxU, minV - radius, maxV + radius)) return true;
  return segmentHitsCircle(u0, v0, u1, v1, minU, minV, radius)
    || segmentHitsCircle(u0, v0, u1, v1, minU, maxV, radius)
    || segmentHitsCircle(u0, v0, u1, v1, maxU, minV, radius)
    || segmentHitsCircle(u0, v0, u1, v1, maxU, maxV, radius);
}

function segmentHitsRect(x0: number, y0: number, x1: number, y1: number,
  minX: number, maxX: number, minY: number, maxY: number): boolean {
  let enter = 0; let leave = 1;
  const dx = x1 - x0; const dy = y1 - y0;
  if (Math.abs(dx) < 1e-12) { if (x0 < minX || x0 > maxX) return false; }
  else {
    let a = (minX - x0) / dx; let b = (maxX - x0) / dx; if (a > b) { const swap = a; a = b; b = swap; }
    enter = Math.max(enter, a); leave = Math.min(leave, b);
  }
  if (Math.abs(dy) < 1e-12) { if (y0 < minY || y0 > maxY) return false; }
  else {
    let a = (minY - y0) / dy; let b = (maxY - y0) / dy; if (a > b) { const swap = a; a = b; b = swap; }
    enter = Math.max(enter, a); leave = Math.min(leave, b);
  }
  return enter <= leave && leave >= 0 && enter <= 1;
}

function segmentHitsCircle(x0: number, y0: number, x1: number, y1: number,
  cx: number, cy: number, radius: number): boolean {
  const dx = x1 - x0; const dy = y1 - y0; const ox = x0 - cx; const oy = y0 - cy;
  const a = dx * dx + dy * dy; const c = ox * ox + oy * oy - radius * radius;
  if (a < 1e-18) return c <= 0;
  const b = 2 * (ox * dx + oy * dy); const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return false;
  const root = Math.sqrt(discriminant); const t0 = (-b - root) / (2 * a); const t1 = (-b + root) / (2 * a);
  return (t0 >= 0 && t0 <= 1) || (t1 >= 0 && t1 <= 1);
}

export function cupWallHandCheck(segment: CupSegment, p: PointDu, radius: number): number {
  const dx = segment.innerEnd.x - segment.innerStart.x; const dy = segment.innerEnd.y - segment.innerStart.y;
  const length = Math.hypot(dx, dy); const inwardX = -segment.outward.x; const inwardY = -segment.outward.y;
  const projection = (p.x - segment.innerStart.x) * dx / length + (p.y - segment.innerStart.y) * dy / length;
  const inward = (p.x - segment.innerStart.x) * inwardX + (p.y - segment.innerStart.y) * inwardY;
  return projection >= 0 && projection <= length ? inward - radius : Number.POSITIVE_INFINITY;
}

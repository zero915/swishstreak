import { RefObject } from 'react';
import { getHoopGeometry } from './hoopGeometry';
import { HoopSnapshot } from './ballPhysics';

export interface HoopStateRef {
  x: number;
  vx: number;
}

export function readHoopSnapshot(
  hoopX: number,
  physicsRimCenterY: number,
  rimWidth: number,
  prevX: number,
  dt: number,
  smoothVxRef?: { current: number }
): HoopSnapshot {
  const rawVx = dt > 0.0001 ? (hoopX - prevX) / dt : 0;
  const clampedVx = Math.max(-320, Math.min(320, rawVx));

  let vx = clampedVx;
  if (smoothVxRef) {
    smoothVxRef.current = smoothVxRef.current * 0.65 + clampedVx * 0.35;
    vx = smoothVxRef.current;
  }

  return {
    geo: getHoopGeometry(hoopX, physicsRimCenterY, rimWidth),
    vx,
    vy: 0,
  };
}

export function offsetHoopSnapshot(base: HoopSnapshot, dx: number, physicsRimCenterY: number, rimWidth: number): HoopSnapshot {
  const x = base.geo.rimCenterX + dx;
  return {
    geo: getHoopGeometry(x, physicsRimCenterY, rimWidth),
    vx: base.vx,
    vy: base.vy,
  };
}

/** @deprecated use readHoopSnapshot(hoopX, ...) */
export function readHoopSnapshotFromRef(
  hoopStateRef: RefObject<HoopStateRef> | undefined,
  fallbackX: number,
  physicsRimCenterY: number,
  rimWidth: number,
  prevX: number,
  dt: number,
  smoothVxRef?: { current: number }
): HoopSnapshot {
  const x = hoopStateRef?.current?.x ?? fallbackX;
  if (hoopStateRef?.current?.vx !== undefined && Math.abs(hoopStateRef.current.vx) < 400) {
    const geo = getHoopGeometry(x, physicsRimCenterY, rimWidth);
    const vx = smoothVxRef
      ? (smoothVxRef.current = smoothVxRef.current * 0.65 + hoopStateRef.current.vx * 0.35)
      : hoopStateRef.current.vx;
    return { geo, vx, vy: 0 };
  }
  return readHoopSnapshot(x, physicsRimCenterY, rimWidth, prevX, dt, smoothVxRef);
}

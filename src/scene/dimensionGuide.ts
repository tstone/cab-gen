import * as THREE from 'three';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import type { DimensionGuide, Strokes, Vec3 } from '../geometry/dimensions';
import type { Vec2 } from '../geometry/sideProfile';

const MM = 0.001;
const COLOR = 0x5cff7a;
/** How far off the side panel's outer face the side lines sit. */
const STANDOFF = 0.001;

export interface GuideObject {
  /** Lines in profile space (meters), to add to the cabinet's profile-space group. */
  object: THREE.Group;
  /** Moves the side lines onto the side panel facing the camera. */
  faceCamera: (camera: THREE.Camera) => void;
}

/**
 * Draws a dimension guide: dashed lines for what's measured, solid ticks and
 * arcs, drawn over the cabinet so they show through it.
 */
export function buildGuide(guide: DimensionGuide): GuideObject {
  const object = new THREE.Group();
  const side = strokes(guide.side, (p: Vec2) => [p.x, p.y, 0]);
  object.add(side, strokes(guide.space, (p: Vec3) => [p.x, p.y, p.z]));

  const camera = new THREE.Vector3();
  return {
    object,
    faceCamera(cam) {
      object.worldToLocal(camera.copy(cam.position));
      side.position.z = (camera.z < 0 ? -1 : 1) * (guide.halfWidth * MM + STANDOFF);
    },
  };
}

function strokes<T>({ dashed, solid }: Strokes<T>, coords: (p: T) => number[]) {
  const group = new THREE.Group();
  for (const [segments, isDashed] of [
    [dashed, true],
    [solid, false],
  ] as const) {
    if (segments.length === 0) continue;
    const geometry = new LineSegmentsGeometry().setPositions(
      segments.flatMap(([a, b]) => [...coords(a), ...coords(b)].map((v) => v * MM)),
    );
    const material = new LineMaterial({
      color: COLOR,
      linewidth: 2,
      dashed: isDashed,
      dashSize: 0.012,
      gapSize: 0.008,
      depthTest: false,
      transparent: true,
    });
    const lines = new LineSegments2(geometry, material);
    if (isDashed) lines.computeLineDistances();
    lines.renderOrder = 1000;
    group.add(lines);
  }
  return group;
}

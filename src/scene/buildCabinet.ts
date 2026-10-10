import * as THREE from 'three';
import { type MonitorPlacement, placeMonitor } from '../geometry/monitor';
import { type Vec2, sideProfile } from '../geometry/sideProfile';
import type { CabinetParams, ProfileParams } from '../state/params';

const MM = 0.001;

/**
 * Builds the cabinet geometry from params. Scene units are meters; the cabinet
 * stands on y = 0 with its back at z = 0 and its front toward +z, then the
 * whole group is recentered over the origin.
 */
export function buildCabinet(p: CabinetParams): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: 0x2b2f3a, roughness: 0.7 });
  const w = p.width * MM;
  const t = p.materialThickness * MM;

  switch (p.bodyType) {
    case 'full':
      group.add(buildProfiled(p.full, p, body));
      break;
    case 'bartop':
      group.add(buildProfiled(p.bartop, p, body));
      break;
    case 'bartop-base': {
      const baseHeight = p.base.height * MM;
      group.add(buildBox(body, w, p.base.height, p.base.depth, t));
      const bartop = buildProfiled(p.bartop, p, body);
      bartop.position.y = baseHeight;
      group.add(bartop);
      break;
    }
  }

  // Center the deepest section over the origin so the camera orbits the middle.
  const box = new THREE.Box3().setFromObject(group);
  group.position.z = -(box.min.z + box.max.z) / 2;

  return group;
}

/** Bartop or full-size body: side panels cut to the side profile, plus the monitor. */
function buildProfiled(profileParams: ProfileParams, p: CabinetParams, material: THREE.Material) {
  const profile = sideProfile(profileParams);
  const group = buildSidePanels(profile.outline, material, p.width * MM, p.materialThickness * MM);
  const innerWidth = p.width - 2 * p.materialThickness;
  group.add(buildMonitor(placeMonitor(profile, p.monitor, profileParams.monitor, innerWidth)));
  return group;
}

/**
 * Monitor body with a glowing picture area, in profile space. Its local axes:
 * x points out of the screen, y runs up the screen edge, z runs across.
 */
function buildMonitor({ size, faceCenter, along }: MonitorPlacement) {
  const group = new THREE.Group();
  group.position.set(faceCenter.x * MM, faceCenter.y * MM, 0);
  group.rotation.z = Math.atan2(-along.x, along.y);

  const body = new THREE.Mesh(
    new THREE.BoxGeometry(size.depth * MM, size.outerAlong * MM, size.outerAcross * MM),
    new THREE.MeshStandardMaterial({ color: 0x111214, roughness: 0.5 }),
  );
  body.position.x = (-size.depth * MM) / 2;
  addMesh(group, body);

  const picture = new THREE.Mesh(
    new THREE.PlaneGeometry(size.viewAcross * MM, size.viewAlong * MM),
    new THREE.MeshStandardMaterial({
      color: 0x0a0f1a,
      emissive: 0x2a5bb8,
      emissiveIntensity: 0.9,
      roughness: 0.2,
    }),
  );
  // Plane faces +z by default; turn it to face out of the screen (+x).
  picture.rotation.y = Math.PI / 2;
  picture.position.x = 0.0005;
  group.add(picture);

  return group;
}

/** Rectangular body section (the base under a bartop): the two side panels. Height and depth in millimeters. */
function buildBox(material: THREE.Material, w: number, height: number, depth: number, t: number) {
  const outline = [
    { x: 0, y: 0 },
    { x: depth, y: 0 },
    { x: depth, y: height },
    { x: 0, y: height },
  ];
  return buildSidePanels(outline, material, w, t);
}

/**
 * Left and right side panels: the side profile (in millimeters, x forward from
 * the back, y up) extruded to panel thickness at each outer edge of the width.
 */
function buildSidePanels(outline: Vec2[], material: THREE.Material, w: number, t: number) {
  const shape = new THREE.Shape(outline.map((pt) => new THREE.Vector2(pt.x * MM, pt.y * MM)));
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });

  // Build in "profile space" (x forward, y up, z across the width), then rotate
  // so profile x maps to world +z and profile z maps to world -x.
  const group = new THREE.Group();
  group.rotation.y = -Math.PI / 2;

  for (const z of [-w / 2, w / 2 - t]) {
    const side = new THREE.Mesh(geometry, material);
    side.position.z = z;
    addMesh(group, side);
  }

  return group;
}

function addMesh(group: THREE.Group, mesh: THREE.Mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
}

export function disposeObject(object: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      geometries.add(child.geometry);
      (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) =>
        materials.add(m),
      );
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}

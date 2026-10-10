import * as THREE from 'three';
import { type ControlPanelLayout, controlPanelLayout } from '../geometry/controlPanel';
import { type MonitorPlacement, placeMonitor } from '../geometry/monitor';
import { type PanelHole, panelHoles } from '../geometry/playArea';
import { bodySections } from '../geometry/sections';
import { type Vec2, sideProfile } from '../geometry/sideProfile';
import type { CabinetParams } from '../state/params';

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

  // Every body type is cut from the full-size profile, so build in its coordinates
  // and drop the result so the lowest section rests on the floor.
  const profile = sideProfile(p.profile);
  const sections = bodySections(profile, p.bodyType);
  // Build in "profile space" (x forward, y up, z across the width), then rotate
  // so profile x maps to world +z and profile z maps to world -x.
  const cabinet = new THREE.Group();
  cabinet.rotation.y = -Math.PI / 2;
  for (const outline of sections.outlines) cabinet.add(buildSidePanels(outline, body, w, t));
  const innerWidth = p.width - 2 * p.materialThickness;
  const monitor = placeMonitor(profile, p.monitor, p.profile.monitor, innerWidth);
  cabinet.add(buildMonitor(monitor));
  if (p.controlPanel.type === 'integrated') {
    const layout = controlPanelLayout(
      profile,
      p.controlPanel,
      p.width,
      p.materialThickness,
      monitor.body,
    );
    const { holes } = panelHoles(p.layout, layout.width, layout.depth);
    cabinet.add(buildControlPanel(layout, holes));
  }
  cabinet.position.y = -sections.floor * MM;
  group.add(cabinet);

  // Center the deepest section over the origin so the camera orbits the middle.
  const box = new THREE.Box3().setFromObject(group);
  group.position.z = -(box.min.z + box.max.z) / 2;

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

/**
 * Control panel board and acrylic, in profile space, spanning the inside width,
 * with the play area holes cut through both.
 */
function buildControlPanel(layout: ControlPanelLayout, holes: PanelHole[]) {
  const group = new THREE.Group();
  const { front, dir, depth, width } = layout;

  // Panel shape, top down: x back along the slope, y across to the players' right.
  const shape = new THREE.Shape()
    .moveTo(0, (-width / 2) * MM)
    .lineTo(depth * MM, (-width / 2) * MM)
    .lineTo(depth * MM, (width / 2) * MM)
    .lineTo(0, (width / 2) * MM)
    .closePath();
  for (const hole of holes) {
    shape.holes.push(
      new THREE.Path().absarc(hole.along * MM, hole.across * MM, hole.radius * MM, 0, Math.PI * 2, true),
    );
  }

  // Lay the shape along the slope: x back along the panel, y across (the players'
  // right is profile -z), and extrude down into the cabinet.
  const basis = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(dir.x, dir.y, 0),
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(-dir.y, dir.x, 0),
  );
  /** A sheet `thickness` thick whose top is `top` below the panel's top surface. */
  const slab = (top: number, thickness: number, material: THREE.Material) => {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: thickness * MM,
      bevelEnabled: false,
      curveSegments: 32,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.applyMatrix4(basis);
    mesh.position.set((front.x - dir.y * top) * MM, (front.y + dir.x * top) * MM, 0);
    return mesh;
  };

  const acrylic = layout.acrylicThickness ?? 0;
  addMesh(
    group,
    slab(acrylic, layout.boardThickness, new THREE.MeshStandardMaterial({ color: 0x3d4250, roughness: 0.6 })),
  );
  if (layout.acrylicThickness !== null) {
    const sheet = slab(
      0,
      layout.acrylicThickness,
      new THREE.MeshPhysicalMaterial({
        color: 0xe8f4ff,
        roughness: 0.05,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
      }),
    );
    // Clear, so it casts no shadow on the board underneath.
    sheet.receiveShadow = true;
    group.add(sheet);
  }

  return group;
}

function extrudeOutline(outline: Vec2[], depth: number) {
  const shape = new THREE.Shape(outline.map((pt) => new THREE.Vector2(pt.x * MM, pt.y * MM)));
  return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
}

/**
 * Left and right side panels, in profile space: the side profile (in millimeters,
 * x forward from the back, y up) extruded to panel thickness at each outer edge of the width.
 */
function buildSidePanels(outline: Vec2[], material: THREE.Material, w: number, t: number) {
  const geometry = extrudeOutline(outline, t);
  const group = new THREE.Group();

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

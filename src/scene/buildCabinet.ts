import * as THREE from 'three';
import { type ControlPanelLayout, controlPanelLayout } from '../geometry/controlPanel';
import { type MonitorPlacement, placeMonitor } from '../geometry/monitor';
import { type PanelHole, panelHoles } from '../geometry/playArea';
import { bodyPanels } from '../geometry/panels';
import { bodySections, splitSections } from '../geometry/sections';
import { type Vec2, sideProfile } from '../geometry/sideProfile';
import { type SpeakerPanel, speakerPanel } from '../geometry/speakers';
import { type CabinetParams, coinDoorSizes } from '../state/params';

const MM = 0.001;

/** Name of the group, inside the built cabinet, whose coordinates are the side profile's (in meters). */
export const PROFILE_SPACE = 'profileSpace';

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

  // Every body type is cut from the full-size profile, so build in its coordinates.
  const profile = sideProfile(p.profile);
  const sections = bodySections(profile, p.bodyType);
  // Build in "profile space" (x forward, y up, z across the width), then rotate
  // so profile x maps to world +z and profile z maps to world -x.
  const cabinet = new THREE.Group();
  cabinet.name = PROFILE_SPACE;
  cabinet.rotation.y = -Math.PI / 2;
  // Named so the preview can show or hide each part (see ViewPart). The sides'
  // outline stands in for them while they're hidden.
  const sides = new THREE.Group();
  sides.name = 'sides';
  const sidesOutline = new THREE.Group();
  sidesOutline.name = 'sidesOutline';
  sidesOutline.visible = false;
  const edges = new THREE.LineBasicMaterial({ color: 0x8b919e });
  for (const outline of sections.outlines) {
    sides.add(buildSidePanels(outline, body, w, t));
    sidesOutline.add(buildSideEdges(outline, edges, w, t));
  }
  cabinet.add(sides, sidesOutline);
  const innerWidth = p.width - 2 * p.materialThickness;
  const monitor = placeMonitor(profile, p.monitor, p.profile.monitor, innerWidth);
  const monitorGroup = buildMonitor(monitor);
  monitorGroup.name = 'monitor';
  cabinet.add(monitorGroup);
  let frontTop: number | undefined;
  if (p.controlPanel.type === 'integrated') {
    const layout = controlPanelLayout(
      profile,
      p.controlPanel,
      p.width,
      p.materialThickness,
      monitor.body,
      p.panels.frontInset,
    );
    const { holes } = panelHoles(p.layout, layout.width, layout.depth);
    const panel = buildControlPanel(layout, holes);
    panel.name = 'controlPanel';
    cabinet.add(panel);
    // The front panel rises to butt against the chin or square bottom's end, up
    // to its upper surface; under a flush panel it stops below the board.
    frontTop = layout.bottom
      ? layout.bottom[3].y
      : profile.controlPanel.underside
        ? undefined
        : boardBottomAt(layout, p.profile.depth - p.panels.frontInset);
  }

  // Front, top and back boards between the sides, split like the sides.
  const panels = bodyPanels(
    profile,
    p.materialThickness,
    { front: p.panels.frontInset, topBack: p.panels.topBackInset },
    frontTop,
  );
  const split = (outline: Vec2[]) => splitSections(outline, profile.cutHeight, p.bodyType);
  const seams = new THREE.LineBasicMaterial({ color: 0x15171c });
  const coinDoor = p.coinDoor.type === 'none' ? null : coinDoorSizes[p.coinDoor.type];
  const opening = coinDoor && { ...coinDoor, bottom: p.coinDoor.bottom };
  const front = buildFrontBoards(panels.front ? split(panels.front) : [], opening, body, seams, innerWidth);
  front.name = 'front';
  const topBack = buildBoards(panels.topBack.flatMap(split), body, seams, innerWidth);
  topBack.name = 'topBack';
  cabinet.add(front, topBack);

  const speakers = speakerPanel(profile, p.speakers, p.panels.topBackInset, innerWidth);
  if (speakers) {
    const board = buildSpeakerPanel(speakers, p.materialThickness, body, seams);
    board.name = 'speakers';
    cabinet.add(board);
  }
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
  body.name = 'Monitor';
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
 * with the play area holes cut through both, plus the front face and chin.
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

  const board = new THREE.MeshStandardMaterial({ color: 0x3d4250, roughness: 0.6 });
  const acrylic = layout.acrylicThickness ?? 0;
  const panelBoard = slab(acrylic, layout.boardThickness, board);
  panelBoard.name = 'Control panel';
  addMesh(group, panelBoard);

  // Front face and chin (or square bottom), across the same width as the top.
  const seams = new THREE.LineBasicMaterial({ color: 0x15171c });
  const outlines = [layout.frontFace, layout.bottom].filter((o): o is Vec2[] => o !== null);
  group.add(buildBoards(outlines, board, seams, width));
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
    sheet.name = 'Acrylic';
    // Clear, so it casts no shadow on the board underneath.
    sheet.receiveShadow = true;
    group.add(sheet);
  }

  return group;
}

/** The speaker panel board, in profile space, with its speaker holes cut through it. */
function buildSpeakerPanel(
  { front, dir, normal, length, width, holes }: SpeakerPanel,
  thickness: number,
  material: THREE.Material,
  seams: THREE.Material,
) {
  const group = new THREE.Group();
  const shape = new THREE.Shape()
    .moveTo(0, (-width / 2) * MM)
    .lineTo(length * MM, (-width / 2) * MM)
    .lineTo(length * MM, (width / 2) * MM)
    .lineTo(0, (width / 2) * MM)
    .closePath();
  for (const hole of holes) {
    shape.holes.push(new THREE.Path(hole.map((pt) => new THREE.Vector2(pt.x * MM, pt.y * MM))));
  }
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: thickness * MM, bevelEnabled: false });

  // Shape x runs back along the board and the extrusion goes into the cabinet;
  // across is whichever profile z direction keeps the basis right-handed.
  // The rotation goes on the mesh, not the geometry, so the STEP export can
  // read the extrusion back out.
  const across = normal.x * dir.y - normal.y * dir.x;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.applyMatrix4(
    new THREE.Matrix4().makeBasis(
      new THREE.Vector3(dir.x, dir.y, 0),
      new THREE.Vector3(0, 0, across),
      new THREE.Vector3(normal.x, normal.y, 0),
    ),
  );
  mesh.position.set(front.x * MM, front.y * MM, 0);
  mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), seams));
  addMesh(group, mesh);
  return group;
}

/**
 * Height of the control panel board's underside at `x` in the profile. The
 * underside rises toward the back, so at a front panel's outer face this is
 * as high as the panel can reach without running into the board.
 */
function boardBottomAt({ front, dir, boardThickness, acrylicThickness }: ControlPanelLayout, x: number) {
  const below = (acrylicThickness ?? 0) + boardThickness;
  const under = { x: front.x - dir.y * below, y: front.y + dir.x * below };
  return under.y + ((x - under.x) * dir.y) / dir.x;
}

/**
 * Boards spanning `width` (mm) across the cabinet, centered, from side outlines
 * in profile space, with their edges drawn so the joints between them show.
 */
function buildBoards(outlines: Vec2[][], material: THREE.Material, seams: THREE.Material, width: number) {
  const group = new THREE.Group();
  for (const outline of outlines) {
    const geometry = extrudeOutline(outline, width * MM);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.z = (-width / 2) * MM;
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), seams));
    addMesh(group, mesh);
  }
  return group;
}

/** A rectangular opening (mm) centered across a board, with its bottom edge `bottom` above the floor. */
interface Opening {
  width: number;
  height: number;
  bottom: number;
}

/**
 * Upright front boards like `buildBoards`, with `opening` cut through the
 * board it fits inside. An opening that no board fully contains is left out.
 */
function buildFrontBoards(
  outlines: Vec2[][],
  opening: Opening | null,
  material: THREE.Material,
  seams: THREE.Material,
  width: number,
) {
  const group = new THREE.Group();
  for (const outline of outlines) {
    const xs = outline.map((pt) => pt.x);
    const ys = outline.map((pt) => pt.y);
    const [minX, maxX] = [Math.min(...xs), Math.max(...xs)];
    const [minY, maxY] = [Math.min(...ys), Math.max(...ys)];
    const fits =
      opening !== null &&
      opening.width < width &&
      opening.bottom > minY &&
      opening.bottom + opening.height < maxY;
    if (!fits) {
      group.add(buildBoards([outline], material, seams, width));
      continue;
    }

    // Face on, x across and y up, extruded back through the board's thickness.
    const shape = rectangle(-width / 2, minY, width / 2, maxY);
    shape.holes.push(
      rectangle(-opening.width / 2, opening.bottom, opening.width / 2, opening.bottom + opening.height),
    );
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: (maxX - minX) * MM, bevelEnabled: false });
    // Shape x runs across (profile -z), y up, and the extrusion forward along profile x.
    const mesh = new THREE.Mesh(geometry, material);
    mesh.applyMatrix4(
      new THREE.Matrix4().makeBasis(
        new THREE.Vector3(0, 0, -1),
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(1, 0, 0),
      ),
    );
    mesh.position.x = minX * MM;
    mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geometry), seams));
    addMesh(group, mesh);
  }
  return group;
}

/** An axis-aligned rectangle from millimeter corners, as a shape in scene units. */
function rectangle(x0: number, y0: number, x1: number, y1: number) {
  return new THREE.Shape()
    .moveTo(x0 * MM, y0 * MM)
    .lineTo(x1 * MM, y0 * MM)
    .lineTo(x1 * MM, y1 * MM)
    .lineTo(x0 * MM, y1 * MM)
    .closePath();
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

/** Edges of the side panels from `buildSidePanels`, as lines. */
function buildSideEdges(outline: Vec2[], material: THREE.Material, w: number, t: number) {
  // Skip the shallow creases between the segments of rounded corners.
  const solid = extrudeOutline(outline, t);
  const geometry = new THREE.EdgesGeometry(solid, 30);
  solid.dispose();
  const group = new THREE.Group();

  for (const z of [-w / 2, w / 2 - t]) {
    const lines = new THREE.LineSegments(geometry, material);
    lines.position.z = z;
    group.add(lines);
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
    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
      geometries.add(child.geometry);
      (Array.isArray(child.material) ? child.material : [child.material]).forEach((m) =>
        materials.add(m),
      );
    }
  });
  geometries.forEach((g) => g.dispose());
  materials.forEach((m) => m.dispose());
}

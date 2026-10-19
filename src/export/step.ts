import * as THREE from 'three';
import { buildCabinet, disposeObject } from '../scene/buildCabinet';
import type { CabinetParams } from '../state/params';

/**
 * STEP (ISO 10303-21, AP214) export of the cabinet as exact solids: every part
 * the preview builds is a straight extrusion (or a box), so each becomes a
 * B-rep prism with planar faces, and round holes become true cylinders.
 *
 * Output is in millimeters with Z up: X across the cabinet (centered), Y from
 * the back (Y = 0) toward the front (negative Y), as CAD front views expect.
 */
export function exportStep(p: CabinetParams, options: StepExportOptions = {}): string {
  const { name = 'cabinet', includeMonitor = false } = options;
  const root = buildCabinet(p);
  root.updateMatrixWorld(true);
  // Undo the preview's recentering, then scene meters (y up) to CAD mm (z up).
  const toCad = new THREE.Matrix4()
    .set(1000, 0, 0, 0, 0, 0, -1000, 0, 0, 1000, 0, 0, 0, 0, 0, 1)
    .multiply(root.matrixWorld.clone().invert());

  const parts: { label: string; prisms: Prism[]; matrix: THREE.Matrix4 }[] = [];
  const monitor = root.getObjectByName('monitor');
  root.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    if (!includeMonitor && monitor && isDescendant(child, monitor)) return;
    const prisms = prismsOf(child.geometry);
    if (prisms.length === 0) return;
    parts.push({ label: partLabel(child), prisms, matrix: toCad.clone().multiply(child.matrixWorld) });
  });
  disposeObject(root);

  const w = new StepWriter();
  const context = w.header();
  const counts = new Map<string, number>();
  for (const { label } of parts) counts.set(label, (counts.get(label) ?? 0) + 1);
  const seen = new Map<string, number>();
  const solids: number[] = [];
  for (const { label, prisms, matrix } of parts) {
    const n = (seen.get(label) ?? 0) + 1;
    seen.set(label, n);
    prisms.forEach((prism, i) => {
      const suffix = (counts.get(label)! > 1 ? ` ${n}` : '') + (prisms.length > 1 ? `.${i + 1}` : '');
      solids.push(w.prism(prism, matrix, label + suffix));
    });
  }
  return w.finish(name, context, solids);
}

export interface StepExportOptions {
  /** Product name written into the file. */
  name?: string;
  /** Include the monitor as a solid. */
  includeMonitor?: boolean;
}

function isDescendant(object: THREE.Object3D, ancestor: THREE.Object3D) {
  for (let o: THREE.Object3D | null = object; o; o = o.parent) if (o === ancestor) return true;
  return false;
}

/** Labels for the named groups buildCabinet puts the parts in (see ViewPart). */
const GROUP_LABELS: Record<string, string> = {
  sides: 'Side',
  front: 'Front',
  topBack: 'Top/back',
  speakers: 'Speaker panel',
  controlPanel: 'Control panel front',
  monitor: 'Monitor',
};

function partLabel(mesh: THREE.Object3D) {
  if (mesh.name) return mesh.name;
  for (let o: THREE.Object3D | null = mesh.parent; o; o = o.parent) {
    if (GROUP_LABELS[o.name]) return GROUP_LABELS[o.name];
  }
  return 'Part';
}

/** A closed outline in a prism's local xy plane. */
type Loop = { kind: 'polygon'; points: THREE.Vector2[] } | { kind: 'circle'; center: THREE.Vector2; radius: number };

/** `outer` minus `holes`, extruded along local +z from `z0` by `depth`. */
interface Prism {
  outer: Loop;
  holes: Loop[];
  z0: number;
  depth: number;
}

/** The prisms a mesh's geometry is made of; empty for anything that isn't a solid (e.g. planes). */
function prismsOf(geometry: THREE.BufferGeometry): Prism[] {
  if (geometry instanceof THREE.ExtrudeGeometry) {
    const { shapes, options } = geometry.parameters;
    const depth = options.depth ?? 1;
    return (Array.isArray(shapes) ? shapes : [shapes]).map((shape) => ({
      outer: loopOf(shape),
      holes: shape.holes.map(loopOf),
      z0: 0,
      depth,
    }));
  }
  if (geometry instanceof THREE.BoxGeometry) {
    const { width, height, depth } = geometry.parameters;
    const [x, y] = [width / 2, height / 2];
    const points = [
      new THREE.Vector2(-x, -y),
      new THREE.Vector2(x, -y),
      new THREE.Vector2(x, y),
      new THREE.Vector2(-x, y),
    ];
    return [{ outer: { kind: 'polygon', points }, holes: [], z0: -depth / 2, depth }];
  }
  return [];
}

function loopOf(path: THREE.Path): Loop {
  const [curve] = path.curves;
  if (
    path.curves.length === 1 &&
    curve instanceof THREE.EllipseCurve &&
    curve.xRadius === curve.yRadius &&
    Math.abs(Math.abs(curve.aEndAngle - curve.aStartAngle) - Math.PI * 2) < 1e-9
  ) {
    return { kind: 'circle', center: new THREE.Vector2(curve.aX, curve.aY), radius: curve.xRadius };
  }
  // Drop repeated points, including a closing one that repeats the start.
  const points: THREE.Vector2[] = [];
  for (const pt of path.getPoints(32)) {
    if (points.length === 0 || points[points.length - 1].distanceTo(pt) > 1e-9) points.push(pt);
  }
  if (points.length > 1 && points[0].distanceTo(points[points.length - 1]) <= 1e-9) points.pop();
  return { kind: 'polygon', points };
}

function signedArea(points: THREE.Vector2[]) {
  let area = 0;
  points.forEach((a, i) => {
    const b = points[(i + 1) % points.length];
    area += a.x * b.y - b.x * a.y;
  });
  return area / 2;
}

/** STEP real: always has a decimal point, never an exponent. */
function real(n: number) {
  if (Math.abs(n) < 1e-10) return '0.';
  return n.toFixed(10).replace(/0+$/, '');
}

function str(s: string) {
  return `'${s.replace(/[^\x20-\x7e]/g, '?').replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

class StepWriter {
  private lines: string[] = [];
  private id = 0;

  private add(entity: string) {
    this.lines.push(`#${++this.id}=${entity};`);
    return this.id;
  }

  private point(v: THREE.Vector3) {
    return this.add(`CARTESIAN_POINT('',(${real(v.x)},${real(v.y)},${real(v.z)}))`);
  }

  private direction(v: THREE.Vector3) {
    const d = v.clone().normalize();
    return this.add(`DIRECTION('',(${real(d.x)},${real(d.y)},${real(d.z)}))`);
  }

  private placement(origin: THREE.Vector3, axis: THREE.Vector3, ref: THREE.Vector3) {
    return this.add(
      `AXIS2_PLACEMENT_3D('',#${this.point(origin)},#${this.direction(axis)},#${this.direction(ref)})`,
    );
  }

  private vertex(v: THREE.Vector3) {
    return this.add(`VERTEX_POINT('',#${this.point(v)})`);
  }

  /** A straight edge between two vertices at `a` and `b`. */
  private lineEdge(va: number, vb: number, a: THREE.Vector3, b: THREE.Vector3) {
    const along = b.clone().sub(a);
    const vector = this.add(`VECTOR('',#${this.direction(along)},${real(along.length())})`);
    const line = this.add(`LINE('',#${this.point(a)},#${vector})`);
    return this.add(`EDGE_CURVE('',#${va},#${vb},#${line},.T.)`);
  }

  private loop(edges: [edge: number, forward: boolean][]) {
    const oriented = edges.map(([e, f]) => `#${this.add(`ORIENTED_EDGE('',*,*,#${e},${f ? '.T.' : '.F.'})`)}`);
    return this.add(`EDGE_LOOP('',(${oriented.join(',')}))`);
  }

  private face(bounds: number[], surface: number, sameSense = true) {
    return this.add(`ADVANCED_FACE('',(${bounds.map((b) => `#${b}`).join(',')}),#${surface},${sameSense ? '.T.' : '.F.'})`);
  }

  private bound(loop: number, outer: boolean) {
    return this.add(`${outer ? 'FACE_OUTER_BOUND' : 'FACE_BOUND'}('',#${loop},.T.)`);
  }

  /**
   * Writes `prism`, placed by `matrix` (rotation, translation and uniform
   * scale, possibly mirrored), as a closed solid; returns its id.
   *
   * Loops run counterclockwise around their face's outward normal, holes
   * clockwise. Outlines are arranged to run counterclockwise (holes clockwise)
   * around the extrusion direction, so the top face takes edges forward, the
   * bottom face backward, and each side face's normal is (edge × extrusion).
   */
  prism({ outer, holes, z0, depth }: Prism, matrix: THREE.Matrix4, name: string) {
    const up = new THREE.Vector3(0, 0, 1).transformDirection(matrix);
    const ref = new THREE.Vector3(1, 0, 0).transformDirection(matrix);
    const mirrored = matrix.determinant() < 0;
    const at = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).applyMatrix4(matrix);
    const top = z0 + depth;

    const faces: number[] = [];
    const bottomBounds: number[] = [];
    const topBounds: number[] = [];
    for (const [i, loop] of [outer, ...holes].entries()) {
      const isOuter = i === 0;
      if (loop.kind === 'circle') {
        // Circles run counterclockwise around `up` whatever the mirroring.
        const { x, y } = loop.center;
        const [cb, ct] = [at(x, y, z0), at(x, y, top)];
        const [pb, pt] = [at(x + loop.radius, y, z0), at(x + loop.radius, y, top)];
        const r = pb.distanceTo(cb);
        const [vb, vt] = [this.vertex(pb), this.vertex(pt)];
        const circleB = this.add(`CIRCLE('',#${this.placement(cb, up, ref)},${real(r)})`);
        const circleT = this.add(`CIRCLE('',#${this.placement(ct, up, ref)},${real(r)})`);
        const eb = this.add(`EDGE_CURVE('',#${vb},#${vb},#${circleB},.T.)`);
        const et = this.add(`EDGE_CURVE('',#${vt},#${vt},#${circleT},.T.)`);
        const seam = this.lineEdge(vb, vt, pb, pt);
        const wall = this.loop([
          [eb, isOuter],
          [seam, true],
          [et, !isOuter],
          [seam, false],
        ]);
        const cylinder = this.add(`CYLINDRICAL_SURFACE('',#${this.placement(cb, up, ref)},${real(r)})`);
        // A hole's wall faces in, against the cylinder's own outward normal.
        faces.push(this.face([this.bound(wall, true)], cylinder, isOuter));
        bottomBounds.push(this.bound(this.loop([[eb, !isOuter]]), isOuter));
        topBounds.push(this.bound(this.loop([[et, isOuter]]), isOuter));
        continue;
      }

      const points = [...loop.points];
      const counterclockwise = signedArea(points) > 0 !== mirrored;
      if (counterclockwise !== isOuter) points.reverse();
      const n = points.length;
      const bottomPts = points.map((pt) => at(pt.x, pt.y, z0));
      const topPts = points.map((pt) => at(pt.x, pt.y, top));
      const bottomVs = bottomPts.map((v) => this.vertex(v));
      const topVs = topPts.map((v) => this.vertex(v));
      const next = (k: number) => (k + 1) % n;
      const bottomEs = bottomVs.map((v, k) => this.lineEdge(v, bottomVs[next(k)], bottomPts[k], bottomPts[next(k)]));
      const topEs = topVs.map((v, k) => this.lineEdge(v, topVs[next(k)], topPts[k], topPts[next(k)]));
      const risers = bottomVs.map((v, k) => this.lineEdge(v, topVs[k], bottomPts[k], topPts[k]));
      for (let k = 0; k < n; k++) {
        const along = bottomPts[next(k)].clone().sub(bottomPts[k]);
        const normal = along.clone().cross(up);
        const plane = this.add(`PLANE('',#${this.placement(bottomPts[k], normal, along)})`);
        const side = this.loop([
          [bottomEs[k], true],
          [risers[next(k)], true],
          [topEs[k], false],
          [risers[k], false],
        ]);
        faces.push(this.face([this.bound(side, true)], plane));
      }
      bottomBounds.push(this.bound(this.loop([...bottomEs].reverse().map((e) => [e, false])), isOuter));
      topBounds.push(this.bound(this.loop(topEs.map((e) => [e, true])), isOuter));
    }

    const down = up.clone().negate();
    const bottomPlane = this.add(`PLANE('',#${this.placement(at(0, 0, z0), down, ref)})`);
    const topPlane = this.add(`PLANE('',#${this.placement(at(0, 0, top), up, ref)})`);
    faces.push(this.face(bottomBounds, bottomPlane), this.face(topBounds, topPlane));
    const shell = this.add(`CLOSED_SHELL('',(${faces.map((f) => `#${f}`).join(',')}))`);
    return this.add(`MANIFOLD_SOLID_BREP(${str(name)},#${shell})`);
  }

  /** Units and the representation context; returns the context's id. */
  header() {
    const length = this.add('(LENGTH_UNIT()NAMED_UNIT(*)SI_UNIT(.MILLI.,.METRE.))');
    const angle = this.add('(NAMED_UNIT(*)PLANE_ANGLE_UNIT()SI_UNIT($,.RADIAN.))');
    const solidAngle = this.add('(NAMED_UNIT(*)SI_UNIT($,.STERADIAN.)SOLID_ANGLE_UNIT())');
    const uncertainty = this.add(
      `UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(1.E-03),#${length},'distance_accuracy_value','confusion accuracy')`,
    );
    return this.add(
      `(GEOMETRIC_REPRESENTATION_CONTEXT(3)GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((#${uncertainty}))` +
        `GLOBAL_UNIT_ASSIGNED_CONTEXT((#${length},#${angle},#${solidAngle}))REPRESENTATION_CONTEXT('',''))`,
    );
  }

  /** Wraps `solids` in one product and returns the file's text. */
  finish(name: string, context: number, solids: number[]) {
    const app = this.add("APPLICATION_CONTEXT('core data for automotive mechanical design processes')");
    this.add(`APPLICATION_PROTOCOL_DEFINITION('international standard','automotive_design',2000,#${app})`);
    const productContext = this.add(`PRODUCT_CONTEXT('',#${app},'mechanical')`);
    const product = this.add(`PRODUCT(${str(name)},${str(name)},'',(#${productContext}))`);
    this.add(`PRODUCT_RELATED_PRODUCT_CATEGORY('part',$,(#${product}))`);
    const formation = this.add(`PRODUCT_DEFINITION_FORMATION('','',#${product})`);
    const definitionContext = this.add(`PRODUCT_DEFINITION_CONTEXT('part definition',#${app},'design')`);
    const definition = this.add(`PRODUCT_DEFINITION('design','',#${formation},#${definitionContext})`);
    const shape = this.add(`PRODUCT_DEFINITION_SHAPE('','',#${definition})`);
    const origin = this.placement(new THREE.Vector3(), new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0));
    const items = [origin, ...solids].map((s) => `#${s}`).join(',');
    const representation = this.add(`ADVANCED_BREP_SHAPE_REPRESENTATION(${str(name)},(${items}),#${context})`);
    this.add(`SHAPE_DEFINITION_REPRESENTATION(#${shape},#${representation})`);

    const timestamp = new Date().toISOString().slice(0, 19);
    return [
      'ISO-10303-21;',
      'HEADER;',
      `FILE_DESCRIPTION((${str(name)}),'2;1');`,
      `FILE_NAME(${str(`${name}.step`)},'${timestamp}',(''),(''),'cab-gen','cab-gen','');`,
      "FILE_SCHEMA(('AUTOMOTIVE_DESIGN { 1 0 10303 214 1 1 1 1 }'));",
      'ENDSEC;',
      'DATA;',
      ...this.lines,
      'ENDSEC;',
      'END-ISO-10303-21;',
      '',
    ].join('\n');
  }
}

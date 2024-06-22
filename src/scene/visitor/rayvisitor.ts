import Matrix from '../../math/matrix';
import Vector from '../../math/vector';
import Material from '../../renderer/material';
import Intersection from '../../renderer/raytracer/intersection';
import phong from '../../renderer/raytracer/phong';
import Ray from '../../renderer/raytracer/ray';
import Sphere from '../../shapes/sphere';
import MatrixPrecomputationVisitor from './matrixprecomputationvisitor';
import Visitor from './visitor';

import ObjMesh from '../../parser/obj-mesh';
import Box from '../../shapes/box';
import Pyramid from '../../shapes/pyramid';
import TextureBox from '../../shapes/texture-box';
import Camera from '../camera';
import {
  BoxNode,
  CameraNode,
  GroupNode,
  LightNode,
  LightSphereNode,
  MeshNode,
  Node,
  PyramidNode,
  SphereNode,
  TextureBoxNode
} from '../nodes/nodes';

/**
 * Unit objects for ray intersections
 */
const UNIT_SPHERE = new Sphere(null, new Vector(0, 0, 0, 1), 1, Material.simply['black']);
const UNIT_BOX = new Box(null, new Vector(-0.5, -0.5, -0.5, 1), new Vector(0.5, 0.5, 0.5, 1));
const UNIT_PYRAMID = new Pyramid(
  null,
  new Vector(0, 0.5, 0, 1),
  [
    new Vector(-0.5, -0.5, -0.5, 1),
    new Vector(0.5, -0.5, 0.5, 1),
    new Vector(0.5, -0.5, -0.5, 1),
    new Vector(-0.5, -0.5, 0.5, 1)
  ],
  Material.simply['black']
);
const UNIT_TEXTURE_BOX = new TextureBox(
  null,
  new Vector(-0.5, -0.5, -0.5, 1),
  new Vector(0.5, 0.5, 0.5, 1),
  Material.simply['black']
);

// !! IMPORTANT: pass .obj file to constructor instead of null for raytracing the obj mesh !!
const UNIT_MESH_NODE = new ObjMesh(
  null,
  null
  //"obj/low-poly-squirrel.obj",
  //"obj/low-poly-squirrel2.mtl"
);

/**
 * Bounding Sphere Objects for ray optimization
 */
// Radius + 0.15 since exact radius would cut off the vertices
const UNIT_BOX_BOUNDING_SPHERE = new Sphere(
  null,
  new Vector(0, 0, 0, 1),
  Math.sqrt(2) / 2 + 0.15,
  Material.simply['black']
);
// Radius + 0.22 since exact radius would cut off vertices of base
const UNIT_PYRAMID_BOUNDING_SPHERE = new Sphere(
  null,
  new Vector(0, 0, 0, 1),
  Math.sqrt(1.5) / 2 + 0.22,
  Material.simply['black']
);

/**
 * Class representing a Visitor that uses
 * Raytracing to render a Scenegraph
 */
export default class RayVisitor implements Visitor {
  /**
   * The image data of the context to
   * set individual pixels
   */
  imageData: ImageData;

  toWorld: Array<Matrix>;
  fromWorld: Array<Matrix>;
  intersection: Intersection | null;
  intersectionMaterial: Material;
  intersectionColor: Vector;
  ray: Ray;

  /**
   * The MatrixPrecomputationVisitor traverses the scenegraph once every render
   * call and saves all toWorld and fromWorld matrices, so they only have to be computed once.
   */
  matrixPrecomputationVisitor: MatrixPrecomputationVisitor;

  /**
   * Creates a new RayVisitor
   * @param context The 2D context to render to
   * @param width The width of the canvas
   * @param height The height of the canvas
   */
  constructor(private context: CanvasRenderingContext2D, width: number, height: number) {
    this.imageData = context.getImageData(0, 0, width, height);
  }

  /**
   * Renders the Scenegraph
   * @param rootNode The root node of the Scenegraph
   * @param camera The camera used
   * @param lights All lights with respective position and color attributs
   * @param ambientLight Ambient light illuminating the scene indirectly
   */
  render(
    rootNode: Node,
    camera: Camera,
    lights: Array<{ position: Vector; color: Vector }>,
    ambientLight: { color: Vector }
  ) {
    this.matrixPrecomputationVisitor = new MatrixPrecomputationVisitor(rootNode);
    rootNode.accept(this.matrixPrecomputationVisitor);
    // clear
    let data = this.imageData.data;
    data.fill(0);

    // raytrace
    const width = this.imageData.width;
    const height = this.imageData.height;

    this.intersection = null;
    this.intersectionMaterial = null;

    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        this.ray = Ray.makeRay(x, y, camera, width, height);

        this.intersection = null;
        this.intersectionMaterial = null;
        this.intersectionColor = null;
        rootNode.accept(this);

        if (this.intersection) {
          if (!this.intersectionMaterial) {
            data[4 * (width * y + x) + 0] = 0;
            data[4 * (width * y + x) + 1] = 0;
            data[4 * (width * y + x) + 2] = 0;
            data[4 * (width * y + x) + 3] = 255;
          } else {
            if (this.intersection._material.colorPerVertex) {
              let i = 1;
            }
            let color = phong(
              this.intersection,
              camera.origin,
              lights,
              ambientLight,
              this.intersection._material,
              this.intersection.color
            );
            data[4 * (width * y + x) + 0] = color.r * 255;
            data[4 * (width * y + x) + 1] = color.g * 255;
            data[4 * (width * y + x) + 2] = color.b * 255;
            data[4 * (width * y + x) + 3] = 255;
          }
        }
      }
    }
    this.context.putImageData(this.imageData, 0, 0);
  }

  /**
   * Visits a group node
   * @param node The node to visit
   */
  visitGroupNode(node: GroupNode) {
    for (let child of node.children) {
      child.accept(this);
    }
  }

  /**
   * Visits a sphere node
   * @param node - The node to visit
   */
  visitSphereNode(node: SphereNode) {
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = node.getToWorld();
    fromWorld = node.getFromWorld();

    //ray in objektkoordinationsystem W->O
    const ray = new Ray(fromWorld.mulVec(this.ray.origin), fromWorld.mulVec(this.ray.direction).normalize());
    let intersection = UNIT_SPHERE.intersect(ray);

    if (intersection) {
      const intersectionPointWorld = toWorld.mulVec(intersection.position); // ins to World bringen
      let normalMatrix = toWorld.transpose();
      normalMatrix.setVal(3, 0, 0);
      normalMatrix.setVal(3, 1, 0);
      normalMatrix.setVal(3, 2, 0);

      const intersectionNormalWorld = toWorld.mulVec(intersection.normal).normalize();
      intersection = new Intersection(
        (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
        intersectionPointWorld,
        intersectionNormalWorld,
        node,
        node.material
      );
      if (this.intersection === null || intersection.closerThan(this.intersection)) {
        this.intersection = intersection;
        this.intersectionMaterial = node.material;
      }
    }
  }

  /**
   * Visits an axis aligned box node
   * @param node The node to visit
   */
  visitBoxNode(node: BoxNode) {
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = node.getToWorld();
    fromWorld = node.getFromWorld();

    const ray = new Ray(fromWorld.mulVec(this.ray.origin), fromWorld.mulVec(this.ray.direction).normalize());
    let boundingIntersection = UNIT_BOX_BOUNDING_SPHERE.intersect(ray);
    if (!boundingIntersection) {
      return;
    }
    let intersection = UNIT_BOX.intersect(ray, node.material);

    if (intersection) {
      let intersectionMaterial = node.material;

      const intersectionPointWorld = toWorld.mulVec(intersection.position);
      let normalMatrix = toWorld.transpose();
      normalMatrix.setVal(3, 0, 0);
      normalMatrix.setVal(3, 1, 0);
      normalMatrix.setVal(3, 2, 0);

      const intersectionNormalWorld = toWorld.mulVec(intersection.normal).normalize();
      intersection = new Intersection(
        (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
        intersectionPointWorld,
        intersectionNormalWorld,
        node,
        intersectionMaterial,
        intersection.color
      );
      if (this.intersection === null || intersection.closerThan(this.intersection)) {
        this.intersection = intersection;
        this.intersectionMaterial = node.material;
      }
    }
  }
  /**
   * Visits a light sphere node
   * @param node The node to visit
   */
  visitLightSphereNode(node: LightSphereNode): void {
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = node.getToWorld();
    fromWorld = node.getFromWorld();

    const ray = new Ray(fromWorld.mulVec(this.ray.origin), fromWorld.mulVec(this.ray.direction).normalize());
    let intersection = UNIT_SPHERE.intersect(ray);

    if (intersection) {
      const intersectionPointWorld = toWorld.mulVec(intersection.position);
      const intersectionNormalWorld = toWorld.mulVec(intersection.normal).normalize();
      intersection = new Intersection(
        (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
        intersectionPointWorld,
        intersectionNormalWorld,
        node,
        node.material
      );
      if (this.intersection === null || intersection.closerThan(this.intersection)) {
        this.intersection = intersection;
        this.intersectionMaterial = node.material;
      }
    }
  }

  /**
   * Visits a pyramid node
   * @param node The node to visit
   */
  visitPyramidNode(node: PyramidNode): void {
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = node.getToWorld();
    fromWorld = node.getFromWorld();

    const ray = new Ray(fromWorld.mulVec(this.ray.origin), fromWorld.mulVec(this.ray.direction).normalize());
    let boundingIntersection = UNIT_PYRAMID_BOUNDING_SPHERE.intersect(ray);
    if (!boundingIntersection) {
      return;
    }
    let intersection = UNIT_PYRAMID.intersect(ray, node.material);

    if (intersection) {
      const intersectionPointWorld = toWorld.mulVec(intersection.position);
      const intersectionNormalWorld = toWorld.mulVec(intersection.normal).normalize();
      intersection = new Intersection(
        (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
        intersectionPointWorld,
        intersectionNormalWorld,
        node,
        node.material,
        intersection.color
      );
      if (this.intersection === null || intersection.closerThan(this.intersection)) {
        this.intersection = intersection;
        this.intersectionMaterial = node.material;
      }
    }
  }

  /**
   * Visits a textured box node
   * @param node The node to visit
   */
  visitTextureBoxNode(node: TextureBoxNode) {
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();
    toWorld = node.getToWorld();
    fromWorld = node.getFromWorld();
    const ray = new Ray(fromWorld.mulVec(this.ray.origin), fromWorld.mulVec(this.ray.direction).normalize());
    let boundingIntersection = UNIT_BOX_BOUNDING_SPHERE.intersect(ray);
    if (!boundingIntersection) {
      return;
    }

    let intersection = UNIT_TEXTURE_BOX.intersect(ray);

    if (intersection) {
      const intersectionPointWorld = toWorld.mulVec(intersection.position);
      const intersectionNormalWorld = toWorld.mulVec(intersection.normal).normalize();
      intersection = new Intersection(
        (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
        intersectionPointWorld,
        intersectionNormalWorld,
        node,
        node.material
      );
      if (this.intersection === null || intersection.closerThan(this.intersection)) {
        this.intersection = intersection;
        this.intersectionMaterial = node.material;
      }
    }
  }

  /**
   * Visits a camera node
   * @param node The node to visit
   */
  visitCameraNode(node: CameraNode): void {
    //Nothing to do here!
  }

  /**
   * Visits an axis aligned video texture box node
   * @param node The node to visit
   */
  visitVideoTextureBoxNode(node: TextureBoxNode) {
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();
    toWorld = node.getToWorld();
    fromWorld = node.getFromWorld();
    const ray = new Ray(fromWorld.mulVec(this.ray.origin), fromWorld.mulVec(this.ray.direction).normalize());
    let boundingIntersection = UNIT_BOX_BOUNDING_SPHERE.intersect(ray);
    if (!boundingIntersection) {
      return;
    }

    let intersection = UNIT_TEXTURE_BOX.intersect(ray);

    if (intersection) {
      const intersectionPointWorld = toWorld.mulVec(intersection.position);
      const intersectionNormalWorld = toWorld.mulVec(intersection.normal).normalize();
      intersection = new Intersection(
        (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
        intersectionPointWorld,
        intersectionNormalWorld,
        node,
        node.material
      );
      if (this.intersection === null || intersection.closerThan(this.intersection)) {
        this.intersection = intersection;
        this.intersectionMaterial = node.material;
      }
    }
  }

  /**
   * Visits a light node
   * @param node The node to visit
   */
  visitLightNode(node: LightNode): void {}

  /**
   * Visits an object mesh node
   * @param node The node to visit
   */
  visitMeshNode(node: MeshNode): void {
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = node.getToWorld();
    fromWorld = node.getFromWorld();

    const ray = new Ray(fromWorld.mulVec(this.ray.origin), fromWorld.mulVec(this.ray.direction).normalize());

    let intersection = UNIT_MESH_NODE.intersect(ray, node.material);

    if (intersection) {
      const intersectionPointWorld = toWorld.mulVec(intersection.position);
      const intersectionNormalWorld = toWorld.mulVec(intersection.normal).normalize();
      intersection = new Intersection(
        (intersectionPointWorld.x - ray.origin.x) / ray.direction.x,
        intersectionPointWorld,
        intersectionNormalWorld,
        node,
        node.material,
        intersection.color
      );
      if (this.intersection === null || intersection.closerThan(this.intersection)) {
        this.intersection = intersection;
        this.intersectionMaterial = node.material;
      }
    }
  }
}

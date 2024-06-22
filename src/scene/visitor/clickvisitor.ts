import Matrix from '../../math/matrix';
import Vector from '../../math/vector';
import ObjMesh from '../../parser/obj-mesh';
import Material from '../../renderer/material';
import Intersection from '../../renderer/raytracer/intersection';
import Ray from '../../renderer/raytracer/ray';
import Box from '../../shapes/box';
import Pyramid from '../../shapes/pyramid';
import Sphere from '../../shapes/sphere';
import TextureBox from '../../shapes/texture-box';
import Camera from '../camera';
import {
  BoxNode,
  CameraNode,
  GroupNode,
  LightNode,
  LightSphereNode,
  MeshNode,
  PyramidNode,
  SphereNode,
  TextureBoxNode
} from '../nodes/nodes';
import Visitor from './visitor';

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
const UNIT_MESH_NODE = new ObjMesh(null, null);
/**
 * Class representing a Visitor that uses
 * Raytracing to render a Scenegraph
 */
export default class ClickVisitor implements Visitor {
  /**
   * The image data of the context to
   * set individual pixels
   */
  imageData: ImageData;

  intersection: Intersection | null;
  intersectionColor: Material;
  ray: Ray;

  matrixStack = [Matrix.identity()];
  inverseMatrixStack = [Matrix.identity()];

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
   * @param lightPositions The light light positions
   */
  click(
    rootNode: GroupNode,
    camera: Camera,
    lightPositions: Array<{ position: Vector; color: Vector }>,
    ambientLight: { color: Vector },
    x: number,
    y: number
  ) {
    // clear
    let data = this.imageData.data;
    data.fill(0);

    // raytrace
    const width = this.imageData.width;
    const height = this.imageData.height;

    this.ray = Ray.makeRay(x, y, camera, width, height);

    this.intersection = null;
    rootNode.accept(this);
    let clickedObj;
    try {
      clickedObj = this.intersection.object;
      if (clickedObj != null) {
        if (
          clickedObj instanceof SphereNode ||
          clickedObj instanceof BoxNode ||
          clickedObj instanceof PyramidNode ||
          clickedObj instanceof TextureBoxNode
        ) {
          if (clickedObj.clickMethod != null) {
            clickedObj.clickMethod();
          }
        }
      }
    } catch (error) {}

    this.context.putImageData(this.imageData, 0, 0);
  }

  /**
   * Visits a group node
   * @param node The node to visit
   */
  visitGroupNode(node: GroupNode) {
    let recentMatrix = this.matrixStack[this.matrixStack.length - 1];
    let recentInverseMatrix = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

    let currentMatrix = node.transform.getMatrix();
    let currentInverseMatrix = node.transform.getInverseMatrix();

    let newMatrix = recentMatrix.mul(currentMatrix);
    let newInverseMatrix = currentInverseMatrix.mul(recentInverseMatrix);

    this.matrixStack.push(newMatrix);
    this.inverseMatrixStack.push(newInverseMatrix);

    let children = node.children;
    for (let childIt = 0; childIt < children.length; childIt++) {
      children[childIt].accept(this);
    }

    this.matrixStack.pop();
    this.inverseMatrixStack.pop();
  }

  /**
   * Visits a sphere node
   * @param node - The node to visit
   */
  visitSphereNode(node: SphereNode) {
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = this.matrixStack[this.matrixStack.length - 1];
    fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

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
        this.intersectionColor = node.material;
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

    toWorld = this.matrixStack[this.matrixStack.length - 1];
    fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

    const ray = new Ray(fromWorld.mulVec(this.ray.origin), fromWorld.mulVec(this.ray.direction).normalize());
    let intersection = UNIT_BOX.intersect(ray);

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
        this.intersectionColor = node.material;
      }
    }
  }

  /**
   * Visits an PyramideNode
   * @param node The node to visit
   */
  visitPyramidNode(node: PyramidNode): void {
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = this.matrixStack[this.matrixStack.length - 1];
    fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

    const ray = new Ray(fromWorld.mulVec(this.ray.origin), fromWorld.mulVec(this.ray.direction).normalize());
    let intersection = UNIT_PYRAMID.intersect(ray);

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
        this.intersectionColor = node.material;
      }
    }
  }

  /**
   * Visits an LightSphereNode
   * @param node The node to visit
   */
  visitLightSphereNode(node: LightSphereNode): void {
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = this.matrixStack[this.matrixStack.length - 1];
    fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

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
        this.intersectionColor = node.material;
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

    toWorld = this.matrixStack[this.matrixStack.length - 1];
    fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

    const ray = new Ray(fromWorld.mulVec(this.ray.origin), fromWorld.mulVec(this.ray.direction).normalize());
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
        this.intersectionColor = node.material;
      }
    }
  }

  /**
   * Visits a MeshNode
   * @param node The node to visit
   * @param node The node to visit
   */
  visitMeshNode(node: MeshNode): void {
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = this.matrixStack[this.matrixStack.length - 1];
    fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

    const ray = new Ray(fromWorld.mulVec(this.ray.origin), fromWorld.mulVec(this.ray.direction).normalize());
    let intersection = UNIT_MESH_NODE.intersect(ray);

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
        this.intersectionColor = node.material;
      }
    }
  }

  /**
   * Visits a camera node
   * @param node The node to visit
   * @param node The node to visit
   */
  visitCameraNode(node: CameraNode): void {}

  /**
   * Visits a VideoTextureBoxNode
   * @param node The node to visit
   * @param node The node to visit
   */
  visitVideoTextureBoxNode(node: TextureBoxNode) {}

  /**
   * Visits a LightNode
   * @param node The node to visit
   * @param node The node to visit
   */
  visitLightNode(node: LightNode): void {}

  /**
   * Visits a ObjNode
   * @param node The node to visit
   * @param node The node to visit
   */
  visitobjNode(node: MeshNode): void {}
}

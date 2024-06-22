import Matrix from '../../math/matrix';
import Vector from '../../math/vector';
import {
  BoxNode,
  CameraNode,
  GroupNode,
  LightNode,
  LightSphereNode,
  MeshNode,
  PyramidNode,
  SphereNode,
  TextureBoxNode,
  VideoTextureBoxNode
} from '../../scene/nodes/nodes';
import Visitor from './visitor';

export default class LightVisitor implements Visitor {
  matrixStack = [Matrix.identity()];
  inverseMatrixStack = [Matrix.identity()];

  lightPositions = new Array<Vector>();
  sphereLightPositions = new Array<Vector>();
  sphereLights: Array<{ position: Vector; color: Vector }> = [];

  /**
   * Creates a new LightVisitor
   * @param context The 2D context to render to
   * @param width The width of the canvas
   * @param height The height of the canvas
   */
  constructor(private context: CanvasRenderingContext2D, width: number, height: number) {}

  /**
   * Visits a pyramid node.
   * @param node - The pyramid node to visit.
   */
  visitPyramidNode(node: PyramidNode): void {}

  /**
   * Visits a mesh node.
   * @param node - The mesh node to visit.
   */
  visitMeshNode(node: MeshNode): void {}

  /**
   * Traverses a group node and updates the matrix stack.
   * @param node - The group node to traverse.
   */
  traverse(node: GroupNode) {
    node.accept(this);
    //return this.lightPositions;
  }

  /** Visits a group node and updates transformation matrices.
   * @param node - The group node to visit.
   */
  visitGroupNode(node: GroupNode): void {
    let recentMatrix = this.matrixStack[this.matrixStack.length - 1];
    let recentInverseMatrix = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

    let currentMatrix = node.transform.getMatrix();
    let currentInverseMatrix = node.transform.getInverseMatrix();

    let newMatrix = recentMatrix.mul(currentMatrix);
    let newInverseMatrix = currentInverseMatrix.mul(recentInverseMatrix);

    this.matrixStack.push(newMatrix);
    this.inverseMatrixStack.push(newInverseMatrix);

    for (let child of node.children) {
      child.accept(this);
    }

    this.matrixStack.pop();
    this.inverseMatrixStack.pop();
  }

  /**
   * Visits a light node, calculates its position in world space, and adds it to the lightPositions array.
   * @param node - The light node to visit.
   */
  visitLightNode(node: LightNode): void {
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = this.matrixStack[this.matrixStack.length - 1];
    fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

    let position = toWorld.mulVec(new Vector(0, 0, 0, 1));
    this.lightPositions.push(position);
  }

  /**
   * Visits a sphere node.
   * @param node - The sphere node to visit.
   */
  visitSphereNode(node: SphereNode): void {}

  /**
   * Visits a texture box node.
   * @param node - The texture box node to visit.
   */
  visitTextureBoxNode(node: TextureBoxNode): void {}

  /**
   * Visits a video texture box node.
   * @param node - The video texture box node to visit.
   */
  visitVideoTextureBoxNode(node: VideoTextureBoxNode): void {}

  /**
   * Visits a camera node.
   * @param node - The camera node to visit.
   */
  visitCameraNode(node: CameraNode): void {}

  /**
   * Visits a light sphere node, calculates its position in world space, and adds it to the sphereLights array.
   * @param node - The light sphere node to visit.
   */
  visitLightSphereNode(node: LightSphereNode): void {
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = this.matrixStack[this.matrixStack.length - 1];
    fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

    let position = toWorld.mulVec(new Vector(0, 0, 0, 1));
    this.sphereLights.push({ position: position, color: node.material.ambient });
  }

  /**
   * Visits a box node.
   * @param node - The box node to visit.
   */
  visitBoxNode(node: BoxNode): void {}

  /**
   * Visits an obj node.
   * @param node - The obj node to visit.
   */
  visitobjNode(node: MeshNode): void {}
}

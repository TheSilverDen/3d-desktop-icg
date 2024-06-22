import Matrix from '../../math/matrix';
import Vector from '../../math/vector';
import Material from '../../renderer/material';
import Box from '../../shapes/box';
import Pyramid from '../../shapes/pyramid';
import Sphere from '../../shapes/sphere';
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
  TextureBoxNode,
  VideoTextureBoxNode
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

/**
 * Class representing a visitor for performing matrix precomputations
 */
export default class Matrixprecomputationvisitor implements Visitor {
  /**
   * Stack to hold transformation matrices.
   */
  matrixStack = [Matrix.identity()];

  /**
   * Stack to hold inverse transformation matrices.
   */
  inverseMatrixStack = [Matrix.identity()];

  /**
   * Creates a new Matrixprecomputationvisitor instance.
   * @param rootNode The root node of the scene graph.
   */
  constructor(rootNode: Node) {}
  /**
   * Visit a GroupNode and apply matrix transformations.
   * @param node The GroupNode to visit.
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
   * Visit a SphereNode and set its transformation matrices.
   * @param node The SphereNode to visit.
   */
  visitSphereNode(node: SphereNode): void {
    let toWorld = this.matrixStack[this.matrixStack.length - 1];
    let fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

    node.setToWorld(toWorld);
    node.setFromWorld(fromWorld);
  }

  /**
   * Visit a BoxNode and set its transformation matrices.
   * @param node The BoxNode to visit.
   */
  visitBoxNode(node: BoxNode): void {
    let toWorld = this.matrixStack[this.matrixStack.length - 1];
    let fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

    node.setToWorld(toWorld);
    node.setFromWorld(fromWorld);
  }

  /**
   * Visit a PyramidNode and set its transformation matrices.
   * @param node The PyramidNode to visit.
   */
  visitPyramidNode(node: PyramidNode): void {
    let toWorld = this.matrixStack[this.matrixStack.length - 1];
    let fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

    node.setToWorld(toWorld);
    node.setFromWorld(fromWorld);
  }

  /**
   * Visit a TextureBoxNode and set its transformation matrices.
   * @param node The TextureBoxNode to visit.
   */
  visitTextureBoxNode(node: TextureBoxNode): void {
    let toWorld = this.matrixStack[this.matrixStack.length - 1];
    let fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

    node.setToWorld(toWorld);
    node.setFromWorld(fromWorld);
  }

  /**
   * Visit a MeshNode and set its transformation matrices.
   * @param node The MeshNode to visit.
   */
  visitMeshNode(node: MeshNode): void {
    let toWorld = this.matrixStack[this.matrixStack.length - 1];
    let fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

    node.setToWorld(toWorld);
    node.setFromWorld(fromWorld);
  }

  /**
   * Visit a VideoTextureBoxNode and set its transformation matrices.
   * @param node The VideoTextureBoxNode to visit.
   */
  visitVideoTextureBoxNode(node: VideoTextureBoxNode): void {
    let toWorld = this.matrixStack[this.matrixStack.length - 1];
    let fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

    node.setToWorld(toWorld);
    node.setFromWorld(fromWorld);
  }

  /**
   * Visit a CameraNode.
   * @param node The CameraNode to visit.
   */
  visitCameraNode(node: CameraNode): void {}

  /**
   * Visit a LightNode and set its transformation matrices.
   * @param node The LightNode to visit.
   */
  visitLightNode(node: LightNode): void {
    let toWorld = this.matrixStack[this.matrixStack.length - 1];
    let fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

    node.setToWorld(toWorld);
    node.setFromWorld(fromWorld);
  }

  /**
   * Visit a LightSphereNode and set its transformation matrices.
   * @param node The LightSphereNode to visit.
   */
  visitLightSphereNode(node: LightSphereNode): void {
    let toWorld = this.matrixStack[this.matrixStack.length - 1];
    let fromWorld = this.inverseMatrixStack[this.inverseMatrixStack.length - 1];

    node.setToWorld(toWorld);
    node.setFromWorld(fromWorld);
  }

  /**
   * Visit an objNode.
   * @param node The objNode to visit.
   */
  visitobjNode(node: MeshNode): void {}
}

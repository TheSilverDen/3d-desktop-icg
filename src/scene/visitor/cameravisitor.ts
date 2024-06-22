import Matrix from '../../math/matrix';
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
  TextureBoxNode,
  VideoTextureBoxNode
} from '../nodes/nodes';
import Visitor from './visitor';

/**
 * Class representing a Visitor that uses
 * finds the/all cameras of a Scenegraph
 */
export default class CameraVisitor implements Visitor {
  toWorld: Array<Matrix> = [];
  fromWorld: Array<Matrix> = [];

  cameras: Array<Camera>;

  /**
   * Creates a new CameraVisitor
   */
  constructor() {}
  /**
   * Renders the Scenegraph
   * @param rootNode The root node of the Scenegraph
   * @param camera The camera used
   * @param lightPositions The light light positions
   */
  setup(rootNode: Node) {
    this.cameras = [];
    this.toWorld.push(Matrix.identity());
    this.fromWorld.push(Matrix.identity());
    rootNode.accept(this);
  }

  /**
   * Visits a group node
   * @param node The node to visit
   */
  visitGroupNode(node: GroupNode) {
    let recentMatrix = this.toWorld[this.toWorld.length - 1];
    let recentInverseMatrix = this.fromWorld[this.fromWorld.length - 1];

    let currentMatrix = node.transform.getMatrix();
    let currentInverseMatrix = node.transform.getInverseMatrix();

    let newMatrix = recentMatrix.mul(currentMatrix);
    let newInverseMatrix = currentInverseMatrix.mul(recentInverseMatrix);

    this.toWorld.push(newMatrix);
    this.fromWorld.push(newInverseMatrix);

    for (let child of node.children) {
      child.accept(this);
    }

    this.toWorld.pop();
    this.fromWorld.pop();
  }

  /**
   * Visits a sphere node
   * @param node - The node to visit
   */
  visitSphereNode(node: SphereNode) {}

  /**
   * Visits an axis aligned box node
   * @param node The node to visit
   */
  visitBoxNode(node: BoxNode) {}

  /**
   * Visits a textured box node
   * @param node The node to visit
   */
  visitTextureBoxNode(node: TextureBoxNode) {}

  /**
   * Visits a camera node
   * @param node The node to visit
   */
  visitCameraNode(node: CameraNode): void {
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();
    toWorld = this.toWorld[this.toWorld.length - 1];
    fromWorld = this.fromWorld[this.fromWorld.length - 1];

    node.camera.viewMatrix = fromWorld;
    node.camera.inverseViewMatrix = toWorld;
    this.cameras.push(node.camera);
  }

  /**
   * Visits a light node node
   * @param node The node to visit
   */
  visitLightNode(node: LightNode): void {}

  /**
   * Visits a light sphere node
   * @param node The node to visit
   */
  visitLightSphereNode(node: LightSphereNode): void {}

  /**
   * Visits a pyramid node
   * @param node The node to visit
   */
  visitPyramidNode(node: PyramidNode): void {}

  /**
   * Visits a mesh node
   * @param node The node to visit
   */
  visitMeshNode(node: MeshNode): void {}

  /**
   * Visits a video texture box node
   * @param node The node to visit
   */
  visitVideoTextureBoxNode(node: VideoTextureBoxNode): void {}
}

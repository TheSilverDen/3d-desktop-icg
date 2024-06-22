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
} from '../nodes/nodes';

/**
 * The Visitor interface allows external classes to perform operations on nodes
 * in a scenegraph without modifying the node classes themselves.
 *
 * It uses a depth-first traversal starting from the root node, visiting group nodes
 * and creating objects with transformations along the path. Transformations are
 * tracked by the visitor using a matrix stack.
 *
 * This pattern promotes separation of concerns and enables flexible operations
 * on various node types in the scenegraph.
 */

export default interface Visitor {
  /**
   * Visits a GroupNode and performs the desired operation.
   * @param node - The GroupNode to visit.
   */
  visitGroupNode(node: GroupNode): void;

  /**
   * Visits a SphereNode and performs the desired operation.
   * @param node - The SphereNode to visit.
   */
  visitSphereNode(node: SphereNode): void;

  /**
   * Visits a BoxNode and performs the desired operation.
   * @param node - The BoxNode to visit.
   */
  visitBoxNode(node: BoxNode): void;

  /**
   * Visits a PyramidNode and performs the desired operation.
   * @param node - The PyramidNode to visit.
   */
  visitPyramidNode(node: PyramidNode): void;

  /**
   * Visits a TextureBoxNode and performs the desired operation.
   * @param node - The TextureBoxNode to visit.
   */
  visitTextureBoxNode(node: TextureBoxNode): void;

  /**
   * Visits a MeshNode and performs the desired operation.
   * @param node - The MeshNode to visit.
   */
  visitMeshNode(node: MeshNode): void;

  /**
   * Visits a VideoTextureBoxNode and performs the desired operation.
   * @param node - The VideoTextureBoxNode to visit.
   */
  visitVideoTextureBoxNode(node: VideoTextureBoxNode): void;

  /**
   * Visits a CameraNode and performs the desired operation.
   * @param node - The CameraNode to visit.
   */
  visitCameraNode(node: CameraNode): void;

  /**
   * Visits a LightNode and performs the desired operation.
   * @param node - The LightNode to visit.
   */
  visitLightNode(node: LightNode): void;

  /**
   * Visits a LightSphereNode and performs the desired operation.
   * @param node - The LightSphereNode to visit.
   */
  visitLightSphereNode(node: LightSphereNode): void;
}

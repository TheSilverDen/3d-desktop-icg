import Matrix from '../../math/matrix';
import { Transformation } from '../../math/transformation';
import Vector from '../../math/vector';
import Material from '../../renderer/material';
import Camera from '../camera';
import Visitor from '../visitor/visitor';

/**
 * Class representing a Node in a Scenegraph
 * Nodes, in the scene graph are transformations or geometric primitives
 * The scene graph describes only the location and appearance of objects. The details how to render it are placed in a visitor!(Ray or Raster)
 * Root-node matches “common world coordinate system”, Object-nodes matches local-object-coordinate-system.
 * Group nodes correspond to transformations
 * All Classes inherit from the Node class and they implement the accept method for the visitor pattern.
 * The visitor calls the accept method on a node, to visit it.
 *
 * Key properties and methods of the Node class include:
 *
 * - `toWorld`: A matrix representing the transformation of the node in world space.
 * - `fromWorld`: The inverse transformation matrix from world space to the node's local space.
 * - `clickMethod`: A function that can be associated with the node to handle mouse click events.
 * - `boundingSphereIntersection`: A boolean flag indicating whether the node intersects with a bounding sphere.
 */
export class Node {
  toWorld: Matrix;
  fromWorld: Matrix;
  clickMethod: Function;
  public boundingSphereIntersection: boolean;

  /**
   * Accepts a visitor according to the visitor pattern
   *
   * @param visitor - The visitor
   */
  accept(visitor: Visitor) {}
  constructor() {
    this.toWorld = Matrix.identity();
    this.fromWorld = Matrix.identity();
  }

  /**
   * Sets whether the node's bounding sphere intersects with another object.
   *
   * @param hasIntersection - A boolean indicating whether the bounding sphere intersects.
   */
  public setBoundingIntersection(hasIntersection: boolean) {
    this.boundingSphereIntersection = hasIntersection;
  }
}

/**
 * Class representing a GroupNode in the Scenegraph.
 * A GroupNode holds a transformation and is able
 * to have child nodes attached to it.
 * @extends Node
 */
export class GroupNode extends Node {
  children = new Array<Node>();

  toWorld: Matrix;
  fromWorld: Matrix;

  /**
   * Constructor
   *
   * @param transform The node's transformation
   */
  constructor(public transform: Transformation) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   *
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitGroupNode(this);
  }

  /**
   * Adds a child node
   *
   * @param childNode The child node to add
   */
  add(childNode: Node) {
    this.children.push(childNode);
  }

  /**
   * Sets a model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setToWorld(matrixStack: Matrix) {
    this.toWorld = matrixStack;
  }

  /**
   * Retrieves the model matrix (toWorld).
   *
   * @returns - The model matrix as a complete array.
   */
  getToWorld(): Matrix {
    return this.toWorld;
  }

  /**
   * Sets an inverse model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setFromWorld(matrixStack: Matrix) {
    this.fromWorld = matrixStack;
  }

  /**
   * Retrieves the inverse model matrix (fromWorld).
   *
   * @returns - The inverse model matrix as a complete array.
   */
  getFromWorld(): Matrix {
    return this.fromWorld;
  }
}

/**
 * Class representing a Sphere in the Scenegraph
 * @extends Node
 */
export class SphereNode extends Node {
  toWorld: Matrix;
  fromWorld: Matrix;

  /**
   * Creates a new Sphere.
   * The sphere is defined around the origin
   * with radius 1.
   * @param material The Material of the Sphere
   */
  constructor(public material: Material) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   *
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    // TODO call the respective method on the visitor
    visitor.visitSphereNode(this);
  }

  /**
   * Sets a model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setToWorld(matrixStack: Matrix) {
    this.toWorld = matrixStack;
  }

  /**
   * Retrieves the model matrix (toWorld).
   *
   * @returns - The model matrix as a complete array.
   */
  getToWorld(): Matrix {
    return this.toWorld;
  }

  /**
   * Sets an inverse model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setFromWorld(matrixStack: Matrix) {
    this.fromWorld = matrixStack;
  }

  /**
   * Retrieves the inverse model matrix (fromWorld).
   *
   * @returns - The inverse model matrix as a complete array.
   */
  getFromWorld(): Matrix {
    return this.fromWorld;
  }

  toString(): String {
    return 'SphereNode';
  }
}

/**
 * Class representing an Axis Aligned Box in the Scenegraph
 * @extends Node
 */
export class BoxNode extends Node {
  toWorld: Matrix;
  fromWorld: Matrix;
  /**
   * Creates an axis aligned box.
   * The box's center is located at the origin
   * with all edges of length 1
   * @param material The Material of the cube
   */
  constructor(public material: Material) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   *
   * @param visitor - The visitor
   */
  accept(visitor: Visitor) {
    if (this.boundingSphereIntersection) {
      //visitor.visitBoxNode(this);
    }
    visitor.visitBoxNode(this);
  }
  /**
   * Sets a model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setToWorld(matrixStack: Matrix) {
    this.toWorld = matrixStack;
  }

  /**
   * Retrieves the model matrix (toWorld).
   *
   * @returns - The model matrix as a complete array.
   */
  getToWorld(): Matrix {
    return this.toWorld;
  }

  /**
   * Sets an inverse model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setFromWorld(matrixStack: Matrix) {
    this.fromWorld = matrixStack;
  }

  /**
   * Retrieves the inverse model matrix (fromWorld).
   *
   * @returns - The inverse model matrix as a complete array.
   */
  getFromWorld(): Matrix {
    return this.fromWorld;
  }

  toString(): String {
    return 'BoxNode';
  }
}

/**
 * Class representing a Pyramid in the Scenegraph
 * @extends Node
 */
export class PyramidNode extends Node {
  toWorld: Matrix;
  fromWorld: Matrix;
  /**
   * Creates an axis aligned box.
   * The box's center is located at the origin
   * with all edges of length 1
   * @param material The Material of the cube
   */
  constructor(public material: Material) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   *
   * @param  {Visitor} visitor - The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitPyramidNode(this);
  }
  /**
   * Sets a model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setToWorld(matrixStack: Matrix) {
    this.toWorld = matrixStack;
  }

  /**
   * Retrieves the model matrix (toWorld).
   *
   * @returns - The model matrix as a complete array.
   */
  getToWorld(): Matrix {
    return this.toWorld;
  }

  /**
   * Sets an inverse model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setFromWorld(matrixStack: Matrix) {
    this.fromWorld = matrixStack;
  }

  /**
   * Retrieves the inverse model matrix (fromWorld).
   *
   * @returns - The inverse model matrix as a complete array.
   */
  getFromWorld(): Matrix {
    return this.fromWorld;
  }
  toString(): String {
    return 'PyramidNode';
  }
}

/**
 * Class representing a Textured Axis Aligned Box in the Scenegraph
 * @extends Node
 */
export class TextureBoxNode extends Node {
  /**
   * Creates an axis aligned box textured box
   * The box's center is located at the origin
   * with all edges of length 1
   * @param texture The image filename for the texture
   * @param material The Material of the Sphere
   */
  constructor(public material: Material) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   *
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitTextureBoxNode(this);
  }

  /**
   * Sets a model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setToWorld(matrixStack: Matrix) {
    this.toWorld = matrixStack;
  }

  /**
   * Retrieves the model matrix (toWorld).
   *
   * @returns - The model matrix as a complete array.
   */
  getToWorld(): Matrix {
    return this.toWorld;
  }

  /**
   * Sets an inverse model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setFromWorld(matrixStack: Matrix) {
    this.fromWorld = matrixStack;
  }

  /**
   * Retrieves the inverse model matrix (fromWorld).
   *
   * @returns - The inverse model matrix as a complete array.
   */
  getFromWorld(): Matrix {
    return this.fromWorld;
  }

  toString(): String {
    return 'TextureBoxNode';
  }
}
export class VideoTextureBoxNode extends Node {
  /**
   * Creates an axis aligned box textured box
   * The box's center is located at the origin
   * with all edges of length 1
   * @param texture The video filename for the texture
   */
  constructor(public material: Material) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitVideoTextureBoxNode(this);
  }
  /**
   * Sets a model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setToWorld(matrixStack: Matrix) {
    this.toWorld = matrixStack;
  }

  /**
   * Retrieves the model matrix (toWorld).
   *
   * @returns - The model matrix as a complete array.
   */
  getToWorld(): Matrix {
    return this.toWorld;
  }

  /**
   * Sets an inverse model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setFromWorld(matrixStack: Matrix) {
    this.fromWorld = matrixStack;
  }

  /**
   * Retrieves the inverse model matrix (fromWorld).
   *
   * @returns - The inverse model matrix as a complete array.
   */
  getFromWorld(): Matrix {
    return this.fromWorld;
  }
}

/**
 * Class representing a camera in the Scenegraph
 * @extends Node
 */
export class CameraNode extends Node {
  /**
   * Creates a new camera.
   * @param camera-object
   */
  constructor(public camera: Camera) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitCameraNode(this);
  }
}

export class LightNode extends Node {
  /**
   * Creates a new Light.
   *
   */
  constructor(public color: Vector) {
    super();
  }
  getColor() {
    return this.color;
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitLightNode(this);
  }
  /**
   * Sets a model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setToWorld(matrixStack: Matrix) {
    this.toWorld = matrixStack;
  }

  /**
   * Retrieves the model matrix (toWorld).
   *
   * @returns - The model matrix as a complete array.
   */
  getToWorld(): Matrix {
    return this.toWorld;
  }

  /**
   * Sets an inverse model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setFromWorld(matrixStack: Matrix) {
    this.fromWorld = matrixStack;
  }

  /**
   * Retrieves the inverse model matrix (fromWorld).
   *
   * @returns - The inverse model matrix as a complete array.
   */
  getFromWorld(): Matrix {
    return this.fromWorld;
  }
}

export class LightSphereNode extends Node {
  /**
   * The children of the group node
   */
  children: Array<SphereNode> = [];

  /**
   * Creates a new LightSphere.
   * The sphere is defined around the origin
   * with radius 1.
   *
   * @param color The colour of the Sphere
   */
  constructor(public material: Material) {
    super();
    //this.children.push(sphere);
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    visitor.visitLightSphereNode(this);
  }
  /**
   * Adds a child node
   * @param childNode The child node to add
   */
  add(childNode: SphereNode) {
    this.children.push(childNode);
  }
  /**
   * Sets a model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setToWorld(matrixStack: Matrix) {
    this.toWorld = matrixStack;
  }

  /**
   * Retrieves the model matrix (toWorld).
   *
   * @returns - The model matrix as a complete array.
   */
  getToWorld(): Matrix {
    return this.toWorld;
  }

  /**
   * Sets an inverse model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setFromWorld(matrixStack: Matrix) {
    this.fromWorld = matrixStack;
  }

  /**
   * Retrieves the inverse model matrix (fromWorld).
   *
   * @returns - The inverse model matrix as a complete array.
   */
  getFromWorld(): Matrix {
    return this.fromWorld;
  }
}

/**
 * Class representing a mesh in the Scenegraph
 * @extends Node
 *
 */
export class MeshNode extends Node {
  /**
   * Creates an axis aligned box textured box
   * The box's center is located at the origin
   * with all edges of length 1
   * @param texture The image filename for the texture
   */
  constructor(public material: Material, public filename: string, public mtl?: string) {
    super();
  }

  /**
   * Accepts a visitor according to the visitor pattern
   * @param visitor The visitor
   */
  accept(visitor: Visitor) {
    // TODO call the respective method on the visitor
    visitor.visitMeshNode(this);
  }
  /**
   * Sets a model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setToWorld(matrixStack: Matrix) {
    this.toWorld = matrixStack;
  }

  /**
   * Retrieves the model matrix (toWorld).
   *
   * @returns - The model matrix as a complete array.
   */
  getToWorld(): Matrix {
    return this.toWorld;
  }

  /**
   * Sets an inverse model matrix stack for an object node.
   *
   * @param matrixStack - The matrix stack to be set.
   */
  setFromWorld(matrixStack: Matrix) {
    this.fromWorld = matrixStack;
  }

  /**
   * Retrieves the inverse model matrix (fromWorld).
   *
   * @returns - The inverse model matrix as a complete array.
   */
  getFromWorld(): Matrix {
    return this.fromWorld;
  }
}

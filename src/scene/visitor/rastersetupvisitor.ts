import Vector from '../../math/vector';
import ObjMesh from '../../parser/obj-mesh';
import Shader from '../../renderer/rasterizer/shader';
import Box from '../../shapes/box';
import Pyramid from '../../shapes/pyramid';
import Sphere from '../../shapes/sphere';
import TextureBox from '../../shapes/texture-box';
import VideoTextureBox from '../../shapes/video-texture-box';
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

interface Renderable {
  render(shader: Shader): void;
}

/**
 * Class representing a Visitor that sets up buffers
 * for use by the RasterVisitor
 * */
export class RasterSetupVisitor {
  /**
   * The created render objects
   */
  public objects: WeakMap<Node, Renderable>;

  /**
   * Creates a new RasterSetupVisitor
   * @param context The 3D context in which to create buffers
   */
  constructor(private gl: WebGL2RenderingContext) {
    this.objects = new WeakMap();
  }

  /**
   * Sets up all needed buffers
   * @param rootNode The root node of the Scenegraph
   */
  setup(rootNode: Node) {
    // Clear to white, fully opaque
    this.gl.clearColor(1.0, 1.0, 1.0, 1.0);
    // Clear everything
    this.gl.clearDepth(1.0);
    // Enable depth testing
    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.depthFunc(this.gl.LEQUAL);

    this.gl.enable(this.gl.CULL_FACE);
    this.gl.cullFace(this.gl.BACK);

    rootNode.accept(this);
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
    this.objects.set(node, new Sphere(this.gl, new Vector(0, 0, 0, 1), 1, node.material));
  }

  /**
   * Visits an axis aligned box node
   * @param  {AABoxNode} node - The node to visit
   */
  visitBoxNode(node: BoxNode) {
    this.objects.set(
      node,
      new Box(this.gl, new Vector(-0.5, -0.5, -0.5, 1), new Vector(0.5, 0.5, 0.5, 1), node.material)
    );
  }

  //        4
  //     /      \
  //    0-------2
  //   /       /
  //  3-------1
  /**
   * Visits a pyramid node
   * @param node - The node to visit
   */
  visitPyramidNode(node: PyramidNode) {
    this.objects.set(
      node,
      new Pyramid(
        this.gl,
        new Vector(0, 0.5, 0, 1), //4
        [
          new Vector(-0.5, -0.5, -0.5, 1), //0
          new Vector(0.5, -0.5, 0.5, 1), //1
          new Vector(0.5, -0.5, -0.5, 1), //2
          new Vector(-0.5, -0.5, 0.5, 1)
        ], //3
        node.material
      )
    );
  }

  /**
   * Visits a textured box node. Loads the texture
   * and creates a uv coordinate buffer
   * @param  {TextureBoxNode} node - The node to visit
   */
  visitTextureBoxNode(node: TextureBoxNode) {
    this.objects.set(
      node,
      new TextureBox(this.gl, new Vector(-0.5, -0.5, -0.5, 1), new Vector(0.5, 0.5, 0.5, 1), node.material)
    );
  }

  /**
   * Visits a video texture box node
   * @param node - The node to visit
   */
  visitVideoTextureBoxNode(node: VideoTextureBoxNode) {
    this.objects.set(
      node,
      new VideoTextureBox(
        this.gl,
        new Vector(-0.5, -0.5, -0.5, 1),
        new Vector(0.5, 0.5, 0.5, 1),
        node.material
      )
    );
  }

  /**
   * Visits a mesh node
   * @param node - The node to visit
   */
  visitMeshNode(node: MeshNode) {
    this.objects.set(node, new ObjMesh(this.gl, node.filename, node.mtl));
  }

  /**
   * Visits a camera node
   * @param node - The node to visit
   */
  visitCameraNode(node: CameraNode) {}

  /**
   * Visits a light node
   * @param node - The node to visit
   */
  visitLightNode(node: LightNode): void {}

  /**
   * Visits a light sphere node
   * @param node - The node to visit
   */
  visitLightSphereNode(node: LightSphereNode): void {
    this.objects.set(node, new Sphere(this.gl, new Vector(0, 0, 0, 1), 1, node.material));
  }
}

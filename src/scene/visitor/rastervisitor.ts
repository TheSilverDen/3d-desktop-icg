import Matrix from '../../math/matrix';
import Vector from '../../math/vector';
import Material from '../../renderer/material';
import Shader from '../../renderer/rasterizer/shader';
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
import MatrixPrecomputationVisitor from './matrixprecomputationvisitor';
import Visitor from './visitor';

interface Renderable {
  render(shader: Shader): void;
}

/**
 * Class representing a Visitor that uses Rasterisation
 * to render a Scenegraph
 */
export class RasterVisitor implements Visitor {
  toWorld: Array<Matrix>;
  fromWorld: Array<Matrix>;
  lightPositions: Array<Vector>;
  lightColors: Array<Vector>;
  sphereLights: Array<{ position: Vector; color: Vector }>;
  defaultLightPosArray = [new Vector(1.0, 1.0, 1.0, 0)];
  defaultLightColorsArray = [new Vector(1.0, 1.0, 1.0, 0)];

  shadowTexture: WebGLTexture;

  camera: Camera;

  lightP = Matrix.identity();
  lightV = Matrix.identity();

  matrixPrecomputationVisitor: MatrixPrecomputationVisitor;

  /**
   * Creates a new RasterVisitor
   * @param gl The 3D context to render to
   * @param shader The default shader to use
   * @param textureshader The texture shader to use
   */
  constructor(private gl: WebGL2RenderingContext, public renderables: WeakMap<Node, Renderable>) {
    this.toWorld = [Matrix.identity()];
    this.fromWorld = [Matrix.identity()];
  }

  /**
   * Renders the Scenegraph
   * @param rootNode The root node of the Scenegraph
   * @param camera The camera used
   * @param lightPositions The lightpositions in view space
   */
  render(
    rootNode: Node,
    camera: Camera | null,
    lightPositions: Array<Vector>,
    frameBuffer?: WebGLFramebuffer,
    lightColors?: Array<Vector>,
    sphereLights?: Array<{ position: Vector; color: Vector }>
  ) {
    this.matrixPrecomputationVisitor = new MatrixPrecomputationVisitor(rootNode);
    rootNode.accept(this.matrixPrecomputationVisitor);

    this.lightPositions = lightPositions;
    this.lightColors = lightColors;
    this.sphereLights = sphereLights;

    if (frameBuffer) {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, frameBuffer);
    } else {
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    if (camera) this.camera = camera;
    else this.camera = new Camera(1.0); // default camera

    // traverse and render
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

  setLightsForShader(shader: Shader) {
    const lightPos = shader.getUniformVec3Array('lightPositions');
    if (lightPos) {
      lightPos.set(
        this.lightPositions != null && this.lightPositions.length > 0
          ? this.lightPositions
          : this.defaultLightPosArray
      );
    }
    const lightColors = shader.getUniformVec3Array('lightColors');
    if (lightColors) {
      lightColors.set(
        this.lightColors != null && this.lightColors.length > 0
          ? this.lightColors
          : this.defaultLightColorsArray
      );
    }

    if (this.sphereLights) {
      let sphereLightsPositions = new Array<Vector>();
      for (let i = 0; i < this.sphereLights.length; i++) {
        sphereLightsPositions.push(this.sphereLights[i].position);
      }
      let sphereLightsColors = new Array<Vector>();
      for (let i = 0; i < this.sphereLights.length; i++) {
        sphereLightsColors.push(this.sphereLights[i].color);
      }

      const sphereLightsPos = shader.getUniformVec3Array('sphereLightPositions');
      if (sphereLightsPos) {
        sphereLightsPos.set(
          this.sphereLights != null && this.sphereLights.length > 0
            ? sphereLightsPositions
            : this.defaultLightPosArray
        );
      }
      const sphereLightsCol = shader.getUniformVec3Array('sphereLightColors');
      if (sphereLightsCol) {
        sphereLightsCol.set(
          this.sphereLights != null && this.sphereLights.length > 0
            ? sphereLightsColors
            : this.defaultLightColorsArray
        );
      }
    }
  }

  /**
   * Visits a sphere node
   * @param node The node to visit
   */
  visitSphereNode(node: SphereNode) {
    let material = node.material;
    if (this.camera && this.camera.replacementMaterial) {
      material = node.material;
      node.material = this.camera.replacementMaterial;
    }

    let shader = node.material.shader;
    shader.use();

    const shininess = shader.getUniformFloat('shininess');
    if (shininess) {
      shininess.set(material.shininess);
    }

    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = node.getToWorld();
    fromWorld = node.getFromWorld();

    let modelLocation = shader.getUniformMatrix('M');
    modelLocation.set(toWorld); //pass model matrix to shader

    //pass view- and projection matrix to shader
    const V = shader.getUniformMatrix('V');

    if (V && this.camera) {
      V.set(this.camera.viewMatrix);
    }
    const P = shader.getUniformMatrix('P');
    if (P && this.camera) {
      P.set(this.camera.projectionMatrix);
    }
    //pass lights to shader
    this.setLightsForShader(shader);

    const alpha = shader.getUniformFloat('alpha');
    alpha.set(material.alpha);

    let normalMatrix = fromWorld.transpose();

    normalMatrix.setVal(3, 0, 0);
    normalMatrix.setVal(3, 1, 0);
    normalMatrix.setVal(3, 2, 0);
    shader.getUniformMatrix('N').set(normalMatrix);

    //render with Shader
    let i = this.renderables.get(node);
    this.renderables.get(node).render(shader);

    if (this.camera && this.camera.replacementMaterial) {
      node.material = material;
    }
  }

  /**
   * Visits an axis aligned box node
   * @param  {BoxNode} node - The node to visit
   */
  visitBoxNode(node: BoxNode) {
    let material: Material = node.material;
    if (this.camera && this.camera.replacementMaterial) {
      material = node.material;
      node.material = this.camera.replacementMaterial;
    }
    let shader = node.material.shader;
    shader.use();
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = node.getToWorld();
    fromWorld = node.getFromWorld();

    const shininess = shader.getUniformFloat('shininess');
    if (shininess) {
      shininess.set(material.shininess);
    }

    //Pass model matrix to shader
    shader.getUniformMatrix('M').set(toWorld);

    //View matrix and projection matrix are passed to shaders. They control the viewer perspective and the projection of the scene
    const V = shader.getUniformMatrix('V');
    if (V && this.camera) {
      V.set(this.camera.viewMatrix);
    }
    const P = shader.getUniformMatrix('P');
    if (P && this.camera) {
      P.set(this.camera.projectionMatrix);
    }

    this.setLightsForShader(shader);
    //Normal matrix is used to transform the surface normals of the sphere in the shader, and to
    //Lighting effects are calculated correctly
    let normalMatrix = fromWorld.transpose();
    shader.getUniformMatrix('N').set(normalMatrix);

    this.renderables.get(node).render(shader);

    if (this.camera && this.camera.replacementMaterial) {
      node.material = material;
    }
  }
  visitobjNode(node: MeshNode): void {}

  visitTextureBoxNode(node: TextureBoxNode): void {
    // Check if a camera and spare material are available
    let material: Material = node.material;
    if (this.camera && this.camera.replacementMaterial) {
      material = node.material;
      node.material = this.camera.replacementMaterial;
    }

    // Use the shader of the node
    const shader = node.material.shader;
    shader.use();

    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = node.getToWorld();
    fromWorld = node.getFromWorld();

    // Set the model matrix (toWorld) in the shader
    shader.getUniformMatrix('M').set(toWorld);

    // Set the view matrix (toWorld) in the shader
    const V = shader.getUniformMatrix('V');
    if (V) {
      V.set(this.camera.viewMatrix);
    }

    // Set the model matrix (toWorld) in the shader (if available)
    const P = shader.getUniformMatrix('P');
    if (P) {
      P.set(this.camera.projectionMatrix);
    }

    this.setLightsForShader(shader);

    // Activate and bind the Shadow Texture on texture layer
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.shadowTexture);

    // Calculate and set the normal matrix in the shader (depending on the model matrix).
    let normalMatrix = fromWorld.transpose();
    normalMatrix.setVal(3, 0, 0);
    normalMatrix.setVal(3, 1, 0);
    normalMatrix.setVal(3, 2, 0);
    shader.getUniformMatrix('N').set(normalMatrix);

    if (material.alpha) {
      shader.getUniformFloat('alpha').set(material.alpha);
    }

    // Render the object with the replacement material
    this.renderables.get(node).render(shader);
    if (this.camera && this.camera.replacementMaterial) {
      node.material = material;
    }
  }

  /**
   * Visits a pyramide node.
   * @param node - The pyramide node to visit.
   */
  visitPyramidNode(node: PyramidNode): void {
    let material: Material = node.material;
    if (this.camera && this.camera.replacementMaterial) {
      material = node.material;
      node.material = this.camera.replacementMaterial;
    }

    let shader = node.material.shader;
    shader.use();

    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = node.getToWorld();
    fromWorld = node.getFromWorld();

    const shininess = shader.getUniformFloat('shininess');
    if (shininess) {
      shininess.set(material.shininess);
    }

    shader.getUniformMatrix('M').set(toWorld);

    const V = shader.getUniformMatrix('V');
    if (V && this.camera) {
      V.set(this.camera.viewMatrix);
    }

    const P = shader.getUniformMatrix('P');
    if (P && this.camera) {
      P.set(this.camera.projectionMatrix);
    }

    this.setLightsForShader(shader);
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.shadowTexture);
    shader.getUniformInt('depthColorTexture').set(1);

    let normalMatrix = fromWorld.transpose();
    normalMatrix.setVal(3, 0, 0);
    normalMatrix.setVal(3, 1, 0);
    normalMatrix.setVal(3, 2, 0);
    shader.getUniformMatrix('N').set(normalMatrix);

    this.renderables.get(node).render(shader);

    if (this.camera && this.camera.replacementMaterial) {
      node.material = material;
    }
  }

  /**
   * Visits a video texture box node.
   * @param node - The box node to visit.
   */
  visitVideoTextureBoxNode2(node: VideoTextureBoxNode) {
    let material: Material = node.material;
    if (this.camera && this.camera.replacementMaterial) {
      material = node.material;
      node.material = this.camera.replacementMaterial;
    }
    let shader: Shader = node.material.shader;
    shader.use();

    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = node.getToWorld();
    fromWorld = node.getFromWorld();

    let normalMatrix = fromWorld.transpose();

    normalMatrix.setVal(3, 0, 0);
    normalMatrix.setVal(3, 1, 0);
    normalMatrix.setVal(3, 2, 0);

    const M = shader.getUniformMatrix('M');
    if (M && toWorld) {
      M.set(toWorld);
    }
    shader.getUniformMatrix('M').set(toWorld);
    shader.getUniformMatrix('N').set(normalMatrix);

    const V = shader.getUniformMatrix('V');
    if (V && this.camera) {
      V.set(this.camera.viewMatrix);
    }

    const P = shader.getUniformMatrix('P');
    if (P && this.camera) {
      P.set(this.camera.projectionMatrix);
    }

    const lightPos = shader.getUniformVec3Array('lightPos');
    if (lightPos) {
      lightPos.set(
        this.lightPositions != null && this.lightPositions.length > 0
          ? this.lightPositions
          : [new Vector(1.0, 1.0, 1.0, 0)]
      );
    }

    shader.getUniformVec3('lightColor').set(new Vector(1.0, 1.0, 1.0));
    shader.getUniformVec3('kA').set(material.ambient);
    shader.getUniformVec3('kD').set(material.diffuse);
    shader.getUniformVec3('kS').set(material.specular);
    shader.getUniformFloat('shininess').set(material.shininess);

    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.shadowTexture);
    shader.getUniformInt('depthColorTexture').set(1);

    this.renderables.get(node).render(shader);

    if (this.camera && this.camera.replacementMaterial) {
      node.material = material;
    }
  }

  visitVideoTextureBoxNode(node: VideoTextureBoxNode): void {
    let material: Material = node.material;
    if (this.camera && this.camera.replacementMaterial) {
      material = node.material;
      node.material = this.camera.replacementMaterial;
    }

    let shader = node.material.shader;
    shader.use();

    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = node.getToWorld();
    fromWorld = node.getFromWorld();

    shader.getUniformMatrix('M').set(toWorld);

    const V = shader.getUniformMatrix('V');
    if (V && this.camera) {
      V.set(this.camera.viewMatrix);
    }

    const P = shader.getUniformMatrix('P');
    if (P && this.camera) {
      P.set(this.camera.projectionMatrix);
    }

    this.setLightsForShader(shader);

    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.shadowTexture);
    shader.getUniformInt('depthColorTexture').set(1);

    let normalMatrix = fromWorld.transpose();
    normalMatrix.setVal(3, 0, 0);
    normalMatrix.setVal(3, 1, 0);
    normalMatrix.setVal(3, 2, 0);
    shader.getUniformMatrix('N').set(normalMatrix);

    let obj = this.renderables.get(node);
    obj.render(shader);

    if (this.camera && this.camera.replacementMaterial) {
      node.material = material;
    }
  }
  /**
   * Visits a camera node.
   * @param node - The node to visit.
   */
  visitCameraNode(node: CameraNode): void {}

  /**
   * Visits a light node.
   * @param node - The node to visit.
   */
  visitLightNode(node: LightNode): void {}

  /**
   * Visits a light sphere node.
   * @param node - The node to visit.
   */
  visitLightSphereNode(node: LightSphereNode): void {
    let material = node.material;
    if (this.camera && this.camera.replacementMaterial) {
      material = node.material;
      node.material = this.camera.replacementMaterial;
    }

    let shader = node.material.shader;
    shader.use();

    const shininess = shader.getUniformFloat('shininess');
    if (shininess) {
      shininess.set(material.shininess);
    }

    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = node.getToWorld();
    fromWorld = node.getFromWorld();

    let modelLocation = shader.getUniformMatrix('M');
    modelLocation.set(toWorld);

    const V = shader.getUniformMatrix('V');

    if (V && this.camera) {
      V.set(this.camera.viewMatrix);
    }
    const P = shader.getUniformMatrix('P');
    if (P && this.camera) {
      P.set(this.camera.projectionMatrix);
    }
    this.setLightsForShader(shader);

    const alpha = shader.getUniformFloat('alpha');
    alpha.set(material.ambient.w);

    let normalMatrix = fromWorld.transpose();
    normalMatrix.setVal(3, 0, 0);
    normalMatrix.setVal(3, 1, 0);
    normalMatrix.setVal(3, 2, 0);
    shader.getUniformMatrix('N').set(normalMatrix);

    //render with shader
    let i = this.renderables.get(node);
    this.renderables.get(node).render(shader);

    if (this.camera && this.camera.replacementMaterial) {
      node.material = material;
    }
  }

  /**
   * Visits a mesh node.
   * @param node - The mesh node to visit.
   */
  visitMeshNode(node: MeshNode): void {
    let material: Material = node.material;

    // Handle camera replacement material if applicable
    if (this.camera && this.camera.replacementMaterial) {
      material = node.material;
      node.material = this.camera.replacementMaterial;
    }

    let shader = node.material.shader;
    shader.use();

    // Calculate the model matrix for the OBJ mesh
    let toWorld = Matrix.identity();
    let fromWorld = Matrix.identity();

    toWorld = node.getToWorld();
    fromWorld = node.getFromWorld();

    const shininess = shader.getUniformFloat('shininess');
    if (shininess) {
      shininess.set(material.shininess);
    }

    shader.getUniformMatrix('M').set(toWorld); // Model Matrix to the shader

    // View-Matrix and Projection Matrix to the shader
    const V = shader.getUniformMatrix('V');
    if (V && this.camera) {
      V.set(this.camera.viewMatrix);
    }
    const P = shader.getUniformMatrix('P');
    if (P && this.camera) {
      P.set(this.camera.projectionMatrix);
    }

    this.setLightsForShader(shader);

    // Configure the Shadow-Texture-Slot in the shader
    this.gl.activeTexture(this.gl.TEXTURE1);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.shadowTexture);
    shader.getUniformInt('depthColorTexture').set(1);

    // Set the normal matrix
    // Normal matrix is used to transform surface normals in the shader
    const normalMatrix = fromWorld.transpose();
    shader.getUniformMatrix('N').set(normalMatrix);

    // Render the OBJ mesh
    this.renderables.get(node).render(shader);

    // Restore the original material if a replacement was used
    if (this.camera && this.camera.replacementMaterial) {
      node.material = material;
    }
  }
}

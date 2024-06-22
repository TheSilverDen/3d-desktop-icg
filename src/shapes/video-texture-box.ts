import Vector from '../math/vector';
import Material from '../renderer/material';
import Shader from '../renderer/rasterizer/shader';
import Intersection from '../renderer/raytracer/intersection';
import Ray from '../renderer/raytracer/ray';
import Triangle from './triangle';

/**
 * A class representing a Video textured box
 */
export default class VideoTextureBox {
  /**
   * The box's vertices.
   */
  vertices: Array<number>;

  /**
   * The buffer containing the box's vertices.
   */
  vertexBuffer: WebGLBuffer;

  /**
   * The buffer containing the box's texture.
   */
  texBuffer: WebGLTexture;

  /**
   * The buffer containing the box's texture coordinates.
   */
  texCoords: WebGLBuffer;

  /**
   * The amount of faces.
   */
  elements: number;

  /**
   * The buffer containing the normals of the vertices.
   */
  normalBuffer: WebGLBuffer;

  /**
   * The buffer containing the box's Normal Map.
   */
  normalMap: WebGLBuffer;

  /**
   * The buffer containing the box's alpha map.
   */
  alphaMap: WebGLBuffer;

  /**
   * The buffer containing tangent.
   */
  tangentBuffer: WebGLBuffer;

  /**
   * The buffer containing bitangent.
   */
  bitangentBuffer: WebGLBuffer;

  /**
   * The buffer containing the box's material.
   */
  ambientBuffer: WebGLBuffer;

  /**
   * The buffer containing the box's diffuse material.
   */
  diffuseBuffer: WebGLBuffer;

  /**
   * The buffer containing the box's specular material.
   */
  specularBuffer: WebGLBuffer;

  /**
   * Indicates whether the video is currently playing.
   */
  playing: boolean = false;

  /**
   * Indicates whether the time update event has occurred for the video.
   */
  timeupdate: boolean = false;

  /**
   * Indicates whether the video should be copied for texture updating.
   */
  copyVideo: boolean = false;

  /**
   * The cube texture used for rendering.
   */
  cubeTexture: WebGLTexture;

  /**
   * The HTML video element used for texture updating.
   */
  cubeVideo: HTMLVideoElement;

  opened: boolean;

  /**
   * Creates a VideoTextureBox
   *     6 ------- 7
   *    / |       / |
   *   3 ------- 2  |
   *   |  |      |  |
   *   |  5 -----|- 4
   *   | /       | /
   *   0 ------- 1
   *  looking in negative z axis direction
   * @param gl The canvas' context
   * @param minPoint The minimal x,y,z of the box
   * @param maxPoint The maximal x,y,z of the box
   * @param material The material
   */
  constructor(
    public gl: WebGL2RenderingContext,
    minPoint: Vector,
    maxPoint: Vector,
    public material: Material
  ) {
    const mi = minPoint;
    const ma = maxPoint;
    let vertices = [
      // front
      mi.x, mi.y, ma.z, ma.x, mi.y, ma.z, ma.x, ma.y, ma.z,
      ma.x, ma.y, ma.z, mi.x, ma.y, ma.z, mi.x, mi.y, ma.z,
      // back
      ma.x, mi.y, mi.z, mi.x, mi.y, mi.z, mi.x, ma.y, mi.z,
      mi.x, ma.y, mi.z, ma.x, ma.y, mi.z, ma.x, mi.y, mi.z,
      // right
      ma.x, mi.y, ma.z, ma.x, mi.y, mi.z, ma.x, ma.y, mi.z,
      ma.x, ma.y, mi.z, ma.x, ma.y, ma.z, ma.x, mi.y, ma.z,
      // top
      mi.x, ma.y, ma.z, ma.x, ma.y, ma.z, ma.x, ma.y, mi.z,
      ma.x, ma.y, mi.z, mi.x, ma.y, mi.z, mi.x, ma.y, ma.z,
      // left
      mi.x, mi.y, mi.z, mi.x, mi.y, ma.z, mi.x, ma.y, ma.z,
      mi.x, ma.y, ma.z, mi.x, ma.y, mi.z, mi.x, mi.y, mi.z,
      // bottom
      mi.x, mi.y, mi.z, ma.x, mi.y, mi.z, ma.x, mi.y, ma.z,
      ma.x, mi.y, ma.z, mi.x, mi.y, ma.z, mi.x, mi.y, mi.z
    ];
    this.vertices = vertices;
    if (!gl) {
      return;
    }

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    this.vertexBuffer = vertexBuffer;
    this.elements = vertices.length / 3;

    this.texBuffer = gl.createTexture();
    material.getMainTexture(gl, this.texBuffer);

    let uv = [
      // front
      0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1,
      // back
      0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1,
      // right
      0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1,
      // top
      0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1,
      // left
      0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1,
      // bottom
      0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 0, 1
    ];
    let uvBuffer = this.gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
    gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(uv), gl.STATIC_DRAW);
    this.texCoords = uvBuffer;

    const numVertices = this.vertices.length;

    const ambientColors = [];
    const diffuseColors = [];
    const specularColors = [];

    for (let vertexIndex = 0; vertexIndex < numVertices; vertexIndex++) {
      const ambient = [material.ambient.x, material.ambient.y, material.ambient.z];
      const diffuse = [material.diffuse.x, material.diffuse.y, material.diffuse.z];
      const specular = [material.specular.x, material.specular.y, material.specular.z];

      ambientColors.push(...ambient);
      diffuseColors.push(...diffuse);
      specularColors.push(...specular);
    }
    // Create the color buffers
    const ambientBuffer = gl.createBuffer();
    const diffuseBuffer = gl.createBuffer();
    const specularBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ambientBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ambientColors), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, diffuseBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(diffuseColors), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, specularBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(specularColors), gl.STATIC_DRAW);

    this.ambientBuffer = ambientBuffer;
    this.diffuseBuffer = diffuseBuffer;
    this.specularBuffer = specularBuffer;

    let normals = [];
    for (let i = 0; i < vertices.length; i += 9) {
      let p0 = new Vector(vertices[i], vertices[i + 1], vertices[i + 2]);
      let p1 = new Vector(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
      let p2 = new Vector(vertices[i + 6], vertices[i + 7], vertices[i + 8]);
      let normal = p1.sub(p0).cross(p2.sub(p0)).normalize();
      normals.push(normal.x, normal.y, normal.z, normal.x, normal.y, normal.z, normal.x, normal.y, normal.z);
    }

    // Create and fill the buffer for normals
    let normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
    this.normalBuffer = normalBuffer;

    this.alphaMap = gl.createTexture();
    material.getAlphaMap(gl, this.alphaMap);

    this.cubeVideo = this.setupVideo(material.images.get('videoTexture'));
    this.cubeTexture = this.material.initTexture(this.gl);
  }

  /**
   * Renders the textured box
   * @param shader - The shader used to render
   */
  render(shader: Shader) {
    if (this.copyVideo) {
      this.material.updateTexture(this.gl, this.cubeTexture, this.cubeVideo);
      this.gl.activeTexture(this.gl.TEXTURE3);
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.cubeTexture);
      shader.getUniformInt('videoTexture').set(3);
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    const positionLocation = shader.getAttributeLocation('a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.ambientBuffer);
    const ambientLocation = shader.getAttributeLocation('a_ambient_color');
    this.gl.enableVertexAttribArray(ambientLocation);
    this.gl.vertexAttribPointer(ambientLocation, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.diffuseBuffer);
    const diffuseLocation = shader.getAttributeLocation('a_diffuse_color');
    this.gl.enableVertexAttribArray(diffuseLocation);
    this.gl.vertexAttribPointer(diffuseLocation, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.specularBuffer);
    const specularLocation = shader.getAttributeLocation('a_specular_color');
    this.gl.enableVertexAttribArray(specularLocation);
    this.gl.vertexAttribPointer(specularLocation, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoords);
    const texCoordinateLocation = shader.getAttributeLocation('a_textureCoordinate');
    this.gl.enableVertexAttribArray(texCoordinateLocation);
    this.gl.vertexAttribPointer(texCoordinateLocation, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
    const normalLocation = shader.getAttributeLocation('a_normal');
    this.gl.enableVertexAttribArray(normalLocation);
    this.gl.vertexAttribPointer(normalLocation, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.activeTexture(this.gl.TEXTURE0);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texBuffer);
    let textureHandle = shader.getUniformInt('sampler');
    if (textureHandle) {
      textureHandle.set(0);
    }

    this.gl.activeTexture(this.gl.TEXTURE2);
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.alphaMap);
    const alphaMapHandle = shader.getUniformInt('u_alphaMap');
    if (alphaMapHandle) {
      alphaMapHandle.set(2); // Texture unit 2
    }

    this.gl.drawArrays(this.gl.TRIANGLES, 0, this.elements);

    this.gl.disableVertexAttribArray(positionLocation);
    this.gl.disableVertexAttribArray(texCoordinateLocation);
    this.gl.disableVertexAttribArray(normalLocation);
  }

  /**
   * Sets up the HTML video element for texture updating.
   * @param videoUrl - The URL of the video.
   * @returns The created HTML video element.
   */
  setupVideo(videoUrl: string) {
    this.cubeVideo = document.createElement('video');
    this.cubeVideo.playsInline = true;
    this.cubeVideo.muted = true;
    this.cubeVideo.loop = true;

    // Waiting for these 2 events ensures
    // there is data in the video

    this.cubeVideo.addEventListener(
      'playing',
      () => {
        this.playing = true;
        this.checkReady();
      },
      true
    );

    this.cubeVideo.addEventListener(
      'timeupdate',
      () => {
        this.timeupdate = true;
        this.checkReady();
      },
      true
    );

    this.cubeVideo.src = videoUrl;
    //this.cubeVideo.pause();
    this.checkReady();
    return this.cubeVideo;
  }

  /**
   * Checks if the video is ready for texture copying.
   */
  checkReady() {
    if (this.playing && this.timeupdate && this.opened) {
      this.copyVideo = true;
    }
  }

  setOpened(isOpen: boolean) {
    this.opened = isOpen;
  }

  /**
   * Pauses or plays the video based on its current state.
   */
  public pausePlayVideo() {
    if (this.playing) {
      this.cubeVideo.pause();
      this.playing = false;
    } else {
      this.cubeVideo.play();
      this.playing = true;
    }
  }

  /**
   * Calculates the intersection of the object with the given ray
   * @param ray The ray to intersect with
   * @return The intersection if there is one, null if there is none
   */
  intersect(ray: Ray): Intersection | null {
    let closestIntersection: Intersection | null = null;

    for (let i = 0; i < this.vertices.length; i += 9) {
      const vertex0 = new Vector(this.vertices[i], this.vertices[i + 1], this.vertices[i + 2]);
      const vertex1 = new Vector(this.vertices[i + 3], this.vertices[i + 4], this.vertices[i + 5]);
      const vertex2 = new Vector(this.vertices[i + 6], this.vertices[i + 7], this.vertices[i + 8]);

      const triangle = new Triangle(vertex0, vertex1, vertex2, null);

      const intersection = triangle.intersect(ray);
      if (intersection) {
        if (!closestIntersection || intersection.t < closestIntersection.t) {
          closestIntersection = intersection;
        }
      }
    }

    return closestIntersection;
  }
}

import Vector from '../math/vector';
import Material from '../renderer/material';
import Shader from '../renderer/rasterizer/shader';
import Intersection from '../renderer/raytracer/intersection';
import Ray from '../renderer/raytracer/ray';
import Triangle from '../shapes/triangle';

/**
 * Represents a 3D mesh created from an OBJ file for rendering with WebGL.
 */
export default class ObjMesh {
  /**
   * An array to store vertex coordinates.
   */
  vertices: number[] = [];

  /**
   * An array to store normal vectors.
   */
  normals: number[] = [];

  /**
   * An array to store indices for vertex data.
   */
  indices: number[] = [];

  /**
   * An array to store texture coordinate indices.
   */
  textureIndices: number[] = [];

  /**
   * An array to store normal indices.
   */
  normalIndices: number[] = [];

  /**
   * An array to store ambient color values.
   */
  ambientColors: number[] = [];

  /**
   * An array to store diffuse color values.
   */
  diffuseColors: number[] = [];

  /**
   * An array to store specular color values.
   */
  specularColors: number[] = [];

  /**
   * An array to store UV coordinates.
   */
  uvCoords: number[] = [];

  /**
   * WebGL buffer for vertex data.
   */
  vertexBuffer: WebGLBuffer;

  /**
   * WebGL buffer for index data.
   */
  indexBuffer: WebGLBuffer;

  /**
   * WebGL buffer for normal index data.
   */
  normalIndexBuffer: WebGLBuffer;

  /**
   * WebGL buffer for normal data.
   */
  normalBuffer: WebGLBuffer;

  /**
   * WebGL buffer for ambient color data.
   */
  ambientBuffer: WebGLBuffer;

  /**
   * WebGL buffer for diffuse color data.
   */
  diffuseBuffer: WebGLBuffer;

  /**
   * WebGL buffer for specular color data.
   */
  specularBuffer: WebGLBuffer;

  /**
   * WebGL buffer for texture coordinates.
   */
  texBuffer: WebGLBuffer;

  /**
   * WebGL buffer for texture coordinates.
   */
  texCoords: WebGLBuffer;

  /**
   * The number of elements in the mesh (usually indices count).
   */
  elements: number;

  /**
   * The path to the associated MTL (Material) file.
   */
  mtlFile: string;

  /**
   * A variable to store the loaded file content.
   */
  file: any;

  /**
   * Creates a new ObjMesh instance.
   * @param gl - The WebGL2 rendering context.
   * @param filename - The path to the OBJ file to load.
   * @param mtl - The path to the MTL file for material properties (optional).
   */
  constructor(private gl: WebGL2RenderingContext, private filename: string, private mtl?: string) {
    this.gl = gl;
    let rasterObj = this;

    if (!mtl) {
      this.mtlFile = 'obj/low-poly-squirrel.mtl';
    } else {
      this.mtlFile = mtl;
    }
    if (!this.filename) return;
    this.loadObjFile(this.filename).then(async () => {
      if (!gl) {
        return;
      }
      const vertexBuffer = rasterObj.gl.createBuffer();
      rasterObj.gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
      this.vertexBuffer = vertexBuffer;

      const normalBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
      this.normalBuffer = normalBuffer;

      const indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
      this.indexBuffer = indexBuffer;
      this.elements = this.indices.length;
    });

    this.loadColors(this.mtlFile).then(async () => {
      if (!gl) {
        return;
      }
      const ambientBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, ambientBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.ambientColors), gl.STATIC_DRAW);
      this.ambientBuffer = ambientBuffer;
      const diffuseBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, diffuseBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.diffuseColors), gl.STATIC_DRAW);
      this.diffuseBuffer = diffuseBuffer;
      const specularBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, specularBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.specularColors), gl.STATIC_DRAW);
      this.specularBuffer = specularBuffer;
    });
  }

  /**
   * Renders the object mesh using a specified shader program.
   * @param shader - The Shader object used for rendering.
   */
  render(shader: Shader) {
    if (
      !this.vertexBuffer ||
      !this.indexBuffer ||
      !this.normalBuffer ||
      !this.ambientBuffer ||
      !this.diffuseBuffer ||
      !this.specularBuffer
    ) {
      return;
    }

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    const positionLocation = shader.getAttributeLocation('a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
    const normalLocation = shader.getAttributeLocation('a_normal');
    this.gl.enableVertexAttribArray(normalLocation);
    this.gl.vertexAttribPointer(normalLocation, 3, this.gl.FLOAT, false, 0, 0);

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

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.drawElements(this.gl.TRIANGLES, this.elements, this.gl.UNSIGNED_SHORT, 0);

    this.gl.disableVertexAttribArray(positionLocation);
    this.gl.disableVertexAttribArray(ambientLocation);
    this.gl.disableVertexAttribArray(diffuseLocation);
    this.gl.disableVertexAttribArray(specularLocation);
    this.gl.disableVertexAttribArray(normalLocation);
  }

  /**
   * Loads the OBJ file and populates the vertex, normal, and index buffers.
   * @param filename - The path to the OBJ file to load.
   */
  async loadObjFile(filename: string) {
    const response = await fetch(filename);
    this.file = await response.text();
    const lines = this.file.split('\n');
    for (const line of lines) {
      const words = line.split(' ');
      if (words[0] === 'v') {
        const x = parseFloat(words[2]);
        const y = parseFloat(words[3]);
        const z = parseFloat(words[4]);
        let vertex = new Vector(x, y, z, 1);
        this.vertices.push(x, y, z);
      } else if (words[0] === 'vt') {
        const u = parseFloat(words[1]);
        const v = parseFloat(words[2]);
        this.uvCoords.push(u);
        this.uvCoords.push(v);
      } else if (words[0] === 'vn') {
        const nx = parseFloat(words[1]);
        const ny = parseFloat(words[2]);
        const nz = parseFloat(words[3]);
        this.normals.push(nx);
        this.normals.push(ny);
        this.normals.push(nz);
      } else if (words[0] === 'f') {
        const faceVertices = [];
        const faceTexCoords = [];
        const faceNormals = [];
        for (let i = 1; i < words.length - 1; i++) {
          const indices = words[i].split('/');
          faceVertices.push(parseInt(indices[0]) - 1); // Vertex index
          if (indices[1]) {
            faceTexCoords.push(parseInt(indices[1]) - 1); // Texture coordinate index
          }
          if (indices[2]) {
            faceNormals.push(parseInt(indices[2]) - 1); // Normal index
          }
        }
        // Store the indices in their respective arrays
        this.indices.push(...faceVertices);
        this.textureIndices.push(...faceTexCoords);
        this.normalIndices.push(...faceNormals);
      } else if (words[0] === 's') {
        // Handle smoothing groups
      }
    }
  }

  /**
   * Loads material colors from an MTL file and populates the ambient, diffuse, and specular color buffers.
   * @param filename - The path to the MTL file for material properties.
   */
  async loadColors(filename: string) {
    const response = await fetch(filename);
    await this.fillColorArray(response);
  }

  /**
   * Fills the color arrays from the response of the MTL file.
   * @param response - The Response object containing MTL file data.
   */
  async fillColorArray(response: Response) {
    this.file = await response.text();
    const lines = this.file.split('\n');
    let ambientColors = [];
    let diffuseColors = [];
    let specularColors = [];

    for (const line of lines) {
      const words = line.split(' ');
      if (words[0] === '\tKa') {
        const colorR = parseFloat(words[1]);
        const colorG = parseFloat(words[2]);
        const colorB = parseFloat(words[3]);

        ambientColors.push(colorR);
        ambientColors.push(colorG);
        ambientColors.push(colorB);
      }
      if (words[0] === '\tKd') {
        const colorR = parseFloat(words[1]);
        const colorG = parseFloat(words[2]);
        const colorB = parseFloat(words[3]);

        diffuseColors.push(colorR);
        diffuseColors.push(colorG);
        diffuseColors.push(colorB);
      }
      if (words[0] === '\tKs') {
        const colorR = parseFloat(words[1]);
        const colorG = parseFloat(words[2]);
        const colorB = parseFloat(words[3]);

        specularColors.push(colorR);
        specularColors.push(colorG);
        specularColors.push(colorB);
      }
    }
    //check if only one color or colors per vertex have been passed
    if (ambientColors.length === 3 || ambientColors.length != this.vertices.length) {
      for (let i = 0; i < this.vertices.length; i++) {
        this.ambientColors.push(ambientColors[0]);
        this.ambientColors.push(ambientColors[1]);
        this.ambientColors.push(ambientColors[2]);
      }
    } else {
      this.ambientColors = ambientColors;
    }
    if (diffuseColors.length === 3 || diffuseColors.length != this.vertices.length) {
      for (let i = 0; i < this.vertices.length; i++) {
        this.diffuseColors.push(diffuseColors[0]);
        this.diffuseColors.push(diffuseColors[1]);
        this.diffuseColors.push(diffuseColors[2]);
      }
    } else {
      this.diffuseColors = diffuseColors;
    }
    if (specularColors.length === 3 || specularColors.length != this.vertices.length) {
      for (let i = 0; i < this.vertices.length; i++) {
        this.specularColors.push(specularColors[0]);
        this.specularColors.push(specularColors[1]);
        this.specularColors.push(specularColors[2]);
      }
    } else {
      this.specularColors = specularColors;
    }
  }

  /**
   * Calculates the intersection of the object mesh with the given ray
   * @param ray The ray to intersect with
   * @return The intersection if there is one, null if there is none
   */
  intersect(ray: Ray, material: Material = null): Intersection | null {
    for (let i = 0; i < this.indices.length; i += 3) {
      const index1 = this.indices[i];
      const index2 = this.indices[i + 1];
      const index3 = this.indices[i + 2];

      let v1x = this.vertices[index1 * 3];
      let v1y = this.vertices[index1 * 3 + 1];
      let v1z = this.vertices[index1 * 3 + 2];
      const vertex1 = new Vector(v1x, v1y, v1z);

      let v2x = this.vertices[index2 * 3];
      let v2y = this.vertices[index2 * 3 + 1];
      let v2z = this.vertices[index2 * 3 + 2];
      const vertex2 = new Vector(v2x, v2y, v2z);

      let v3x = this.vertices[index3 * 3];
      let v3y = this.vertices[index3 * 3 + 1];
      let v3z = this.vertices[index3 * 3 + 2];
      const vertex3 = new Vector(v3x, v3y, v3z);

      const colorR = this.ambientColors[index1];
      const colorG = this.ambientColors[index2];
      const colorB = this.ambientColors[index3];
      let color1 = new Vector(
        this.ambientColors[index1 * 3],
        this.ambientColors[index1 * 3 + 1],
        this.ambientColors[index1 * 3 + 2]
      );
      let color2 = new Vector(
        this.ambientColors[index2 * 3],
        this.ambientColors[index2 * 3 + 1],
        this.ambientColors[index2 * 3 + 2]
      );
      let color3 = new Vector(
        this.ambientColors[index3 * 3],
        this.ambientColors[index3 * 3 + 1],
        this.ambientColors[index3 * 3 + 2]
      );

      let normal1 = new Vector(
        this.normals[index1 * 3],
        this.normals[index1 * 3 + 1],
        this.normals[index1 * 3 + 2]
      );
      let normal2 = new Vector(
        this.normals[index2 * 3],
        this.normals[index2 * 3 + 1],
        this.normals[index2 * 3 + 2]
      );
      let normal3 = new Vector(
        this.normals[index3 * 3],
        this.normals[index3 * 3 + 1],
        this.normals[index3 * 3 + 2]
      );
      const color = new Vector(colorR, colorG, colorB);

      const triangle = new Triangle(vertex1, vertex2, vertex3, null, [color1, color2, color3], null, [
        normal1,
        normal2,
        normal3
      ]);

      const intersection = triangle.intersect(ray);
      if (intersection) {
        return intersection;
      }
    }

    return null;
  }
}

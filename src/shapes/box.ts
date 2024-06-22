import Vector from '../math/vector';
import Material from '../renderer/material';
import Shader from '../renderer/rasterizer/shader';
import Intersection from '../renderer/raytracer/intersection';
import Ray from '../renderer/raytracer/ray';
import { BoxNode, PyramidNode, SphereNode } from '../scene/nodes/nodes';
import Triangle from './triangle';

/**
 * Class representing a box
 */
export default class Box {
  /**
   * The box's vertices
   */
  vertices: Array<Vector>;

  /**
   * The indices of the vertices that together form the faces of the box
   */
  indices: Array<number>;
  colors: Array<Vector>;

  /**
   * The buffer containing the box's vertices
   */
  vertexBuffer: WebGLBuffer;

  /**
   * The indices describing which vertices form a triangle
   */
  indexBuffer: WebGLBuffer;

  /**
   * The normals on the surface at each vertex location
   */
  normalBuffer: WebGLBuffer;

  /**
   * The color of each vertex
   */
  colorBuffer: WebGLBuffer;

  /**
   * The amount of indices
   */
  elements: number;

  /**
   * The ambient colors of the box
   */
  ambientColors: number[];

  /**
   * The diffuse colors of the box
   */
  diffuseColors: number[];

  /**
   * The specular colors of the box
   */
  specularColors: number[];

  /**
   * The normals of the box
   */
  normals: number[];

  /**
   * The ambient buffer
   */
  ambientBuffer: WebGLBuffer;

  /**
   * The diffuse buffer
   */
  diffuseBuffer: WebGLBuffer;

  /**
   * The specular buffer
   */
  specularBuffer: WebGLBuffer;

  /**
   * Creates an axis aligned box
   *
   *   6----7
   *  /|   /|   2 = maxPoint
   * 3----2 |   5 = minPoint
   * | 5--|-4   Looking into negative z direction
   * |/   |/
   * 0----1
   * @param gl The WebGL2RenderingContext
   * @param minPoint The minimum Point
   * @param maxPoint The maximum Point
   * @param material The material of the box (default is "grey" material)
   */
  constructor(
    private gl: WebGL2RenderingContext,
    minPoint: Vector,
    maxPoint: Vector,
    public material: Material = Material.simply['grey']
  ) {
    const mi = minPoint;
    const ma = maxPoint;
    // 8 Eckpunkte (Vertices)
    this.vertices = [
      new Vector(mi.x, mi.y, ma.z, 1),
      new Vector(ma.x, mi.y, ma.z, 1),
      new Vector(ma.x, ma.y, ma.z, 1),
      new Vector(mi.x, ma.y, ma.z, 1),
      new Vector(ma.x, mi.y, mi.z, 1),
      new Vector(mi.x, mi.y, mi.z, 1),
      new Vector(mi.x, ma.y, mi.z, 1),
      new Vector(ma.x, ma.y, mi.z, 1)
    ];

    //12 dreiecke für eine box (6*2)
    //Reihenfolge ist wichtig -> gegen den Uhrzeigersinn (mathematisch positiver Sinne)
    this.indices = [
      0, 1, 2, 2, 3, 0, //front
      4, 5, 6, 6, 7, 4, //back
      1, 4, 7, 7, 2, 1, //right
      3, 2, 7, 7, 6, 3, //top
      5, 0, 3, 3, 6, 5, //left
      5, 4, 1, 1, 0, 5 //bottom
    ];

    const numVertices = this.vertices.length;

    this.ambientColors = [];
    this.diffuseColors = [];
    this.specularColors = [];

    this.normals = [];

    //Source: Chat GPT (lines 138-169)
    for (let vertexIndex = 0; vertexIndex < numVertices; vertexIndex++) {
      const vertex = this.vertices[vertexIndex];
      const vertexPosition = vertex.data.slice(0, 3);
      // Compute normals based on face orientation
      const normalX = vertexPosition[0] > mi.x + (ma.x - mi.x) / 2 ? 1 : -1;
      const normalY = vertexPosition[1] > mi.y + (ma.y - mi.y) / 2 ? 1 : -1;
      const normalZ = vertexPosition[2] > mi.z + (ma.z - mi.z) / 2 ? 1 : -1;

      const interpolatedAmbient = [material.ambient.x, material.ambient.y, material.ambient.z];
      const interpolatedDiffuse = [material.diffuse.x, material.diffuse.y, material.diffuse.z];
      const interpolatedSpecular = [material.specular.x, material.specular.y, material.specular.z];
      // Normalize the normal vector
      const normalLength = Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ);
      const interpolatedNormal = [normalX / normalLength, normalY / normalLength, normalZ / normalLength];
      this.ambientColors.push(...interpolatedAmbient);
      this.diffuseColors.push(...interpolatedDiffuse);
      this.specularColors.push(...interpolatedSpecular);
      this.normals.push(...interpolatedNormal);
    }

    if (!gl) {
      return;
    }

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.vertices.flatMap((v) => v.data.slice(0, 3))),
      gl.STATIC_DRAW
    );
    this.vertexBuffer = vertexBuffer;

    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this.indices), gl.STATIC_DRAW);
    this.indexBuffer = indexBuffer;

    const normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.normals), gl.STATIC_DRAW);
    this.normalBuffer = normalBuffer;
    this.elements = this.indices.length;

    const ambientBuffer = gl.createBuffer();
    const diffuseBuffer = gl.createBuffer();
    const specularBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, ambientBuffer);
    if (material.colorPerVertex && material.colorPerVertex.length === this.vertices.length) {
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(material.colorPerVertex.flatMap((v) => v.data.slice(0, 3))),
        gl.STATIC_DRAW
      );
    } else {
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.ambientColors), gl.STATIC_DRAW);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, diffuseBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.diffuseColors), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, specularBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.specularColors), gl.STATIC_DRAW);

    this.ambientBuffer = ambientBuffer;
    this.diffuseBuffer = diffuseBuffer;
    this.specularBuffer = specularBuffer;
  }

  /**
   * Calculates the intersection of the Box with the given ray
   * @param ray The ray to intersect with
   * @param material The material to use for intersection (optional)
   * @param node The node to associate with the box (optional)
   * @return The intersection if there is one, null if there is none
   */
  intersect(
    ray: Ray,
    material: Material = null,
    node?: BoxNode | SphereNode | PyramidNode
  ): Intersection | null {
    let closestIntersection: Intersection | null = null;

    for (let i = 0; i < this.indices.length; i += 3) {
      const index0 = this.indices[i];
      const index1 = this.indices[i + 1];
      const index2 = this.indices[i + 2];

      const vertex0 = this.vertices[index0];
      const vertex1 = this.vertices[index1];
      const vertex2 = this.vertices[index2];
      let triangle = new Triangle(vertex0, vertex1, vertex2);
      let color;
      if (material && !material.colorPerVertex) {
        color = material.ambient;
        triangle = new Triangle(vertex0, vertex1, vertex2, color);
      } else if (material) {
        let colorsPerVertex = [
          material.colorPerVertex[index0],
          material.colorPerVertex[index1],
          material.colorPerVertex[index2]
        ];
        let normal1 = new Vector(
          this.normals[index0 * 3],
          this.normals[index0 * 3 + 1],
          this.normals[index0 * 3 + 2]
        );
        let normal2 = new Vector(
          this.normals[index1 * 3],
          this.normals[index1 * 3 + 1],
          this.normals[index1 * 3 + 2]
        );
        let normal3 = new Vector(
          this.normals[index2 * 3],
          this.normals[index2 * 3 + 1],
          this.normals[index2 * 3 + 2]
        );
        let normalsPerVertex = [normal1, normal2, normal3];
        triangle = new Triangle(vertex0, vertex1, vertex2, null, colorsPerVertex, material, normalsPerVertex);
      }
      const intersection = triangle.intersect(ray);
      if (intersection) {
        if (!closestIntersection || intersection.t < closestIntersection.t) {
          closestIntersection = intersection;
        }
      }
    }

    return closestIntersection;
  }

  /**
   * Renders the box using a shader
   * @param shader The shader used to render
   */
  render(shader: Shader) {
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

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.normalBuffer);
    const normalLocation = shader.getAttributeLocation('a_normal');
    this.gl.enableVertexAttribArray(normalLocation);
    this.gl.vertexAttribPointer(normalLocation, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    this.gl.drawElements(this.gl.TRIANGLES, this.elements, this.gl.UNSIGNED_SHORT, 0);

    // Disable vertex attribute arrays
    this.gl.disableVertexAttribArray(positionLocation);
    this.gl.disableVertexAttribArray(ambientLocation);
    this.gl.disableVertexAttribArray(diffuseLocation);
    this.gl.disableVertexAttribArray(specularLocation);
  }
}

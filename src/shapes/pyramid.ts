import Vector from '../math/vector';
import Material from '../renderer/material';
import Shader from '../renderer/rasterizer/shader';
import Intersection from '../renderer/raytracer/intersection';
import Ray from '../renderer/raytracer/ray';
import Triangle from './triangle';

/**
 * Class representing a pyramid
 */
export default class Pyramid {
  /**
   * The Pyramids vertices
   */
  vertices: Array<Vector>;

  /**
   * The indices of the vertices that together form the faces of the Pyramid
   */
  indices: Array<number>;
  normals: Array<Vector>;
  colors: [];

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
   * The amount of indices
   */
  elements: number;

  /**
   * Creates a pyramid
   *
   * @param gl The WebGL2RenderingContext
   * @param apex The apex (top) vertex of the pyramid
   * @param baseVertices The vertices of the pyramid's base
   * @param material The material of the pyramid (default is "grey" material)
   */
  constructor(
    private gl: WebGL2RenderingContext,
    apex: Vector,
    baseVertices: Array<Vector>,
    public material: Material = Material.simply['grey']
  ) {
    this.vertices = [...baseVertices, apex]; // Append apex as the last vertex

    // Compute pyramid attributes

    this.indices = [
      4, 3, 1, // front
      4, 2, 0, // back
      4, 1, 2, // right
      4, 0, 3, // left
      2, 3, 0, 2, 1, 3 // base
    ];

    //this.colors = Array.from({ length: this.vertices.length }, () => new Vector(1, 1, 0, 1)); // Yellow color for all vertices
    const numVertices = this.vertices.length;
    const mi = baseVertices[0];
    const ma = baseVertices[2];

    const ambientColors = [];
    const diffuseColors = [];
    const specularColors = [];
    this.normals = [];

    for (let vertexIndex = 0; vertexIndex < numVertices; vertexIndex++) {
      const interpolatedAmbient = [material.ambient.x, material.ambient.y, material.ambient.z];
      const interpolatedDiffuse = [material.diffuse.x, material.diffuse.y, material.diffuse.z];
      const interpolatedSpecular = [material.specular.x, material.specular.y, material.specular.z];

      ambientColors.push(...interpolatedAmbient);
      diffuseColors.push(...interpolatedDiffuse);
      specularColors.push(...interpolatedSpecular);
    }
    for (let i = 0; i < this.vertices.length; i++) {
      this.normals.push(new Vector(0));
    }
    for (let i = 0; i < this.indices.length; i += 3) {
      const index0 = this.indices[i];
      const index1 = this.indices[i + 1];
      const index2 = this.indices[i + 2];

      const vertex0 = this.vertices[index0];
      const vertex1 = this.vertices[index1];
      const vertex2 = this.vertices[index2];

      // Calculate the normal of the triangle formed by these vertices
      const normal = vertex1.sub(vertex0).cross(vertex2.sub(vertex0)).normalize();

      // Duplicate the normal for each vertex in the triangle
      this.normals[index0] = this.normals[index0].add(normal);
      this.normals[index1] = this.normals[index1].add(normal);
      this.normals[index2] = this.normals[index2].add(normal);
    }
    for (let i = 0; i < this.normals.length; i++) {
      this.normals[i] = this.normals[i].normalize();
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
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(this.normals.flatMap((v) => v.data.slice(0, 3))),
      gl.STATIC_DRAW
    );
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
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ambientColors), gl.STATIC_DRAW);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, diffuseBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(diffuseColors), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, specularBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(specularColors), gl.STATIC_DRAW);

    this.ambientBuffer = ambientBuffer;
    this.diffuseBuffer = diffuseBuffer;
    this.specularBuffer = specularBuffer;
  }

  /**
   * Calculate the surface normal of a side of the pyramid.
   *
   * @param vertex1 The index of the first vertex of the side.
   * @param vertex2 The index of the second vertex of the side.
   * @param baseVertices The vertices of the pyramid's base.
   * @param apex The apex (top) vertex of the pyramid.
   * @returns The surface normal of the side.
   */
  calcSideNormal(vertex1: number, vertex2: number, baseVertices: Array<Vector>, apex: Vector) {
    const v0 = baseVertices[vertex1];
    const v1 = baseVertices[vertex2];
    const v2 = apex;
    const triangle = new Triangle(v0, v1, v2);
    return triangle.surfaceNormal;
  }

  /**
   * Calculate the average of a set of vectors.
   *
   * @param normals An array of vectors to calculate the average from.
   * @returns The average vector.
   */
  calcVectorsAvg(normals: Array<Vector>) {
    // Summiere alle Vektoren in v0Normals und normalisiere die Summe (reduce geht alle Werte im Array einzeln durch)
    let sum = normals.reduce((sum, vector) => sum.add(vector), new Vector(0, 0, 0)).normalize();
    //return sum.div(normals.length);
    return sum;
  }

  /**
   * Find the intersection between a ray and the pyramid.
   *
   * @param ray The ray to intersect with the pyramid.
   * @param material The material for the intersection (optional).
   * @returns An Intersection object or null if no intersection is found.
   */
  intersect(ray: Ray, material: Material = null): Intersection | null {
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
        let normal1 = this.normals[index0];
        let normal2 = this.normals[index1];
        let normal3 = this.normals[index2];
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
   * Render the pyramid using a shader.
   *
   * @param shader The shader to use for rendering.
   */
  render(shader: Shader) {
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexBuffer);
    const positionLocation = shader.getAttributeLocation('a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 3, this.gl.FLOAT, false, 0, 0);

    // Bind and enable color buffers
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

import Vector from '../math/vector';
import Material from '../renderer/material';
import Shader from '../renderer/rasterizer/shader';
import Intersection from '../renderer/raytracer/intersection';
import Ray from '../renderer/raytracer/ray';

/**
 * A class representing a sphere
 */
export default class Sphere {
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
   * Creates a new Sphere with center and radius.
   *
   * @param gl - The WebGL2RenderingContext for rendering.
   * @param center - The center of the Sphere. Default is (0, 0, 0, 1).
   * @param radius - The radius of the Sphere. Default is 0.5.
   * @param material - The material of the Sphere. Default is Material.simply["red"].
   */
  constructor(
    private gl: WebGL2RenderingContext,
    public center: Vector = new Vector(0, 0, 0, 1),
    public radius: number = 0.5,
    public material: Material = Material.simply['red']
  ) {
    let vertices = [];
    let indices = [];
    let normals = [];

    let ambientColors = [];
    let diffuseColors = [];
    let specularColors = [];

    if (!gl) {
      return;
    }

    let ringsize = 30;
    for (let ring = 0; ring < ringsize; ring++) {
      for (let ring2 = 0; ring2 < ringsize; ring2++) {
        let theta = (ring * Math.PI * 2) / ringsize;
        let phi = (ring2 * Math.PI * 2) / ringsize;
        let x = radius * Math.sin(theta) * Math.cos(phi) + center.x;
        let y = radius * Math.sin(theta) * Math.sin(phi) + center.y;
        let z = radius * Math.cos(theta) + center.z;
        vertices.push(x);
        vertices.push(y);
        vertices.push(z);

        let normal = new Vector(x, y, z, 1).sub(center).normalize();
        normals.push(normal.x);
        normals.push(normal.y);
        normals.push(normal.z);

        ambientColors.push(material.ambient.x);
        ambientColors.push(material.ambient.y);
        ambientColors.push(material.ambient.z);

        diffuseColors.push(material.diffuse.x);
        diffuseColors.push(material.diffuse.y);
        diffuseColors.push(material.diffuse.z);

        specularColors.push(material.specular.x);
        specularColors.push(material.specular.y);
        specularColors.push(material.specular.z);
      }
    }

    for (let ring = 0; ring < ringsize / 2; ring++) {
      for (let ring2 = 0; ring2 < ringsize; ring2++) {
        indices.push(ring * ringsize + ring2);
        indices.push((ring + 1) * ringsize + ring2);
        indices.push(ring * ringsize + ((ring2 + 1) % ringsize));

        indices.push(ring * ringsize + ((ring2 + 1) % ringsize));
        indices.push((ring + 1) * ringsize + ring2);
        indices.push((ring + 1) * ringsize + ((ring2 + 1) % ringsize));
      }
    }

    const vertexBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(vertices), this.gl.STATIC_DRAW);
    this.vertexBuffer = vertexBuffer;
    const indexBuffer = gl.createBuffer();
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), this.gl.STATIC_DRAW);
    this.indexBuffer = indexBuffer;
    const normalBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, normalBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(normals), this.gl.STATIC_DRAW);
    this.normalBuffer = normalBuffer;
    this.elements = indices.length;

    //create colorBuffer
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
  }

  /**
   * Calculates the intersection of the sphere with the given ray.
   *
   * @param ray - The ray to intersect with.
   * @returns The intersection if there is one, null if there is none.
   */
  intersect(ray: Ray): Intersection | null {
    var x0 = ray.origin.sub(this.center);
    let c = Math.pow(x0.dot(ray.direction), 2) - x0.dot(x0) + Math.pow(this.radius, 2);
    let t;
    if (c < Number.EPSILON) {
      //zero intersections
      return null;
    } else if (c === 0) {
      t = x0.mul(-1).dot(ray.direction);
    } else {
      //one or more intersections -> if two, we take the closer one
      let t1 = -x0.dot(ray.direction) + Math.sqrt(c);
      let t2 = -x0.dot(ray.direction) - Math.sqrt(c);

      t = Math.min(t1, t2);
      if (t < 0) {
        return null;
      }
      let intersectionPoint = ray.origin.add(ray.direction.mul(t));
      let surfaceNormal = intersectionPoint.sub(this.center).normalize();
      return new Intersection(t, intersectionPoint, surfaceNormal, null);
    }
  }

  /**
   * Renders the sphere.
   *
   * @param shader - The shader used to render.
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

import Vector from '../math/vector';
import Material from '../renderer/material';
import Intersection from '../renderer/raytracer/intersection';
import Ray from '../renderer/raytracer/ray';

/**
 * A class representing a Triangle
 */
export default class Triangle {
  public direction1: Vector;
  public direction2: Vector;
  public surfaceNormal: Vector;
  /**
   * Creates a new Triangle.
   * @param v0 The 1st vertice of the vector
   * @param v1 The 2nd vertice of the vector
   * @param v2 The 3rd vertice of the vector
   * @param color The color of the Triangle
   * @param colorsPerVertex An array of colors per vertex (optional)
   * @param material The material of the Triangle (optional)
   * @param normalsPerVertex An array of normals per vertex (optional)
   */
  constructor(
    public v0: Vector,
    public v1: Vector,
    public v2: Vector,
    public color?: Vector,
    public colorsPerVertex?: Array<Vector>,
    public material?: Material,
    public normalsPerVertex?: Array<Vector>
  ) {
    this.direction1 = v1.sub(v0);
    this.direction2 = v2.sub(v0);
    this.surfaceNormal = this.direction1.normalize().cross(this.direction2.normalize()).normalize();
  }

  /**
   * Calculates the intersection of the object with the given ray.
   * @param ray The ray to intersect with
   * @return The intersection if there is one, null if there is none
   */
  intersect(ray: Ray): Intersection | null {
    if (this.surfaceNormal.dot(ray.direction) === 0) {
      //no intersection
      return null;
    }
    if (this.surfaceNormal.dot(ray.origin.sub(this.v0)) <= 0) {
      return null;
    }
    let dist = this.surfaceNormal.dot(this.v2);
    let t = (dist - this.surfaceNormal.dot(ray.origin)) / this.surfaceNormal.dot(ray.direction);
    if (t < 0) {
      //no intersection
      return null;
    } else {
      let intersectionPoint = ray.origin.add(ray.direction.mul(t));
      let color = null;

      if (this.isIntersectionInTriangle(intersectionPoint)) {
        if (this.colorsPerVertex) {
          // Source: Unity Community Forum (lines 64-71): https://discussions.unity.com/t/calculate-uv-coordinates-of-3d-point-on-plane-of-meshs-triangle/60938
          // calculate vectors from point f to vertices p1, p2 and p3:
          let f1 = this.v0.sub(intersectionPoint);
          let f2 = this.v1.sub(intersectionPoint);
          let f3 = this.v2.sub(intersectionPoint);
          // calculate the areas and factors (order of parameters doesn't matter):
          let totalArea = this.v0.sub(this.v1).cross(this.v0.sub(this.v2)).length; // main triangle area a
          let a1 = f2.cross(f3).length / totalArea; // p1's triangle area / a
          let a2 = f3.cross(f1).length / totalArea; // p2's triangle area / a
          let a3 = f1.cross(f2).length / totalArea; // p3's triangle area / a
          color = this.colorsPerVertex[0]
            .mul(a1)
            .add(this.colorsPerVertex[1].mul(a2))
            .add(this.colorsPerVertex[2].mul(a3));

          if (this.normalsPerVertex) {
            this.surfaceNormal = this.normalsPerVertex[0]
              .mul(a1)
              .add(this.normalsPerVertex[1].mul(a2))
              .add(this.normalsPerVertex[2].mul(a3))
              .normalize();
          }
        } else {
          color = this.color;
        }
        if (this.material && this.material.colorPerVertex) {
          let i = 1;
        }
        return new Intersection(t, intersectionPoint, this.surfaceNormal, null, this.material, color);
      } else {
        return null;
      }
    }
  }
  /**
   * Determines if an intersection point lies within the boundaries of this triangle.
   *
   * @param intersectionPoint - The intersection point to check.
   * @returns True if the intersection point is inside the triangle, false otherwise.
   */
  isIntersectionInTriangle(intersectionPoint: Vector): boolean {
    let edge0 = this.v1.sub(this.v0);
    let edge1 = this.v2.sub(this.v1);
    let edge2 = this.v0.sub(this.v2);

    let c0 = intersectionPoint.sub(this.v0);
    let c1 = intersectionPoint.sub(this.v1);
    let c2 = intersectionPoint.sub(this.v2);

    let k0 = edge0.cross(c0);
    let k0dot = k0.dot(this.surfaceNormal); //-> wenn positiv, dann ist es links von dem Verktor, links ist immer drin, wenn man an Kante gegen Uhrzeigersinn geht
    let k1 = edge1.cross(c1);
    let k1dot = k1.dot(this.surfaceNormal);
    let k2 = edge2.cross(c2);
    let k2dot = k2.dot(this.surfaceNormal);

    return k0dot >= 0 && k1dot >= 0 && k2dot >= 0;
  }
}

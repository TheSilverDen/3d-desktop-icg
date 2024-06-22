import Vector from '../../math/vector';
import { Node } from '../../scene/nodes/nodes';
import Material from '../material';

/**
 * Class representing a ray-sphere intersection in 3D space
 */
export default class Intersection {
  /**
   * Create an Intersection
   * @param t The distance on the ray
   * @param position The intersection position
   * @param normal The normal in the intersection
   */
  constructor(
    public t: number,
    public position: Vector,
    public normal: Vector,
    public object: Node,
    public _material?: Material,
    public color?: Vector
  ) {
    if (t) {
      this.t = t;
    } else {
      this.t = Infinity;
    }
  }

  /**
   * Determines whether this intersection
   * is closer than the other
   * @param other The other Intersection
   * @return The result
   */
  closerThan(other: Intersection): boolean {
    if (this.position.z > other.position.z) return true;
    else return false;
  }
}

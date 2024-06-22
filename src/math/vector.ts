/**
 * Class representing a vector in 4D space
 */
export default class Vector {
  /**
   * The variable to hold the vector data
   */
  data: [number, number, number, number];

  /**
   * Create a vector
   *
   * @param x The x component
   * @param y The y component
   * @param z The z component
   * @param w The w component
   */
  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
    this.data = [x, y, z, w];
  }

  /**
   * Returns the x component of the vector
   *
   * @return The x component of the vector
   */
  get x(): number {
    return this.data[0]; //TODO: needs to be replaced!
  }

  /**
   * Sets the x component of the vector to val
   *
   * @param val - The new value
   */
  set x(val: number) {
    this.data[0] = val;
  }

  /**
   * Returns the first component of the vector
   *
   * @return The first component of the vector
   */
  get r(): number {
    return this.data[0];
  }

  /**
   * Sets the first component of the vector to val
   *
   * @param val The new value
   */
  set r(val: number) {
    this.data[0] = val;
  }

  /**
   * Returns the y component of the vector
   *
   * @return The y component of the vector
   */
  get y(): number {
    return this.data[1];
  }

  /**
   * Sets the y component of the vector to val
   *
   * @param val The new value
   */
  set y(val: number) {
    this.data[1] = val;
  }

  /**
   * Returns the second component of the vector
   *
   * @return The second component of the vector
   */
  get g(): number {
    return this.data[1];
  }

  /**
   * Sets the second component of the vector to val
   *
   * @param val The new value
   */
  set g(val: number) {
    this.data[1] = val;
  }

  /**
   * Returns the z component of the vector
   *
   * @return The z component of the vector
   */
  get z(): number {
    return this.data[2];
  }

  /**
   * Sets the z component of the vector to val
   *
   * @param val The new value
   */
  set z(val: number) {
    this.data[2] = val;
  }

  /**
   * Returns the third component of the vector
   *
   * @return The third component of the vector
   */
  get b(): number {
    return this.data[2];
  }

  /**
   * Sets the third component of the vector to val
   *
   * @param val The new value
   */
  set b(val: number) {
    this.data[2] = val;
  }

  /**
   * Returns the w component of the vector
   *
   * @return The w component of the vector
   */
  get w(): number {
    return this.data[3];
  }

  /**
   * Sets the w component of the vector to val
   *
   * @param val The new value
   */
  set w(val: number) {
    this.data[3] = val;
  }

  /**
   * Returns the fourth component of the vector
   *
   * @return The fourth component of the vector
   */
  get a(): number {
    return this.data[3];
  }

  /**
   * Sets the fourth component of the vector to val
   *
   * @param val The new value
   */
  set a(val: number) {
    this.data[3] = val;
  }

  /**
   * Creates a new vector with the vector added
   *
   * @param other The vector to add
   * @return The new vector;
   */
  add(other: Vector): Vector {
    let x: number;
    let y: number;
    let z: number;
    let w: number;
    x = this.data[0] + other.x;
    y = this.data[1] + other.y;
    z = this.data[2] + other.z;
    w = this.data[3] + other.w;
    let added = new Vector(x, y, z, w);
    return added;
  }

  /**
   * Creates a new vector with the vector subtracted
   *
   * @param other The vector to subtract
   * @return The new vector
   */
  sub(other: Vector): Vector {
    let x: number;
    let y: number;
    let z: number;
    let w: number;
    x = this.data[0] - other.x;
    y = this.data[1] - other.y;
    z = this.data[2] - other.z;
    w = this.data[3] - other.w;
    let subbed = new Vector(x, y, z, w);
    return subbed;
  }

  mul(vector: Vector): Vector;
  mul(scalar: number): Vector;

  /**
   * Creates a new vector with the scalar multiplied
   *
   * @param factor The scalar to multiply or the vector to multiply
   * @return The new vector
   */
  mul(factor: number | Vector): Vector {
    if (!(factor instanceof Vector)) {
      let x: number;
      let y: number;
      let z: number;
      let w: number;
      x = this.data[0] * factor;
      y = this.data[1] * factor;
      z = this.data[2] * factor;
      w = this.data[3] * factor;
      let multiplied = new Vector(x, y, z, w);
      return multiplied;
    } else {
      let x = this.data[0] * factor.x;
      let y = this.data[1] * factor.y;
      let z = this.data[2] * factor.z;
      let w = this.data[3] * factor.w;
      let multiplied = new Vector(x, y, z, w);
      return multiplied;
    }
  }

  /**
   * Creates a new vector with the scalar divided
   *
   * @param other The scalar to divide
   * @return The new vector
   */
  div(other: number): Vector {
    let x: number;
    let y: number;
    let z: number;
    let w: number;
    x = this.data[0] / other;
    y = this.data[1] / other;
    z = this.data[2] / other;
    w = this.data[3] / other;
    let divided = new Vector(x, y, z, w);
    return divided;
  }

  /**
   * Dot product
   *
   * @param other The vector to calculate the dot /scalar product with
   * @return The result of the dot / scalar product
   */
  dot(other: Vector): number {
    let x: number;
    let y: number;
    let z: number;
    let w: number;
    x = this.data[0] * other.x;
    y = this.data[1] * other.y;
    z = this.data[2] * other.z;
    w = this.data[3] * other.w;
    let multiplied = x + y + z + w;
    return multiplied;
  }

  /**
   * Cross product
   * Calculates the cross product using the first three components
   *
   * @param other The vector to calculate the cross product with
   * @return The result of the cross product as new Vector
   */
  cross(other: Vector): Vector {
    let x: number;
    let y: number;
    let z: number;
    let w: number;
    x = this.data[1] * other.z - this.data[2] * other.y;
    y = this.data[2] * other.x - this.data[0] * other.z;
    z = this.data[0] * other.y - this.data[1] * other.x;
    w = 0;
    let crossed = new Vector(x, y, z, w);
    return crossed;
  }

  /**
   * Returns an array representation of the vector
   *
   * @return An array representation.
   */
  valueOf(): [number, number, number, number] {
    return this.data;
  }

  /**
   * Normalizes this vector in place
   *
   * @returns this vector for easier function chaining
   */
  normalize(): Vector {
    let nenner = Math.sqrt(
      Math.pow(this.data[0], 2) +
        Math.pow(this.data[1], 2) +
        Math.pow(this.data[2], 2) +
        Math.pow(this.data[3], 2)
    );
    let norm = 1 / nenner;
    this.x = this.data[0] * norm;
    this.y = this.data[1] * norm;
    this.z = this.data[2] * norm;
    this.w = this.data[3] * norm;
    return this;
  }

  /**
   * Compares the vector to another
   *
   * @param other The vector to compare to.
   * @return True if the vectors carry equal numbers. The fourth element may be both equivalent to undefined to still return true.
   */
  equals(other: Vector): boolean {
    let xDif = Math.abs(this.data[0] - other.x);
    let yDif = Math.abs(this.data[1] - other.y);
    let zDif = Math.abs(this.data[2] - other.z);
    let wDif = Math.abs(this.data[3] - other.w);
    return (
      xDif <= Number.EPSILON && yDif <= Number.EPSILON && zDif <= Number.EPSILON && wDif <= Number.EPSILON
    );
  }

  /**
   * Calculates the length of the vector
   *
   * @return The length of the vector
   */
  get length(): number {
    let laenge = Math.sqrt(
      Math.pow(this.data[0], 2) +
        Math.pow(this.data[1], 2) +
        Math.pow(this.data[2], 2) +
        Math.pow(this.data[3], 2)
    );
    return laenge;
  }
}

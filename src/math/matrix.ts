import Vector from './vector';

/**
 * Class representing a 4x4 Matrix
 */
export default class Matrix {

  /**
   * Data representing the matrix values
   */
  data: Float32Array;

  /**
   * Constructor of the matrix. Expects an array in row-major layout. Saves the data as column major internally.
   * 
   * @param mat Matrix values row major
   */
  constructor(mat: Array<number>) {
    this.data = new Float32Array(16);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        this.data[row * 4 + col] = mat[col * 4 + row];
      }
    }
  }

  /**
   * Returns the value of the matrix at position row, col
   * 
   * @param row The value's row
   * @param col The value's column
   * @return The requested value
   */
  getVal(row: number, col: number): number {
    return this.data[col * 4 + row];
  }

  /**
   * Sets the value of the matrix at position row, col
   * 
   * @param row The value's row
   * @param val The value to set to
   * @param col The value's column
   */
  setVal(row: number, col: number, val: number) {
    this.data[col * 4 + row] = val;
  }

  /**
   * Returns a matrix that represents a translation
   * 
   * @param translation The translation vector that shall be expressed by the matrix
   * @return The resulting translation matrix
   */
  static translation(translation: Vector): Matrix {
    return new Matrix([
      1, 0, 0, translation.x,
      0, 1, 0, translation.y,
      0, 0, 1, translation.z,
      0, 0, 0, 1
    ]);
  }

  /**
   * Returns a matrix that represents a rotation. The rotation axis is either the x, y or z axis (either x, y, z is 1).
   * 
   * @param axis The axis to rotate around
   * @param angle The angle to rotate
   * @return The resulting rotation matrix
   */
  static rotation(axis: Vector, angle: number): Matrix {
    if(axis.x===1){
      return new Matrix([
        1, 0, 0, 0,
        0, Math.cos(angle), -Math.sin(angle), 0,
        0, Math.sin(angle), Math.cos(angle), 0,
        0, 0, 0, 1
      ]);
    }else if(axis.y===1){
      return new Matrix([
        Math.cos(angle), 0, Math.sin(angle), 0,
        0, 1, 0, 0,
        -Math.sin(angle),0 , Math.cos(angle), 0,
        0, 0, 0, 1
      ]);
    } else if(axis.z===1){
      return new Matrix([
        Math.cos(angle), -Math.sin(angle), 0, 0,
        Math.sin(angle), Math.cos(angle), 0, 0,
        0,0 , 1, 0,
        0, 0, 0, 1
      ]);
    }

  }

  /**
   * Returns a matrix that represents a scaling
   * 
   * @param scale The amount to scale in each direction
   * @return The resulting scaling matrix
   */
  static scaling(scale: Vector): Matrix {
    return new Matrix([
      scale.x, 0, 0, 0,
      0, scale.y, 0, 0,
      0, 0, scale.z, 0,
      0, 0, 0, 1
    ]);

  }

  /**
   * Constructs a new matrix that defines a camera perspective transformation
   * Considering the position of the viewer (eye), the point being looked at (center),
   * and the upward direction (up).
   *
   * @param eye - The position of the camera (viewer).
   * @param center - The point in space the camera is looking at.
   * @param up - The upward direction for the camera.
   *
   * @returns {Matrix} The resulting perspective transformation matrix.
   */
  static lookat(eye: Vector, center: Vector, up: Vector): Matrix {
    const f = center.sub(eye).normalize();
    const s = f.cross(up).normalize();
    const u = s.cross(f);
  
    return new Matrix([
      s.x,  s.y,  s.z, -s.dot(eye),
      u.x,  u.y,  u.z, -u.dot(eye),
      -f.x, -f.y, -f.z, f.dot(eye),
      0,    0,    0,    1
    ]);
  }

  /**
   * Constructs a new matrix that represents a projection normalisation transformation
   * Transforms 3D coordinates of objects into 2D screen coordinates
   * by deforming objects according to perspective, field of view, and screen aspect effects
   * for both symmetric and asymmetric frustum.
   * 
   * @param left Camera-space left value of lower near point
   * @param right Camera-space right value of upper right far point
   * @param bottom Camera-space bottom value of lower lower near point
   * @param top Camera-space top value of upper right far point
   * @param near Camera-space near value of lower lower near point
   * @param far Camera-space far value of upper right far point
   * @return The rotation matrix
   */
  static frustum(left: number, right: number, bottom: number, top: number, near: number, far: number): Matrix {
    return new Matrix([
      (2*near)/(right-left), 0, (right+left)/(right-left), 0,
      0, (2*near)/(top-bottom), (top+bottom)/(top-bottom), 0,
      0, 0, -((far+near)/(far-near)), (-2*far*near)/(far-near),
      0, 0, -1, 0
    ]);
  }

  /**
   * Constructs a new matrix that represents a projection normalisation transformation.
   * Perspective projection creates a 3D effect by simulating depth and perspective.
   * 
   * @param fovy Field of view in y-direction
   * @param aspect Aspect ratio between width and height
   * @param near Camera-space distance to near plane
   * @param far Camera-space distance to far plane
   * @return The resulting matrix
   */
  static perspective(fovy: number, aspect: number, near: number, far: number): Matrix {
    let top = near * (Math.tan(Math.PI/180)*(fovy/2));
    let bottom = -top;
    let right = top * aspect;
    let left = -right;
    return this.frustum(left, right, bottom, top, near, far);
  }

  /**
   * Constructs a new matrix that represents an orthographic projection transformation.
   * Orthographic projection is used to create a 2D representation of a 3D scene without perspective.
   *
   * @param left - Left coordinate of the view volume.
   * @param right - Right coordinate of the view volume.
   * @param bottom - Bottom coordinate of the view volume.
   * @param top - Top coordinate of the view volume.
   * @param near - Camera-space distance to the near plane.
   * @param far - Camera-space distance to the far plane.
   * @returns The resulting orthographic projection matrix.
   */
  static orthographic(left: number, right: number, bottom: number, top: number, near: number, far: number): Matrix {
    return new Matrix([
      2/(right-left), 0, 0, -(right+left)/(right-left),
      0, 2/(top-bottom), 0, -(top+bottom)/(top-bottom),
      0, 0, -(2/(far-near)), -(far+near)/(far-near),
      0, 0, 0, 1
    ]);
  }

  /**
   * Constructs a new matrix that represents an oblique transformation.
   * Oblique transformation is used to skew or slant objects in the x and y directions.
   *
   * @param theta - Angle for the oblique transformation in the x-direction.
   * @param tau - Angle for the oblique transformation in the y-direction.
   * @returns The resulting oblique transformation matrix.
   */
  static oblique(theta: number, tau:number): Matrix {
    return new Matrix([
      1, 0, -(1/Math.tan(theta/2)), 0,
      0, 1, -(1/Math.tan(tau/2)), 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  /**
   * Returns the identity matrix
   * 
   * @return A new identity matrix
   */
  static identity(): Matrix {
    return new Matrix([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  /**
   * Matrix multiplication
   * 
   * @param other The matrix to multiply with
   * @return The result of the multiplication this*other
   */
  mul(other: Matrix): Matrix {
    let mulMatrix = new Array<number>
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        let sum = 0;
        for (let el = 0; el < 4; el++) {
          sum += this.getVal(row, el) * other.getVal(el, col);
        }
        mulMatrix[row * 4 + col] = sum;
        
      }
    }
    return new Matrix(mulMatrix);
  }

  /**
   * Matrix-vector multiplication
   * 
   * @param other The vector to multiply with
   * @return The result of the multiplication this*other
   */
  mulVec(other: Vector): Vector {
  let result = new Vector(0,0,0,0)
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let col = 0; col < 4; col++) {
        sum += this.getVal(row, col) * other.data[col];
      }
      result.data[row] = sum
    }
  return result;
  }

  /**
   * Returns the transpose of this matrix
   * 
   * @return A new matrix that is the transposed of this
   */
  transpose(): Matrix {
    let matrix = Matrix.identity()
    for(let row = 0; row<4; row++){
      for(let col = 0; col<4; col++){
        matrix.setVal(row, col, this.getVal(col, row)) 
      }
    }
    return matrix
  }

  /**
   * Debug print to console
   */
  print() {
    for (let row = 0; row < 4; row++) {
      console.log("> " + this.getVal(row, 0) +
        "\t" + this.getVal(row, 1) +
        "\t" + this.getVal(row, 2) +
        "\t" + this.getVal(row, 3)
      );
    }
  }

  /**
   * Calculates and returns the inverse of this matrix.
   *
   * @throws Throws an error if the matrix is not invertible (determinant is zero).
   * @returns The inverse matrix.
   */
  inverse(): Matrix {
    const a = this.data[0], b = this.data[1], c = this.data[2], d = this.data[3],
          e = this.data[4], f = this.data[5], g = this.data[6], h = this.data[7],
          i = this.data[8], j = this.data[9], k = this.data[10], l = this.data[11],
          m = this.data[12], n = this.data[13], o = this.data[14], p = this.data[15];
    
    const det =
      a * f * k * p - a * f * l * o - a * g * j * p + a * g * l * n +
      a * h * j * o - a * h * k * n - b * e * k * p + b * e * l * o +
      b * g * i * p - b * g * l * m - b * h * i * o + b * h * k * m +
      c * e * j * p - c * e * l * n - c * f * i * p + c * f * l * m +
      c * h * i * n - c * h * j * m - d * e * j * o + d * e * k * n +
      d * f * i * o - d * f * k * m - d * g * i * n + d * g * j * m;
    
    if (det === 0) {
      throw new Error("Matrix is not invertible");
    }
    
    const invDet = 1 / det;
    
    const inverseMatrix = [
      (f * k * p - f * l * o - g * j * p + g * l * n + h * j * o - h * k * n) * invDet,
      (-b * k * p + b * l * o + c * j * p - c * l * n - d * j * o + d * k * n) * invDet,
      (b * g * p - b * h * o - c * f * p + c * h * n + d * f * o - d * g * n) * invDet,
      (-b * g * l + b * h * k + c * f * l - c * h * j - d * f * k + d * g * j) * invDet,
      (-e * k * p + e * l * o + g * i * p - g * l * m - h * i * o + h * k * m) * invDet,
      (a * k * p - a * l * o - c * i * p + c * l * m + d * i * o - d * k * m) * invDet,
      (-a * g * p + a * h * o + c * e * p - c * h * m - d * e * o + d * g * m) * invDet,
      (a * g * l - a * h * k - c * e * l + c * h * i + d * e * k - d * g * i) * invDet,
      (e * j * p - e * l * n - f * i * p + f * l * m + h * i * n - h * j * m) * invDet,
      (-a * j * p + a * l * n + b * i * p - b * l * m - d * i * n + d * j * m) * invDet,
      (a * f * p - a * h * n - b * e * p + b * h * m + d * e * n - d * f * m) * invDet,
      (-a * f * l + a * h * j + b * e * l - b * h * i - d * e * j + d * f * i) * invDet,
      (-e * j * o + e * k * n + f * i * o - f * k * m - g * i * n + g * j * m) * invDet,
      (a * j * o - a * k * n - b * i * o + b * k * m + c * i * n - c * j * m) * invDet,
      (-a * f * o + a * g * n + b * e * o - b * g * m - c * e * n + c * f * m) * invDet,
      (a * f * k - a * g * j - b * e * k + b * g * i + c * e * j - c * f * i) * invDet,
    ];
    
    return new Matrix(inverseMatrix);
  }
}
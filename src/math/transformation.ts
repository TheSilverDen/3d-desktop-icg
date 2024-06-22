import Matrix from './matrix';
import Vector from './vector';

/**
 * The Transformation interface defines methods for obtaining transformation matrices
 * and their inverses.
 */
export interface Transformation {
  getMatrix(): Matrix;
  getInverseMatrix(): Matrix;
}

/**
 * The `MatrixTransformation` class represents a generic transformation using matrices.
 * It encapsulates a transformation matrix and its inverse matrix.
 */
export class MatrixTransformation implements Transformation {
  /**
   * The transformation matrix.
   */
  matrix: Matrix;

  /**
   * The inverse transformation matrix.
   */
  inverse: Matrix;

  /**
   * Creates a new `MatrixTransformation` instance with the given transformation matrix and its inverse.
   * @param matrix The transformation matrix.
   * @param inverse The inverse transformation matrix.
   */
  constructor(matrix: Matrix, inverse: Matrix) {
    this.matrix = matrix;
    this.inverse = inverse;
  }

  /**
   * Gets the transformation matrix.
   * @returns The transformation matrix.
   */
  getMatrix(): Matrix {
    return this.matrix;
  }

  /**
   * Gets the inverse transformation matrix.
   * @returns The inverse transformation matrix.
   */
  getInverseMatrix(): Matrix {
    return this.inverse;
  }
}

/**
 * The Translation class represents a translation transformation.
 */
export class Translation extends MatrixTransformation {
  constructor(translation: Vector) {
    super(Matrix.translation(translation), Matrix.translation(translation.mul(-1)));
  }
}

/**
 * The `Rotation` class represents a rotation transformation.
 * It extends the `MatrixTransformation` class and provides methods for setting the rotation axis and angle.
 */
export class Rotation extends MatrixTransformation {
  /**
   * The private axis of rotation.
   */
  private _axis: Vector;

  /**
   * The private angle of rotation in radians.
   */
  private _angle: number;

  /**
   * Creates a new `Rotation` instance with the specified rotation axis and angle.
   * @param axis The axis of rotation.
   * @param angle The angle of rotation in radians.
   */
  constructor(axis: Vector, angle: number) {
    super(Matrix.rotation(axis, angle), Matrix.rotation(axis, -angle));
    this._axis = axis;
    this._angle = angle;
  }

  /**
   * Sets the rotation axis.
   * @param axis The new axis of rotation.
   */
  set axis(axis: Vector) {
    this._axis = axis;
    this.recalculate();
  }

  /**
   * Sets the angle of rotation in radians.
   * @param angle The new angle of rotation in radians.
   */
  set angle(angle: number) {
    this._angle = angle;
    this.recalculate();
  }

  /**
   * Recalculates the transformation matrices based on the current rotation axis and angle.
   * This method should be called after modifying the axis or angle.
   * @private
   */
  private recalculate() {
    this.matrix = Matrix.rotation(this._axis, this._angle);
    this.inverse = Matrix.rotation(this._axis, -this._angle);
  }
}

/**
 * The Scaling class represents a scaling transformation.
 */
export class Scaling extends MatrixTransformation {
  constructor(scale: Vector) {
    super(Matrix.scaling(scale), Matrix.scaling(new Vector(1 / scale.x, 1 / scale.y, 1 / scale.z, 0)));
  }
}

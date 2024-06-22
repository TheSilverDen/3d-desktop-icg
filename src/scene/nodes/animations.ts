import { MatrixTransformation, Rotation, Scaling, Translation } from '../../math/transformation';
import Vector from '../../math/vector';
import { GroupNode } from './nodes';

/**
 * Class representing an Animation
 */
export class Animations {
  /**
   * Describes if the animation is running
   */
  active: boolean;

  scaleUp: boolean;
  translateUp: boolean;

  /**
   * Creates a new Animation object
   * @param groupNode The GroupNode to attach to
   */
  constructor(public groupNode: GroupNode) {
    this.active = true;
  }

  /**
   * Toggles the active state of the animation node
   */
  toggleActive() {
    this.active = !this.active;
  }

  /**
   * Simulates the animation
   * @param deltaT
   */

  simulate(deltaT: number) {
    // do nothing
  }
}

/**
 * Class representing a Rotation Animation
 * @extends Animations
 */
export class RotAnim extends Animations {
  /**
   * The absolute angle of the rotation
   */
  angle: number;

  /**
   * The vector to rotate around
   */
  axis: Vector;

  /**
   * Creates a new RotationNode
   * @param groupNode The group node to attach to
   * @param axis The axis to rotate around
   */
  constructor(groupNode: GroupNode, axis: Vector, angle?: number) {
    super(groupNode);
    this.axis = axis;
    this.scaleUp = true;
    this.translateUp = true;
    if (angle != undefined) {
      this.angle = angle;
    } else {
      this.angle = Math.PI / 4;
    }
  }

  /**
   * Simulates the rotation animation.
   * @param deltaT The time elapsed since the last simulation.
   */
  simulate(deltaT: number) {
    if (!this.active) {
      return;
    }

    let angle = 0.003 * deltaT * this.angle;
    //const deltaMatrix = Matrix.rotation(this.axis, angle);
    const deltaMatrix = new Rotation(this.axis, angle);
    // Aktualisiere die Transformationsmatrix des GroupNode-Objekts mit der Delta-Matrix

    const currentTransform = this.groupNode.transform.getMatrix();
    let newTransform = deltaMatrix.matrix.mul(currentTransform);

    // Aktualisiere auch die Inverse-Transformationsmatrix des GroupNode-Objekts
    const currentInverseTransform = this.groupNode.transform.getInverseMatrix();

    const newInverseTransform = currentInverseTransform.mul(deltaMatrix.inverse);

    this.groupNode.transform = new MatrixTransformation(newTransform, newInverseTransform);
  }
}
/**
 * Class representing a Translation Animation
 * @extends Animations
 */
export class TranslationAnim extends Animations {
  /**
   * The translation vector
   */
  translationVector: Vector;

  /**
   * Creates a new TranslationAnim
   * @param groupNode The group node to attach to
   * @param translationVector The translation vector to apply
   */
  constructor(groupNode: GroupNode, translationVector: Vector) {
    super(groupNode);
    this.translationVector = translationVector;
  }

  /**
   * @param iteration Number of iterations to simulate
   */
  simulate(iteration: number) {
    if (!this.active) {
      return;
    }

    const currentTransform = this.groupNode.transform.getMatrix();

    // Berechne die neue Translationsmatrix basierend auf dem gegebenen Vektor
    const translationMatrix = new Translation(this.translationVector);

    const newTransform = currentTransform.mul(translationMatrix.matrix);

    // Aktualisiere auch die Inverse-Transformationsmatrix des GroupNode-Objekts
    const currentInverseTransform = this.groupNode.transform.getInverseMatrix();
    const newInverseTransform = translationMatrix.inverse.mul(currentInverseTransform);

    this.groupNode.transform = new MatrixTransformation(newTransform, newInverseTransform);
  }
}

/**
 * Class representing a Translation Animation
 * @extends Animations
 */
export class TranslationAnim2 extends Animations {
  /**
   * The translation vector
   */
  translationAxis: Vector;
  translationFactor: number;

  /**
   * Creates a new TranslationAnim
   * @param groupNode The group node to attach to
   * @param translationAxis The axis the translation follows
   * @param translationFactor The translation factor to apply
   */
  constructor(groupNode: GroupNode, translationAxis: Vector, translationFactor: number) {
    super(groupNode);
    this.translationAxis = translationAxis;
    this.translationFactor = translationFactor;
  }

  /**
   * @param iteration Number of iterations to simulate
   */
  simulate(iteration: number) {
    if (!this.active) {
      return;
    }

    const currentTransform = this.groupNode.transform.getMatrix();

    // Berechne die neue Translationsmatrix basierend auf dem gegebenen Vektor
    let translationVector = new Vector(
      this.translationAxis.x * this.translationFactor,
      this.translationAxis.y * this.translationFactor,
      this.translationAxis.z * this.translationFactor,
      1
    );
    const translationMatrix = new Translation(translationVector);

    const newTransform = currentTransform.mul(translationMatrix.matrix);

    // Aktualisiere auch die Inverse-Transformationsmatrix des GroupNode-Objekts
    const currentInverseTransform = this.groupNode.transform.getInverseMatrix();
    const newInverseTransform = translationMatrix.inverse.mul(currentInverseTransform);

    this.groupNode.transform = new MatrixTransformation(newTransform, newInverseTransform);
  }
}

/**
 * Class representing a Scaling Animation.
 * @extends Animations
 */
export class ScaleAnim extends Animations {
  /**
   * The scaling vector
   */
  scaleVector: Vector;

  /**
   * Creates a new Scaling Animation.
   * @param groupNode The group node to attach to.
   * @param scaleVector The scaling vector to apply.
   */
  constructor(groupNode: GroupNode, scaleVector: Vector) {
    super(groupNode);
    this.scaleVector = scaleVector;
  }

  /**
   * Simulates the scaling animation for a specified number of iterations.
   * @param iteration The number of iterations to simulate.
   */
  simulate(iteration: number) {
    if (!this.active) {
      return;
    }

    const currentScale = this.groupNode.transform.getMatrix();

    // Berechne die neue Scalingmatrix basierend auf dem gegebenen Vektor
    const scaleMatrix = new Scaling(this.scaleVector);
    const newScale = currentScale.mul(scaleMatrix.matrix);

    // Aktualisiere auch die Inverse-Transformationsmatrix des GroupNode-Objekts
    const currentInverseScale = this.groupNode.transform.getInverseMatrix();
    const newInverseScale = scaleMatrix.inverse.mul(currentInverseScale);

    this.groupNode.transform = new MatrixTransformation(newScale, newInverseScale);
  }
}

/**
 * Class representing a Scaling Animation for a window.
 * @extends Animations
 */
export class WindowScaleAnim extends Animations {
  t = 0;
  startScaling: Vector;
  endScaling: Vector;
  scaleUp = true; // Start with "scaleUp" as true to begin with a larger size
  duration: number;
  currentDuration: number = 0;

  /**
   * Creates a new WindowScaleAnim.
   * @param groupNode The group node to attach to.
   * @param startScaling The initial scaling vector.
   * @param endScaling The final scaling vector.
   * @param duration The duration of the animation.
   */
  constructor(groupNode: GroupNode, startScaling: Vector, endScaling: Vector, duration: number) {
    super(groupNode);
    this.startScaling = startScaling;
    this.endScaling = endScaling;
    this.duration = duration;
  }

  /**
   * Simulates the scaling animation for a specified delta time.
   * @param deltaT The time difference for simulation.
   */
  simulate(deltaT: number) {
    // Change the matrix of the attached group node to reflect scaling
    if (!this.active) {
      return;
    }

    if (this.scaleUp) {
      this.t += deltaT * 0.002;
      if (this.t > 1) {
        this.t = 1;
        this.active = false;
        this.scaleUp = false;
      }
    } else {
      this.t -= deltaT * 0.002;
      if (this.t < 0) {
        this.t = 0;
        this.active = false;
        this.scaleUp = true;
      }
    }

    // Interpolate between start and end scaling based on the progress (this.t)
    const currentScale = this.startScaling.mul(1 - this.t).add(this.endScaling.mul(this.t));

    // Create a scaling matrix
    const scaleMatrix = new Scaling(currentScale);

    // Update the transformation matrix of the group node
    const currentTransform = this.groupNode.transform.getMatrix();
    const newTransform = scaleMatrix.matrix.mul(currentTransform);

    // Also update the inverse transformation matrix of the group node
    const currentInverseTransform = this.groupNode.transform.getInverseMatrix();
    const newInverseTransform = currentInverseTransform.mul(scaleMatrix.inverse);

    // Apply the scaling matrix to the group node
    this.groupNode.transform = new MatrixTransformation(newTransform, newInverseTransform);
  }
}

/**
 * Class representing a Translation Animation for a window.
 * @extends Animations
 */
export class WindowTranslationAnim extends Animations {
  moveUp = true;
  t = 0;
  startTranslation: Vector;
  endTranslation: Vector;

  /**
   * Creates a new WindowTranslationAnim.
   * @param groupNode The group node to attach to.
   * @param startTranslation The initial translation vector.
   * @param endTranslation The final translation vector.
   */
  constructor(groupNode: GroupNode, startTranslation: Vector, endTranslation: Vector) {
    super(groupNode);
    this.startTranslation = startTranslation;
    this.endTranslation = endTranslation;
  }

  /**
   * Simulates the translation animation for a specified delta time.
   * @param deltaT The time difference for simulation.
   */
  simulate(deltaT: number) {
    if (!this.active) {
      return;
    }

    const translationDelta = this.endTranslation.sub(this.startTranslation);

    if (this.moveUp) {
      this.t += deltaT * 0.002;
      if (this.t >= 1) {
        this.t = 1;
        this.active = false;
        this.moveUp = false;
      }
    } else {
      this.t -= deltaT * 0.002;
      if (this.t <= 0) {
        this.t = 0;
        this.active = false;
        this.moveUp = true;
      }
    }

    const currentTranslation = this.startTranslation.add(translationDelta.mul(this.t));

    // Update the transformation matrix and the inverse transformation matrix
    const translationMatrix = new Translation(currentTranslation);
    this.groupNode.transform = new MatrixTransformation(translationMatrix.matrix, translationMatrix.inverse);
  }
}

/**
 * Class representing a combined Scaling and Translation Animation for a window.
 * @extends Animations
 */
export class WindowScaleAndTranslationAnim extends Animations {
  t = 0;
  startScaling: Vector;
  endScaling: Vector;
  startTranslation: Vector;
  endTranslation: Vector;
  scaleUp = true;
  duration: number;
  currentDuration: number = 0;
  moveUp = true;

  /**
   * Creates a new WindowScaleAndTranslationAnim.
   * @param groupNode The group node to attach to.
   * @param startScaling The initial scaling vector.
   * @param endScaling The final scaling vector.
   * @param startTranslation The initial translation vector.
   * @param endTranslation The final translation vector.
   * @param duration The duration of the animation.
   */
  constructor(
    groupNode: GroupNode,
    startScaling: Vector,
    endScaling: Vector,
    startTranslation: Vector,
    endTranslation: Vector,
    duration: number
  ) {
    super(groupNode);
    this.startScaling = startScaling;
    this.endScaling = endScaling;
    this.startTranslation = startTranslation;
    this.endTranslation = endTranslation;
    this.duration = duration;
  }

  /**
   * Simulates the combined scaling and translation animation for a specified delta time.
   * @param deltaT The time difference for simulation.
   */
  simulate(deltaT: number) {
    if (!this.active) {
      return;
    }

    const scaleStepSize = 0.002;
    const translationStepSize = 0.002;

    if (this.moveUp) {
      this.t += deltaT * 0.002;
      if (this.t >= 1) {
        this.t = 1;
        this.active = false;
        this.moveUp = false;
      }
    } else {
      this.t -= deltaT * 0.002;
      if (this.t <= 0) {
        this.t = 0;
        this.active = false;
        this.moveUp = true;
      }
    }

    if (this.scaleUp) {
      this.t += deltaT * scaleStepSize;
      if (this.t > 1) {
        this.t = 1;
        this.active = false;
        this.scaleUp = false;
      }
    } else {
      this.t -= deltaT * scaleStepSize;
      if (this.t < 0) {
        this.t = 0;
        this.active = false;
        this.scaleUp = true;
      }
    }

    const currentScale = this.startScaling.mul(1 - this.t).add(this.endScaling.mul(this.t));
    const currentTranslation = this.startTranslation.mul(1 - this.t).add(this.endTranslation.mul(this.t));

    const scaleMatrix = new Scaling(currentScale);
    const translationMatrix = new Translation(currentTranslation);

    const currentTransform = this.groupNode.transform.getMatrix();
    const newTransform = scaleMatrix.matrix.mul(translationMatrix.matrix).mul(currentTransform);

    const currentInverseTransform = this.groupNode.transform.getInverseMatrix();
    const newInverseTransform = currentInverseTransform
      .mul(scaleMatrix.inverse)
      .mul(translationMatrix.inverse);

    this.groupNode.transform = new MatrixTransformation(newTransform, newInverseTransform);
  }
}

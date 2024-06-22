import Vector from '../../math/vector';
import Camera from '../../scene/camera';

/**
 * Class representing a ray
 */
export default class Ray {
  /**
   * Creates a new ray with origin and direction
   * @param origin The origin of the Ray
   * @param direction The direction of the Ray
   */
  constructor(public origin: Vector, public direction: Vector) {}

  /**
   * Creates a ray from the camera through the image plane.
   * @param x The pixel's x-position in the canvas
   * @param y The pixel's y-position in the canvas
   * @param camera The Camera
   * @return The resulting Ray
   */
  static makeRay(x: number, y: number, camera: Camera, width: number, height: number): Ray {
    // Ursprüngliche Kameraposition
    let origin = camera.origin;

    // Berechne die Richtung des Strahls
    let xd = x - (width - 1) / 2;
    let yd = (height - 1) / 2 - y;
    let zd = -(width / 2 / Math.tan(camera.alpha / 2));

    // Berechne die Pitch- und Yaw-Winkel in Radian
    let pitchRadians = camera.pitch * Math.PI;
    let yawRadians = camera.yaw * Math.PI;

    // Erzeuge eine Rotation um die Pitch-Achse (um die horizontale Achse)
    let pitchRotation = rotateAroundX(new Vector(xd, yd, zd, 0), pitchRadians);

    // Erzeuge eine Rotation um die Yaw-Achse (um die vertikale Achse)
    let yawRotation = rotateAroundY(pitchRotation, yawRadians);

    // Aktualisiere die Richtung mit den gedrehten Koordinaten
    let direction = yawRotation.normalize();

    return new Ray(origin, direction);
  }
}

//Source: ChatGPT, lines 49 - 63
function rotateAroundX(vector: Vector, angle: number) {
  let cosAngle = Math.cos(angle);
  let sinAngle = Math.sin(angle);
  let newY = vector.y * cosAngle - vector.z * sinAngle;
  let newZ = vector.y * sinAngle + vector.z * cosAngle;
  return new Vector(vector.x, newY, newZ, 0);
}

function rotateAroundY(vector: Vector, angle: number) {
  let cosAngle = Math.cos(angle);
  let sinAngle = Math.sin(angle);
  let newX = vector.x * cosAngle + vector.z * sinAngle;
  let newZ = -vector.x * sinAngle + vector.z * cosAngle;
  return new Vector(newX, vector.y, newZ, 0);
}

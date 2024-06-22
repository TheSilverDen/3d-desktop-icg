import Matrix from '../math/matrix';
import Vector from '../math/vector';
import Material from '../renderer/material';

/**
 * Represents a camera used for rendering scenes in a 3D environment.
 */
export default class Camera {
  public eye: Vector;
  public center: Vector;
  public up: Vector;
  public fovy: number;
  public aspect: number;
  public near: number;
  public far: number;
  public origin: Vector;
  public alpha: number;

  public width: number;
  public height: number;

  public yaw: number;
  public pitch: number;

  /**
   * The view matrix for the camera.
   */
  public viewMatrix: Matrix;

  /**
   * The inverse of the view matrix for the camera.
   */
  public inverseViewMatrix: Matrix;

  /**
   * The projection matrix for the camera.
   */
  public projectionMatrix: Matrix;

  /**
   * The replacement material to be used during rendering with this camera.
   */
  public replacementMaterial: Material;

  /**
   * Creates a new Camera with default settings.
   *
   * @param aspect - The aspect ratio of the camera's viewport.
   * @param eye - The position of the camera's eye.
   * @param center - The point in 3D space that the camera is looking at.
   * @param up - The up direction of the camera.
   * @param fovy - The field of view angle in degrees.
   * @param near - The near clipping plane distance.
   * @param far - The far clipping plane distance.
   * @param origin - The origin point of the camera.
   * @param alpha - The alpha angle (rotation) of the camera.
   */
  constructor(aspect: number, yaw: number = 0, pitch: number = 0) {
    this.eye = new Vector(0, 0, 0, 1);
    this.center = new Vector(0, 0, -1, 1);
    this.up = new Vector(0, 1, 0, 0);
    this.fovy = 60;
    this.aspect = aspect;
    this.near = 0.1;
    this.far = 100;
    this.origin = new Vector(0, 0, 0, 1);
    this.alpha = Math.PI / 3;
    this.yaw = yaw;
    this.pitch = pitch;

    this.viewMatrix = Matrix.identity();
    this.inverseViewMatrix = Matrix.identity();
    this.projectionMatrix = Matrix.identity();
  }

  /**
   * Sets a replacement material to be used for rendering objects with this camera.
   * When the material is null or not set, it will be ignored during rendering.
   *
   * @param material - The replacement material for this camera.
   */
  setReplacementMaterial(material: Material) {
    this.replacementMaterial = material;
  }

  /**
   * Sets the perspective matrix for this camera.
   *
   * @param matrix - The perspective matrix.
   * @note Use the Matrix class to create a perspective matrix.
   */
  setPerspective(matrix: Matrix) {
    this.projectionMatrix = matrix;
  }
}

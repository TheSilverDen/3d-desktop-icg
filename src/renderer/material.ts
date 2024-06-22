import Vector from "../math/vector";
import Shader from "./rasterizer/shader";

/**
 * This class is used to create a material for a mesh.
 * It contains parameters such as ambient, diffuse, specular, shininess,
 * alpha map, bump map, and normal map.
 */
export default class Material {
  public imagesMap: Map<string, HTMLImageElement> = null;
  public textCanvas: HTMLCanvasElement = null; // Füge das Canvas als Eigenschaft hinzu
  public textCanvasContext: CanvasRenderingContext2D = null; // Füge den Kontext des Canvas hinzu

  /**
   * Represents a material used for rendering 3D objects.
   *
   * @param ambient - The ambient color of the material.
   * @param diffuse - The diffuse color of the material.
   * @param specular - The specular color of the material.
   * @param shininess - The shininess coefficient of the material.
   * @param images - A map of texture names to their image URLs.
   * @param shader - The shader used for rendering this material.
   * @param alpha - The alpha (transparency) value of the material (optional).
   * @param colorPerVertex - An array of per-vertex colors (optional).
   */
  constructor(
    public ambient: Vector = new Vector(1, 0, 1, 1),
    public diffuse: Vector = new Vector(1, 0, 1, 1),
    public specular: Vector = new Vector(1, 0, 1, 1),
    public shininess: number = 0.5,
    public images: Map<string, string> = null,
    public shader: Shader = null,
    public alpha?: number,
    public colorPerVertex?: Array<Vector>
  ) {
    this.imagesMap = new Map<string, HTMLImageElement>();

    // Erstelle das Text-Canvas und den Kontext
    this.textCanvas = document.createElement("canvas");
    this.textCanvasContext = this.textCanvas.getContext("2d");
    this.textCanvas.width = 128; // Breite des Canvas
    this.textCanvas.height = 128; // Höhe des Canvas

    if (images) {
      images.forEach((value: string, key: string) => {
        var localImage = new Image();
        localImage.src = value;
        this.imagesMap.set(key, localImage);
      });
    }
  }

  /**
   * Sets the shader used for rendering this material.
   *
   * @param shader - The shader to set for rendering.
   * @returns This material instance with the shader set.
   */
  setShader(shader: Shader): Material {
    this.shader = shader;
    return this;
  }

  /**
   * Returns a WebGLTexture bound to the given WebGl2RenderingContext
   * When the picture is not loaded yet, it will set the texture as soon as the image is loaded
   *
   * @param gl The rendering context to bind to
   * @param texture handle to the webglTexture
   * @param type string that specifys what image to use
   * @returns a WebGLTexture or null if the image is not present
   */
  loadTexture(
    gl: WebGL2RenderingContext,
    texture: WebGLTexture,
    type: string = "primaryTexture"
  ): WebGLTexture {
    // TODO: Bind the texture to the WebGL context
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Get the image URL based on the type
    let imageKey;
    try {
      imageKey = this.images.get(type);
    } catch (e) {}

    if (!imageKey) {
      //console.warn(`Image not found for type: ${type}`);
      return null;
    }

    // Get the image based on the imageKey
    const image = this.imagesMap.get(type);

    if (!image) {
      // Image is not loaded yet, set up the onload event
      image.onload = () => {
        // Bind the texture again before configuring it
        gl.bindTexture(gl.TEXTURE_2D, texture);

        // Configure the texture parameters
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      };

      // Return null for now, the texture will be set once the image is loaded
      return null;
    }

    // If the image is already loaded, configure the texture immediately
    if (!gl) return;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // Return the texture
    return texture;
  }

  /**
   * Initializes a new WebGL texture for the material.
   *
   * @param gl - The WebGL rendering context.
   * @returns The created WebGL texture.
   */
  initTexture(gl: WebGL2RenderingContext): WebGLTexture {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      srcType,
      pixel
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    return texture;
  }

  /**
   * Updates the WebGL texture with video data.
   *
   * @param gl - The WebGL rendering context.
   * @param texture - The WebGL texture to update.
   * @param video - The HTML video element containing video data.
   */
  updateTexture(
    gl: WebGL2RenderingContext,
    texture: WebGLTexture,
    video: HTMLVideoElement
  ): void {
    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      video
    );
  }

  /**
   * Returns the materials main texture
   *
   * @param gl The rendering context to bind to
   * @param texture handle to the webglTexture
   * @returns
   */
  getMainTexture(gl: WebGL2RenderingContext, texture: WebGLTexture) {
    return this.loadTexture(gl, texture, "mainTexture");
  }

  /**
   * Returns the materials normal-map
   *
   * @param gl The rendering context to bind to
   * @param texture handle to the webglTexture
   * @returns
   */
  getNormalMap(gl: WebGL2RenderingContext, texture: WebGLTexture) {
    return this.loadTexture(gl, texture, "normalMap");
  }

  /**
   * Returns the materials alpha-map
   *
   * @param gl The rendering context to bind to
   * @param texture handle to the webglTexture
   * @returns
   */
  getAlphaMap(gl: WebGL2RenderingContext, texture: WebGLTexture) {
    return this.loadTexture(gl, texture, "alphaMap");
  }

  /**
   * Creates a new material with a single color.
   *
   * @param color - The color to use for ambient and diffuse properties.
   * @returns A new Material instance.
   */
  static fromSingleColor(vec: Vector) {
    return new Material(vec, vec, new Vector(1, 1, 1, 1), 10); // The specular color is always white, reflecing all colors.
  }

  /**
   * Creates a custom material with specified properties.
   *
   * @param ambient - The ambient color of the material.
   * @param diffuse - The diffuse color of the material.
   * @param specular - The specular color of the material.
   * @param shininess - The shininess of the material.
   * @returns A new Material instance with custom properties.
   */
  static setCustomMaterial(
    ambient: Vector,
    diffuse: Vector,
    specular: Vector,
    shininess: number
  ) {
    return new Material(ambient, diffuse, specular, shininess); // The specular color is always white, reflecing all colors.
  }

  /**
   * Creates a custom material with specified properties and per-vertex colors.
   *
   * @param ambient - The ambient color of the material.
   * @param diffuse - The diffuse color of the material.
   * @param specular - The specular color of the material.
   * @param shininess - The shininess of the material.
   * @param colors - An array of per-vertex colors.
   * @returns A new Material instance with custom properties and per-vertex colors.
   */
  static setCustomMaterialWithColor(
    ambient: Vector,
    diffuse: Vector,
    specular: Vector,
    shininess: number,
    colors: Array<Vector>
  ) {
    return new Material(
      ambient,
      diffuse,
      specular,
      shininess,
      null,
      null,
      1.0,
      colors
    ); // The specular color is always white, reflecing all colors.
  }

  /**
   * Static dictionary of materials for the mesh
   * it maps the name of the material to the material itself
   * The specular color is always white, reflecing all colors.
   * The material has no alpha, bump nor normal map. The shader is also null. If you want to use a shader, you have to set it manually.
   *
   * @param name The name of the material
   * @param material The material itself
   */
  static simply: { [name: string]: Material } = {
    red: new Material(
      new Vector(1, 0, 0, 1),
      new Vector(1, 0, 0, 1),
      new Vector(1, 1, 1, 1),
      10
    ),
    green: new Material(
      new Vector(0, 1, 0, 1),
      new Vector(0, 1, 0, 1),
      new Vector(1, 1, 1, 1),
      10
    ),
    blue: new Material(
      new Vector(0, 0, 1, 1),
      new Vector(0, 0, 1, 1),
      new Vector(1, 1, 1, 1),
      10
    ),
    yellow: new Material(
      new Vector(1, 1, 0, 1),
      new Vector(1, 1, 0, 1),
      new Vector(1, 1, 1, 1),
      10
    ),
    magenta: new Material(
      new Vector(1, 0, 1, 1),
      new Vector(1, 0, 1, 1),
      new Vector(1, 1, 1, 1),
      10
    ),
    cyan: new Material(
      new Vector(0, 1, 1, 1),
      new Vector(0, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      10
    ),
    white: new Material(
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      10
    ),
    black: new Material(
      new Vector(0, 0, 0, 1),
      new Vector(0, 0, 0, 1),
      new Vector(1, 1, 1, 1),
      10
    ),
    grey: new Material(
      new Vector(0.5, 0.5, 0.5, 1),
      new Vector(0.5, 0.5, 0.5, 1),
      new Vector(1, 1, 1, 1),
      10
    ),
    taskbar: new Material(
      new Vector(0.85, 0.65, 0.45, 1),
      new Vector(0.4, 0.4, 0.4, 1),
      new Vector(0, 0, 0, 1),
      10
    ),
    transparent: new Material(
      new Vector(0.2, 0, 0, 1),
      new Vector(0, 0, 0, 1),
      new Vector(0, 0, 0, 1),
      10,
      null,
      null,
      0.0
    ),
  };

  /**
   * Static dictionary of materials with color textures.
   * It maps the name of the material to the Material instance with color textures.
   *
   * @param name - The name of the material.
   * @param material - The Material instance.
   */
  static colortexture: { [name: string]: Material } = {
    "hci-logo": new Material(
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      10,
      new Map<string, string>([["/mainTexture", "/textures/hci-logo.png"]])
    ),
    grau: new Material(
      new Vector(0.8, 0.8, 0.8, 1),
      new Vector(0.4, 0.4, 0.4, 1),
      new Vector(1, 1, 1, 1),
      10,
      new Map<string, string>([["mainTexture", "/textures/grau.jpg"]])
    ),
    ticTacToeIcon: new Material(
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      10,
      new Map<string, string>([["mainTexture", "/textures/ticTacToeIcon.png"]])
    ),
    wallpaper: new Material(
      new Vector(0.8, 0.8, 0.8, 1),
      new Vector(0.4, 0.4, 0.4, 1),
      new Vector(1, 1, 1, 1),
      10,
      new Map<string, string>([
        ["mainTexture", "/textures/windows-xp-background.png"],
      ])
    ),
    squirrel: new Material(
      new Vector(0.8, 0.8, 0.8, 1),
      new Vector(0.4, 0.4, 0.4, 1),
      new Vector(1, 1, 1, 1),
      10,
      new Map<string, string>([["mainTexture", "/textures/squirrel.png"]])
    ),
  };

  /**
   * Static dictionary of materials with brushed textures.
   * It maps the name of the material to the Material instance with brushed textures.
   *
   * @param name - The name of the material.
   * @param material - The Material instance.
   */
  static brushed: { [name: string]: Material } = {
    alpha: new Material(
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      10,
      new Map<string, string>([
        ["mainTexture", "hci-logo.png"],
        ["alphaMap", "/textures/hci-logo-alpha.png"],
      ])
    ),
  };

  /**
   * Static dictionary of materials with alpha textures.
   * It maps the name of the material to the Material instance with alpha textures.
   *
   * @param name - The name of the material.
   * @param material - The Material instance.
   */
  static alpha: { [name: string]: Material } = {
    alpha: new Material(
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      10,
      new Map<string, string>([
        ["mainTexture", "/textures/hci-logo-alpha.png"],
        ["alphaMap", "/textures/hci-logo-alpha.png"],
      ])
    ),
    play: new Material(
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      10,
      new Map<string, string>([
        ["mainTexture", "/textures/play.png"],
        ["alphaMap", "/textures/play.png"],
      ])
    ),
    playAgain: new Material(
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      10,
      new Map<string, string>([
        ["mainTexture", "/textures/playAgain.png"],
        ["alphaMap", "/textures/playAgain.png"],
      ])
    ),
    roterKreis: new Material(
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      10,
      new Map<string, string>([
        ["mainTexture", "/textures/roterKreis.png"],
        ["alphaMap", "/textures/roterKreis.png"],
      ])
    ),
    blauesKreuz: new Material(
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      10,
      new Map<string, string>([
        ["mainTexture", "/textures/blauesKreuz.png"],
        ["alphaMap", "/textures/blauesKreuz.png"],
      ])
    ),
    closeWindow: new Material(
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      10,
      new Map<string, string>([
        ["mainTexture", "/textures/closeWindow.png"],
        ["alphaMap", "/textures/closeWindow.png"],
      ])
    ),
    fullScreen: new Material(
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      10,
      new Map<string, string>([
        ["mainTexture", "/textures/fullScreen.png"],
        ["alphaMap", "/textures/fullScreen.png"],
      ])
    ),
  };

  /**
   * Static dictionary of animated materials.
   * It maps the name of the material to the Material instance with video textures.
   *
   * @param name - The name of the material.
   * @param material - The Material instance.
   */
  static animated: { [name: string]: Material } = {
    rickroll: new Material(
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      new Vector(1, 1, 1, 1),
      10,
      new Map<string, string>([
        ["videoTexture", "/textures/Rickroll_Meme_Template-2.mov"],
      ])
    ),
  };

  /**
   * Set a custom HTML canvas as the main texture for this material.
   *
   * @param canvas - The HTML canvas element to use as the main texture.
   * @param gl - The WebGL2RenderingContext for texture configuration.
   */
  setCustomCanvasAsMainTexture(
    canvas: HTMLCanvasElement,
    gl: WebGL2RenderingContext
  ) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const imageElement = new Image();
    imageElement.src = canvas.toDataURL();

    this.images = new Map<string, string>();
    this.images.set("mainTexture", canvas.toDataURL());
    this.imagesMap.set("mainTexture", imageElement);
  }
}

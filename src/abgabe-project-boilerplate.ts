import 'bootstrap';
import 'bootstrap/scss/bootstrap.scss';
import Matrix from './math/matrix';
import { Rotation, Scaling, Translation } from './math/transformation';
import Vector from './math/vector';
import Material from './renderer/material';
import Shader from './renderer/rasterizer/shader';
import textureVertexShader from './renderer/rasterizer/shader/perspective-texture.vert';
import phongVertexShader from './renderer/rasterizer/shader/perspective.vert';
import textureFragmentShader from './renderer/rasterizer/shader/phong-texture.frag';
import videoTextureFragmentShader from './renderer/rasterizer/shader/phong-video-texture.frag';
import phongFragmentShader from './renderer/rasterizer/shader/phong.frag';
import Camera from './scene/camera';
import { RotAnim, TranslationAnim2, WindowScaleAnim, WindowTranslationAnim } from './scene/nodes/animations';
import {
  BoxNode,
  CameraNode,
  GroupNode,
  LightNode,
  LightSphereNode,
  MeshNode,
  PyramidNode,
  SphereNode,
  TextureBoxNode,
  VideoTextureBoxNode
} from './scene/nodes/nodes';
import CameraVisitor from './scene/visitor/cameravisitor';
import ClickVisitor from './scene/visitor/clickvisitor';
import LightVisitor from './scene/visitor/lightvisitor';
import { RasterSetupVisitor } from './scene/visitor/rastersetupvisitor';
import { RasterVisitor } from './scene/visitor/rastervisitor';
import RayVisitor from './scene/visitor/rayvisitor';
import VideoTextureBox from './shapes/video-texture-box';
import { changeButtontext } from './ui/ButtonChange';

/**
 * This File renders an interactive desktop scene
 */

window.addEventListener('load', () => {
  const canvasRaster = document.getElementById('rasterCanvas') as HTMLCanvasElement;
  const canvasRay = document.getElementById('rayCanvas') as HTMLCanvasElement;
  let contextGl2 = canvasRaster.getContext('webgl2');
  let context2d = canvasRay.getContext('2d', { willReadFrequently: true });

  let activeCanvas = canvasRaster;

  /**
   * Creates a new Phong shader (color texture, image  texture and video texture)
   * with the specified vertex and fragment shaders.
   * @param context The WebGL2 rendering context.
   * @param vertexShader The vertex shader source code.
   * @param fragmentShader The fragment shader source code.
   */
  const phongShader = new Shader(contextGl2, phongVertexShader, phongFragmentShader);
  const textureShader = new Shader(contextGl2, textureVertexShader, textureFragmentShader);

  const videoTextureShader = new Shader(contextGl2, textureVertexShader, videoTextureFragmentShader);

  const camera = new Camera(canvasRaster.width / canvasRaster.height);
  camera.origin.y = 0.02;

  // ---------------------------------------------------Prepare Materials for Scenegraph -----------------------------------------------------

  let pointLights = [
    new LightNode(new Vector(0.4, 0.4, 0.4, 1)), //Light Node with color
    new LightNode(new Vector(0.4, 0.4, 0.4, 1))
  ];
  let sphereLightNodes = [
    new LightSphereNode(Material.fromSingleColor(new Vector(0.5, 0.4, 0.1, 1)).setShader(phongShader)) // Shere Light with color yellow
  ];

  /**
   * Creates a canvas element with text. Is need to create a texture for text texture boxes.
   * @param text the text to be displayed on the canvas
   * @returns custom canvas with text for texture box nodes
   */

  function getTextCanvas(text: string) {
    const customCanvas = document.createElement('canvas');
    customCanvas.width = 128;
    customCanvas.height = 128;
    const customCanvasContext = customCanvas.getContext('2d');
    // Zeichne auf Canvas
    customCanvasContext.fillStyle = 'white';
    customCanvasContext.fillRect(0, 0, customCanvas.width, customCanvas.height);
    // Text
    customCanvasContext.fillStyle = 'black'; // Farbe des Textes
    customCanvasContext.font = '10px Arial black'; // Schriftart und Größe des Textes
    customCanvasContext.fillText(text, 2, 12); // Text und Position
    return customCanvas;
  }

  /**
   * Color arrays for objects which consist of multiple colors (colors per vertex)
   */
  let cubeColors = [
    new Vector(0.5, 0, 1), // Dunkles Lila
    new Vector(0.4, 0.2, 1), // Lila
    new Vector(0.3, 0.4, 1), // Hell-Lila
    new Vector(0.8, 0, 1), // Blau
    new Vector(0, 0.2, 0.8), // Blau mit etwas Grün
    new Vector(0.4, 0.2, 1), // Blau mit mehr Lila
    new Vector(0.5, 0, 1), // Blau mit viel Lila
    new Vector(0.3, 0.4, 1) // Blau mit hell lila
  ];
  let pyramidColors = [
    new Vector(0.1, 0, 0.8), // Dunkles Lila
    new Vector(0.1, 0.2, 1), // Lila
    new Vector(0.1, 0.4, 1), // Hell-Lila
    new Vector(0.2, 0.8, 0.7), // Hell-Lila
    new Vector(0.1, 0.1, 0.2) // Blau mit viel Lila
  ];

  /**
   * Initial Fields for TicTacToe Game
   */
  const ticTacToeFields = [
    //[0]
    new TextureBoxNode(Material.colortexture['grau'].setShader(textureShader)),
    //[1]
    new TextureBoxNode(Material.colortexture['grau'].setShader(textureShader)),
    //[2]
    new TextureBoxNode(Material.colortexture['grau'].setShader(textureShader)),
    //[3]
    new TextureBoxNode(Material.colortexture['grau'].setShader(textureShader)),
    //[4]
    new TextureBoxNode(Material.colortexture['grau'].setShader(textureShader)),
    //[5]
    new TextureBoxNode(Material.colortexture['grau'].setShader(textureShader)),
    //[6]
    new TextureBoxNode(Material.colortexture['grau'].setShader(textureShader)),
    //[7]
    new TextureBoxNode(Material.colortexture['grau'].setShader(textureShader)),
    //[8]
    new TextureBoxNode(Material.colortexture['grau'].setShader(textureShader))
  ];

  // ----------------------------------------- SCENEGRAPH ----------------------------------

  /**
   * Creation of the Scenegraph.
   * The Scenegraph consists of GroupNodes as inner nodes and Object nodes as leaf nodes.
   * GroupNodes represent transformations of objects (translation, scaling, rotation...)
   * Object nodes specify geometries (Spheres, Boxes, Pyramids, etc.)
   *
   * Complete and concise structure can be viewed in docs/scenegraph-overview.png
   */

  const scenegraph = new GroupNode(new Translation(new Vector(0, 0, -0.88, 0)));
  const start = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  scenegraph.add(start);

  const addedObjectsStart = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  start.add(addedObjectsStart);

  //------------------------------------------------- Lights ---------------------------------

  const light1Translation1 = new GroupNode(new Translation(new Vector(0.8, 1, 1, 0.0)));
  start.add(light1Translation1);
  const light1Translation1Scaling = new GroupNode(new Scaling(new Vector(0.6, 0.6, 0.6, 0)));
  light1Translation1.add(light1Translation1Scaling);
  const light1Translation2 = new GroupNode(new Translation(new Vector(0.5, 0, 0, 0)));
  light1Translation1Scaling.add(light1Translation2);
  const light1Scaling = new GroupNode(new Scaling(new Vector(0.1, 0.1, 0.1, 0)));
  light1Translation2.add(light1Scaling);
  light1Scaling.add(pointLights[0]);

  const light2Translation1 = new GroupNode(new Translation(new Vector(-0.3, 0.3, 0.2, 0.0)));
  start.add(light2Translation1);
  const light2Translation1Scaling = new GroupNode(new Scaling(new Vector(0.2, 0.2, 0.2, 0)));
  light2Translation1.add(light2Translation1Scaling);
  const light2Translation2 = new GroupNode(new Translation(new Vector(0.1, 0, 0, 0)));
  light2Translation1Scaling.add(light2Translation2);
  const light2Scaling = new GroupNode(new Scaling(new Vector(0.1, 0.1, 0.1, 0)));
  light2Translation2.add(light2Scaling);
  light2Scaling.add(sphereLightNodes[0]);

  const light3Translation1 = new GroupNode(new Translation(new Vector(1, -1, 1, 0.0)));
  start.add(light3Translation1);
  const light3Translation1Scaling = new GroupNode(new Scaling(new Vector(0.2, 0.2, 0.2, 0)));
  light3Translation1.add(light3Translation1Scaling);
  const light3Translation2 = new GroupNode(new Translation(new Vector(0.5, 0, 0, 0)));
  light3Translation1Scaling.add(light3Translation2);
  const light3Scaling = new GroupNode(new Scaling(new Vector(0.1, 0.1, 0.1, 0)));
  light3Translation2.add(light3Scaling);
  light3Scaling.add(pointLights[1]);

  //------------------------------------------------------- Camera -----------------------------------
  const cameraTranslation = new GroupNode(new Translation(new Vector(0, 0, 1, 0))); //z +1 weil Scenegraph -1 verschoben ist
  start.add(cameraTranslation);
  const cameraYaw = new GroupNode(new Rotation(new Vector(0, 1, 0, 0), 0));
  cameraTranslation.add(cameraYaw);
  const cameraPitch = new GroupNode(new Rotation(new Vector(1, 0, 0, 0), 0));
  cameraYaw.add(cameraPitch);
  const camNode = new CameraNode(camera);
  cameraPitch.add(camNode);

  ///------------------------------------------------------- Gemometry Nodes -----------------------------------
  //Background
  const backgroundBoxTranslation = new GroupNode(new Translation(new Vector(0, 0.2, -0.9, 0)));
  start.add(backgroundBoxTranslation);
  const backgroundBoxTranslation2 = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  backgroundBoxTranslation.add(backgroundBoxTranslation2);
  const backgroundBoxScaling = new GroupNode(new Scaling(new Vector(2, 2, 0.2, 0.2)));
  backgroundBoxTranslation2.add(backgroundBoxScaling);
  const backgroundBox = new BoxNode(
    Material.fromSingleColor(new Vector(0.2, 0.2, 0.8, 1)).setShader(phongShader)
  );
  backgroundBoxScaling.add(backgroundBox);
  const backgroundClick = function clickMethod() {
    if (clickedObj === backgroundBox) {
      setUnclicked();
    } else if (clickedObj != backgroundBox) {
      setClicked(backgroundBox);
    }
  };
  backgroundBox.clickMethod = backgroundClick;

  //----------------------------
  // Window 1
  const window1Translation1 = new GroupNode(new Translation(new Vector(0, -1, 0.3, 1)));
  start.add(window1Translation1);
  const window1Translation2 = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  window1Translation1.add(window1Translation2);
  const window1Scaling1 = new GroupNode(new Scaling(new Vector(0.45, 0.45, 0.0001, 1)));
  window1Translation2.add(window1Scaling1);
  const materialWindowSphere = Material.setCustomMaterial(
    new Vector(1, 1, 1, 1),
    new Vector(1, 1, 1, 1),
    new Vector(1, 1, 1, 1),
    10
  );
  materialWindowSphere.setCustomCanvasAsMainTexture(getTextCanvas('Sphere'), contextGl2);
  const window1 = new TextureBoxNode(materialWindowSphere.setShader(textureShader));
  const window1Click = function clickMethod() {
    getWindowClickMethod(window1, window1Translation1);
  };
  window1.clickMethod = window1Click;
  window1Scaling1.add(window1);

  //Close Button Window 1
  const tinyCube1Translation = new GroupNode(new Translation(new Vector(0.185, 0.178, 0.05, 0)));
  window1Translation2.add(tinyCube1Translation);
  const tinyCube1Scaling = new GroupNode(new Scaling(new Vector(0.05, 0.05, 0.001, 0.2)));
  tinyCube1Translation.add(tinyCube1Scaling);
  const window1CloseCube = new TextureBoxNode(Material.alpha['closeWindow'].setShader(textureShader));
  const window1CloseCubeClick = function clickMethod() {
    windowFunction(0);
  };
  window1CloseCube.clickMethod = window1CloseCubeClick;
  tinyCube1Scaling.add(window1CloseCube);

  //Sphere in Window 1
  const sphereTranslation1 = new GroupNode(new Translation(new Vector(0, 0, 0.05, 0)));
  window1Translation2.add(sphereTranslation1);
  const sphereTranslation1Scaling = new GroupNode(new Scaling(new Vector(0.5, 0.5, 0.5, 0)));
  sphereTranslation1.add(sphereTranslation1Scaling);
  const sphereTranslation2 = new GroupNode(new Translation(new Vector(0, 0, -0.1, 0)));
  sphereTranslation1Scaling.add(sphereTranslation2);
  const sphereScaling = new GroupNode(new Scaling(new Vector(0.19, 0.19, 0.19, 0)));
  sphereTranslation2.add(sphereScaling);
  const sphere = new SphereNode(
    Material.fromSingleColor(new Vector(0.8, 0.4, 0.1, 1)).setShader(phongShader)
  );
  const sphereClick = function clickMethod() {
    if (clickedObj === sphere) {
      setUnclicked();
    } else if (clickedObj != sphere) {
      setClicked(sphere);
    }
  };
  sphere.clickMethod = sphereClick;
  sphereScaling.add(sphere);

  //-----------------------------
  //Window 2
  const window2Translation1 = new GroupNode(new Translation(new Vector(-0.2, -1, 0.2, 1)));
  start.add(window2Translation1);
  const window2Translation2 = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  window2Translation1.add(window2Translation2);
  const window2Scaling1 = new GroupNode(new Scaling(new Vector(0.5, 0.5, 0.0001, 1)));
  window2Translation2.add(window2Scaling1);
  const materialWindowPyramid = Material.setCustomMaterial(
    new Vector(1, 1, 1, 1),
    new Vector(1, 1, 1, 1),
    new Vector(1, 1, 1, 1),
    10
  );
  materialWindowPyramid.setCustomCanvasAsMainTexture(getTextCanvas('Pyramid'), contextGl2);
  const window2 = new TextureBoxNode(materialWindowPyramid.setShader(textureShader));
  const window2Click = function clickMethod() {
    getWindowClickMethod(window2, window2Translation1);
  };
  window2.clickMethod = window2Click;
  window2Scaling1.add(window2);

  //Close Button Window 2
  const tinyCube2Translation = new GroupNode(new Translation(new Vector(0.22, 0.21, 0, 0)));
  window2Translation2.add(tinyCube2Translation);
  const tinyCube2Scaling = new GroupNode(new Scaling(new Vector(0.05, 0.05, 0.001, 0.2)));
  tinyCube2Translation.add(tinyCube2Scaling);
  const window2CloseCube = new TextureBoxNode(Material.alpha['closeWindow'].setShader(textureShader));
  const window2CloseCubeClick = function clickMethod() {
    windowFunction(2);
  };
  window2CloseCube.clickMethod = window2CloseCubeClick;
  tinyCube2Scaling.add(window2CloseCube);

  //Pyramid in Window 2
  const pyramid1translation1 = new GroupNode(new Translation(new Vector(0, 0, 0.1, 0)));
  window2Translation2.add(pyramid1translation1);
  const pyramid1translation2 = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  pyramid1translation1.add(pyramid1translation2);
  const pyramid1scaling2 = new GroupNode(new Scaling(new Vector(0.2, 0.2, 0.2, 0.2)));
  pyramid1translation2.add(pyramid1scaling2);
  const pyramid = new PyramidNode(
    Material.setCustomMaterialWithColor(
      new Vector(0.6, 0.1, 0.1, 1),
      new Vector(0.8, 0.8, 0.8, 1),
      new Vector(1, 1, 1, 1),
      30,
      pyramidColors
    ).setShader(phongShader)
  );
  const pyramidClick = function clickMethod() {
    if (clickedObj === pyramid) {
      setUnclicked();
    } else if (clickedObj != pyramid) {
      setClicked(pyramid);
    }
  };
  pyramid.clickMethod = pyramidClick;
  pyramid1scaling2.add(pyramid);

  // -------------

  //Window 3
  const window3Translation1 = new GroupNode(new Translation(new Vector(0.2, -1, 0.2, 1)));
  start.add(window3Translation1);
  const window3Translation2 = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  window3Translation1.add(window3Translation2);
  const window3Scaling1 = new GroupNode(new Scaling(new Vector(0.5, 0.5, 0.0001, 1)));
  window3Translation2.add(window3Scaling1);
  const materialWindowCube = Material.setCustomMaterial(
    new Vector(1, 1, 1, 1),
    new Vector(1, 1, 1, 1),
    new Vector(1, 1, 1, 1),
    10
  );
  materialWindowCube.setCustomCanvasAsMainTexture(getTextCanvas('Cube'), contextGl2);
  const window3 = new TextureBoxNode(materialWindowCube.setShader(textureShader));
  const window3Click = function clickMethod() {
    getWindowClickMethod(window3, window3Translation1);
  };
  window3.clickMethod = window3Click;
  window3Scaling1.add(window3);

  //Close Button Window 3
  const tinyCube3Translation = new GroupNode(new Translation(new Vector(0.2, 0.21, 0.05, 0)));
  window3Translation2.add(tinyCube3Translation);
  const tinyCube3Scaling = new GroupNode(new Scaling(new Vector(0.05, 0.05, 0.001, 0.2)));
  tinyCube3Translation.add(tinyCube3Scaling);
  const window3CloseCube = new TextureBoxNode(Material.alpha['closeWindow'].setShader(textureShader));
  const window3CloseCubeClick = function clickMethod() {
    windowFunction(3);
  };
  window3CloseCube.clickMethod = window3CloseCubeClick;
  tinyCube3Scaling.add(window3CloseCube);

  //Cube in Window 3
  const cubeTranslation1 = new GroupNode(new Translation(new Vector(0, 0, 0.05, 0)));
  window3Translation2.add(cubeTranslation1);
  const cubeScaling1 = new GroupNode(new Scaling(new Vector(0.2, 0.2, 0.2, 0.2)));
  cubeTranslation1.add(cubeScaling1);
  const cube = new BoxNode(
    Material.setCustomMaterialWithColor(
      new Vector(0.6, 0.1, 0.1, 1),
      new Vector(0.8, 0.8, 0.8, 1),
      new Vector(1, 1, 1, 1),
      30,
      cubeColors
    ).setShader(phongShader)
  );
  const sphere2Click = function clickMethod() {
    if (clickedObj === cube) {
      setUnclicked();
    } else if (clickedObj != cube) {
      setClicked(cube);
    }
  };
  cube.clickMethod = sphere2Click;
  cubeScaling1.add(cube);

  // -------------

  //-Window 4 - VIDEO
  const window4Translation1 = new GroupNode(new Translation(new Vector(0, -1, 0.2, 1)));
  start.add(window4Translation1);
  const window4Translation2 = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  window4Translation1.add(window4Translation2);
  const window4Scaling1 = new GroupNode(new Scaling(new Vector(0.5, 0.5, 0.0001, 1)));
  window4Translation2.add(window4Scaling1);
  const materialVideoCube = Material.setCustomMaterial(
    new Vector(1, 1, 1, 1),
    new Vector(1, 1, 1, 1),
    new Vector(1, 1, 1, 1),
    10
  );
  materialVideoCube.setCustomCanvasAsMainTexture(getTextCanvas('Video'), contextGl2);
  const window4 = new TextureBoxNode(materialVideoCube.setShader(textureShader));
  const window4Click = function clickMethod() {
    getWindowClickMethod(window4, window4Translation1);
  };
  window4.clickMethod = window4Click;
  window4Scaling1.add(window4);

  //Close Button Window 4
  const tinyCube4Translation = new GroupNode(new Translation(new Vector(0.2, 0.21, 0.05, 0)));
  window4Translation2.add(tinyCube4Translation);
  const tinyCube4Scaling = new GroupNode(new Scaling(new Vector(0.05, 0.05, 0.001, 0.2)));
  tinyCube4Translation.add(tinyCube4Scaling);
  const window4CloseCube = new TextureBoxNode(Material.alpha['closeWindow'].setShader(textureShader));
  const window4CloseCubeClick = function clickMethod() {
    windowFunction(4);
  };
  window4CloseCube.clickMethod = window4CloseCubeClick;
  tinyCube4Scaling.add(window4CloseCube);

  //Video Box in Window 4
  const vidTranslation = new GroupNode(new Translation(new Vector(0, 0, 0.05, 0)));
  window4Translation2.add(vidTranslation);
  const vidTranslation2 = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  vidTranslation.add(vidTranslation2);
  const vidScaling = new GroupNode(new Scaling(new Vector(0.28, 0.28, 0.28, 0.2)));
  vidTranslation2.add(vidScaling);
  const vidBox = new VideoTextureBoxNode(Material.animated['rickroll'].setShader(videoTextureShader));
  const vidBoxClick = function clickMethod() {};
  vidBox.clickMethod = vidBoxClick;
  vidScaling.add(vidBox);

  //--------------

  //Squirrel
  const squirrelTranslation = new GroupNode(new Translation(new Vector(0, -1, 0.6, 0)));
  start.add(squirrelTranslation);
  const squirrelRotation = new GroupNode(new Rotation(new Vector(0, 1, 0, 0), 2 * Math.PI * (-30 / 360)));
  squirrelTranslation.add(squirrelRotation);
  const squirrelTranslation2 = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  squirrelRotation.add(squirrelTranslation2);
  const squirrelScaling = new GroupNode(new Scaling(new Vector(0.001, 0.001, 0.001, 1)));
  squirrelTranslation2.add(squirrelScaling);
  const squirrel = new MeshNode(
    Material.simply['yellow'].setShader(phongShader),
    'obj/low-poly-squirrel.obj',
    'obj/low-poly-squirrel2.mtl'
  );
  squirrelScaling.add(squirrel);

  //------------

  //------------------------------------------------- TASKBAR ----------------------------------------
  //Taskbar Background Box
  const taskBarTranslation = new GroupNode(new Translation(new Vector(0, -0.95, 0.3, 0)));
  backgroundBoxTranslation.add(taskBarTranslation);
  const taskBarScaling = new GroupNode(new Scaling(new Vector(2, 0.2, 0.001, 1)));
  taskBarTranslation.add(taskBarScaling);
  const taskBar = new BoxNode(Material.fromSingleColor(new Vector(0.2, 0.2, 0.3, 1)).setShader(phongShader));
  taskBarScaling.add(taskBar);
  const taskbarClick = function clickMethod() {
    if (clickedObj === taskBar) {
      setUnclicked();
    } else if (clickedObj != taskBar) {
      setClicked(taskBar);
    }
  };
  taskBar.clickMethod = taskbarClick;

  //Video (Play Button) in Taskbar
  const playButtonTranslation1 = new GroupNode(new Translation(new Vector(-0.5, 0.16, 0.3, 0)));
  taskBarTranslation.add(playButtonTranslation1);
  const playButtonTranslation2 = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  playButtonTranslation1.add(playButtonTranslation2);
  const playButtonScaling = new GroupNode(new Scaling(new Vector(0.07, 0.07, 0.07, 0)));
  playButtonTranslation2.add(playButtonScaling);
  const playButton = new TextureBoxNode(Material.alpha['play'].setShader(textureShader));
  playButtonScaling.add(playButton);
  const playButtonClick = function clickMethod() {
    windowFunction(4);
    videoOpen = !videoOpen;
    (setupVisitor.objects.get(vidBox) as VideoTextureBox).setOpened(videoOpen);
    toggleVideoWindow();
  };
  playButton.clickMethod = playButtonClick;

  //Sphere in Taskbar
  const taskbarSphere1Translation1 = new GroupNode(new Translation(new Vector(-0.1, 0.16, 0.3, 0)));
  taskBarTranslation.add(taskbarSphere1Translation1);
  const taskbarSphere1Translation2 = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  taskbarSphere1Translation1.add(taskbarSphere1Translation2);
  const taskbarSphere1Scaling = new GroupNode(new Scaling(new Vector(0.04, 0.04, 0.04, 0)));
  taskbarSphere1Translation2.add(taskbarSphere1Scaling);
  const taskbarSphere = new SphereNode(
    Material.fromSingleColor(new Vector(0.8, 0.4, 0.1, 1)).setShader(phongShader)
  );
  const taskbarPyramidClick = function clickMethod() {
    windowFunction(0);
  };
  taskbarSphere.clickMethod = taskbarPyramidClick;
  taskbarSphere1Scaling.add(taskbarSphere);

  //Pyramid in Taskbar
  const taskbarPyramidTranslation1 = new GroupNode(new Translation(new Vector(-0.3, 0.17, 0.3, 0)));
  taskBarTranslation.add(taskbarPyramidTranslation1);
  const taskbarPyramidTranslation2 = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  taskbarPyramidTranslation1.add(taskbarPyramidTranslation2);
  const taskbarPyramidScaling = new GroupNode(new Scaling(new Vector(0.07, 0.07, 0.07, 0)));
  taskbarPyramidTranslation2.add(taskbarPyramidScaling);
  const taskbarPyramid = new PyramidNode(
    Material.setCustomMaterialWithColor(
      new Vector(0.6, 0.1, 0.1, 1),
      new Vector(0.8, 0.8, 0.8, 1),
      new Vector(1, 1, 1, 1),
      30,
      pyramidColors
    ).setShader(phongShader)
  );
  const taskbarSphereClick = function clickMethod() {
    windowFunction(2);
  };
  taskbarPyramid.clickMethod = taskbarSphereClick;
  taskbarPyramidScaling.add(taskbarPyramid);

  //Cube in Taskbar
  const taskbarCubeTranslation1 = new GroupNode(new Translation(new Vector(0.1, 0.16, 0.3, 0)));
  taskBarTranslation.add(taskbarCubeTranslation1);
  const taskbarCubeTranslation2 = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  taskbarCubeTranslation1.add(taskbarCubeTranslation2);
  const taskbarCubeScaling = new GroupNode(new Scaling(new Vector(0.06, 0.06, 0.06, 0)));
  taskbarCubeTranslation2.add(taskbarCubeScaling);
  const taskbarCube = new BoxNode(
    Material.setCustomMaterialWithColor(
      new Vector(0.6, 0.1, 0.1, 1),
      new Vector(0.4, 0.4, 0.4, 1),
      new Vector(1, 1, 1, 1),
      10,
      cubeColors
    ).setShader(phongShader)
  );
  const taskbarCubeClick = function clickMethod() {
    windowFunction(3);
  };
  taskbarCube.clickMethod = taskbarCubeClick;
  taskbarCubeScaling.add(taskbarCube);

  //TicTacToe in Taskbar
  const taskbarTicTacToeTranslation1 = new GroupNode(new Translation(new Vector(0.3, 0.16, 0.3, 0)));
  taskBarTranslation.add(taskbarTicTacToeTranslation1);
  const taskbarTicTacToeTranslation2 = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  taskbarTicTacToeTranslation1.add(taskbarTicTacToeTranslation2);
  const taskbarTicTacToeScaling = new GroupNode(new Scaling(new Vector(0.056, 0.056, 0.056, 0)));
  taskbarTicTacToeTranslation2.add(taskbarTicTacToeScaling);
  const taskbarTicTacToe = new TextureBoxNode(
    Material.colortexture['ticTacToeIcon'].setShader(textureShader)
  );
  const taskbarTicTacToeClick = function clickMethod() {
    windowFunction(1);
  };
  taskbarTicTacToe.clickMethod = taskbarTicTacToeClick;
  taskbarTicTacToeScaling.add(taskbarTicTacToe);

  //Squirrel in Taskbar
  const squirrelTaskbarTranslation1 = new GroupNode(new Translation(new Vector(0.5, 0.16, 0.3, 0)));
  taskBarTranslation.add(squirrelTaskbarTranslation1);
  const squirrelTaskbarTranslation2 = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  squirrelTaskbarTranslation1.add(squirrelTaskbarTranslation2);
  const squirrelTaskbarScaling = new GroupNode(new Scaling(new Vector(0.056, 0.056, 0.056, 0)));
  squirrelTaskbarTranslation2.add(squirrelTaskbarScaling);
  const squirrelTaskbar = new TextureBoxNode(Material.colortexture['squirrel'].setShader(textureShader));
  const squirrelTaskbarClick = function clickMethod() {
    windowFunction(5);
  };
  squirrelTaskbar.clickMethod = squirrelTaskbarClick;
  squirrelTaskbarScaling.add(squirrelTaskbar);

  // ------------------------------------------ TIC TAC TOE ---------------------------------------------------
  //TicTacToeWindow
  const tictactoeWindowTranslation1 = new GroupNode(new Translation(new Vector(0, -2, 0, 1)));
  start.add(tictactoeWindowTranslation1);
  const tictactoeWindowTranslation2 = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  tictactoeWindowTranslation1.add(tictactoeWindowTranslation2);
  const tictactoeWindowScaling = new GroupNode(new Scaling(new Vector(0.4, 0.4, 0.0001, 0.2)));
  tictactoeWindowTranslation2.add(tictactoeWindowScaling);
  const materialGameCube = Material.setCustomMaterial(
    new Vector(1, 1, 1, 1),
    new Vector(0.4, 0.4, 0.4, 1),
    new Vector(1, 1, 1, 1),
    10
  );
  materialGameCube.setCustomCanvasAsMainTexture(getTextCanvas('TIC TAC TOE'), contextGl2);
  const tictactoeWindow = new TextureBoxNode(materialGameCube.setShader(textureShader));
  const tictactoeWindowClick = function clickMethod() {
    getWindowClickMethod(tictactoeWindow, tictactoeWindowTranslation1);
  };
  tictactoeWindow.clickMethod = tictactoeWindowClick;
  tictactoeWindowScaling.add(tictactoeWindow);

  //TicTacToeWindow Close
  const tictactoeCloseTranslation = new GroupNode(new Translation(new Vector(0.17, 0.17, 0.03, 0)));
  tictactoeWindowTranslation1.add(tictactoeCloseTranslation);
  const tictactoeCloseScaling = new GroupNode(new Scaling(new Vector(0.03, 0.03, 0.0001, 0.2)));
  tictactoeCloseTranslation.add(tictactoeCloseScaling);
  const tictactoeClose = new TextureBoxNode(Material.alpha['closeWindow'].setShader(textureShader));
  const tictactoeCloseClick = function clickMethod() {
    windowFunction(1);
  };
  tictactoeClose.clickMethod = tictactoeCloseClick;
  tictactoeCloseScaling.add(tictactoeClose);

  //TicTacToeWindow FullScreen
  const tictactoeFullTranslation = new GroupNode(new Translation(new Vector(0.365, 0.455, 0.9, 0)));
  tictactoeWindowScaling.add(tictactoeFullTranslation);
  const tictactoeFullScaling = new GroupNode(new Scaling(new Vector(0.07, 0.07, 0.0001, 0.2)));
  tictactoeFullTranslation.add(tictactoeFullScaling);
  const tictactoeFull = new TextureBoxNode(Material.alpha['fullScreen'].setShader(textureShader));
  const tictactoeFullClick = function clickMethod() {
    toggleFullScreenForGameWindow();
  };
  tictactoeFull.clickMethod = tictactoeFullClick;
  tictactoeFullScaling.add(tictactoeFull);

  //TicTacToeWindow Replay
  const tictactoeReplayTranslation = new GroupNode(new Translation(new Vector(0.28, 0.455, 0.9, 0)));
  tictactoeWindowScaling.add(tictactoeReplayTranslation);
  const tictactoeReplayScaling = new GroupNode(new Scaling(new Vector(0.07, 0.07, 0.0001, 0.2)));
  tictactoeReplayTranslation.add(tictactoeReplayScaling);
  const tictactoeReplay = new TextureBoxNode(Material.alpha['playAgain'].setShader(textureShader));
  const tictactoeReplayClick = function clickMethod() {
    resetTicTacToe();
  };
  tictactoeReplay.clickMethod = tictactoeReplayClick;
  tictactoeReplayScaling.add(tictactoeReplay);

  //TicTacToe Field 1
  const tictactoe1Translation1 = new GroupNode(new Translation(new Vector(-0.25, 0.25, 0.8, 0)));
  tictactoeWindowScaling.add(tictactoe1Translation1);
  const tictactoe1Scaling = new GroupNode(new Scaling(new Vector(0.2, 0.2, 0.0001, 0.2)));
  tictactoe1Translation1.add(tictactoe1Scaling);
  const tictactoe1 = ticTacToeFields[0];
  const tictactoe1Click = function clickMethod() {
    setTicTacToeInput(tictactoe1, 0);
  };
  tictactoe1.clickMethod = tictactoe1Click;
  tictactoe1Scaling.add(tictactoe1);

  //TicTacToe Field 2
  const tictactoe2Translation1 = new GroupNode(new Translation(new Vector(0, 0.25, 0.8, 0)));
  tictactoeWindowScaling.add(tictactoe2Translation1);
  const tictactoe2Scaling = new GroupNode(new Scaling(new Vector(0.2, 0.2, 0.0001, 0.2)));
  tictactoe2Translation1.add(tictactoe2Scaling);
  const tictactoe2 = ticTacToeFields[1];
  const tictactoe2Click = function clickMethod() {
    setTicTacToeInput(tictactoe2, 1);
  };
  tictactoe2.clickMethod = tictactoe2Click;
  tictactoe2Scaling.add(tictactoe2);

  //TicTacToe Field 3
  const tictactoe3Translation1 = new GroupNode(new Translation(new Vector(0.25, 0.25, 0.8, 0)));
  tictactoeWindowScaling.add(tictactoe3Translation1);
  const tictactoe3Scaling = new GroupNode(new Scaling(new Vector(0.2, 0.2, 0.0001, 0.2)));
  tictactoe3Translation1.add(tictactoe3Scaling);
  const tictactoe3 = ticTacToeFields[2];
  const tictactoe3Click = function clickMethod() {
    setTicTacToeInput(tictactoe3, 2);
  };
  tictactoe3.clickMethod = tictactoe3Click;
  tictactoe3Scaling.add(tictactoe3);

  //TicTacToe Field 4
  const tictactoe4Translation1 = new GroupNode(new Translation(new Vector(-0.25, 0, 0.8, 0)));
  tictactoeWindowScaling.add(tictactoe4Translation1);
  const tictactoe4Scaling = new GroupNode(new Scaling(new Vector(0.2, 0.2, 0.0001, 0.2)));
  tictactoe4Translation1.add(tictactoe4Scaling);
  const tictactoe4 = ticTacToeFields[3];
  const tictactoe4Click = function clickMethod() {
    setTicTacToeInput(tictactoe4, 3);
  };
  tictactoe4.clickMethod = tictactoe4Click;
  tictactoe4Scaling.add(tictactoe4);

  //TicTacToe Field 5
  const tictactoe5Translation1 = new GroupNode(new Translation(new Vector(0, 0, 0.8, 0)));
  tictactoeWindowScaling.add(tictactoe5Translation1);
  const tictactoe5Scaling = new GroupNode(new Scaling(new Vector(0.2, 0.2, 0.0001, 0.2)));
  tictactoe5Translation1.add(tictactoe5Scaling);
  const tictactoe5 = ticTacToeFields[4];
  const tictactoe5Click = function clickMethod() {
    setTicTacToeInput(tictactoe5, 4);
  };
  tictactoe5.clickMethod = tictactoe5Click;
  tictactoe5Scaling.add(tictactoe5);

  //TicTacToe Field 6
  const tictactoe6Translation1 = new GroupNode(new Translation(new Vector(0.25, 0, 0.8, 0)));
  tictactoeWindowScaling.add(tictactoe6Translation1);
  const tictactoe6Scaling = new GroupNode(new Scaling(new Vector(0.2, 0.2, 0.0001, 0.2)));
  tictactoe6Translation1.add(tictactoe6Scaling);
  const tictactoe6 = ticTacToeFields[5];
  const tictactoe6Click = function clickMethod() {
    setTicTacToeInput(tictactoe6, 5);
  };
  tictactoe6.clickMethod = tictactoe6Click;
  tictactoe6Scaling.add(tictactoe6);

  //TicTacToe Field 7
  const tictactoe7Translation1 = new GroupNode(new Translation(new Vector(-0.25, -0.25, 0.8, 0)));
  tictactoeWindowScaling.add(tictactoe7Translation1);
  const tictactoe7Scaling = new GroupNode(new Scaling(new Vector(0.2, 0.2, 0.0001, 0.2)));
  tictactoe7Translation1.add(tictactoe7Scaling);
  const tictactoe7 = ticTacToeFields[6];
  const tictactoe7Click = function clickMethod() {
    setTicTacToeInput(tictactoe7, 6);
  };
  tictactoe7.clickMethod = tictactoe7Click;
  tictactoe7Scaling.add(tictactoe7);

  //TicTacToe Field 8
  const tictactoe8Translation1 = new GroupNode(new Translation(new Vector(0, -0.25, 0.8, 0)));
  tictactoeWindowScaling.add(tictactoe8Translation1);
  const tictactoe8Scaling = new GroupNode(new Scaling(new Vector(0.2, 0.2, 0.0001, 0.2)));
  tictactoe8Translation1.add(tictactoe8Scaling);
  const tictactoe8 = ticTacToeFields[7];
  const tictactoe8Click = function clickMethod() {
    setTicTacToeInput(tictactoe8, 7);
  };
  tictactoe8.clickMethod = tictactoe8Click;
  tictactoe8Scaling.add(tictactoe8);

  //TicTacToe Field 9
  const tictactoe9Translation1 = new GroupNode(new Translation(new Vector(0.25, -0.25, 0.8, 0)));
  tictactoeWindowScaling.add(tictactoe9Translation1);
  const tictactoe9Scaling = new GroupNode(new Scaling(new Vector(0.2, 0.2, 0.0001, 0.2)));
  tictactoe9Translation1.add(tictactoe9Scaling);
  const tictactoe9 = ticTacToeFields[8];
  const tictactoe9Click = function clickMethod() {
    setTicTacToeInput(tictactoe9, 8);
  };
  tictactoe9.clickMethod = tictactoe9Click;
  tictactoe9Scaling.add(tictactoe9);

  // ------------------------------------------ Ende TicTacToe ---------------------------------------------------

  //------------------------------------------ Scenegraph Updates at Runtime --------------------------------------------------

  //Ambient Light for the Rayvisitor only
  const ambientLight = { color: new Vector(0.8, 0.8, 0.8, 1) };

  /**
   * Lights can be added and removed at runtime.
   * Therefore the information is stored in arrays that are passed to the renderes.
   */

  let lightPositions: Array<Vector> = [];
  let lightColors: Array<Vector> = [];
  let sphereLights: Array<{ position: Vector; color: Vector }> = [];

  function getRayLights() {
    let rayLights: Array<{ position: Vector; color: Vector }> = [];
    for (let i = 0; i < lightPositions.length; i++) {
      let light = { position: lightPositions[i], color: lightColors[i] };
      rayLights.push(light);
    }
    for (let i = 0; i < sphereLights.length; i++) {
      rayLights.push(sphereLights[i]);
    }
    return rayLights;
  }

  /**
   * After lights are edited in the scenegraph, the lightvisitor traverses the scenegraph to retrive the
   * positions of the lights.
   * Therefore, the positions are known, even if an object would be visited before a specific light source.
   */
  function updateLightSources() {
    let lightVisitor = new LightVisitor(context2d, canvasRaster.width, canvasRaster.height);
    lightVisitor.traverse(scenegraph);
    lightPositions = lightVisitor.lightPositions;
    sphereLights = lightVisitor.sphereLights;
    lightColors = [];
    for (let i = 0; i < pointLights.length; i++) {
      lightColors.push(pointLights[i].getColor());
    }
    //only light colors for point lights, cause color for sphere light is already in sphereLights Array included
  }

  /**
   * Adds a new light source to the scene at the specified position with the given color.
   * @param position The position of the new light source.
   * @param color The color of the new light source.
   */
  function addLightSource(position: Vector, color: Vector) {
    let lightNode = new LightNode(color);
    pointLights.push(lightNode);
    let lightTranslation = new GroupNode(new Translation(position));
    start.add(lightTranslation);
    lightTranslation.add(pointLights[pointLights.length - 1]);
    updateLightSources();
    setupVisitor.setup(scenegraph);
  }

  /**
   * Objects (Spheres, Boxes and Pyramids) can also be added at runtime
   * To be able to add and remove flexibely we add them to a specific group node (addedObjectsStart)
   */

  let addedObjects: Array<SphereNode | PyramidNode | BoxNode> = [];
  let addedObjectTranslations: Array<GroupNode> = [];

  /**
   * Adds a 3D object to the scene based on the specified object type, position, color, and rotation option.
   *
   * @param {number} objectType - The type of 3D object to add (0 for Sphere, 1 for Box, 2 for Pyramid).
   * @param {Vector} position - The position vector specifying the location of the object in the scene.
   * @param {Vector} color - The color vector representing the object's surface color.
   * @param {boolean} rotation - A boolean flag indicating whether to apply rotation animation to the object.
   *
   * @returns {void}
   */
  function addObject(objectType: number, position: Vector, color: Vector, rotation: boolean) {
    //Choose Node Object
    let objNode: SphereNode | PyramidNode | BoxNode;
    let objMaterial = Material.fromSingleColor(color).setShader(phongShader);
    if (objectType === 0) objNode = new SphereNode(objMaterial);
    else if (objectType === 1) objNode = new BoxNode(objMaterial);
    else if (objectType === 2) objNode = new PyramidNode(objMaterial);

    //Translate Object
    let objTranslation = new GroupNode(new Translation(position));
    let objTranslation2 = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
    objTranslation.add(objTranslation2);
    //Scaling Object
    let objScaling = new GroupNode(new Scaling(new Vector(0.2, 0.2, 0.2, 1)));
    objTranslation2.add(objScaling);
    objScaling.add(objNode);

    //Rotation if checked
    if (rotation) {
      let rotNode = new RotAnim(objTranslation2, new Vector(0, 1, 0, 0), Math.PI / 3);
      animationNodes.push(rotNode);
    }
    const objClick = function clickMethod() {
      getWindowClickMethod(objNode, objTranslation);
    };
    objNode.clickMethod = objClick;

    //adding nodes to arrays for later scenegraph addition
    addedObjectTranslations.push(objTranslation);
    addedObjects.push(objNode);

    loadAddedObjects();
    updateLightSources();
    setupVisitor.setup(scenegraph);
  }

  /**
   * Loads and adds the previously defined 3D objects and their translations to the scene graph.
   * This function removes any existing objects from the designated starting node and adds the new objects.
   *
   * @returns {void}
   */
  function loadAddedObjects() {
    addedObjectsStart.children.splice(0, addedObjectsStart.children.length);
    for (let i = 0; i < addedObjectTranslations.length; i++) {
      addedObjectsStart.add(addedObjectTranslations[i]);
    }
  }

  //------------------------------------------- Renderer Selection -----------------------------------------------

  /**
   * Retrieves the renderer selection menu element and stores the initially selected renderer.
   */
  let rendererMenu = document.getElementById('rendererMenu') as HTMLSelectElement;
  let selectedRenderer = rendererMenu.value;

  /**
   * Adds an event listener to the renderer selection menu to update the selected renderer
   * and trigger changes when the user selects a different rendering method.
   */
  rendererMenu.addEventListener('change', () => {
    selectedRenderer = rendererMenu.value;
    changeCanvas();
    changeVisitor();
  });

  /**
   * Changes the selected renderer based on the user's choice in the selection menu.
   */
  function changeRenderer() {
    if (rendererMenu.value === 'Rasterisation') {
      rendererMenu.selectedIndex = 0;
    } else {
      rendererMenu.selectedIndex = 1;
    }
    selectedRenderer = rendererMenu.value;
  }

  //--------------------------- VISITORS --------------------------------------
  /**
   * Type alias for visitors that can be either RasterVisitor or RayVisitor.
   */
  type AnyVisitor = RasterVisitor | RayVisitor;

  /**
   * The currently active visitor for rendering.
   */
  let activeVisitor: AnyVisitor;

  const setupVisitor = new RasterSetupVisitor(contextGl2); //auch immer neu aufrufen wenn sich etwas an der szene ändert
  setupVisitor.setup(scenegraph);

  let rasterVisitor = new RasterVisitor(contextGl2, setupVisitor.objects);
  let rayVisitor = new RayVisitor(context2d, canvasRay.width, canvasRay.height);
  let clickvisitor = new ClickVisitor(context2d, canvasRay.width, canvasRay.height);

  const cameraVisitor = new CameraVisitor();
  cameraVisitor.setup(scenegraph);

  /**
   * Function to change the active rendering visitor based on the selected renderer.
   */
  function changeVisitor() {
    if (selectedRenderer === 'Raytracing') {
      activeVisitor = rayVisitor;
    } else {
      activeVisitor = rasterVisitor;
    }
  }
  /**
   * Function to render the scene based on the selected renderer.
   */
  function renderScene() {
    updateCamera();
    if (selectedRenderer === 'Raytracing') {
      rayVisitor.render(scenegraph, camera, getRayLights(), ambientLight);
    } else {
      rasterVisitor.render(scenegraph, camera, lightPositions, null, lightColors, sphereLights);
    }
  }
  /**
   * Function to change the active canvas based on the selected renderer.
   */
  function changeCanvas() {
    if (selectedRenderer === 'Raytracing') {
      document.getElementById('rayCanvas').style.visibility = 'visible';
      document.getElementById('rasterCanvas').style.visibility = 'hidden';
      activeCanvas = canvasRay;
    } else {
      document.getElementById('rasterCanvas').style.visibility = 'visible';
      document.getElementById('rayCanvas').style.visibility = 'hidden';
      activeCanvas = canvasRaster;
    }
    addClickEventListener();
  }

  updateLightSources();
  addClickEventListener();
  renderScene();

  //--------------------------------------------- Setup for Animation ---------------------------------------

  let isAnimating = false;
  let animationId = -1;
  let startStopAnimationButton = document.getElementById('startAnimationBtn') as HTMLInputElement;

  /**
   * Animation nodes controlling rotations.
   * Those animations are active per default and can be toggled via the "Start"/"Stop" button
   * The Lights and the Objects in the taskbar are always rotating
   */
  let animationNodes = [
    new RotAnim(light1Translation2, new Vector(0, 1, 0, 1), Math.PI / 3 / 2),
    new RotAnim(light3Translation2, new Vector(0, 0, 1, 1), Math.PI / 3 / 2),
    new RotAnim(light2Translation2, new Vector(0, 1, 0, 1), Math.PI / 3 / 2),
    new RotAnim(taskbarTicTacToeTranslation2, new Vector(0, 1, 0, 1), Math.PI / 3 / 2),
    new RotAnim(taskbarTicTacToeTranslation2, new Vector(1, 0, 0, 1), Math.PI / 3 / 2),
    new RotAnim(taskbarPyramidTranslation2, new Vector(0, 1, 0, 0), Math.PI / 3 / 2),
    new RotAnim(taskbarCubeTranslation2, new Vector(0, 1, 0, 0), Math.PI / 3 / 2),
    new RotAnim(playButtonTranslation2, new Vector(1, 0, 0, 0)),
    new RotAnim(playButtonTranslation2, new Vector(0, 1, 0, 0)),
    new RotAnim(squirrelTaskbarTranslation2, new Vector(0, 1, 0, 0))
  ];

  /**
   * Animation nodes controlling the Objects displayed in the windows.
   *
   */
  let windowShapesAnimationNodes = [
    new RotAnim(sphereTranslation1, new Vector(0, 1, 0, 0), Math.PI / 3 / 2),
    new RotAnim(pyramid1translation2, new Vector(0, 1, 0, 0), Math.PI / 3 / 2),
    new RotAnim(cubeScaling1, new Vector(1, 0, 0, 0), Math.PI / 3 / 2)
  ];
  /**
   * Animation nodes controlling window open/close translation.
   */
  let windowAniTrans = [
    new WindowTranslationAnim(window1Translation1, new Vector(-0.1, -2, 0, 0), new Vector(0, 0.1, 0.3, 0)),
    new WindowTranslationAnim(
      tictactoeWindowTranslation1,
      new Vector(0.8, -2, -1, 0),
      new Vector(0, 0, 0, 0)
    ),
    new WindowTranslationAnim(window2Translation1, new Vector(-0.2, -2, 0, 0), new Vector(-0.2, 0, 0.001, 0)),
    new WindowTranslationAnim(window3Translation1, new Vector(0.1, -2, 0, 0), new Vector(0.2, -0.05, 0, 0)),
    new WindowTranslationAnim(window4Translation1, new Vector(-1.2, -2, 0, 0), new Vector(0, 0, 0, 0)),
    new WindowTranslationAnim(squirrelTranslation, new Vector(1.2, -2, -1, 0), new Vector(0, 0, 0, 0))
  ];

  /**
   * Animation nodes controlling window open/close scaling.
   */
  let windowAniScale = [
    new WindowScaleAnim(window1Translation1, new Vector(0.5, 0.5, 0.3, 0.1), new Vector(1, 1, 1, 0), 1),
    new WindowScaleAnim(
      tictactoeWindowTranslation1,
      new Vector(0.5, 0.5, 0.3, 0.1),
      new Vector(2.3, 2.3, 2.3, 0),
      1
    ),
    new WindowScaleAnim(window2Translation1, new Vector(0.5, 0.5, 0.3, 0.1), new Vector(1, 1, 1, 0), 1),
    new WindowScaleAnim(window3Translation1, new Vector(0.5, 0.5, 0.3, 0.1), new Vector(1, 1, 1, 0), 1),
    new WindowScaleAnim(window4Translation1, new Vector(0.5, 0.5, 0.3, 0.1), new Vector(1.3, 1.3, 1.3, 0), 1),
    new WindowScaleAnim(squirrelTranslation, new Vector(0.5, 0.5, 0.3, 0.1), new Vector(2.3, 2.3, 2.3, 0), 1)
  ];

  /**
   * Animation driver nodes. Selected objects can be translated via arrow keys in x and y direction
   * The specific node is added to the AnimationNode as soon as an object is selected.
   */
  const placeholderNode = new GroupNode(new Translation(new Vector(0, 0, 0, 0)));
  let driverNodes = [
    new TranslationAnim2(placeholderNode, new Vector(1, 0, 0, 1), 0.1),
    new TranslationAnim2(placeholderNode, new Vector(1, 0, 0, 1), -0.1),
    new TranslationAnim2(placeholderNode, new Vector(0, 1, 0, 1), 0.1),
    new TranslationAnim2(placeholderNode, new Vector(0, 1, 0, 1), -0.1)
  ];

  /**
   * Sets the animation driver nodes for a specific group node that has been selected via click.
   * @param groupNode The group node to associate with animation driver nodes.
   */
  function setDriverNodes(groupNode: GroupNode) {
    driverNodes[0] = new TranslationAnim2(groupNode, new Vector(1, 0, 0, 1), 0.1);
    driverNodes[1] = new TranslationAnim2(groupNode, new Vector(1, 0, 0, 1), -0.1);
    driverNodes[2] = new TranslationAnim2(groupNode, new Vector(0, 1, 0, 1), 0.1);
    driverNodes[3] = new TranslationAnim2(groupNode, new Vector(0, 1, 0, 1), -0.1);
  }

  /**
   * Function to toggle the activity state of all animation driver nodes.
   * The driver nodes are inactive by default until an object is clicked. Only certain objects are possible
   * hold this animation when clicked (Windows and certain geometries)
   */
  function toggleAllDriverNodes() {
    for (let i = 0; i < driverNodes.length; i++) {
      driverNodes[i].toggleActive();
    }
  }
  toggleAllDriverNodes(); //Driver is inactive on default until window is clicked

  //-------------------------------------------------------ANIMATION FUNCTIONALITY -----------------------------------------------
  startstopAnimation();
  let timestamp = performance.now();

  function animate(now: number) {
    simulate(now - timestamp);
    updateLightSources();
    renderScene();
    timestamp = now;
    if (isAnimating) {
      animationId = requestAnimationFrame(animate);
    }
  }

  function simulate(deltaT: number) {
    for (let animationNode of animationNodes) {
      animationNode.simulate(deltaT);
    }
    for (let animationNode of windowShapesAnimationNodes) {
      animationNode.simulate(deltaT);
    }
    for (let i = 0; i < windowAniTrans.length; i++) {
      windowAniTrans[i].simulate(deltaT);
      windowAniScale[i].simulate(deltaT);
    }
  }

  function startstopAnimation() {
    setupVisitor.setup(scenegraph);
    if (startStopAnimationButton.value == 'Start') {
      (setupVisitor.objects.get(vidBox) as VideoTextureBox).setOpened(videoOpen);
      toggleVideoWindow();
      isAnimating = true;
      timestamp = performance.now();
      animate(performance.now());
    } else {
      isAnimating = false;
      cancelAnimationFrame(animationId);
    }
    changeButtontext();
  }

  document.getElementById('startAnimationBtn').addEventListener('click', startstopAnimation);

  //------------------------------------------------ Handel windows: Open/Close Animations, Obj. Animations on Open -------------------------------
  let fullScreen = false;
  function toggleFullScreenForGameWindow() {
    let factor = 1;
    if (!fullScreen) {
      factor = 0.882;
      camera.origin.z = -0.1;
    } else {
      camera.origin.z = 0;
    }
    cameraTranslation.transform = new Translation(
      new Vector(
        cameraTranslation.transform.getMatrix().getVal(0, 3),
        cameraTranslation.transform.getMatrix().getVal(1, 3),
        factor,
        0
      )
    );
    fullScreen = !fullScreen;

    cameraVisitor.setup(scenegraph);
    updateCamera();
    renderScene();
  }

  /**
   * Toggle the animation nodes of Objects associated with windows.
   * Used to set all window anims to inactive as default
   * Only if certain window is opened, the respective animations are toggled active
   */
  function toggleWindowAnimNodes() {
    for (let animationNode of windowShapesAnimationNodes) {
      animationNode.toggleActive();
    }
    for (let animationNode of windowAniScale) {
      animationNode.toggleActive();
    }
    for (let animationNode of windowAniTrans) {
      animationNode.toggleActive();
    }
  }
  toggleWindowAnimNodes(); //set all window anims to inactive as default

  let windowOpened = 0;
  /**
   * Function to control the animation and opening of windows.
   * Animations of objects displayed on window activated
   * Window Open/Close Animation (Scale and Translate) activated.
   * @param index The index of the window that is to be opened / closed with.
   */
  function windowFunction(index: number) {
    if (windowOpened === 0) {
      setupVisitor.setup(scenegraph);
      windowOpened += 1;
    }
    if (index == 0) {
      windowShapesAnimationNodes[0].toggleActive();
    } else if (index == 2) {
      windowShapesAnimationNodes[1].toggleActive();
    } else if (index == 3) {
      windowShapesAnimationNodes[2].toggleActive();
    }
    windowAniScale[index].toggleActive();
    windowAniTrans[index].toggleActive();
  }

  //-------------------------------------------------------TIC TAC TOE -------------------------------------------------------------------

  /**
   * Symbols for Tic Tac Toe game.
   * Index 0: Red Circle
   * Index 1: Blue Cross
   * Index 2: Gray Texture
   */
  const ticTacToeSymbols = [
    Material.alpha['roterKreis'].setShader(textureShader),
    Material.alpha['blauesKreuz'].setShader(textureShader),
    Material.colortexture['grau'].setShader(textureShader)
  ];

  /**
   * Indicates the current turn in Tic Tac Toe.
   * - true: Red's turn
   * - false: Blue's turn
   */
  let ticTacToeTurn = true;

  let ticTacToeField = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  /**
   * Sets Tic Tac Toe input at the specified field position.
   * After every input, we check if the game is over (winner or draw)
   * @param field The TextureBoxNode representing the game field.
   * @param position The position of the field in the 1D array.
   */

  function setTicTacToeInput(field: TextureBoxNode, position: number) {
    if (ticTacToeField[position] != 0) {
      return;
    }
    if (ticTacToeTurn) {
      //rot
      field.material = ticTacToeSymbols[0];
      ticTacToeField[position] = 1;
    } else {
      //blau
      field.material = ticTacToeSymbols[1];
      ticTacToeField[position] = 2;
    }
    setupVisitor.setup(scenegraph);
    ticTacToeTurn = !ticTacToeTurn;

    let winner = checkIfWon();
    showWinner(winner);
  }
  /**
   * Displays the winner's symbol on the Tic Tac Toe board.
   * @param winner The winner's identifier (1 for Red, 2 for Blue).
   */
  function showWinner(winner: number) {
    for (let i = 0; i < ticTacToeFields.length; i++) {
      if (winner === 1) {
        ticTacToeFields[i].material = Material.alpha['roterKreis'].setShader(textureShader);
      } else if (winner === 2) {
        ticTacToeFields[i].material = Material.alpha['blauesKreuz'].setShader(textureShader);
      }
    }
    setupVisitor.setup(scenegraph);
  }

  /**
   * Resets the Tic Tac Toe game board to its initial state.
   */
  function resetTicTacToe() {
    for (let i = 0; i < ticTacToeFields.length; i++) {
      ticTacToeFields[i].material = Material.colortexture['grau'].setShader(textureShader);
      setupVisitor.setup(scenegraph);
    }
    ticTacToeField.fill(0);
  }

  /**
   * Checks if there is a winner or if the game is a draw.
   * @returns The winner's identifier (1 for Red, 2 for Blue, 3 for draw, 0 for ongoing).
   */
  function checkIfWon() {
    let hasRow;
    let hasDiagonal;
    let hasColumn;
    let full = true;
    let winner = 0; //0: spiel geht weiter; 1: rot; 2: blau; 3: unentschieden

    // Check rows for a win
    for (let i = 0; i < ticTacToeField.length - 2; i += 3) {
      if (
        ticTacToeField[i] === ticTacToeField[i + 1] &&
        ticTacToeField[i] === ticTacToeField[i + 2] &&
        ticTacToeField[i] != 0
      ) {
        hasRow = true;
        winner = ticTacToeField[i];
        return winner;
      }
    }

    // Check columns for a win
    for (let i = 0; i < 3; i++) {
      if (
        ticTacToeField[i] === ticTacToeField[i + 3] &&
        ticTacToeField[i] === ticTacToeField[i + 6] &&
        ticTacToeField[i] != 0
      ) {
        hasColumn = true;
        winner = ticTacToeField[i];
        return winner;
      }
    }

    // Check diagonals for a win
    if (
      ticTacToeField[0] === ticTacToeField[4] &&
      ticTacToeField[4] === ticTacToeField[8] &&
      ticTacToeField[0] != 0
    ) {
      hasDiagonal = true;
      winner = ticTacToeField[0];
      return winner;
    }
    if (
      ticTacToeField[2] === ticTacToeField[4] &&
      ticTacToeField[4] === ticTacToeField[6] &&
      ticTacToeField[2] != 0
    ) {
      hasDiagonal = true;
      winner = ticTacToeField[2];
      return winner;
    }
    // Check if the board is full (draw)
    for (let i = 0; i < ticTacToeFields.length; i++) {
      if (ticTacToeField[i] === 0) {
        full = false;
        break;
      }
    }
    if (full) {
      winner = 3;
    }
    return winner;
  }

  //----------------------------------- Event Listener --------------------------------------------------------

  /**
   * Adds event listeners to the active canvas and window if click is registered.
   * If a click is registered, the position of the click is calculated
   * Then the click function in Clickvisitor is called
   * In click visitor: Intersection test with ray through clicked position
   * > determines clicked object
   * > calls click function on object if one is present
   */
  function addClickEventListener() {
    activeCanvas.addEventListener('click', (event) => {
      const rect = activeCanvas.getBoundingClientRect();
      let x = Math.floor(event.clientX - rect.left);
      let y = Math.floor(event.clientY - rect.top);
      clickvisitor.click(scenegraph, camera, getRayLights(), ambientLight, x, y);
    });

    /**
     * Adds event listeners for keyboard inputs.
     * Listener handles various user interactions.
     */
    window.addEventListener('keydown', function (event) {
      let field;
      switch (event.key) {
        case 'ArrowLeft':
          driverNodes[1].simulate(1);
          break;
        case 'ArrowRight':
          driverNodes[0].simulate(1);
          break;
        case 'ArrowUp':
          driverNodes[2].simulate(1);
          break;
        case 'ArrowDown':
          driverNodes[3].simulate(1);
          break;
        case 'w':
          windowFunction(0);
          break;
        case 'g':
          windowFunction(1);
          break;
        case 'q':
          windowFunction(2);
          break;
        case 'e':
          windowFunction(3);
          break;
        case 'r':
          resetTicTacToe();
          break;
        case 'z':
          toggleFullScreenForGameWindow();
          break;
        case 'v':
          windowFunction(4);
          videoOpen = !videoOpen;
          (setupVisitor.objects.get(vidBox) as VideoTextureBox).setOpened(videoOpen);
          toggleVideoWindow();
          break;
        case 's':
          windowFunction(5);
          break;
        case 'c':
          changeRenderer();
          changeCanvas();
          changeVisitor();
          break;
        case 'x':
          startStopAnimationButton.click();
          break;
        case '1':
          field = tictactoe1;
          break;
        case '2':
          field = tictactoe2;
          break;
        case '3':
          field = tictactoe3;
          break;
        case '4':
          field = tictactoe4;
          break;
        case '5':
          field = tictactoe5;
          break;
        case '6':
          field = tictactoe6;
          break;
        case '7':
          field = tictactoe7;
          break;
        case '8':
          field = tictactoe8;
          break;
        case '9':
          field = tictactoe9;
          break;
      }
      if (parseInt(event.key) > 0 && parseInt(event.key) < 10) {
        setTicTacToeInput(field, parseInt(event.key) - 1);
      }
    });
  }

  // ---------------------------------------------------------------------- CLICK OBJECTS FUNCTION ----------------------------------------------------------------------
  let clickedObj: SphereNode | BoxNode | PyramidNode;

  /**
   * Clears the clicked state of the currently selected object.
   * This function reduces the object's material color to its original state, since it is highlighted when selected.
   * Also, it sets the clicked object reference to null.
   */
  function setUnclicked() {
    clickedObj.material.diffuse = clickedObj.material.diffuse.sub(new Vector(0.2, 0.2, 0.2, 1));
    clickedObj = null;
    setupVisitor.setup(scenegraph);
  }

  /**
   * Sets the clicked state for the given object.
   * This function enhances the object's material color to indicate selection.
   * If another object is already clicked, it unselects it first.
   * @param node The object to be clicked.
   */
  function setClicked(node: BoxNode | PyramidNode | SphereNode) {
    // if other object is already clicked, unselect it first
    if (clickedObj) {
      clickedObj.material.diffuse = clickedObj.material.diffuse.sub(new Vector(0.2, 0.2, 0.2, 1));
    }
    clickedObj = node;
    node.material.diffuse = node.material.diffuse.add(new Vector(0.2, 0.2, 0.2, 1));
    setupVisitor.setup(scenegraph);
  }
  /**
   * Handles the click event for a window-like object.
   * If the clicked object is already selected, it unselects it and disables its driver nodes.
   * If the clicked object is not selected, it selects it and activates its driver nodes.
   * @param object The window-like object being clicked.
   * @param translation The translation node associated with the object.
   */
  function getWindowClickMethod(object: TextureBoxNode, translation: GroupNode) {
    if (clickedObj === object) {
      setUnclicked();
      setupVisitor.setup(scenegraph);
      toggleAllDriverNodes();
    } else if (clickedObj != object) {
      setClicked(object);
      setDriverNodes(translation);
      setupVisitor.setup(scenegraph);
    }
  }

  // ---------------------------------------------------------------------- ADD and RESET LIGHTS AT RUNTIME ----------------------------------------------------------------------

  /**
   * "Add Lights" Popup
   * Open/Close
   * Set all values to default
   */
  let lightsPopup = document.getElementById('addLightsPopup');
  let lightsInterfaceButton = document.getElementById('addLightsButton');
  lightsInterfaceButton.addEventListener('click', function () {
    if (clickedObj) {
      setUnclicked();
    }
    if (pointLights.length === 8) {
      document.getElementById('maxLightsPopup').style.display = 'flex';
      return;
    }
    (<HTMLInputElement>document.getElementById('posXLight')).value = '0';
    (<HTMLInputElement>document.getElementById('posYLight')).value = '0';
    (<HTMLInputElement>document.getElementById('posZLight')).value = '0';
    (<HTMLInputElement>document.getElementById('redInputLight')).value = '0';
    (<HTMLInputElement>document.getElementById('greenInputLight')).value = '0';
    (<HTMLInputElement>document.getElementById('blueInputLight')).value = '0';

    lightsPopup.style.display = 'flex';
  });

  let lightsFormClose = document.getElementById('addLightsClose');
  lightsFormClose.addEventListener('click', function () {
    lightsPopup.style.display = 'none';
  });

  /**
   * Add Light Source
   *Get input values (Position, Color)
   * Call add function
   */
  let addNewLightButton = document.getElementById('addNewLightButton');
  addNewLightButton.addEventListener('click', function () {
    let x = parseFloat((<HTMLInputElement>document.getElementById('posXLight')).value);
    let y = parseFloat((<HTMLInputElement>document.getElementById('posYLight')).value);
    let z = parseFloat((<HTMLInputElement>document.getElementById('posZLight')).value);
    let red = parseFloat((<HTMLInputElement>document.getElementById('redInputLight')).value);
    let green = parseFloat((<HTMLInputElement>document.getElementById('greenInputLight')).value);
    let blue = parseFloat((<HTMLInputElement>document.getElementById('blueInputLight')).value);

    if (isNaN(x) && isNaN(y) && isNaN(z) && isNaN(red) && isNaN(green) && isNaN(blue)) {
      lightsPopup.style.display = 'none';
      return; // Beende die Funktion, wenn alle Werte leer sind
    }

    let addedLightPosition = new Vector(x, y, z, 1);
    let addedLightColor = new Vector(red, green, blue, 1);
    addLightSource(addedLightPosition, addedLightColor);
    lightsPopup.style.display = 'none';
    renderScene();
  });
  /**
   * Alert if Maximum Number of Lights Reached
   * No more lights can be added
   */
  let maxLightsOkButton = document.getElementById('maxLightsOkButton');
  maxLightsOkButton.addEventListener('click', function () {
    document.getElementById('maxLightsPopup').style.display = 'none';
  });

  /**
   * Reset Lights
   */
  function resetLights() {
    pointLights = [
    new LightNode(new Vector(0.4, 0.4, 0.4, 1)), 
    new LightNode(new Vector(0.4, 0.4, 0.4, 1))
    ]; //Light Node with color
    updateLightSources();
    setupVisitor.setup(scenegraph);
  }
  let resetLightsButton = document.getElementById('resetLightsButton');
  resetLightsButton.addEventListener('click', resetLights);

  //---------------------------------------------------------------------- ADD AND DELETE OBJECTS ----------------------------------------------------------------------

  /**
   * "Add Objects" Popup
   * Open/Close
   * Set all values to default
   */
  let objectsPopup = document.getElementById('addObjectsPopup');
  let addObjectButton = document.getElementById('addObjectButton');
  addObjectButton.addEventListener('click', function () {
    if (clickedObj) {
      setUnclicked();
    }
    (<HTMLInputElement>document.getElementById('posXObj')).value = '0';
    (<HTMLInputElement>document.getElementById('posYObj')).value = '0';
    (<HTMLInputElement>document.getElementById('posZObj')).value = '0';
    (<HTMLInputElement>document.getElementById('redInputObj')).value = '0';
    (<HTMLInputElement>document.getElementById('greenInputObj')).value = '0';
    (<HTMLInputElement>document.getElementById('blueInputObj')).value = '0';

    objectsPopup.style.display = 'flex';
  });

  let objectsFormClose = document.getElementById('addObjectsClose');
  objectsFormClose.addEventListener('click', function () {
    objectsPopup.style.display = 'none';
  });

  /**
   * Add New Object
   * Get input values (Object Type, Position, Color, Rotation)
   * Call add function
   */
  let addNewObjectButton = document.getElementById('addNewObjectButton');
  addNewObjectButton.addEventListener('click', function () {
    let objectType = (<HTMLSelectElement>document.getElementById('objectType')).selectedIndex;
    let x = parseFloat((<HTMLInputElement>document.getElementById('posXObj')).value);
    let y = parseFloat((<HTMLInputElement>document.getElementById('posYObj')).value);
    let z = parseFloat((<HTMLInputElement>document.getElementById('posZObj')).value);
    let red = parseFloat((<HTMLInputElement>document.getElementById('redInputObj')).value);
    let green = parseFloat((<HTMLInputElement>document.getElementById('greenInputObj')).value);
    let blue = parseFloat((<HTMLInputElement>document.getElementById('blueInputObj')).value);
    let rotation = (<HTMLInputElement>document.getElementById('rotationNewObj')).checked;
    if (isNaN(x) && isNaN(y) && isNaN(z) && isNaN(red) && isNaN(green) && isNaN(blue)) {
      objectsPopup.style.display = 'none';
      return; // Beende die Funktion, wenn alle Werte leer sind
    }

    let addedObjectPosition = new Vector(x, y, z, 1);
    let addedObjectColor = new Vector(red, green, blue, 1);
    addObject(objectType, addedObjectPosition, addedObjectColor, rotation);
    objectsPopup.style.display = 'none';
    renderScene();
  });
  /**
   * Delete Selected Object
   */
  let deleteSelectedObject = document.getElementById('deleteObjectButton');
  deleteSelectedObject.addEventListener('click', function () {
    if (addedObjects.includes(clickedObj)) {
      for (let i = 0; i < addedObjects.length; i++) {
        if (addedObjects[i] === clickedObj) {
          addedObjectTranslations.splice(i, 1);
          addedObjects.splice(i, 1);
          break;
        }
      }
      loadAddedObjects();
      setupVisitor.setup(scenegraph);
      renderScene();
    }
  });

  // ---------------------------------------------------------------------- EDIT PHONG PARAMETER ----------------------------------------------------------------------
  /**
   * Update Phong Shader Parameters
   */
  function updateFields() {
    let specularExponentInput = Number(
      (document.getElementById('specular-exponent') as HTMLInputElement).value
    );
    let ambientInput = new Vector(
      ...(document.getElementById('ambient') as HTMLInputElement).value
        .match(/[0-9a-f]{2}/gi)
        .map((x: string) => parseInt(x, 16) / 255),
      0
    );
    let diffuseInput = new Vector(
      ...(document.getElementById('diffuse') as HTMLInputElement).value
        .match(/[0-9a-f]{2}/gi)
        .map((x: string) => parseInt(x, 16) / 255),
      0
    );
    let specularInput = new Vector(
      ...(document.getElementById('specular') as HTMLInputElement).value
        .match(/[0-9a-f]{2}/gi)
        .map((x: string) => parseInt(x, 16) / 255),
      0
    );

    // change the first object's material
    if (clickedObj === undefined || clickedObj == null) {
      return;
    }
    clickedObj.material = new Material(
      ambientInput,
      diffuseInput,
      specularInput,
      specularExponentInput
    ).setShader(phongShader);
    clickedObj.material.ambient = clickedObj.material.ambient.sub(new Vector(0.1, 0.1, 0.1, 1));
    clickedObj = null;
    setupVisitor.setup(scenegraph);
  }
  /**
   * Add change event listeners to input fields of phong input form
   */
  const inputs = document.querySelectorAll('input');
  inputs.forEach((input) => {
    input.addEventListener('change', () => {
      updateFields();
      renderScene();
    });
  });

  // ---------------------------------------------------------------------- CAMERA ----------------------------------------------------------------------
  /**
   * Update Camera Projection Matrix
   */
  function updateCamera() {
    let projection = Matrix.perspective(camera.fovy, camera.aspect, camera.near, camera.far);
    camera.projectionMatrix = projection;
  }

  /**
   * Reset Camera to Default Position and Orientation
   */
  let resetCamButton = document.getElementById('resetCamButton');
  resetCamButton.onclick = () => {
    resetCamera();
  };
  function resetCamera() {
    cameraTranslation.transform = new Translation(new Vector(0, 0, 1, 0));
    cameraYaw.transform = new Rotation(new Vector(0, 1, 0, 0), 0);
    cameraPitch.transform = new Rotation(new Vector(1, 0, 0, 0), 0);
    let rangeX = document.getElementById('posx') as HTMLInputElement;
    let rangeY = document.getElementById('posy') as HTMLInputElement;
    let rangeYaw = document.getElementById('yaw') as HTMLInputElement;
    let rangePitch = document.getElementById('pitch') as HTMLInputElement;
    if (rangeX) rangeX.value = '0';
    if (rangeY) rangeY.value = '0';
    if (rangeYaw) rangeYaw.value = '0';
    if (rangePitch) rangePitch.value = '0';
    camera.origin = new Vector(0, 0, 0, 1);
    camera.yaw = 0;
    camera.pitch = 0;
    cameraVisitor.setup(scenegraph);
    updateCamera();
    renderScene();
  }
  /**
   * Update Camera Position on X-axis
   */
  const posxElement = document.getElementById('posx') as HTMLInputElement;
  posxElement.oninput = () => {
    let range = document.getElementById('posx') as HTMLInputElement;
    let posx = Number(range.value) / 10;
    cameraTranslation.transform = new Translation(
      new Vector(posx, cameraTranslation.transform.getMatrix().getVal(1, 3), 1, 0)
    );
    camera.origin.x += posx;
    cameraVisitor.setup(scenegraph);
    updateCamera();
    renderScene();
  };
  /**
   * Update Camera Position on Y-axis
   */
  const posyElement = document.getElementById('posy') as HTMLInputElement;
  posyElement.oninput = () => {
    let range = document.getElementById('posy') as HTMLInputElement;
    let posy = Number(range.value) / 10;
    cameraTranslation.transform = new Translation(
      new Vector(cameraTranslation.transform.getMatrix().getVal(0, 3), posy, 1, 0)
    );
    camera.origin.y += posy;
    cameraVisitor.setup(scenegraph);
    updateCamera();
    renderScene();
  };
  /**
   * Update Camera Yaw (Horizontal Rotation)
   */
  const yawElement = document.getElementById('yaw') as HTMLInputElement;
  yawElement.oninput = () => {
    let range = document.getElementById('yaw') as HTMLInputElement;
    let yaw = Number(range.value);
    cameraYaw.transform = new Rotation(new Vector(0, 1, 0, 0), yaw);
    camera.yaw = yaw / 3;
    cameraVisitor.setup(scenegraph);
    updateCamera();
    renderScene();
  };
  /**
   * Update Camera Pitch (Vertical Rotation)
   */
  const pitchElement = document.getElementById('pitch') as HTMLInputElement;
  pitchElement.oninput = () => {
    let range = document.getElementById('pitch') as HTMLInputElement;
    let pitch = Number(range.value);
    cameraPitch.transform = new Rotation(new Vector(1, 0, 0, 0), pitch);
    camera.pitch = pitch / 2.9;
    cameraVisitor.setup(scenegraph);
    updateCamera();
    renderScene();
  };

  //------------------------------------------------- VIDEO ----------------------------------
  /**
   * Toggle Video if the Video Window is Opened/Closed
   */
  let videoOpen = false;

  function toggleVideoWindow() {
    (setupVisitor.objects.get(vidBox) as VideoTextureBox).pausePlayVideo();
  }
});

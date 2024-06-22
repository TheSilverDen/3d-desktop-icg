# ICG Projekt

# Project Structure
<!-- Ihr könnt die Projektstruktur beliebig beschreiben. Hier einfach mit dem Unix Programm `tree`  -->

```
.
├── README.md
├── dist
│   ├── obj <-- OBJ Dateien
│   ├── style
│   ├── textures <-- Texturen
│   ├── abgabe-project.html
│   └── index.html
├── docs <-- Dokumentation
│   └── scenegraph-overview.png
├── src
│   ├── math <-- Mathe Bibliothek
│   │    ├── matrix.ts
│   │    ├── vector.ts
│   │    └── vector.ts
│   ├── parser <-- Mesh Object Parser
│   ├── renderer 
│   │    ├── rasterizer
│   │    │    ├── shader <--- Vertex and Fragement Shader
│   │    │    └── shader.ts
│   │    ├── raytracer
│   │    │    ├── intersection.ts
│   │    │    ├── phong.ts
│   │    │    └── ray.ts
│   │    └── material.ts            
│   ├── scene 
│   │    ├── nodes <--- Group, Geometry and Animation nodes
│   │    ├── visitor <--- all visitors
│   │    └── camera.ts
│   ├── shapes <--- Geometry 
│   ├── ui  <-- UI html logic
│   ├── abgabe-project-boilerplate.ts <--- Boilerplate 
│   └── ...
│       
└── ...

```

The project is thematically divided into several folders. 
`dist` contains resources that are used directly in the browser. In `obj` are sample files, which can be loaded into the scene by our OBJ loader. 
Under `src` all source files are summarized, which are transpiled by `webgl`.


# Installation

Open a console and change into the directory of this file and run:
```
npm install
```

### Execution
Then type 
```bash
npm start
```
and call the server's web site using `localhost:<port>` in the browser. The port must be replaced from the console output.

# Project Overview

The following explains how to use the application:

## Rasterization and Raytracing
Two renderers - Rasterization and Raytracing - are supported. In the menu on the left side you can switch between the two renderers in the Renderer dropdown menu.

Alternatively you can switch by keyboard input. Press "c" (for change) to switch between the renderers.

## Application Windows

The project consists of a desktop on which you have several application windows. At the bottom of the taskbar you have an overview of all windows. Each icon represents a window and at the same time shows what the window is about. 
You can open or close the windows by clicking on the corresponding icon.

In addition, the windows can be opened/closed via keyboard input:
- "w" Window 1 (Sphere)
- "q" Window 2 (Pyramid)
- "e" Window 3 (Cube)
- "g" Game Window
- "v" Video Window
- "s" Squirrel

In the menu at the top of the window you can also close the window from there by clicking on the "X" icon.

To enjoy the game to the fullest, you can also play it in full screen mode. To do this, either click on the "Fullscreen" icon at the top or press "z".

## Interactive Objects

Three basic object types have been implemented. Spheres, cubes and pyramids. 
Some of the objects can be interacted with. To do this, you simply need to select an object (when selected, it will become a little brighter to indicate the selection). You can also deselect the object by clicking on it a second time.

### Lighting Parameters

In the menu, you can set objects' individual illumination parameters. To do this, select an object and then you can change the Phong parameters (ambient, diffuse, specular, and shininess) in the menu.

For semantic reasons, this is only possible for certain objects. Application windows and the objects (sphere, box, and pyramid) they contain can be changed. 
In addition, the Phong parameters of the background and taskbar can also be changed.

### Moving Objects 

Application windows can be moved with the help of a driver animation.
To do this, you need to select the object again and then you can move it using the arrow keys on the keyboard.

## Animations

Additionally, due to the above-mentioned driver and window open/close animations that can be executed interactively by the user, most of our objects are rotating due to their rotation animation. This animation is active by default, you can, however, stop and start the animation by pressing "x" or the "Start" / "Stop" button in the menu on the left.

## Light Sources 

Our application supports up to 8 light sources. Point and sphere lights are possible. At the moment, our scene graph consists of three lights - two point light sources and one yellow sphere. Two of them are moving. More light sources can also be added in runtime by clicking on the button "add light source". There, you can choose the position and color of the light source. If you want to add a moving light, you have to add it to the scene graph in the code directly. All user added light sources can be removed by pressing "reset lights".

## Adding Objects

Additionally to lights, you can also add new objects to the scene. By clicking on the "add objects" button, you can set your preferences regarding position, color in the form. Decide on the object type (sphere, pyramid or box) and if you want to have a rotation.<br>
Every own object can be moved around the scene by selecting it, just like application windows.<br>
If you want to remove the object, you can select it and press "delete selected object".

## Camera

We use one camera which is part of the scenegraph. The camera can be moved or changed interactively. The sliders on the left enable you to turn the camera in x and y direction. It is also possible to rotate it around the x and y axis by using the yaw and pitch sliders. Camera animations are also possible. In our case, one can resize the game window to full size by translating the camera in -z direction.

## Raytracing

### Raytracing All Objects

All our objects (spheres and all triangle meshes) can be rendered by the raytracer except for texture-box nodes and video-texture-boxes. Therefore, the raytracer is not as performant as the rasterizer. 

##### Object Meshes
Because of the performance, we did not include our object mesh for our raytracer scene, so that the rest of the scene can be viewed comfortably. If you want to render our squirrel as well, you can go to the file rayvisitor.ts `src/scene/visitors/rayvisitor.ts ` to line 36-40. Here, you can substitute the second argument (null) with the path to our obj file ("low-poly-squirrel.obj") and the third can be added for the colors ("low-poly-squirrel.mtl"). Now you can render the obj mesh as well. 

To improve the raytracer's performance, we implemented several optimizations.

##### Acceleration Beam Shot by Bounding Spheres
We perform intersection tests with bounding spheres for all types of boxes and pyramids before the actual intersection test. For this purpose, we use a 'UNIT_BOX_BOUNDING_SPHERE' and a 'UNIT_PYRAMID_BOUNDING_SPHERE' which we use to intersect with in the visit-functions in the Rayvisitor. The radius of the sphere for the box is √2/2, and for the pyramid, it is √1.5. We have added a value between 0.15 and 0.22 to account for possible loss.

With this logic, we ensure that significantly fewer intersection tests need to be performed for triangle mesh objects, resulting in a noticeably more efficient ray tracer.

##### Using a MatrixPrecomputationVisitor 
We implemented a MatrixPrecomputationVisitor (matrixprecomputationvisitor.ts). This visitor is used before every scenegraph traversal so that every node's matrixstack calculation only has to be done once. Each node stores the respective toWorld and fromWorld matrix, which can then be retrieved whenever needed. This serves as an acceleration for the raytracer. For consistency purposes, we also implemented the rasterizer using the MatrixPrecomputationVisitor.

##### Good to know 
If you want the Raytracer scene to load faster, you might want to set the width and height of the rayCanvas to a lower value. <br>
Just go to `dist/abgabe-project.html` to lines 42-43. Here you can choose a smaller value (e.g. 200x200px - 300x300px), while the canvas is still scaled to 600px x 600px. <br>
Of course, the scene will look pixelated. Furthermore, the mouse clicks won't work unfortunately. So only use that trick if you do not have to rely on clicks and keep in mind to change it back afterwards.


## Visitor pattern
In this project, we consistently used the visitor pattern. Besides raster-, ray- and matrixprecomputationvisitor we also used the lightsvisitor, cameravisitor, clickvisitor and rastersetupvisitor. 
The use of the visitors not only improves the performance, but also ensures a better readability and less complex computations. For example, computing the lights beforehand is important so that the effects of the light can be correctly calculated for every object, even if the lights would be traversed after the object in the scenegraph.

## Game Application - TicTacToe 

The TicTacToe game works in the usual way, by taking turns to select a field. The first player to complete a row of 3 is the winner. 
By clicking on the corresponding field or by keyboard input of the corresponding number (1 -> 1. field unw.) you can select a field. When the game is over and a player has won, either the winner is displayed. Whether won or drawn, you can start a new game by clicking on the "Replay" arrow or with keyboard input "r".

# Key Assignment

- "c" Change Renderer
- "x" Start/Stop Rotation animation
- "w" Window 1 (Sphere)
- "q" Window 2 (Pyramid)
- "e" Window 3 (Cube)
- "g" Game Window (TicTacToe)
- "v" Video Window
- "s" Squirrel
- "z" resize game window (maximize/normal size)
- "r" replay game 

- "1" tick TicTacToe Field 1 ("1" - "9" for each field tick)


# Requirements 

<!-- replace  "- [ ]" with "- [X]" when you tackled the topic -->
<!-- the bullet points are from last years requirements; you need to change the entries to reflect the current requirements -->

| Nummer | Punkte | Beschreibung                                                     | bearbeitet               | Verantwortliche/r                    | Bewertung |
| ------ | ------ | ---------------------------------------------------------------- | ------------------------ | ------------------------------------ | --------- |
| M1     | 5      | Szenengraph                                                      | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder              |           |
| M2     | 10     | Rasteriser & Ray Tracer                                          | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder              |           |
| M3     | 3      | min. drei eingebundene Objekte                                   | <ul><li>- [X] </li></ul> |Deniz Celikhan, Joanna Grause, Antonia Heyder                           |           |
| M4     | 8      | min. drei verschiedene Animationsknoten                          | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder                           |           |
| M5     | 4      | texturierte und phong-beleuchtete Objekte                        | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder                          |           |
| M6     | 5      | mathematische Bibliothek                                         | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder            |           |
| M7     | 4      | Phong WebGL Shader (Rasterisier)                                 | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder                          |           |
| M8     | 2      | 3D-Anwendungsfenster                                             | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder             |           |
| M9     | 4      | Taskleiste                                                       | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder                          |           |
| M10    | 5      | Mausklick mit Manipulation                                       | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder                         |           |
|        |        |                                                                  |                          |                                      |           |
| O1     | 7      | weitere Textur zur Beeinflussung der Beleuchtung / Transparenz (Alpha Mapping) | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder             |           |
| O2     | 3      | Videos und Text als Textur                                       | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder                          |           |
| O3     | 8      | Laden von 3D Modellen                                            | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder                                     |           |
| O4     | 4      | mehrere Lichtquellen                                             | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder                         |           |
| O5     | 6      | Lupeneffekt                                                      | <ul><li>- [ ] </li></ul> |  |           |
| O6     | 4      | Animation bei Klick                                              | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder |           |
| O7     | 8      | Kamera-Knoten                                                    | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder                                     |           |
| O8     | 5      | Beschleunigung des Raytracing                                    | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder                          |           |
| O9     | 8      | Laden & Speichern                                                | <ul><li>- [ ] </li></ul> |                                      |           |
| O10    | 7      | Raytracing aller Dreiecksnetze                                   | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder                          |           |
| O11    | 10     | Dynamische Texturen                                              | <ul><li>- [ ] </li></ul> |             |           |
| O12    | 10      | Zweite interaktive Szene                                         | <ul><li>- [ ] </li></ul> |                                      |           |
| O13    | 5      | Anwendung in den 3D Anwendungsfenstern (TicTacToe Spiel)         | <ul><li>- [X] </li></ul> |Deniz Celikhan, Joanna Grause, Antonia Heyder                                      |           |
| O14    | nach Absprache      | Eigene Implementierungsvorschläge: MatrixPrecomputationVisitor, Hinzufügen und Löschen von Objekten in Laufzeit                              | <ul><li>- [X] </li></ul> | Deniz Celikhan, Joanna Grause, Antonia Heyder                                      |                                  |           |





### Compatibility
The project has been tested with the following configurations:
<!-- Nur die Konfigurationen angeben die ihr wirklich getestet habt. Eine gängige Kombination ist hier schon ausreichend-->
- Windows 11 Build Version <22621.2283> 
  - Chrome Version <116.0.5845.188> 
  - Opera GX Version - <101.0.4843.74> 
  - node js Version <18.17.1>

- macOs Version <Ventura 13.3.1> 
  - Chrome Version <117.0.5938.62> 
  - node js Version <20.0.0>

## Used Sources

- Lecture Materials (Interaktive Computergraphik SS23)
- Chat GPT (GPT-3.5)

## Used Tools

- Prettier - Code Formatter v10.1.0

## Used Tutorials

- mdn web docs - "Animating Textures in WebGL"
 [see article](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Tutorial/Animating_textures_in_WebGL?retiredLocale=de) <br>(last visited 15.09.2023)

- unity Community Forum - "Calculating color interpolation with barycentric coordinates" [see article](https://discussions.unity.com/t/calculate-uv-coordinates-of-3d-point-on-plane-of-meshs-triangle/60938) <br>(last visited 14.09.2023)


## Used Code Snippets

- Small code snippets used from ChatGPT. Those have been tagged in the code ("Source: Chat GPT, line x-y")



import Vector from '../../math/vector';
import Material from '../material';
import Intersection from './intersection';

/**
 * Calculate the color of an object at the intersection point according to the Phong Lighting model.
 * @param intersection The intersection point
 * @param cameraPosition The position of the camera
 * @param lights The array of lights in the scene
 * @param ambientLight The ambient light in the scene
 * @param material The material of the object
 * @return The color of the object at the intersection point
 * @see https://en.wikipedia.org/wiki/Phong_reflection_model
 */
export default function phong(
  intersection: Intersection,
  cameraPosition: Vector,
  lights: { position: Vector; color: Vector }[], // we encode the light intensity in the color;
  ambientLight: { color: Vector },
  material: Material, //alles was Oberflächen eines Objektes beschreibt
  intersectionColor?: Vector
): Vector {
  let color = new Vector(0, 0, 0, 0);
  let ambientCoefficient = material.ambient; //ambiant reflectivity
  if (intersectionColor) {
    ambientCoefficient = intersectionColor;
  }
  let diffuseCoefficient = material.diffuse;
  let specularCoefficient = material.specular;
  let shininessCoefficient = material.shininess;

  let diffuseVecs = new Vector(0, 0, 0, 0);
  let specularVecs = new Vector(0, 0, 0, 0);
  let Ia = ambientCoefficient.mul(ambientLight.color); //Light Intensity
  color = color.add(Ia);

  let vectorToViewer = cameraPosition.sub(intersection.position).normalize();
  let surfaceNormal = intersection.normal.normalize();

  for (let i = 0; i < lights.length; i++) {
    let vectorToLightSource = lights[i].position.sub(intersection.position).normalize();
    let lightIntensity = lights[i].color;

    //diffuse
    let diffuseFactor = Math.max(vectorToLightSource.dot(surfaceNormal), 0);
    diffuseVecs = diffuseVecs.add(lightIntensity.mul(diffuseFactor));
    //specular
    let idealReflectionDirection = surfaceNormal
      .mul(2 * surfaceNormal.dot(vectorToLightSource))
      .sub(vectorToLightSource)
      .normalize(); //direction that a perfectly reflected ray of light would take from this point on the surface, and
    let specularFactor = Math.pow(
      Math.max(0, idealReflectionDirection.dot(vectorToViewer)),
      shininessCoefficient
    );
    specularVecs = specularVecs.add(lightIntensity.mul(specularFactor));
  }

  diffuseVecs = diffuseCoefficient.mul(diffuseVecs);
  specularVecs = specularCoefficient.mul(specularVecs);
  color = color.add(diffuseVecs);
  color = color.add(specularVecs);
  return color;
}

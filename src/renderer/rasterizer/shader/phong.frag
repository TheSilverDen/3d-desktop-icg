precision mediump float;
/**
 * Fragment Shader for applying lighting and shading to 3D objects.
 *
 * This shader calculates lighting effects such as ambient, diffuse, and specular lighting for 3D objects
 * and determines the final color of each fragment (pixel) in the rendered image.
 **/
varying vec3 v_color;
varying vec3 v_ambient_color;
varying vec3 v_diffuse_color;
varying vec3 v_specular_color;
varying vec3 v_position;
varying vec3 v_normal;
varying float v_shininess;

uniform vec3 lightColors[8]; 
uniform vec3 lightPositions[8];  
uniform vec3 sphereLightColors[2]; 
uniform vec3 sphereLightPositions[2];  
uniform float shininess;
uniform mat4 M;
uniform mat4 P;
uniform mat4 V;
uniform mat4 N;
uniform float alpha;
vec3 ambientLight = vec3(1.0, 1.0, 1.0); //ÄNDERN

/**
 * @function main - The main function of the fragment shader.
 * This function calculates ambient, diffuse, and specular lighting contributions from multiple light sources,
 * including point lights and spherical lights. It also handles fragment transparency.
 */

void main(void) {
  vec3 normal = normalize(v_normal);
  vec3 finalColor = vec3(0.0);
  vec3 ambient = vec3(0.0);
  vec3 diffuse = vec3(0.0);
  vec3 specular = vec3(0.0);

  // Apply ambient lighting
  ambient = v_ambient_color * ambientLight;
  finalColor += ambient;

  // Assuming you have up to 8 light sources
  for (int i = 0; i < 8; i++) {  
      // Transform light position to view space
      vec3 lightPosition = ( V *  vec4(lightPositions[i], 1.0)).xyz;
  
      // Calculate distance from fragment to light
      float distanceToLight = length(lightPosition - v_position);

      // Calculate light direction and reflection direction
      vec3 lightDir = normalize(lightPosition - v_position);
      vec3 viewDir = normalize(-v_position);
      vec3 reflectDir = reflect(-lightDir, normal);

      // Calculate diffuse and specular factors
      float diffuseFactor = max(dot(normal, lightDir), 0.0);
      diffuse = v_diffuse_color * lightColors[i] * diffuseFactor;

      float specularFactor = pow(max(dot(reflectDir, viewDir), 0.0), shininess);
      specular = v_specular_color * lightColors[i] * specularFactor;

      // Calculate final color by adding diffuse and specular lighting
      finalColor += ( diffuse + specular);
    }

  // Loop through spherical light sources
  for(int i = 0; i < 2; i++){

    // Transform sphere light position to view space
    vec3 sphereLightPosition = ( V *  vec4(sphereLightPositions[i], 1.0)).xyz;
    float sphereRadius = 2.0;
    vec3 sphereLightColor = sphereLightColors[i];
    vec3 viewDir = normalize(-v_position);
    
    // Calculate distance from fragment to spherical light
    float distanceToSphereLight = length(sphereLightPosition - v_position);
    
    if (distanceToSphereLight < sphereRadius) {
      // Inside the sphere radius, apply lighting contributions

      // Calculate spherical light direction
      vec3 sphereLightDir = normalize(sphereLightPosition - v_position);
      float sphereDiffuseFactor = max(dot(normal, sphereLightDir), 0.0);
      diffuse = v_diffuse_color * sphereLightColor * sphereDiffuseFactor;
      
      // Calculate the reflection direction for the spherical light
      vec3 sphereReflectDir = reflect(-sphereLightDir, normal);

      // Calculate the specular factor for the spherical light
      float sphereSpecularFactor = pow(max(dot(sphereReflectDir, viewDir), 0.0), shininess);
      specular = v_specular_color * sphereLightColor * sphereSpecularFactor;
      
      // Apply attenuation based on the distance to the spherical light
      // float sphereAttenuation = 1.0 - distanceToSphereLight / sphereRadius;
      finalColor += (diffuse + specular);
    }

  }
  
    // Handle transparency
  if (alpha < 0.01) {
    discard;
  } else {
    gl_FragColor = vec4(finalColor, 1.0);
  }
}
precision mediump float;

/**
 * Vertex-Shader für die Beleuchtung und Transformation von 3D-Objekten.
 *
 * Dieser Shader wird verwendet, um die Beleuchtungseffekte auf 3D-Objekte anzuwenden
 * und die 3D-Objekte entsprechend ihrer Transformationen zu rendern.
**/

attribute vec3 a_color;
attribute vec3 a_position;
attribute vec3 a_ambient_color;
attribute vec3 a_diffuse_color;
attribute vec3 a_specular_color;
attribute vec3 a_normal;


varying vec3 v_color;
varying vec3 v_ambient_color;
varying vec3 v_diffuse_color;
varying vec3 v_specular_color;
varying vec3 v_position;
varying vec3 v_normal;


uniform mat4 M;
uniform mat4 V;
uniform mat4 P;
uniform mat4 N;

/**
 * @function main - The main function of the vertex shader.
 * This function calculates the vertex position in world coordinates, the normalized vertex normal in world coordinates,
 * and projects the vertex position into Normalized Device Coordinates (NDC) space.
 **/
void main() {

  // Transfer vertex attributes to fragment shader variables
  v_ambient_color = a_ambient_color;
  v_diffuse_color = a_diffuse_color;
  v_specular_color = a_specular_color;
  v_color = a_color;

// Transform the vertex position from object coordinates to world coordinates
  vec4 position = V * M * vec4(a_position, 1.0); //Object > Weltkoordinatensystem
  v_position = (position).xyz;
  
  // Transform and normalize the vertex normal in world coordinates
  v_normal = normalize((N * vec4(a_normal, 0.0)).xyz);
  
  
  // Project the vertex position into Normalized Device Coordinates (NDC)
  gl_Position = P * position;
}

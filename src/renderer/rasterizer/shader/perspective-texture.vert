precision mediump float;

attribute vec3 a_position; // Main texture
attribute vec2 a_textureCoordinate;
attribute vec3 a_normal;

attribute vec3 a_lightPos;
attribute vec3 a_ambient_color;
attribute vec3 a_diffuse_color;
attribute vec3 a_specular_color;

varying vec2 v_textureCoordinate;
varying vec3 v_position;

varying vec3 v_normal; 
varying vec3 v_fragPos;
varying vec3 v_ambient_color;
varying vec3 v_diffuse_color;
varying vec3 v_specular_color;

uniform mat4 M;
uniform mat4 V;
uniform mat4 P;
uniform mat4 N; // normal matrix
uniform vec3 lightPos;

/**
 * Vertex shader for lighting calculations.
 */
void main() {
    v_ambient_color = a_ambient_color;
    v_diffuse_color = a_diffuse_color;
    v_specular_color = a_specular_color;

    // Calculate the transformed position in eye coordinates
    v_position = (V * M * vec4(a_position, 1.0)).xyz;
    
    // Calculate the transformed normal, tangent, and bitangent in eye coordinates
    v_normal = normalize(mat3(N) * a_normal);
    
    // Pass the texture coordinate to the fragment shader
    v_textureCoordinate = a_textureCoordinate;
    
    // Calculate the final transformed position
    gl_Position = P * vec4(v_position, 1.0);
}
/*
 * Attributes:
 *  Scope: Attributes are used in vertex shaders.
 *  Role: They are used to input data per vertex, such as vertex positions, normals, colors, or texture coordinates.
 *   - `a_position`: 3D position of the vertex.
 *   - `a_textureCoordinate`: Texture coordinates for mapping textures.
 *   - `a_normal`: Vertex normal for lighting calculations.
 *   - `a_lightPos`: Position of the light source.
 *   - `a_ambient_color`: Ambient color of the material.
 *   - `a_diffuse_color`: Diffuse color of the material.
 *   - `a_specular_color`: Specular color of the material.
 *      -> are attributes that receive input data per vertex.
 *
 * Varyings:
 *  Scope: Varyings are used to communicate data from a vertex shader to a fragment shader.
 *  Role: They allow passing interpolated values from vertex to fragment shaders. These values 
 *  can change smoothly across the surface of a triangle (or other primitive) 
 *  and are typically used for things like colors or texture coordinates.
 *   - `v_textureCoordinate`: Texture coordinate passed to the fragment shader.
 *   - `v_position`: Transformed vertex position in eye coordinates.
 *   - `v_normal`: Transformed vertex normal in eye coordinates.
 *   - `v_fragPos`: Fragment position in eye coordinates.
 *   - `v_ambient_color`: Ambient color varying.
 *   - `v_diffuse_color`: Diffuse color varying.
 *   - `v_specular_color`: Specular color varying.
 *
 * Uniforms:
 *  Scope: Uniforms can be used in both vertex and fragment shaders.
 *  Role: They are constant values that remain the same for all vertices or 
 *  fragments processed by a shader during a draw call. Uniforms are typically used 
 *  for values like transformation matrices, lighting parameters, or global settings.
 *   - `M`: Model matrix.
 *   - `V`: View matrix.
 *   - `P`: Projection matrix.
 *   - `N`: Normal matrix (used for transforming normals).
 *   - `lightPos`: Position of the light source in world coordinates.
 */
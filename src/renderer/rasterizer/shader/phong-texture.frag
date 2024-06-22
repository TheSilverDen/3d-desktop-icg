precision mediump float;
/**
 * Fragment Shader for textured 3D objects with lighting and transparency.
 *
 * This shader applies textures to 3D objects and calculates lighting effects, including ambient, diffuse,
 * and specular lighting, based on the provided normal map and alpha map. It also handles transparency
 * for the fragments, allowing for partially transparent regions in the texture.
 *
 **/
uniform sampler2D sampler; 
uniform sampler2D u_normalMap; 
uniform sampler2D u_alphaMap;

varying vec2 v_textureCoordinate;
varying vec3 v_position;
varying vec3 v_normal;

vec3 ambientLight = vec3(1.0, 1.0, 1.0);
const float shininess = 100.0;
varying vec3 v_ambient_color;
varying vec3 v_diffuse_color;
varying vec3 v_specular_color;

uniform vec3 lightPositions[8];
uniform vec3 lightColors[8];
uniform vec3 sphereLightColors[2]; 
uniform vec3 sphereLightPositions[2]; 

uniform mat4 M;
uniform mat4 P;
uniform mat4 V;
uniform mat4 N;

void main(void) {
    vec3 color = vec3(0.0);
    vec3 ambient = vec3(0.0);
    vec3 diffuse = vec3(0.0);
    vec3 specular = vec3(0.0);
    
    // Retrieve texture color based on the texture coordinates
    vec4 textureColor = texture2D(sampler, v_textureCoordinate);

    // Fetch the normal from the normal map
    vec3 normal = texture2D(u_normalMap, v_textureCoordinate).xyz * 2.0 - 1.0;
    normal = normalize(normal);

    // Retrieve alpha value from the alpha map
    float alpha = texture2D(u_alphaMap, v_textureCoordinate).a;


    // Apply ambient lighting
    ambient = v_ambient_color * ambientLight;
    color += ambient;

    //Iterate through the lights (a maximum of 8 light sources is assumed) 
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

        color += diffuse + specular;

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
            color += (diffuse + specular);
        }


    }

     // Final color: Mix ambient, diffuse, specular, and texture color, and multiply by alpha
    vec4 fragColor = vec4(color * textureColor.rgb, min(textureColor.a, alpha));


    // Discard fragments with low alpha values to handle transparency
    if(alpha < 1.0){
        discard;
    }else{
        gl_FragColor = fragColor;
    }
     
}

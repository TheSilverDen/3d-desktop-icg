precision mediump float;
/**
 * Fragment Shader for combining textures, normal mapping, lighting, and transparency.
 *
 * This shader combines multiple textures, including the main texture, normal map, alpha map, and video texture,
 * and calculates lighting effects (ambient, diffuse, and specular lighting) based on the normal map. It also
 * handles transparency for the fragments, allowing for partially transparent regions in the textures.
 **/
uniform sampler2D sampler; // Main texture
uniform sampler2D u_normalMap; // Normal map texture
uniform sampler2D u_alphaMap; // Alpha map texture
uniform sampler2D videoTexture; // Video texture

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
    vec3 diffuse = vec3(0.0);
    vec3 specular = vec3(0.0);
    // Retrieve color from the main texture based on texture coordinates
    vec4 textureColor = texture2D(sampler, v_textureCoordinate);

    // Fetch the normal from the normal map 
    vec3 normal = texture2D(u_normalMap, v_textureCoordinate).xyz * 2.0 - 1.0;
    normal = normalize(normal);

     // Retrieve alpha value from the alpha map
    float alpha = texture2D(u_alphaMap, v_textureCoordinate).a;

    // Retrieve color from the video texture based on texture coordinates
    vec4 videoTextureColor = texture2D(videoTexture, v_textureCoordinate);
    
    vec3 color = vec3(0.0);

    // Ambient
    vec3 ambient = v_ambient_color * ambientLight;
    color += ambient;

    //Iterate through the lights (a maximum of 8 light sources is assumed) 
    for (int i = 0; i < 8; i++) {
        vec3 lightDir = lightPositions[i] - v_position;
        lightDir = normalize(lightDir);
    
        // Diffuse
        float diffuseIntensity = max(dot(normal, lightDir), 0.0);
        diffuse = v_diffuse_color * lightColors[i] * diffuseIntensity;

        // Betrachterrichtung normalisieren
        vec3 viewDir = normalize(-v_position);

        // Calculate the reflected light direction
        vec3 reflectDir = reflect(-lightDir, normal);

        // Specular
        float specularFactor = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
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

    // Combine colors from the main texture and the video texture based on the alpha value
    vec3 colorWithoutPhong = mix(textureColor.rgb, videoTextureColor.rgb, alpha);

    // Final fragment color: Combine lighting effects and final color, considering transparency
    vec4 fragColor = vec4(color * colorWithoutPhong, min(textureColor.a, alpha));

    // Discard fragments with low alpha values to handle transparency
    if(alpha < 1.0){
       discard;
    }else{
        gl_FragColor = fragColor;
    
    }
}

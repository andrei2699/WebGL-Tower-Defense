// const vertexShaderSource = `
//     precision mediump float;

//     attribute vec4 aVertexPosition;
//     attribute vec3 aVertexColor;

//     uniform mat4 uWorldMatrix;
//     // uniform mat4 uModelViewMatrix;
//     // uniform mat4 uProjectionMatrix;

//     varying vec3 vVertexColor;

//     void main(void) {
//         vVertexColor = aVertexColor;

//         gl_Position = uWorldMatrix * aVertexPosition;// uProjectionMatrix * uModelViewMatrix * aVertexPosition;
//     }
// `;

// const fragmentShaderSource = `
//     precision mediump float;

//     varying vec3 vVertexColor;

//     // uniform vec3 uLightDirection;
//     // uniform vec3 uLightColor;
//     // uniform vec3 uAmbientLightColor;

//     void main(void) {
//         // vec3 lightDirection = normalize(uLightDirection);
//         // float lightFalloff = max(0.0, dot(lightDirection, vVertexNormal));
//         // vec3 diffuseLight = uLightColor * lightFalloff;
//         // vec4 texelColor = texture2D(uSampler, vTextureCoord);
//         // vec3 light = uAmbientLightColor + diffuseLight;

//         // gl_FragColor = vec4(texelColor.rgb * light, texelColor.a);
//         gl_FragColor = vec4(vVertexColor, 1.0);
//   }  
// `;

// const vertexShaderSource = `
//     precision mediump float;

//     attribute vec4 aVertexPosition;
//     attribute vec3 aVertexColor;
//     attribute vec3 aVertexNormal;
//     attribute vec2 aTextureCoord;

//     uniform mat4 uModelMatrix;
//     uniform mat4 uViewMatrix;
//     uniform mat4 uProjectionMatrix;

//     uniform mat4 uNormalMatrix;

//     varying vec3 vVertexColor;
//     varying vec2 vTextureCoord;
//     varying vec3 vVertexNormal;

//     void main(void) {
//         vVertexColor = aVertexColor;
//         vTextureCoord = aTextureCoord;
//         vVertexNormal = aVertexNormal;
//         //vVertexNormal = (uNormalMatrix * vec4(aVertexNormal, 1)).xyz;

//         gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * aVertexPosition;
//     }
// `;

// const fragmentShaderSource = `
//     precision mediump float;

//     varying vec3 vVertexColor;
//     varying vec2 vTextureCoord;
//     varying vec3 vVertexNormal;

//     uniform vec3 uLightDirection;
//     uniform vec3 uLightColor;
//     uniform vec3 uAmbientLightColor;

//     uniform sampler2D uSampler;

//     void main(void) {
//         vec4 texelColor = texture2D(uSampler, vTextureCoord);

//         vec3 lightDirection = normalize(uLightDirection);
//         float lightFalloff = max(0.0, dot(lightDirection, vVertexNormal));
//         vec3 diffuseLight = uLightColor * lightFalloff;
//         vec3 light = uAmbientLightColor + diffuseLight;

//         gl_FragColor = vec4(texelColor.rgb * light, texelColor.a);
//   }  
// `;

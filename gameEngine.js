'use strict'


function createArrayPattern(n, pattern) {
    return [...Array(n)].reduce(sum => sum.concat(pattern), []);
}

function loadTexture(gl, url) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
        width, height, border, srcFormat, srcType,
        pixel);

    const image = new Image();
    image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
            srcFormat, srcType, image);

        // WebGL1 has different requirements for power of 2 images
        // vs non power of 2 images so check if the image is a
        // power of 2 in both dimensions.
        if (isPowerOf2(image.width) && isPowerOf2(image.height)) {
            // Yes, it's a power of 2. Generate mips.
            gl.generateMipmap(gl.TEXTURE_2D);
        } else {
            // No, it's not a power of 2. Turn of mips and set
            // wrapping to clamp to edge
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }
    };
    image.src = url;

    return texture;
}

function isPowerOf2(value) {
    return (value & (value - 1)) == 0;
}

var Transform = function (position) {
    if (!position) {
        position = [0, 0, 0];
    }
    this.scale = [1, 1, 1];
    this.position = position;
    this.right = [1, 0, 0];
    this.up = [0, 1, 0];
    this.forward = [0, 0, 1];
    this.rotation = quat.create();
    this._realign();
    this.eulerAngles = [0, 0, 0];

    this.modelMatrix = mat4.create();
}

Transform.prototype._realign = function () {
    vec3.transformQuat(this.forward, [0, 0, 1], this.rotation);
    vec3.transformQuat(this.right, [1, 0, 0], this.rotation);
    vec3.transformQuat(this.up, [0, 1, 0], this.rotation);

    vec3.normalize(this.forward, this.forward);
    vec3.normalize(this.right, this.right);
    vec3.normalize(this.up, this.up);
};

Transform.prototype.localToWorld = function (point) {
    var rightTemp = vec3.clone(this.right);
    vec3.scale(rightTemp, rightTemp, point[0]);

    var upTemp = vec3.clone(this.up);
    vec3.scale(upTemp, upTemp, point[1]);

    var forwardTemp = vec3.clone(this.forward);
    vec3.scale(forwardTemp, forwardTemp, point[2]);

    var worldOffset = rightTemp;

    vec3.add(worldOffset, worldOffset, upTemp);
    vec3.add(worldOffset, worldOffset, forwardTemp);


    vec3.add(worldOffset, worldOffset, this.position);

    return worldOffset;
}

Transform.prototype.worldToLocal = function (point) {
    var localOffset = vec3.clone(point);
    vec3.subtract(localOffset, localOffset, this.position);

    return [
        vec3.dot(localOffset, this.right),
        vec3.dot(localOffset, this.up),
        vec3.dot(localOffset, this.forward)
    ];
}

Transform.prototype.translate = function (pos) {
    this.position = vec3.clone(pos);
}

Transform.prototype.rotate = function (rotation) {
    this.rotation = quat.clone(rotation);
}

Transform.prototype.rescale = function (size) {
    this.scale = vec3.clone(size);
}

Transform.prototype.moveForward = function (amount) {
    vec3.scaleAndAdd(this.position, this.position, this.forward, amount);
}

Transform.prototype.moveRight = function (amount) {
    vec3.scaleAndAdd(this.position, this.position, this.right, amount);
}

Transform.prototype.moveUp = function (amount) {
    vec3.scaleAndAdd(this.position, this.position, this.up, amount);
}

Transform.prototype.rotateX = function (amount) {
    this.eulerAngles[0] += amount;
    quat.fromEuler(this.rotation, this.eulerAngles[0], this.eulerAngles[1], this.eulerAngles[2]);
    this._realign();
}

Transform.prototype.rotateY = function (amount) {
    this.eulerAngles[1] += amount;
    quat.fromEuler(this.rotation, this.eulerAngles[0], this.eulerAngles[1], this.eulerAngles[2]);

    this._realign();
}

Transform.prototype.rotateZ = function (amount) {
    this.eulerAngles[2] += amount;
    quat.fromEuler(this.rotation, this.eulerAngles[0], this.eulerAngles[1], this.eulerAngles[2]);

    this._realign();
}

Transform.prototype.rotate = function (rotation) {
    this.rotateX(rotation[0]);
    this.rotateY(rotation[1]);
    this.rotateZ(rotation[2]);
}

Transform.prototype.getTransformation = function () {
    mat4.identity(this.modelMatrix);
    mat4.translate(this.modelMatrix, this.modelMatrix, this.position);


    mat4.scale(this.modelMatrix, this.modelMatrix, this.scale);

    var rotationMatrix = [0, 0, 0, 0];
    mat4.fromQuat(rotationMatrix, this.rotation);
    mat4.multiply(this.modelMatrix, this.modelMatrix, rotationMatrix);

    // mat4.rotateZ(this.modelMatrix, this.modelMatrix, this.eulerAngles[2]);
    // mat4.rotateY(this.modelMatrix, this.modelMatrix, this.eulerAngles[1]);
    // mat4.rotateX(this.modelMatrix, this.modelMatrix, this.eulerAngles[0]);

    return this.modelMatrix;
}

var GameObject = function (components) {
    this.transform = new Transform();
    this.components = [];

    if (components) {
        for (let i = 0; i < components.length; i++) {
            this.attachComponent(components[i]);
        }
    }
}

GameObject.prototype.update = function () {
    for (var i = 0; i < this.components.length; i++) {
        this.components[i].update();
    }
}

GameObject.prototype.attachComponent = function (component) {
    this.components.push(component);
    component.init(this);
}

GameObject.prototype.getComponent = function (componentType) {
    for (var i = 0; i < this.components.length; i++) {
        if (this.components[i] instanceof componentType) {
            return this.components[i];
        }
    }

    return undefined;
}


var MeshData = function (vertices, indices, normals, uvCoords, vertexColors) {
    this.vertices = vertices;
    this.indices = indices;
    this.normals = normals;
    this.uvCoords = uvCoords;
    this.vertexColors = vertexColors;
}

var MeshRenderer = function (gl, viewMatrix, projectionMatrix, meshData, material, drawType) {
    if (!drawType) {
        drawType = gl.TRIANGLES
    }
    this.drawType = drawType;
    this.gl = gl;
    this.viewMatrix = viewMatrix;
    this.projectionMatrix = projectionMatrix;
    this.material = material;

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.vertices), gl.STATIC_DRAW);
    material.applyAttribute(gl, 'vertexPositions', 3, gl.FLOAT, false, 0, 0);

    this.ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(meshData.indices), gl.STATIC_DRAW);
    this.nPoints = meshData.indices.length;

    if (meshData.normals && meshData.normals.length > 0) {
        this.nbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.normals), gl.STATIC_DRAW);
        material.applyAttribute(gl, 'vertexNormals', 3, gl.FLOAT, false, 0, 0);
    }

    if (meshData.uvCoords && meshData.uvCoords.length > 0) {
        this.uvbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.uvCoords), gl.STATIC_DRAW);
        material.applyAttribute(gl, 'vertexUvs', 2, gl.FLOAT, false, 0, 0);
    }

    if (meshData.vertexColors && meshData.vertexColors.length > 0) {
        this.colorsBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorsBO);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(meshData.vertexColors), gl.STATIC_DRAW);
        material.applyAttribute(gl, 'vertexColors', 3, gl.FLOAT, false, 0, 0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

MeshRenderer.prototype.init = function (gameobject) {
    this.normalMatrix = mat4.create();
    this.mvMatrix = mat4.create();
    this.gameobjectTransform = gameobject.transform;
}

MeshRenderer.prototype.update = function () {
    var gl = this.gl;

    this.calculateMatrices();
    this.material.apply(gl, this.mvMatrix, this.projectionMatrix, this.normalMatrix);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    this.material.applyAttribute(gl, 'vertexPositions', 3, gl.FLOAT, false, 0, 0);

    if (this.nbo) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
        this.material.applyAttribute(gl, 'vertexNormals', 3, gl.FLOAT, false, 0, 0);
    }

    if (this.uvbo) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.uvbo);
        this.material.applyAttribute(gl, 'vertexUvs', 2, gl.FLOAT, false, 0, 0);
    }

    if (this.colorsBO) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorsBO);
        this.material.applyAttribute(gl, 'vertexColors', 3, gl.FLOAT, false, 0, 0);
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
    gl.drawElements(this.drawType, this.nPoints, gl.UNSIGNED_SHORT, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
}

MeshRenderer.prototype.calculateMatrices = function () {
    mat4.multiply(this.mvMatrix, this.viewMatrix, this.gameobjectTransform.getTransformation());

    mat4.invert(this.normalMatrix, this.mvMatrix);
    mat4.transpose(this.normalMatrix, this.normalMatrix);
}

var Camera = function (fov, aspect, near, far) {
    this.projectionMatrix = mat4.create();
    this.viewMatrix = mat4.create();
    this.setPerspective(fov, aspect, near, far);
};

Camera.prototype.calculateClipSpacePositionInWorldSpace = function (mouseX, mouseY) {

    var projectionViewMatrix = mat4.create();
    mat4.invert(projectionViewMatrix, this.projectionMatrix);

    var vector = [mouseX, mouseY, -1, 1.0];
    vec4.transformMat4(vector, vector, projectionViewMatrix);

    vector[2] = -1;
    vector[3] = 0;

    var matrix = mat4.create();
    mat4.invert(matrix, this.viewMatrix);

    vec4.transformMat4(vector, vector, matrix);

    var rayDirection = [
        vector[0],
        vector[1],
        vector[2],
    ];

    vec3.normalize(rayDirection, rayDirection);
    var rayStart = [0, 0, 0];
    vec3.add(rayStart, rayDirection, this.gameobjectTransform.position);

    return {
        direction: rayDirection,
        point: rayStart
    };
}

Camera.prototype.init = function (gameobject) {
    this.gameobjectTransform = gameobject.transform;
}

Camera.prototype.update = function () {
    mat4.invert(this.viewMatrix, this.gameobjectTransform.getTransformation());
}

Camera.prototype.setPerspective = function (fov, aspect, near, far) {
    this.far = far;
    this.near = near;
    mat4.perspective(this.projectionMatrix, fov, aspect, near, far);
}

function createPlanePrimitiveMeshData(color) {
    if (!color) {
        color = [1.0, 1.0, 1.0, 1.0];
    }

    return new MeshData(
        [
            -1, 0, -1,
            -1, 0, 1,
            1, 0, 1,
            1, 0, -1
        ],
        [0, 1, 2, 0, 2, 3],
        [
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,
            0.0, 1.0, 0.0,],
        [
            0.0, 0.0,
            0.0, 1.0,
            1.0, 1.0,
            1.0, 0.0,
        ],
        createArrayPattern(4, color)
    );
}

function createBoxPrimitiveMeshData(color) {

    if (!color) {
        color = [1.0, 1.0, 1.0, 1.0];
    }

    const vertices = [

        // Front face
        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,

        // Back face
        -0.5, -0.5, -0.5,
        -0.5, 0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, -0.5, -0.5,

        // Top face
        -0.5, 0.5, -0.5,
        -0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,

        // Bottom face
        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5,
        -0.5, -0.5, 0.5,

        // Right face
        0.5, -0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, 0.5, 0.5,
        0.5, -0.5, 0.5,

        // Left face
        -0.5, -0.5, -0.5,
        -0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, 0.5, -0.5,
    ];

    const indices = [
        0, 1, 2, 0, 2, 3,    // front
        4, 5, 6, 4, 6, 7,    // back
        8, 9, 10, 8, 10, 11,   // top
        12, 13, 14, 12, 14, 15,   // bottom
        16, 17, 18, 16, 18, 19,   // right
        20, 21, 22, 20, 22, 23,   // left
    ];

    const vertexNormals = [
        // Front
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,
        0.0, 0.0, 1.0,

        // Back
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,
        0.0, 0.0, -1.0,

        // Top
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,
        0.0, 1.0, 0.0,

        // Bottom
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,
        0.0, -1.0, 0.0,

        // Right
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,

        // Left
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        -1.0, 0.0, 0.0
    ];

    const textureCoordinates = [
        // Front
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Back
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Top
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Bottom
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Right
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        // Left
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];

    return new MeshData(vertices, indices, vertexNormals, textureCoordinates, createArrayPattern(vertices.length, color));
}

/**
 * 
 * PHYSICS
 * 
 */

var Collider = function (gl, viewMatrix, projectionMatrix, scale) {
    this.debug = false;
    this.gl = gl;
    this.viewMatrix = viewMatrix;
    this.projectionMatrix = projectionMatrix;
    this.mvMatrix = mat4.create();
    this.colliderTransform = new Transform();
    this.scale = scale;
}

var BoxCollider = function (gl, viewMatrix, projectionMatrix, scale) {
    Collider.call(this, gl, viewMatrix, projectionMatrix, scale);
}

BoxCollider.prototype.init = function (gameobject) {
    this.mvMatrix = mat4.create();
    this.gameobjectTransform = gameobject.transform;

    this.vertices = [
        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,

        -0.5, -0.5, -0.5,
        -0.5, -0.5, 0.5,

        -0.5, -0.5, -0.5,
        -0.5, 0.5, -0.5,

        0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,

        0.5, 0.5, 0.5,
        0.5, -0.5, 0.5,

        0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,

        -0.5, 0.5, 0.5,
        -0.5, -0.5, 0.5,

        -0.5, 0.5, -0.5,
        -0.5, 0.5, 0.5,

        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,

        0.5, 0.5, -0.5,
        -0.5, 0.5, -0.5,

        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5,

        0.5, -0.5, -0.5,
        0.5, 0.5, -0.5,
    ];

    var gl = this.gl;

    this.material = new UnlitMaterial(gl, [0.0, 1.0, 0.0, 1.0]);

    this.vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this.vertices), gl.STATIC_DRAW);
    this.material.applyAttribute(gl, 'vertexPositions', 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

BoxCollider.prototype.update = function () {
    var gl = this.gl;

    if (!this.debug) {
        return;
    }

    this._updateCollider();

    mat4.multiply(this.mvMatrix, this.viewMatrix, this.colliderTransform.getTransformation());
    this.material.apply(gl, this.mvMatrix, this.projectionMatrix, undefined);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    this.material.applyAttribute(gl, 'vertexPositions', 3, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.LINES, 0, this.vertices.length);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

BoxCollider.prototype._updateCollider = function () {
    var scale = [0, 0, 0]
    vec3.multiply(scale, this.scale, this.gameobjectTransform.scale);
    this.colliderTransform.rescale(scale);
    this.colliderTransform.translate(this.gameobjectTransform.position);
}

BoxCollider.prototype.checkCollision = function (ray) {
    var minCorner = [-0.5, -0.5, -0.5, 1];
    var maxCorner = [0.5, 0.5, 0.5, 1];
    this._updateCollider();
    var worldTransform = this.colliderTransform.getTransformation();

    minCorner = vec4.transformMat4(minCorner, minCorner, worldTransform);
    maxCorner = vec4.transformMat4(maxCorner, maxCorner, worldTransform);

    var t1 = (minCorner[0] - ray.point[0]) / ray.direction[0];
    var t2 = (maxCorner[0] - ray.point[0]) / ray.direction[0];
    var t3 = (minCorner[1] - ray.point[1]) / ray.direction[1];
    var t4 = (maxCorner[1] - ray.point[1]) / ray.direction[1];
    var t5 = (minCorner[2] - ray.point[2]) / ray.direction[2];
    var t6 = (maxCorner[2] - ray.point[2]) / ray.direction[2];

    var tmin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
    var tmax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

    if (tmax < 0) {
        return undefined;
    }

    if (tmin > tmax) {
        return undefined;
    }

    var t = tmin < 0 ? tmax : tmin;

    var collisionPoint = vec3.clone(ray.point);

    vec3.scale(collisionPoint, ray.direction, t);
    vec3.add(collisionPoint, collisionPoint, ray.point);

    return collisionPoint;
}

/**
 * 
 *  SHADERS
 * 
*/

class Shader {

    /**
     * vertexPositions
     * vertexNormals
     * vertexUvs
     * vertexColors
     * 
     * this must be declared in the attribLocations of the shader
     * 
     * uniformLocations must contain a uViewModelMatrix, uNormalMatrix and uProjectionMatrix uniform
     * 
     */

    constructor(gl, vsSource, fsSource) {
        this.shaderProgram = initShaderProgram(gl, vsSource, fsSource);

        this.attribLocations = new Map();
        this.uniformLocations = new Map();

        function initShaderProgram(gl, vsSource, fsSource) {
            const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
            const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

            const shaderProgram = gl.createProgram();
            gl.attachShader(shaderProgram, vertexShader);
            gl.attachShader(shaderProgram, fragmentShader);
            gl.linkProgram(shaderProgram);

            if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
                alert('Unable to initialize the shader program');
                console.log(gl.getProgramInfoLog(shaderProgram));
                return null;
            }

            return shaderProgram;
        }

        function loadShader(gl, type, source) {
            const shader = gl.createShader(type);

            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                const t = type == gl.FRAGMENT_SHADER ? 'fragment' : 'vertex';
                alert('An error occurred compiling the ' + t + ' shader:');
                console.log(gl.getShaderInfoLog(shader))
                gl.deleteShader(shader);
                return null;
            }

            return shader;
        }
    }

    use(gl) {
        if (this.shaderProgram) {
            gl.useProgram(this.shaderProgram);
        }
    }

    getAttribLocation(attributeName) {
        return this.attribLocations.get(attributeName);
    }
}

class Material {
    constructor(shader) {
        this.shader = shader;
    }

    applyAttribute(gl, attributeName, size, type, normalized, stride, offset) {
        const location = this.shader.getAttribLocation(attributeName);

        if (location != undefined) {
            gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
            gl.enableVertexAttribArray(location);
        }
    }

    apply(gl, viewModelMatrix, projectionMatrix, normalMatrix) {
        this.shader.use(gl);
        gl.uniformMatrix4fv(this.shader.uniformLocations.get('viewModelMatrix'), false, viewModelMatrix);
        if (normalMatrix) {
            gl.uniformMatrix4fv(this.shader.uniformLocations.get('normalMatrix'), false, normalMatrix);
        }
        gl.uniformMatrix4fv(this.shader.uniformLocations.get('projectionMatrix'), false, projectionMatrix);
    }
}

class LitTextureShader extends Shader {
    constructor(gl) {
        const vsSource = `
            precision mediump float;

            attribute vec3 aPosition;
            attribute vec2 aUV;
            attribute vec3 aNormal;
            attribute vec3 aColor;

            varying vec3 worldNormal;
            varying vec4 vColor;
            varying vec2 vUV;

            uniform mat4 uViewModelMatrix;
            uniform mat4 uProjectionMatrix;
            uniform mat4 uNormalMatrix;

            void main() {
                vColor = vec4(aColor, 1.0);
                worldNormal = (uNormalMatrix * vec4(aNormal, 1)).xyz;
                vUV = aUV;

                gl_Position = uProjectionMatrix * uViewModelMatrix * vec4(aPosition, 1);
            }
        `;

        const fsSource = `
            precision mediump float;

            const vec3 lightDirection = normalize(vec3(0, 1.0, 1.0));
            const float ambient = 0.1;

            varying vec3 worldNormal;
            varying vec4 vColor;
            varying vec2 vUV;
            
            uniform sampler2D uTextureID;

            void main() {
                vec4 texel = texture2D(uTextureID, vUV);
                float diffuse = max(0.0, dot(worldNormal, lightDirection));
                
                float vBrightness = ambient + diffuse;
                texel.xyz *= vBrightness;

                bool hasTexture = (texel.x + texel.y + texel.z) > 0.0;
                if (hasTexture) {
                    gl_FragColor = texel;
                } else {
                    gl_FragColor = vColor * vBrightness;
                }
            }
        `;

        super(gl, vsSource, fsSource);

        this.attribLocations.set('vertexPositions', gl.getAttribLocation(this.shaderProgram, 'aPosition'));
        this.attribLocations.set('vertexUvs', gl.getAttribLocation(this.shaderProgram, 'aUV'));
        this.attribLocations.set('vertexNormals', gl.getAttribLocation(this.shaderProgram, 'aNormal'));
        this.attribLocations.set('vertexColors', gl.getAttribLocation(this.shaderProgram, 'aColor'));

        this.uniformLocations.set('viewModelMatrix', gl.getUniformLocation(this.shaderProgram, 'uViewModelMatrix'));
        this.uniformLocations.set('normalMatrix', gl.getUniformLocation(this.shaderProgram, 'uNormalMatrix'));
        this.uniformLocations.set('projectionMatrix', gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'));

        this.uniformLocations.set('textureID', gl.getUniformLocation(this.shaderProgram, 'uTextureID'));
    }
}

class LitTextureMaterial extends Material {

    static unlitshader = null;

    constructor(gl, texture) {
        if (!LitTextureMaterial.unlitshader) {
            LitTextureMaterial.unlitshader = new LitTextureShader(gl);
        }
        super(LitTextureMaterial.unlitshader);
        this.texture = texture;
    }

    apply(gl, viewModelMatrix, projectionMatrix, normalMatrix) {
        super.apply(gl, viewModelMatrix, projectionMatrix, normalMatrix);
        if (this.texture) {
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.uniform1i(this.shader.uniformLocations.get('textureID'), 0);
        }
    }
}

class UnlitShader extends Shader {
    constructor(gl) {
        const vsSource = `
            precision mediump float;

            attribute vec3 aPosition;

            uniform mat4 uViewModelMatrix;
            uniform mat4 uProjectionMatrix;

            void main() {
                gl_Position = uProjectionMatrix * uViewModelMatrix * vec4(aPosition, 1);
            }
        `;

        const fsSource = `
            precision mediump float;
            
            uniform vec4 uTintColor;

            void main() {
                gl_FragColor = uTintColor;
            }
        `;

        super(gl, vsSource, fsSource);

        this.attribLocations.set('vertexPositions', gl.getAttribLocation(this.shaderProgram, 'aPosition'));

        this.uniformLocations.set('viewModelMatrix', gl.getUniformLocation(this.shaderProgram, 'uViewModelMatrix'));
        this.uniformLocations.set('projectionMatrix', gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'));

        this.uniformLocations.set('uTintColor', gl.getUniformLocation(this.shaderProgram, 'uTintColor'));
    }
}

class UnlitMaterial extends Material {

    static unlitshader = null;

    constructor(gl, color) {
        if (!UnlitMaterial.unlitshader) {
            UnlitMaterial.unlitshader = new UnlitShader(gl);
        }
        super(UnlitMaterial.unlitshader);
        this.color = color;
    }

    apply(gl, viewModelMatrix, projectionMatrix, normalMatrix) {
        super.apply(gl, viewModelMatrix, projectionMatrix);
        gl.uniform4fv(this.shader.uniformLocations.get('uTintColor'), this.color);
    }
}
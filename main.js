var gameobject;
var otherGameobject;

var camera;
var gameObjects

var pressedKeys = {
	Up: false,
	Right: false,
	Down: false,
	Left: false,
	Forward: false,
	Back: false,

	RotLeft: false,
	RotRight: false,
};

const MouseSensitivity = 0.25;

var colliders = [];

var LockCameraMouseRotation = false;

const MoveForwardSpeed = 10;
const RotateSpeed = 500;

function Init() {
	const canvas = document.querySelector('#glcanvas');
	const gl = canvas.getContext('webgl');

	if (!gl) {
		gl = canvas.getContext('experimental-webgl');
	}

	if (!gl) {
		alert('Unable to initialize WebGL. Your browser or machine may not support it.');
		return;
	}

	canvas.requestPointerLock = canvas.requestPointerLock ||
		canvas.mozRequestPointerLock;

	document.exitPointerLock = document.exitPointerLock ||
		document.mozExitPointerLock;

	window.addEventListener('keydown', (e) => handleKeyInput(e.code, true, canvas));
	window.addEventListener('keyup', (e) => handleKeyInput(e.code, false, canvas));
	window.addEventListener('resize', (e) => OnWindowResize(gl));
	document.addEventListener('mousedown', (e) => OnMouseDown(e, gl));
	document.addEventListener('mousemove', (e) => OnMouseMove(e, gl));

	OnWindowResize(gl);

	camera = new Camera(75 * Math.PI / 180, canvas.width / canvas.height, 1e-4, 1e10);

	var cameraGameObject = new GameObject([camera]);
	// camera.gameobjectTransform.translate([-0.5, 2, 5]);
	camera.gameobjectTransform.translate([0, 3, 2]);

	var cubeMeshData = createBoxPrimitiveMeshData([1.0, 1.0, 0.0, 1.0]);

	var modelMeshRenderer = new MeshRenderer(gl, camera.viewMatrix, camera.projectionMatrix, cubeMeshData, new UnlitMaterial(gl, [1.0, 0.5, 1.0, 1.0]));//, vertices, indices, vertexNormals, textureCoordinates, []);
	var otherModelRenderer = new MeshRenderer(gl, camera.viewMatrix, camera.projectionMatrix, cubeMeshData, new LitTextureMaterial(gl, loadTexture(gl, `cubetexture.png`)));

	var collider = new BoxCollider(gl, camera.viewMatrix, camera.projectionMatrix, [1.5, 1.5, 1.5]);
	collider.debug = true;
	colliders.push(collider);

	gameobject = new GameObject([modelMeshRenderer, collider]);
	otherGameobject = new GameObject([otherModelRenderer]);
	// var plane = new GameObject(new Mesh(gl, planeMeshData, new LitTextureMaterial(litTextureShader, loadTexture(gl, `seat.png`))));

	gl.clearColor(0.6, 0.6, 0.6, 1.0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);
	gl.depthFunc(gl.LEQUAL);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gameObjects = [cameraGameObject, gameobject, otherGameobject];

	for (var i = 0; i < 10; i++) {
		for (var j = 0; j < 10; j++) {
			var p = new GameObject([new MeshRenderer(gl, camera.viewMatrix, camera.projectionMatrix, createPlanePrimitiveMeshData([1.0, 0.5, 0.7, 1.0]), new LitTextureMaterial(gl, loadTexture(gl, 'cubeTexture.png')))]);
			// p.transform.rotateX(Math.PI / 4);
			p.transform.translate([i * 2, 0, j * 2]);
			gameObjects.push(p);
		}
	}

	// camera.gameobjectTransform.rotateX(-Math.PI / 6);

	gameobject.transform.translate([0, 2, 0]);
	otherGameobject.transform.rescale([0.5, 0.5, 0.5]);

	// var forward = new MeshRenderer(gl, camera.viewMatrix, camera.projectionMatrix, cubeMeshData, new UnlitMaterial(gl, [0.0, 0.0, 1.0, 1.0]));
	// var right = new MeshRenderer(gl, camera.viewMatrix, camera.projectionMatrix, cubeMeshData, new UnlitMaterial(gl, [1.0, 0.0, 0.0, 1.0]));
	// var up = new MeshRenderer(gl, camera.viewMatrix, camera.projectionMatrix, cubeMeshData, new UnlitMaterial(gl, [0.0, 1.0, 0.0, 1.0])); 0

	// var forwardGO = new GameObject([forward]);
	// var rightGO = new GameObject([right]);
	// var upGO = new GameObject([up]);

	// forwardGO.transform.rescale([0.55, 0.55, 0.55]);
	// rightGO.transform.rescale([0.55, 0.55, 0.55]);
	// upGO.transform.rescale([0.15, 0.15, 0.15]);

	// gameObjects.push(forwardGO);
	// gameObjects.push(rightGO);
	// gameObjects.push(upGO);

	canvas.requestPointerLock();

	var then = 0;
	function animate(now) {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		now *= 0.001;  // convert to seconds
		const deltaTime = now - then;
		then = now;
		requestAnimationFrame(animate);

		// gameobject.transform.rotateY(deltaTime * 10);
		gameobject.transform.rotateX(deltaTime * 10);
		// gameobject.transform.moveForward(deltaTime)

		handleMovement(deltaTime);

		// var pos = vec3.clone(gameobject.transform.position);
		// var tmp = [0, 0, 0];

		// vec3.add(tmp, pos, gameobject.transform.forward);
		// forwardGO.transform.translate(tmp);

		// vec3.add(tmp, pos, gameobject.transform.right);
		// rightGO.transform.translate(tmp);

		// vec3.add(tmp, pos, gameobject.transform.up);
		// upGO.transform.translate(tmp);

		for (var i = 0; i < gameObjects.length; i++) {
			gameObjects[i].update();
		}

	}

	animate(0);
}

function handleMovement(deltaTime) {

	if (pressedKeys.RotLeft) {
		camera.gameobjectTransform.rotateY(deltaTime * RotateSpeed);
	}
	if (pressedKeys.RotRight) {
		camera.gameobjectTransform.rotateY(-deltaTime * RotateSpeed);
	}

	if (pressedKeys.Forward) {
		camera.gameobjectTransform.moveForward(-deltaTime * MoveForwardSpeed);
	}
	if (pressedKeys.Back) {
		camera.gameobjectTransform.moveForward(deltaTime * MoveForwardSpeed);
	}
	if (pressedKeys.Left) {
		camera.gameobjectTransform.moveRight(-deltaTime * MoveForwardSpeed);
	}
	if (pressedKeys.Right) {
		camera.gameobjectTransform.moveRight(deltaTime * MoveForwardSpeed);
	}
	if (pressedKeys.Up) {
		camera.gameobjectTransform.moveUp(deltaTime * MoveForwardSpeed);
	}
	if (pressedKeys.Down) {
		camera.gameobjectTransform.moveUp(-deltaTime * MoveForwardSpeed);
	}
}

function OnMouseMove(e, gl) {
	if (!LockCameraMouseRotation) {
		camera.gameobjectTransform.rotateX(-e.movementY * MouseSensitivity);
		camera.gameobjectTransform.rotateY(-e.movementX * MouseSensitivity);
	}

	var pos = getNoPaddingNoBorderCanvasRelativeMousePosition(gl, e);
	var ray = camera.calculateClipSpacePositionInWorldSpace(pos.x, pos.y);
	var mouseWorldPos = ray.point;

	var dir = vec3.clone(ray.direction);
	var r = [0, 0, 0];
	var add = [0, 0, 0];
	vec3.scale(r, dir, 10);
	vec3.add(add, mouseWorldPos, r);

	for (let i = 0; i < colliders.length; i++) {

		var collision = colliders[i].checkCollision(ray);
		if (collision) {
			otherGameobject.transform.translate(collision);
			// console.log(collision);
		}
	}

}

function OnMouseDown(gl, e) {
	return;

	console.log(getNoPaddingNoBorderCanvasRelativeMousePosition(gl, e));
	var pos = getNoPaddingNoBorderCanvasRelativeMousePosition(gl, e);
	var mouseWorldPos = camera.calculateClipSpacePositionInWorldSpace(pos.x, pos.y, 10)

	var add = [0, 0, 0];
	vec3.add(add, mouseWorldPos, camera.gameobjectTransform.forward)

	console.log(mouseWorldPos, add);

}

function handleKeyInput(keyCode, pressed, canvas) {
	switch (keyCode) {
		case 'KeyW':
			pressedKeys.Forward = pressed;
			break;

		case 'KeyS':
			pressedKeys.Back = pressed;
			break;

		case 'KeyA':
			pressedKeys.Left = pressed;
			break;

		case 'KeyD':
			pressedKeys.Right = pressed;
			break;

		case 'Space':
			pressedKeys.Up = pressed;
			break;

		case 'ShiftLeft':
			pressedKeys.Down = pressed;
			break;

		case 'KeyQ':
			pressedKeys.RotLeft = pressed;
			break;

		case 'KeyE':
			pressedKeys.RotRight = pressed;
			break;

		case 'KeyF':
			{
				if (pressed) {
					LockCameraMouseRotation = !LockCameraMouseRotation;
					if (LockCameraMouseRotation) {
						document.exitPointerLock();
					}
					else {
						canvas.requestPointerLock();
					}
				}
			}
			break;


		case 'KeyG': {
			if (pressed) {
				for (let i = 0; i < colliders.length; i++) {
					colliders[i].debug = !colliders[i].debug;
				}

			}
		}
		// case 'KeyF':
		// 	{
		// 		canvas.requestPointerLock();
		// 		LockCameraMouseRotation = false;
		// 	}
		// 	break;
	}
}

function OnWindowResize(gl) {
	var targetHeight = window.innerWidth * 9 / 16;

	if (window.innerHeight > targetHeight) {
		gl.canvas.width = window.innerWidth;
		gl.canvas.height = targetHeight;
		gl.canvas.style.left = '0px';
		gl.canvas.style.top = (window.innerHeight - targetHeight) / 2 + 'px';
	} else {
		gl.canvas.width = window.innerHeight * 16 / 9;
		gl.canvas.height = window.innerHeight;
		gl.canvas.style.left = (window.innerWidth - gl.canvas.width) / 2 + 'px';
		gl.canvas.style.top = '0px';
	}

	gl.canvas.height -= 20;

	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
}

function getRelativeMousePosition(event, target) {
	target = target || event.target;
	var rect = target.getBoundingClientRect();

	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top,
	}
}

function getNoPaddingNoBorderCanvasRelativeMousePosition(gl, event, target) {
	target = target || event.target;
	var pos = getRelativeMousePosition(event, target);

	pos.x = (2 * pos.x) / gl.canvas.width - 1;
	pos.y = 1 - (2 * pos.y) / gl.canvas.height;

	// pos.x = pos.x / gl.canvas.width * 2 - 1;
	// pos.y = pos.y / gl.canvas.height * -2 + 1;

	// pos.x = pos.x * target.width / target.clientWidth;
	// pos.y = pos.y * target.height / target.clientHeight;

	return pos;
}

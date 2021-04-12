var simpleEnemy;

var camera;
var gameObjects;

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
var gamePaused = false;

var LockCameraMouseRotation = false;

const MoveForwardSpeed = 10;
const RotateSpeed = 500;

function Init() {

	loadTextResource("/models/Shape.json", (_, model) => {

		var models = new Map();
		models['cat'] = JSON.parse(model)[0];

		loadTextResource("/levels/level1.json", (_, res) => {
			const map = JSON.parse(res);
			LoadLevel(map, models);
		});
	});
}

function LoadLevel(map, models) {
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

	InitUI('uiparent');

	// CreateMenu();
	// PauseGame(true);

	OnWindowResize(gl);

	camera = new Camera(75 * Math.PI / 180, canvas.width / canvas.height, 1e-4, 1e10);

	var cameraGameObject = new GameObject([camera]);
	// camera.gameobjectTransform.translate([-0.5, 2, 5]);
	camera.gameobjectTransform.translate([0, 3, 2]);

	var catMeshData = CreateMeshDataFromJSONObj(models['cat']);

	// var modelMeshRenderer = new MeshRenderer(gl, camera.viewMatrix, camera.projectionMatrix, cubeMeshData, new UnlitMaterial(gl, [1.0, 0.5, 1.0, 1.0]));//, vertices, indices, vertexNormals, textureCoordinates, []);
	// var otherModelRenderer = new MeshRenderer(gl, camera.viewMatrix, camera.projectionMatrix, cubeMeshData, new LitTextureMaterial(gl, loadTexture(gl, `cubetexture.png`)));

	// var collider = new BoxCollider(gl, camera.viewMatrix, camera.projectionMatrix, [1.5, 1.5, 1.5]);
	// collider.debug = true;
	// colliders.push(collider);

	// gameobject = new GameObject([modelMeshRenderer, collider]);
	// otherGameobject = new GameObject([otherModelRenderer]);

	gl.clearColor(0.6, 0.6, 0.6, 1.0);
	gl.clearDepth(1.0);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);
	gl.frontFace(gl.CCW);
	gl.cullFace(gl.BACK);
	gl.depthFunc(gl.LEQUAL);

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gameObjects = [cameraGameObject];

	var startPoint = [0, 0, 0];
	var waypoints = [];

	for (let i = 0; i < map.mapsize; i++) {
		const mapRow = map.map[i];
		for (let j = 0; j < mapRow.length; j++) {
			const element = mapRow[j];
			var p;

			if (element == 2) {
				startPoint = [i * 2, 0.5, j * 2];
			}

			if (element == 0) {
				p = new GameObject([new MeshRenderer(gl, camera.viewMatrix, camera.projectionMatrix,
					createPlanePrimitiveMeshData([1.0, 0.5, 0.7, 1.0]), new UnlitMaterial(gl, [1.0, 0.5, 0.5, 1.0]))]);
			}
			else {
				waypoints.push([i * 2, 0.5, j * 2]);
				p = new GameObject([new MeshRenderer(gl, camera.viewMatrix, camera.projectionMatrix, createPlanePrimitiveMeshData([1.0, 0.5, 0.7, 1.0]), new LitTextureMaterial(gl, loadTexture(gl, 'cubeTexture.png')))]);
			}

			p.transform.translate([i * 2, 0, j * 2]);
			gameObjects.push(p);

		}
	}

	simpleEnemy = new GameObject([
		new MeshRenderer(gl, camera.viewMatrix, camera.projectionMatrix, catMeshData, new LitTextureMaterial(gl, loadTexture(gl, `cubetexture.png`))),
		new SimpleEnemyComponent(0, waypoints)
	]);
	simpleEnemy.transform.translate(startPoint);
	simpleEnemy.transform.rescale([0.5, 0.5, 0.5]);

	gameObjects.push(simpleEnemy);

	canvas.requestPointerLock();

	var then = 0;
	function animate(now) {
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

		now *= 0.001;  // convert to seconds
		const deltaTime = now - then;
		then = now;
		requestAnimationFrame(animate);

		handleMovement(deltaTime);

		for (var i = 0; i < gameObjects.length; i++) {
			gameObjects[i].update(deltaTime);
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
	if (gamePaused) {
		return;
	}

	if (!LockCameraMouseRotation) {
		camera.gameobjectTransform.rotateX(-e.movementY * MouseSensitivity);
		camera.gameobjectTransform.rotateY(-e.movementX * MouseSensitivity);
	}

	// var pos = getNoPaddingNoBorderCanvasRelativeMousePosition(gl, e);
	// var ray = camera.calculateClipSpacePositionInWorldSpace(pos.x, pos.y);
	// var mouseWorldPos = ray.point;

	// var dir = vec3.clone(ray.direction);
	// var r = [0, 0, 0];
	// var add = [0, 0, 0];
	// vec3.scale(r, dir, 10);
	// vec3.add(add, mouseWorldPos, r);

	// for (let i = 0; i < colliders.length; i++) {

	// 	var collision = colliders[i].checkCollision(ray);
	// 	if (collision) {
	// 		otherGameobject.transform.translate(collision);
	// 		// console.log(collision);
	// 	}
	// }

}

function OnMouseDown(gl, e) {
	if (gamePaused) {
		return;
	}
	return;

	console.log(getNoPaddingNoBorderCanvasRelativeMousePosition(gl, e));
	var pos = getNoPaddingNoBorderCanvasRelativeMousePosition(gl, e);
	var mouseWorldPos = camera.calculateClipSpacePositionInWorldSpace(pos.x, pos.y, 10)

	var add = [0, 0, 0];
	vec3.add(add, mouseWorldPos, camera.gameobjectTransform.forward)

	console.log(mouseWorldPos, add);

}

function handleKeyInput(keyCode, pressed, canvas) {
	if (gamePaused) {
		return;
	}

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

function PauseGame(paused) {
	gamePaused = paused;
	ShowUI(gamePaused);
}

function CreateMenu() {
	var mainMenuPanel = CreatePanel(null, [80, 80], '#8e8e8eAA', 'column');
	CreateLabel(mainMenuPanel, [100, 10], "Main Menu", 3, 'white');
	CreateButton(mainMenuPanel, [10, 5], "Play", (e) => { console.log("Button!") }, 10);
	CreateButton(mainMenuPanel, [10, 5], "Settings", (e) => { console.log("Button!") }, 10);
}

var SimpleEnemyComponent = function (speed, waypoints) {
	this.speed = speed;
	this.waypoints = waypoints;
	this.currentWayPointIndex = 0;
}

SimpleEnemyComponent.prototype.init = function (gameobject) {
	this.gameobjectTransform = gameobject.transform;
}

SimpleEnemyComponent.prototype.update = function (dt) {
	if (this.currentWayPointIndex >= this.waypoints.length) {
		return;
	}

	var distance = vec3.distance(this.waypoints[this.currentWayPointIndex], this.gameobjectTransform.position);

	if (distance < 0.1) {
		this.currentWayPointIndex++;

		if (this.currentWayPointIndex >= this.waypoints.length) {
			return;
		}
		var targetDirection = this.gameobjectTransform.calculateMoveTowardsDirection(this.waypoints[this.currentWayPointIndex]);
		var angle = Math.atan2(targetDirection[0], targetDirection[2]);
		this.gameobjectTransform.setRotation([0, (angle * 180) / Math.PI, 0]);
	}

	var targetDirection = this.gameobjectTransform.calculateMoveTowardsDirection(this.waypoints[this.currentWayPointIndex]);

	vec3.scale(targetDirection, targetDirection, dt * this.speed);
	vec3.add(targetDirection, targetDirection, this.gameobjectTransform.position);

	this.gameobjectTransform.translate(targetDirection);
}
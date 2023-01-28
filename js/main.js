import {Clock, RepeatWrapping, WebGLRenderer, Scene, PerspectiveCamera, sRGBEncoding, HemisphereLight, DirectionalLight, TextureLoader, Vector3, Raycaster, AnimationMixer, Mesh, PlaneGeometry, MeshPhongMaterial} from './three.module.js'
import { GLTFLoader } from './gltfLoader.module.js'
import { FBXLoader } from './fbxLoader.module.js'

if (location.protocol.startsWith('https')) {
	navigator.serviceWorker.register('service-worker.js')
	navigator.serviceWorker.onmessage = m => {
		console.info('Update found!')
		if (m?.data == 'update') location.reload(true)
	}
}

const UP = 12
const LEFT = 14
const RIGHT = 15
const DOWN = 13
const X = 2
const Y = 3
const A = 0
const B = 1
const RB = 5
const RT = 7
const LB = 4
const LT = 6
const MENU = 9
const WIND = 8

const clock = new Clock()
const renderer = new WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true})
renderer.shadowMap.enabled = true
const camera = new PerspectiveCamera(75, document.documentElement.clientWidth / document.documentElement.clientHeight, 0.1, 1000)
const hemisphereLight = new HemisphereLight(0xffffff, 0x000000, 0.5)
const dirLight = new DirectionalLight(0xffffff, 0.1)
const gltfLoader = new GLTFLoader()
const textureLoader = new TextureLoader()
const fbxLoader = new FBXLoader()
const scene = new Scene()
const audio = new Audio()
const keysPressed = {}

var hero
var animations
var mixer
var idleAction, walkAction, walkBackAction, runAction, jumpAction, jumpRunningAction, backflipAction, rotateLeftAction, rotateRightAction, punchRightAction, punchLeftAction, kickAction

var fps = 0
var frames = 0
var fpsLimit = isPC() ? null : 1 / 60
var gamepad
var gamepadVibrating = false
var jumping = false
var clockDelta = 0
var touchControl = !(localStorage.getItem('touch') == 'false')
var bgmSource
var lastFrameTime = performance.now()
var audioAuthorized = false
var audioContext
var audioGain
var bgmBuffer
var dummyCamera
var mixer
var animations = []
var actions = []
var isWalking, isRunning, isRotating, isSteppingBack, isPunching, isKicking, isJumping, isBackingFlip
var lastAction
var bgmVolume = 0.5

scene.background = null
renderer.outputEncoding = sRGBEncoding
hemisphereLight.position.set(0, -50, -50)
dirLight.position.set(0, 0, 5)
dirLight.castShadow = true
renderer.setClearColor(0x000000, 0)
scene.add(hemisphereLight)
scene.add(dirLight)

gltfLoader.load('./models/hero.glb',
	gltf => {
		hero = gltf.scene
		/* hero.vertices = getVertices(hero) */
		hero.traverse(object => {if (object.isMesh) object.castShadow = true})
		dummyCamera = camera.clone()
		dummyCamera.position.set(0, hero.position.y+5, hero.position.z-10)
		dummyCamera.lookAt(0, 5, 0)
		hero.add(dummyCamera)
		scene.add(hero)
		mixer = new AnimationMixer(hero)
		loadAnimations()
		resizeScene()
		loadField()
		animate()
		initControls()
	}, undefined, error => {
		console.log(error)
	}
)

function loadAnimations() {
	fbxLoader.load('./models/idle.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		idleAction = mixer.clipAction(animation)
		lastAction = idleAction
		idleAction.play()
	}, undefined, error => {
		console.log(error)
	})
	fbxLoader.load('./models/walking.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		walkAction = mixer.clipAction(animation)
	}, undefined, error => {
		console.log(error)
	})
	fbxLoader.load('./models/walkingBack.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		walkBackAction = mixer.clipAction(animation)
	}, undefined, error => {
		console.log(error)
	})
	fbxLoader.load('./models/running.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		runAction = mixer.clipAction(animation)
	}, undefined, error => {
		console.log(error)
	})
	fbxLoader.load('./models/jumping.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		jumpAction = mixer.clipAction(animation)
	}, undefined, error => {
		console.log(error)
	})
	fbxLoader.load('./models/jumpingRunning.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		jumpRunningAction = mixer.clipAction(animation)
	}, undefined, error => {
		console.log(error)
	})
	fbxLoader.load('./models/backflip.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		backflipAction = mixer.clipAction(animation)
	}, undefined, error => {
		console.log(error)
	})
	fbxLoader.load('./models/punchingRight.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		punchRightAction = mixer.clipAction(animation)
	}, undefined, error => {
		console.log(error)
	})
	fbxLoader.load('./models/punchingLeft.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		punchLeftAction = mixer.clipAction(animation)
	}, undefined, error => {
		console.log(error)
	})
	fbxLoader.load('./models/turningLeft.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		rotateLeftAction = mixer.clipAction(animation)
	}, undefined, error => {
		console.log(error)
	})
	fbxLoader.load('./models/kick.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		kickAction = mixer.clipAction(animation)
	}, undefined, error => {
		console.log(error)
	})
	fbxLoader.load('./models/turningRight.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		rotateRightAction = mixer.clipAction(animation)
	}, undefined, error => {
		console.log(error)
	})
}

function loadField() {
	textureLoader.load('./textures/ground.webp', texture => {
		texture.wrapS = RepeatWrapping
		texture.wrapT = RepeatWrapping
		texture.repeat.set(parseInt(texture.wrapS / 200), parseInt(texture.wrapT / 200))
		const mesh = new Mesh(new PlaneGeometry(200, 200), new MeshPhongMaterial({map: texture}))
		mesh.rotation.x = - Math.PI / 2
		mesh.receiveShadow = true
		scene.add(mesh)
	}, undefined, error => {
		console.log(error)
	})
}

function resizeScene() {
	camera.aspect = document.documentElement.clientWidth / document.documentElement.clientHeight
	camera.updateProjectionMatrix()
	renderer.setSize(document.documentElement.clientWidth, document.documentElement.clientHeight)
}

function animate() {
	requestAnimationFrame(animate)
	if (document.hidden) return
	clockDelta += clock.getDelta()
	if (fpsLimit && clockDelta < fpsLimit) return
	renderer.render(scene, camera)
	mixer?.update(clockDelta)
	updateFPSCounter()
	updateCamera()
	updateActions()
	/* updateGamepad() */
	clockDelta = fpsLimit ? clockDelta % fpsLimit : clockDelta % (1 / Math.max(fps, 30))
}

function updateFPSCounter() {
	frames++
	if (performance.now() < lastFrameTime + 1000) return
	fps = Math.round(( frames * 1000 ) / ( performance.now() - lastFrameTime ))
	if (!Number.isNaN(fps)) {
		let ctx = document.querySelector('#fps').getContext('2d')
		ctx.font = 'bold 20px sans-serif'
		ctx.textAlign = 'end'
		ctx.fillStyle = 'rgba(255,255,255,0.25)'
		ctx.clearRect(0, 0, 80, 20)
		ctx.fillText(`${fps} FPS`, 80, 20)
	}
	lastFrameTime = performance.now()
	frames = 0
}

function updateGamepad() {
	gamepad = navigator.getGamepads().find(el => el?.connected)
	if (gamepad) {
		if (!audioAuthorized && gamepad.buttons.some(el => el.pressed)) initAudio()
		document.querySelectorAll('footer')?.forEach(el => el.classList.add('hide'))
		document.querySelector('#menu-button-gamepad').classList.remove('off')
		document.querySelector('#menu-button-touch-on').classList.add('off')
		document.querySelector('#menu-button-touch-off').classList.add('off')
	} else if (!gamepad && touchControl) {
		document.querySelectorAll('footer')?.forEach(el => el.classList.remove('hide'))
	}
	if (!gamepad) {
		if (touchControl) {
			document.querySelector('#menu-button-gamepad').classList.add('off')
			document.querySelector('#menu-button-touch-off').classList.remove('off')
		}
		return
	}
	if (gamepad.axes[0] <= -0.5 || gamepad.buttons[LEFT].pressed) rotate = 'left'
	else if (gamepad.axes[0] >= 0.5 || gamepad.buttons[RIGHT].pressed) rotate = 'right'
	else if (gamepad.axes[1] <= -0.5 || gamepad.buttons[UP].pressed) rotate = 'up'
	else if (gamepad.axes[1] >= 0.5 || gamepad.buttons[DOWN].pressed) rotate = 'down'
	else rotate = null
	jumping = gamepad.buttons[A].pressed || gamepad.buttons[B].pressed || gamepad.buttons[X].pressed || gamepad.buttons[Y].pressed
	if (jumping && !gamepadVibrating) vibrateGamepad()
}

function updateCamera() {
	if (!hero) return
	let target = hero.clone()
	dummyCamera.getWorldPosition(target.position)
	dummyCamera.getWorldQuaternion(target.quaternion)
	camera.position.lerp(target.position, 0.25)
	camera.quaternion.slerp(target.quaternion, 0.25)
}

function updateActions() {
	if (!hero) return
	let w = actions.includes('walk')
	let r = actions.includes('run')
	let p = actions.includes('punch')
	let k = actions.includes('kick')
	let t = actions.find(el => el == 'turn-left' || el == 'turn-right')
	let sb = actions.includes('step-back')
	let b = actions.includes('backflip')
	let j = actions.includes('jump')
	let returnAction = w ? (r ? runAction : walkAction) : idleAction
	if (!isPunching && p) {
		isPunching = true
		syncPunchActions()
	} else if (isPunching && !p) {
		isPunching = false
		executeCrossFade(lastAction, returnAction, 0.25)
	}
	if (p) return
	if (!isKicking && k) {
		executeCrossFade(lastAction, kickAction, 0.25)
		isKicking = true
	} else if (isKicking && !k) {
		executeCrossFade(lastAction, returnAction, 0.25)
		isKicking = false
	}
	if (k) return
	if (actions.includes('turn-left')) hero.rotation.y += r ? 0.025 : 0.01
	if (actions.includes('turn-right')) hero.rotation.y -= r ? 0.025 : 0.01
	if (w && !isWalking) {
		executeCrossFade(lastAction, walkAction, 0.25)
		isWalking = true
	} else if (!w && isWalking) {
		executeCrossFade(lastAction, idleAction, 0.25)
		isWalking = false
		isRunning = false
	}
	if (w) {
		updateWalk(r)
		if (r && !isRunning) {
			executeCrossFade(lastAction, runAction, 0.25)
			isRunning = true
		} else if (!r && isRunning) {
			executeCrossFade(lastAction, returnAction, 0.25)
			isRunning = false
		}
	}
	if (!isJumping && j) {
		executeCrossFade(lastAction, w ? jumpRunningAction : jumpAction, 0.25)
		isJumping = true
	} else if (isJumping && !j) {
		executeCrossFade(lastAction, returnAction, 0.25)
		isJumping = false
	}
	if (w) return
	if (sb && !isSteppingBack) {
		executeCrossFade(lastAction, walkBackAction, 0.25)
		isSteppingBack = true
	} else if (!sb && isSteppingBack) {
		executeCrossFade(lastAction, returnAction, 0.25)
		isSteppingBack = false
	}
	if (sb) updateWalk(false, true, 0.025)
	if (sb) return
	if (!isRotating && t) {
		executeCrossFade(lastAction, actions.includes('turn-left') ? rotateLeftAction : rotateRightAction, 0.25)
		isRotating = true
	} else if (isRotating && !t) {
		executeCrossFade(lastAction, returnAction, 0.25)
		isRotating = false
	}
}

function updateWalk(running=false, back=false, speed=0.1) {
	let dir = camera.getWorldDirection(hero.clone().position)
	if (back) {
		dir.x *= -1
		dir.y *= -1
		dir.z *= -1
	}
	if (isBackingFlip) setTimeout(() => {hero.position.add(dir.multiplyScalar(0.1))}, 500)
	else hero.position.add(dir.multiplyScalar(running ? 0.25 : speed))
}

function synchronizeCrossFade(startAction, endAction, duration) {
	mixer.addEventListener('loop', onLoopFinished)
	function onLoopFinished(event) {
		if (event.action === startAction) {
			mixer.removeEventListener('loop', onLoopFinished)
			executeCrossFade(startAction, endAction, duration)
		}
	}
}

function executeCrossFade(startAction, endAction, duration) {
	if (!startAction || !endAction) return
	lastAction = endAction
	endAction.enabled = true
	endAction.setEffectiveTimeScale(1)
	endAction.setEffectiveWeight(1)
	endAction.time = 0
	startAction.crossFadeTo(endAction, duration, true)
	endAction.play()
}

function syncPunchActions() {
	let netxAction = punchRightAction
	executeCrossFade(idleAction, punchRightAction, 0.5)
	mixer.addEventListener('loop', onLoopFinished)
	function onLoopFinished(event) {
		if (!isPunching) {
			return mixer.removeEventListener('loop', onLoopFinished)
		} else if (event.action === punchRightAction) {
			netxAction = punchLeftAction
		} else if (event.action === punchLeftAction) {
			netxAction = punchRightAction
		}
		executeCrossFade(event.action, netxAction, 0.25)
	}
}

/* function vibrateGamepad() {
	if (!gamepad) return
	gamepadVibrating = true
	gamepad.vibrationActuator.playEffect(gamepad.vibrationActuator.type, {
		startDelay: 0,
		duration: 0.1,
		weakMagnitude: 0.1,
		strongMagnitude: 0.25,
	})
	.then(() => {
		if (jumping) vibrateGamepad()
	})
	.finally(() => {
		if (!jumping) gamepadVibrating = false
	})
} */

/* function getVertices(obj) {
	let vertices = []
	if (obj.geometry) {
		vertices= [...vertices, obj.geometry.attributes.position]
	} else {
		for (let i in obj.children) {
			vertices= [...vertices, ...getVertices(obj.children[i])]
		}
	}
	return vertices
}
function colisionCheck(a, b) {
	return a.vertices.some((el, i) => {
		let localVertex = new Vector3().fromBufferAttribute(el, i).clone()
		let globalVertex = localVertex.applyMatrix4(a.matrix)
		let directionVector = globalVertex.sub(a.position)
		let ray = new Raycaster(a.position, directionVector.normalize())
		let collisionResults = ray.intersectObjects([b])
		return collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()
	})
}
function collide(a, b) {
	let collide = colisionCheck(a, b)
	if (collide) return true
	collide = colisionCheck(b, a)
	if (collide) return true
	collide = a.position.z==b.position.z&&a.position.x==b.position.x&&a.position.y==b.position.y
	return collide
} */

window.onkeydown = e => {
	if (!hero) return
	//console.log(e)
	keysPressed[e.keyCode] = true
	if (keysPressed[13] && !actions.includes('punch')) actions.push('punch')
	if (keysPressed[32] && !actions.includes('run')) actions.push('run')
	if (keysPressed[65] && !actions.includes('turn-left')) actions.push('turn-left')
	if (keysPressed[68] && !actions.includes('turn-right')) actions.push('turn-right')
	if (keysPressed[87] && !actions.includes('walk')) actions.push('walk')
	/* if (keysPressed[83] && !actions.includes('backflip')) actions.push('backflip') */
	if (keysPressed[83] && !actions.includes('step-back')) actions.push('step-back')
	if (keysPressed[74] && !actions.includes('jump')) actions.push('jump')
	if (keysPressed[75] && !actions.includes('kick')) actions.push('kick')
}
window.onkeyup = e => {
	keysPressed[e.keyCode] = false
	if (e.keyCode == 13) actions.splice(actions.findIndex(el => el == 'punch'), 1)
	if (e.keyCode == 32) actions.splice(actions.findIndex(el => el == 'run'), 1)
	if (e.keyCode == 65) actions.splice(actions.findIndex(el => el == 'turn-left'), 1)
	if (e.keyCode == 68) actions.splice(actions.findIndex(el => el == 'turn-right'), 1)
	if (e.keyCode == 87) actions.splice(actions.findIndex(el => el == 'walk'), 1)
	/* if (e.keyCode == 83) actions.splice(actions.findIndex(el => el == 'backflip'), 1) */
	if (e.keyCode == 83) actions.splice(actions.findIndex(el => el == 'step-back'), 1)
	if (e.keyCode == 74) actions.splice(actions.findIndex(el => el == 'jump'), 1)
	if (e.keyCode == 75) actions.splice(actions.findIndex(el => el == 'kick'), 1)
}

function initControls() {
	document.querySelector('#button-config').onclick = e => {
		e.stopPropagation()
		document.querySelector('#menu-config').classList.toggle('opened')
	}
	document.querySelector('#menu-button-music-off').onclick = e => {
		e.stopPropagation()
		localStorage.setItem('bgm', 'false')
		document.querySelector('#menu-button-music-off').classList.add('off')
		document.querySelector('#menu-button-music-on').classList.remove('off')
		if (bgmSource) bgmSource.stop()
	}
	document.querySelector('#menu-button-music-on').onclick = e => {
		e.stopPropagation()
		localStorage.setItem('bgm', 'true')
		document.querySelector('#menu-button-music-on').classList.add('off')
		document.querySelector('#menu-button-music-off').classList.remove('off')
		playBGM()
	}
	document.querySelector('#menu-button-touch-off').onclick = e => {
		e.stopPropagation()
		touchControl = false
		localStorage.setItem('touch', 'false')
		document.querySelector('#menu-button-touch-off').classList.add('off')
		document.querySelector('#menu-button-touch-on').classList.remove('off')
		document.querySelectorAll('footer')?.forEach(el => el.classList.add('hide'))
	}
	document.querySelector('#menu-button-touch-on').onclick = e => {
		e.stopPropagation()
		touchControl = true
		localStorage.setItem('touch', 'true')
		document.querySelector('#menu-button-touch-on').classList.add('off')
		document.querySelector('#menu-button-touch-off').classList.remove('off')
		document.querySelectorAll('footer')?.forEach(el => el.classList.remove('hide'))
	}
	const buttonForward = document.querySelector('#button-forward')
	buttonForward.ontouchmove = e => {
		if (!buttonForward.posX && buttonForward.getClientRects()) buttonForward.posX = buttonForward.getClientRects()[0].x
		if (!actions.includes('turn-left') && e.changedTouches[0].pageX < (buttonForward.posX)) {
				actions.push('turn-left')
				document.querySelector('#button-left').classList.add('active')
		} else if (actions.includes('turn-left')) {
			actions.splice(actions.findIndex(el => el == 'turn-left'), 1)
			document.querySelector('#button-left').classList.remove('active')
		}
		if (!actions.includes('turn-right') && e.changedTouches[0].pageX > (buttonForward.posX+64)) {
				actions.push('turn-right')
				document.querySelector('#button-right').classList.add('active')
		} else if (actions.includes('turn-right')) {
			actions.splice(actions.findIndex(el => el == 'turn-right'), 1)
			document.querySelector('#button-right').classList.remove('active')
		}
	}
	buttonForward.ontouchstart = () => {
		if (!actions.includes('walk')) actions.push('walk')
		buttonForward.classList.add('active')
	}
	buttonForward.ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'walk'), 1)
		if (actions.includes('turn-left')) actions.splice(actions.findIndex(el => el == 'turn-left'), 1)
		if (actions.includes('turn-right')) actions.splice(actions.findIndex(el => el == 'turn-right'), 1)
		buttonForward.classList.remove('active')
		document.querySelector('#button-left').classList.remove('active')
		document.querySelector('#button-right').classList.remove('active')
	}
	document.querySelector('#button-backward').ontouchstart = () => {
		if (!actions.includes('step-back')) actions.push('step-back')
	}
	document.querySelector('#button-backward').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'step-back'), 1)
	}
	document.querySelector('#button-left').ontouchstart = () => {
		if (!actions.includes('turn-left')) actions.push('turn-left')
	}
	document.querySelector('#button-left').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'turn-left'), 1)
	}
	document.querySelector('#button-right').ontouchstart = () => {
		if (!actions.includes('turn-right')) actions.push('turn-right')
	}
	document.querySelector('#button-right').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'turn-right'), 1)
	}
	document.querySelector('#button-run').ontouchstart = () => {
		if (!actions.includes('run')) actions.push('run')
	}
	document.querySelector('#button-run').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'run'), 1)
	}
	document.querySelector('#button-attack').ontouchstart = () => {
		if (!actions.includes('punch')) actions.push('punch')
	}
	document.querySelector('#button-attack').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'punch'), 1)
	}
	document.querySelector('#button-kick').ontouchstart = () => {
		if (!actions.includes('kick')) actions.push('kick')
	}
	document.querySelector('#button-kick').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'kick'), 1)
	}
	document.querySelector('#button-jump').ontouchstart = () => {
		if (!actions.includes('jump')) actions.push('jump')
	}
	document.querySelector('#button-jump').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'jump'), 1)
	}
	document.querySelector('header').style.removeProperty('display')
	document.querySelectorAll('footer').forEach(el => el.style.removeProperty('display'))
	if (localStorage.getItem('bgm') == 'false') {
		document.querySelector('#menu-button-music-on').classList.remove('off')
		document.querySelector('#menu-button-music-off').classList.add('off')
	}
	if (localStorage.getItem('touch') == 'false') {
		document.querySelector('#menu-button-touch-on').classList.remove('off')
		document.querySelector('#menu-button-touch-off').classList.add('off')
		document.querySelectorAll('footer')?.forEach(el => el.classList.add('hide'))
	}
	if (isPC()) {
		document.querySelectorAll('[data-mobile]').forEach(el => {el.style.setProperty('display', 'none')})
	} else {
		document.querySelectorAll('[data-pc]').forEach(el => {el.style.setProperty('display', 'none')})
	}
}

function initAudio() {
	audioContext = new AudioContext()
	audioGain = audioContext.createGain()
	const destination = audioContext.createMediaStreamDestination()
	audioGain.connect(audioContext.destination)
	audioGain.gain.value = bgmVolume
	audio.srcObject = destination.stream
	audio.play()
	fetch('../audio/music-1.mp3')
	.then(response => {
		response.arrayBuffer()
		.then(buffer => {
			audioContext.decodeAudioData(buffer)
			.then(audioData => {
				bgmBuffer = audioData
				playBGM()
			})
		})
	})
	/* fetch('../audio/turn.mp3')
	.then(response => {
		response.arrayBuffer()
		.then(buffer => {
			audioContext.decodeAudioData(buffer)
			.then(audioData => {
				seTurnBuffer = audioData
			})
		})
	})
	fetch('../audio/fly.mp3')
	.then(response => {
		response.arrayBuffer()
		.then(buffer => {
			audioContext.decodeAudioData(buffer)
			.then(audioData => {
				seFlyBuffer = audioData
			})
		})
	}) */
	audioAuthorized = true
}

window.onresize = () => resizeScene()
window.oncontextmenu = e => {e.preventDefault(); return false}

document.body.appendChild(renderer.domElement)
/* document.onreadystatechange = () => {
	if (document.readyState != 'complete') return
} */
document.onclick = () => {
	/* document.querySelector('#menu-config').classList.remove('opened') */
	if (!audioAuthorized) initAudio()
}
document.onvisibilitychange = () => {
	if (document.hidden) {
		if (audioGain) audioGain.gain.value = 0
		document.querySelectorAll('footer section button').forEach(el => {
			el.classList.remove('active')
		})
	} else {
		if (audioGain) audioGain.gain.value = bgmVolume
	}
}

function playBGM() {
	if (!audioContext || !bgmBuffer || localStorage.getItem('bgm') == 'false') return
	bgmSource = audioContext.createBufferSource()
	bgmSource.buffer = bgmBuffer
	bgmSource.loop = true
	bgmSource.connect(audioGain)
	bgmSource.start(0)
	bgmSource.onended = () => {
		bgmSource.disconnect()
		bgmSource = undefined
	}
}

function playSE(buffer, loop=false) {
	return
	if (!audioContext || !buffer) return
	let src = audioContext.createBufferSource()
	src.buffer = buffer
	src.loop = loop
	src.connect(audioContext.destination)
	src.start(0)
	src.onended = () => src.disconnect()
	return src
}

function isLocalhost() {
	return ['localhost', '127.0.0.1'].includes(location.hostname)
}

function isPC() {
	return /(windows|macintosh)/i.test(navigator.userAgent)
}
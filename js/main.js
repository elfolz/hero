import * as THREE from '/js/three.module.js'
import { GLTFLoader } from '/js/gltfLoader.module.js'
import { FBXLoader } from '/js/fbxLoader.module.js'

const isLocalhost = ['localhost', '127.0.0.1'].includes(location.hostname)

if (location.protocol.startsWith('https') || isLocalhost) {
	navigator.serviceWorker.register('service-worker.js')
	navigator.serviceWorker.onmessage = m => {
		console.info('Update found!')
		if (m?.data == 'update') location.reload(true)
	}
}

const device = {
	get name() {
		if (/(iphone)/i.test(navigator.userAgent)) return 'iphone'
		else if (/(ipad)/i.test(navigator.userAgent)) return 'ipad'
		else if (/(android)/i.test(navigator.userAgent)) return 'android'
		else if (/(windows)/i.test(navigator.userAgent)) return 'windows'
		else if (/(mac|macos|macintosh)/i.test(navigator.userAgent)) return 'mac'
		else return null
	},
	get osVersion() {
		if (this.name == 'iphone') return parseInt(/OS\s(\d+)_(\d+)_?(\d+)?/i.exec(navigator.userAgent)[1] || '0')
		else return parseInt(/(?:windows|android|mac)\s([\.\_\d]+)/i.exec(navigator.userAgent)[1] || '0')
	},
	get memory() {
		return navigator.deviceMemory ?? 0
	},
	get isPC() {
		return ['windows', 'mac'].includes(this.name)
	},
	get isApple() {
		return ['iphone', 'ipad', 'mac'].includes(this.name)
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

const keyPunch = 80
const keySlash = 13
const keyKick = 75
const keyWalk = 87
const keyRun = 32
const keyJump = 74
const keyTurnLeft = 65
const keyTurnRight = 68
const keyStepBack = 83
const keyRoll = 82
const keyBackflip = 76
const keyToggleSword = 69

const clock = new THREE.Clock()
const renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true})
const camera = new THREE.PerspectiveCamera(75, window.innerWidth /window.innerHeight, 0.1, 1000)
const hemisphereLight = new THREE.HemisphereLight(0xddeeff, 0x0f0e0d, 0.25)
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5)
const gltfLoader = new GLTFLoader()
const textureLoader = new THREE.TextureLoader()
const fbxLoader = new FBXLoader()
const scene = new THREE.Scene()
const audio = new Audio()
const keysPressed = {}

var hero
var sword
var animations
var mixer
var idleAction, walkAction, walkBackAction, runAction, jumpAction, jumpRunningAction, punchRightAction, punchLeftAction, kickAction, backflipAction, rollAction, outwardSlashAction, outwardSlashFastAction, inwardSlashAction, withdrawSwordAction, sheathSwordAction

var fpsLimit = device.isPC ? null : (window.devicePixelRatio > 2 || device.memory >= 4 || device.isApple) ? 1 / 60 : 1 / 30
var gameStarted = false
var fps = 0
var frames = 0
var gamepad
var clockDelta = 0
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
var waitForAnimation, isWalking, isRunning, isRotating, isSteppingBack, isPunching, isKicking, isJumping, isBackingflip, isRolling, isSlashing, isTogglingSword, rotateRightAction, rotateLeftAction
var lastAction
var bgmVolume = 0.5
var keyboardActive = device.isPC
var swordEquipped = true

var progress = new Proxy({}, {
	set: function(target, key, value) {
		target[key] = value
		let values = Object.values(target).slice()
		let progressbar = document.querySelector('progress')
		let total = values.reduce((a, b) => a + b, 0)
		total = total / 15
		if (progressbar) progressbar.value = parseInt(total || 0)
		if (total >= 100) setTimeout(() => initGame(), 500)
		return true
	}
})

scene.background = null
renderer.outputEncoding = THREE.sRGBEncoding
renderer.shadowMap.enabled = true
renderer.physicallyCorrectLights = true
renderer.setClearColor(0x000000, 0)
hemisphereLight.position.set(100, 100, 100)
dirLight.position.set(0, 100, 100)
dirLight.castShadow = true

scene.add(hemisphereLight)
scene.add(dirLight)

textureLoader.load('/textures/ground.webp', texture => {
	texture.wrapS = THREE.RepeatWrapping
	texture.wrapT = THREE.RepeatWrapping
	texture.encoding = THREE.sRGBEncoding
	texture.anisotropy = 4
	texture.repeat.set(parseInt(texture.wrapS / 200), parseInt(texture.wrapT / 200))
	const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshPhongMaterial({map: texture}))
	ground.rotation.x = - Math.PI / 2
	ground.receiveShadow = true
	scene.add(ground)
}, xhr => {
	progress['ground'] = (xhr.loaded / xhr.total) * 100
}, error => {
	console.error(error)
})
gltfLoader.load('/models/hero.glb',
	gltf => {
		hero = gltf.scene
		/* hero.vertices = getVertices(hero) */
		hero.encoding = THREE.sRGBEncoding
		hero.traverse(object => {if (object.isMesh) object.castShadow = true})
		dummyCamera = camera.clone()
		dummyCamera.position.set(0, hero.position.y+5, hero.position.z-10)
		dummyCamera.lookAt(0, 5, 0)
		hero.add(dummyCamera)
		mixer = new THREE.AnimationMixer(hero)
		dirLight.target = hero
		scene.add(hero)
		onFinishActions()
		loadAnimations()
	}, xhr => {
		progress['hero'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	}
)
gltfLoader.load('/models/sword.glb', fbx => {
	sword = fbx.scene
	sword.encoding = THREE.sRGBEncoding
	sword.traverse(el => {if (el.isMesh) el.castShadow = true})
}, xhr => {
	progress['sword'] = (xhr.loaded / xhr.total) * 100
}, error => {
	console.error(error)
})

function loadAnimations() {
	fbxLoader.load('/models/idle.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		idleAction = mixer.clipAction(animation)
		idleAction.name = 'idle'
		lastAction = idleAction
		idleAction.play()
	}, xhr => {
		progress['idle'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/walking.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		walkAction = mixer.clipAction(animation)
		walkAction.name = 'walk'
	}, xhr => {
		progress['walking'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/walkingBack.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		walkBackAction = mixer.clipAction(animation)
		walkBackAction.name = 'step-back'
	}, xhr => {
		progress['walkingBack'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/running.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		runAction = mixer.clipAction(animation)
		runAction.name = 'run'
	}, xhr => {
		progress['running'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/jumping.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		jumpAction = mixer.clipAction(animation)
		jumpAction.name = 'jump'
	}, xhr => {
		progress['jumping'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/jumpingRunning.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		jumpRunningAction = mixer.clipAction(animation)
		jumpRunningAction.name = 'jump-running'
	}, xhr => {
		progress['jumpingRunning'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/backflip.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		backflipAction = mixer.clipAction(animation)
		backflipAction.name = 'backflip'
	}, xhr => {
		progress['backflip'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/punchingRight.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		punchRightAction = mixer.clipAction(animation)
		punchRightAction.name = 'punch-right'
	}, xhr => {
		progress['punchingRight'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/punchingLeft.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		punchLeftAction = mixer.clipAction(animation)
		punchLeftAction.name = 'punch-left'
	}, xhr => {
		progress['punchingLeft'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		reject(error)
	})
	fbxLoader.load('/models/kick.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		kickAction = mixer.clipAction(animation)
		kickAction.name = 'kick'
	}, xhr => {
		progress['kick'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/rolling.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		rollAction = mixer.clipAction(animation)
		rollAction.name = 'roll'
	}, xhr => {
		progress['roll'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/stableSwordOutwardSlash.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		outwardSlashAction = mixer.clipAction(animation)
		outwardSlashAction.name = 'outwardSlash'
	}, xhr => {
		progress['outwardSlash'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/stableSwordOutwardSlashFast.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		outwardSlashFastAction = mixer.clipAction(animation)
		outwardSlashFastAction.name = 'outwardSlashFast'
	}, xhr => {
		progress['outwardSlash'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/stableSwordInwardSlash.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		inwardSlashAction = mixer.clipAction(animation)
		inwardSlashAction.name = 'inwardSlash'
	}, xhr => {
		progress['inwardSlash'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	/* fbxLoader.load('/models/withdrawSword.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		withdrawSwordAction = mixer.clipAction(animation)
		withdrawSwordAction.name = 'withdrawSword'
	}, xhr => {
		progress['withdrawSword'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/sheathSword.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		sheathSwordAction = mixer.clipAction(animation)
		sheathSwordAction.name = 'sheathSword'
	}, xhr => {
		progress['sheathSword'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	}) */
	/* fbxLoader.load('/models/turningLeft.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		rotateLeftAction = mixer.clipAction(animation)
	}, xhr => {
		progress['turningLeft'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/turningRight.fbx', fbx => {
		let animation = fbx.animations[0]
		animations.push(animation)
		rotateRightAction = mixer.clipAction(animation)
	}, xhr => {
		progress['turningRight'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	}) */
}

function initGame() {
	if (gameStarted) return
	gameStarted = true
	document.body.classList.add('loaded')
	document.body.removeChild(document.querySelector('figure'))
	document.querySelector('header').style.removeProperty('display')
	if (localStorage.getItem('bgm') == 'false') {
		document.querySelector('#menu-button-music-on').classList.remove('off')
		document.querySelector('#menu-button-music-off').classList.add('off')
	}
	if (!device.isPC) document.querySelectorAll('footer').forEach(el => el.style.removeProperty('display'))
	hero.getObjectByName('mixamorigRightHand').attach(sword)
	initControls()
	resizeScene()
	animate()
}

function resizeScene() {
	camera.aspect = window.innerWidth /window.innerHeight
	camera.updateProjectionMatrix()
	if (device.isPC && device.memory >= 8) renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(window.innerWidth,window.innerHeight)
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
	updateGamepad()
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

function updateCamera() {
	let target = hero.clone()
	dummyCamera.getWorldPosition(target.position)
	dummyCamera.getWorldQuaternion(target.quaternion)
	camera.position.lerp(target.position, 0.25)
	camera.quaternion.slerp(target.quaternion, 0.25)
}

function onFinishActions() {
	mixer.addEventListener('finished', () => {
		if (actions.includes('slash')) {
			let action = lastAction == inwardSlashAction ? outwardSlashFastAction : inwardSlashAction
			executeCrossFade(action, 0.25, 'once')
		} else if (actions.includes('punch')) {
			executeCrossFade(lastAction == punchLeftAction ? punchRightAction : punchLeftAction, 0.25, 'once')
		} else if (actions.includes('kick')) {
			executeCrossFade(kickAction, 0.25, 'once')
		} else if (actions.includes('backflip')) {
			executeCrossFade(backflipAction, 0.25, 'once')
		} else {
			executeCrossFade(returnAction())
		}
		/* if (isTogglingSword) {
			swordEquipped = !swordEquipped
			sword.parent.remove(sword)
			sword.matrixWorld.decompose(sword.position, sword.quaternion, sword.scale)
			if (swordEquipped) {
				hero.getObjectByName('mixamorigRightHand').attach(sword)
			} else {
				hero.getObjectByName('mixamorigLeftLeg').attach(sword)
			}
		} */
		waitForAnimation = false
		if (!actions.includes('slash')) isSlashing = false
		if (!actions.includes('punch')) isPunching = false
		isKicking = false
		isBackingflip = false
		isRolling = false
		isJumping = false
		isTogglingSword = false
	})
}

function returnAction() {
	if (actions.includes('walk') || actions.some(el => ['turn-left', 'turn-right'].includes(el))) {
		return actions.includes('run') ? runAction : walkAction
	} else if (actions.includes('step-back')) {
		return walkBackAction
	} else {
		return idleAction
	}
}

function updateActions() {
	let w = actions.includes('walk')
	let r = actions.includes('run')
	let s = actions.includes('slash')
	let p = actions.includes('punch')
	let k = actions.includes('kick')
	let t = actions.some(el => ['turn-left', 'turn-right'].includes(el))
	let sb = actions.includes('step-back')
	let b = actions.includes('backflip')
	let j = actions.includes('jump')
	let rl = actions.includes('roll')
	let bf = actions.includes('backflip')
	let ts = actions.includes('toggle-sword')
	if (actions.length <= 0) synchronizeCrossFade(idleAction)

	if (!waitForAnimation && s && !isSlashing) {
		isSlashing = true
		waitForAnimation = true
		executeCrossFade(outwardSlashAction, 0.25, 'once')
	} else if (!waitForAnimation && p && !isPunching) {
		isPunching = true
		waitForAnimation = true
		executeCrossFade(punchRightAction, 0.25, 'once')
	} else if (!waitForAnimation && k) {
		isKicking = true
		waitForAnimation = true
		executeCrossFade(kickAction, 0.25, 'once')
	} else if (!waitForAnimation && bf && !isBackingflip) {
		isBackingflip = true
		executeCrossFade(backflipAction, 0.25, 'once')
		setTimeout(() => {updateWalk(false, true, 5)}, 250)
	}
	if (waitForAnimation || isPunching || isKicking || isBackingflip) return
	if (actions.includes('turn-left')) hero.rotation.y += r ? 0.025 : 0.01
	if (actions.includes('turn-right')) hero.rotation.y -= r ? 0.025 : 0.01
	if (w && !isWalking) {
		isWalking = true
		executeCrossFade(walkAction)
	} else if (!w && isWalking) {
		if (!t) executeCrossFade(idleAction)
		isWalking = false
		isRunning = false
	}
	if (w) {
		updateWalk(r)
		if (r && !isRunning) {
			isRunning = true
			executeCrossFade(runAction)
		} else if (!r && isRunning) {
			executeCrossFade(walkAction)
			isRunning = false
		}
	}
	if (!waitForAnimation && rl && !isRolling) {
		isRolling = true
		executeCrossFade(rollAction, 0.25, 'once')
	}
	if (isRolling) return
	if (!waitForAnimation && j && !isJumping) {
		isJumping = true
		executeCrossFade(w ? jumpRunningAction : jumpAction, 0.25, 'once')
	}
	if (w || isJumping) return
	if (sb && !isSteppingBack) {
		isSteppingBack = true
		executeCrossFade(walkBackAction)
	} else if (!sb && isSteppingBack) {
		executeCrossFade(returnAction())
		isSteppingBack = false
	}
	if (sb) return updateWalk(false, true, 0.025)
	if (!isRotating && t) {
		isRotating = true
		executeCrossFade(walkAction)
	} else if (isRotating && !t) {
		if (!w) executeCrossFade(returnAction())
		isRotating = false
	}

	if (!waitForAnimation && !isTogglingSword && ts) {
		isTogglingSword = true
		waitForAnimation = true
		executeCrossFade(swordEquipped ? sheathSwordAction : withdrawSwordAction, 0.25, 'once')
	} else if (isTogglingSword && !t) {
		executeCrossFade(returnAction())
		isTogglingSword = false
	}

}

function updateWalk(running=false, back=false, speed=0.1) {
	let dir = camera.getWorldDirection(hero.clone().position)
	if (back) {
		dir.x *= -1
		dir.y *= -1
		dir.z *= -1
	}
	hero.position.add(dir.multiplyScalar(running ? speed*2.5 : speed))
}

function executeCrossFade(newAction, duration=0.25, loop='repeat') {
	if (actions.some(el => ['walk', 'run', 'turn-left', 'turn-right', 'step-back'].includes(el)) && newAction == idleAction) return
	if (lastAction == newAction) return newAction.reset()
	newAction.enabled = true
	newAction.setEffectiveTimeScale(1)
	newAction.setEffectiveWeight(1)
	newAction.loop = loop == 'pingpong' ? THREE.LoopPingPong : loop == 'once' ? THREE.LoopOnce : THREE.LoopRepeat
	newAction.clampWhenFinished = (loop == 'once')
	if (loop == 'once') newAction.reset()
	lastAction.crossFadeTo(newAction, duration, true)
	newAction.play()
	lastAction = newAction
}

function synchronizeCrossFade(newAction, duration, loop='repeat') {
	mixer.addEventListener('loop', onLoopFinished)
	function onLoopFinished(event) {
		waitForAnimation = false
		isSlashing = false
		isPunching = false
		isKicking = false
		isBackingflip = false
		isRolling = false
		isJumping = false
		if (event.action == lastAction) {
			mixer.removeEventListener('loop', onLoopFinished)
			executeCrossFade(newAction, duration, loop)
		}
	}
}

function updateGamepad() {
	gamepad = navigator.getGamepads().find(el => el?.connected)
	if (!gamepad) return
	if (gamepad.buttons.some(el => el.pressed)) keyboardActive = false
	if (keyboardActive) return
	if (gamepad.axes[1] <= -0.05 || gamepad.buttons[UP].pressed) {
		if (!actions.includes('walk')) actions.push('walk')
	} else if (actions.includes('walk')) {
		actions.splice(actions.findIndex(el => el == 'walk'), 1)
	}
	if (gamepad.axes[1] >= 0.5 || gamepad.buttons[DOWN].pressed) {
		if (!actions.includes('step-back')) actions.push('step-back')
	} else if (actions.includes('step-back')) {
		actions.splice(actions.findIndex(el => el == 'step-back'), 1)
	}
	if (gamepad.axes[0] <= -0.5 || gamepad.buttons[LEFT].pressed) {
		if (!actions.includes('turn-left')) actions.push('turn-left')
	} else if (actions.includes('turn-left')) {
		actions.splice(actions.findIndex(el => el == 'turn-left'), 1)
	}
	if (gamepad.axes[0] >= 0.5 || gamepad.buttons[RIGHT].pressed) {
		if (!actions.includes('turn-right')) actions.push('turn-right')
	} else if (actions.includes('turn-right')) {
		actions.splice(actions.findIndex(el => el == 'turn-right'), 1)
	}
	if (gamepad.buttons[A].pressed) {
		if (!actions.includes('run')) actions.push('run')
	} else if (actions.includes('run')) {
		actions.splice(actions.findIndex(el => el == 'run'), 1)
	}
	if (gamepad.buttons[B].pressed) {
		if (!actions.includes('roll')) actions.push('roll')
	} else if (actions.includes('roll')) {
		actions.splice(actions.findIndex(el => el == 'roll'), 1)
	}
	if (gamepad.buttons[X].pressed) {
		if (!actions.includes('jump')) actions.push('jump')
	} else if (actions.includes('jump')) {
		actions.splice(actions.findIndex(el => el == 'jump'), 1)
	}
	if (gamepad.buttons[Y].pressed) {
		if (!actions.includes('backflip')) actions.push('backflip')
	} else if (actions.includes('backflip')) {
		actions.splice(actions.findIndex(el => el == 'backflip'), 1)
	}
	/* if (gamepad.buttons[RB].pressed) {
		if (!actions.includes('punch')) actions.push('punch')
	} else if (actions.includes('punch')) {
		actions.splice(actions.findIndex(el => el == 'punch'), 1)
	} */
	if (gamepad.buttons[RB].pressed) {
		if (!actions.includes('slash')) actions.push('slash')
	} else if (actions.includes('slash')) {
		actions.splice(actions.findIndex(el => el == 'slash'), 1)
	}
	if (gamepad.buttons[LB].pressed) {
		if (!actions.includes('kick')) actions.push('kick')
	} else if (actions.includes('kick')) {
		actions.splice(actions.findIndex(el => el == 'kick'), 1)
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
		let localVertex = new THREE.Vector3().fromBufferAttribute(el, i).clone()
		let globalVertex = localVertex.applyMatrix4(a.matrix)
		let directionVector = globalVertex.sub(a.position)
		let ray = new THREE.Raycaster(a.position, directionVector.normalize())
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

function initControls() {
	window.onkeydown = e => {
		//console.log(e)
		keyboardActive = true
		keysPressed[e.keyCode] = true
		if (keysPressed[keyToggleSword] && !actions.includes('toggle-sword')) actions.push('toggle-sword')
		if (keysPressed[keySlash] && !actions.includes('slash')) actions.push('slash')
		/* if (keysPressed[keyPunch] && !actions.includes('punch')) actions.push('punch') */
		if (keysPressed[keyRun] && !actions.includes('run')) actions.push('run')
		if (keysPressed[keyTurnLeft] && !actions.includes('turn-left')) actions.push('turn-left')
		if (keysPressed[keyTurnRight] && !actions.includes('turn-right')) actions.push('turn-right')
		if (keysPressed[keyWalk] && !actions.includes('walk')) actions.push('walk')
		if (keysPressed[keyBackflip] && !actions.includes('backflip')) actions.push('backflip')
		if (keysPressed[keyStepBack] && !actions.includes('step-back')) actions.push('step-back')
		if (keysPressed[keyJump] && !actions.includes('jump')) actions.push('jump')
		if (keysPressed[keyKick] && !actions.includes('kick')) actions.push('kick')
		if (keysPressed[keyRoll] && !actions.includes('roll')) actions.push('roll')
	}
	window.onkeyup = e => {
		keysPressed[e.keyCode] = false
		if (e.keyCode == keyToggleSword) actions.splice(actions.findIndex(el => el == 'toggle-sword'), 1)
		if (e.keyCode == keySlash) actions.splice(actions.findIndex(el => el == 'slash'), 1)
		/* if (e.keyCode == keyPunch) actions.splice(actions.findIndex(el => el == 'punch'), 1) */
		if (e.keyCode == keyRun) actions.splice(actions.findIndex(el => el == 'run'), 1)
		if (e.keyCode == keyTurnLeft) actions.splice(actions.findIndex(el => el == 'turn-left'), 1)
		if (e.keyCode == keyTurnRight) actions.splice(actions.findIndex(el => el == 'turn-right'), 1)
		if (e.keyCode == keyWalk) actions.splice(actions.findIndex(el => el == 'walk'), 1)
		if (e.keyCode == keyBackflip) actions.splice(actions.findIndex(el => el == 'backflip'), 1)
		if (e.keyCode == keyStepBack) actions.splice(actions.findIndex(el => el == 'step-back'), 1)
		if (e.keyCode == keyJump) actions.splice(actions.findIndex(el => el == 'jump'), 1)
		if (e.keyCode == keyKick) actions.splice(actions.findIndex(el => el == 'kick'), 1)
		if (e.keyCode == keyRoll) actions.splice(actions.findIndex(el => el == 'roll'), 1)
	}
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
	const buttonForward = document.querySelector('#button-forward')
	buttonForward.ontouchmove = e => {
		e.stopPropagation()
		e.preventDefault()
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
	buttonForward.ontouchstart = e => {
		e.stopPropagation()
		e.preventDefault()
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
	document.querySelector('#button-backward').ontouchstart = e => {
		e.stopPropagation()
		e.preventDefault()
		if (!actions.includes('step-back')) actions.push('step-back')
	}
	document.querySelector('#button-backward').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'step-back'), 1)
	}
	document.querySelector('#button-left').ontouchstart = e => {
		e.stopPropagation()
		e.preventDefault()
		if (!actions.includes('turn-left')) actions.push('turn-left')
	}
	document.querySelector('#button-left').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'turn-left'), 1)
	}
	document.querySelector('#button-right').ontouchstart = e => {
		e.stopPropagation()
		e.preventDefault()
		if (!actions.includes('turn-right')) actions.push('turn-right')
	}
	document.querySelector('#button-right').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'turn-right'), 1)
	}
	document.querySelector('#button-run').ontouchstart = e => {
		e.stopPropagation()
		e.preventDefault()
		if (!actions.includes('run')) actions.push('run')
	}
	document.querySelector('#button-run').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'run'), 1)
	}
	document.querySelector('#button-attack').ontouchstart = e => {
		e.stopPropagation()
		e.preventDefault()
		if (!actions.includes('slash')) actions.push('slash')
	}
	document.querySelector('#button-attack').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'punch'), 1)
	}
	document.querySelector('#button-kick').ontouchstart = e => {
		e.stopPropagation()
		e.preventDefault()
		if (!actions.includes('kick')) actions.push('kick')
	}
	document.querySelector('#button-kick').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'kick'), 1)
	}
	document.querySelector('#button-jump').ontouchstart = e => {
		e.stopPropagation()
		e.preventDefault()
		if (!actions.includes('jump')) actions.push('jump')
	}
	document.querySelector('#button-jump').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'jump'), 1)
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
	fetch('/audio/bgm.mp3')
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
	/* fetch('/audio/turn.mp3')
	.then(response => {
		response.arrayBuffer()
		.then(buffer => {
			audioContext.decodeAudioData(buffer)
			.then(audioData => {
				seTurnBuffer = audioData
			})
		})
	})
	fetch('/audio/fly.mp3')
	.then(response => {
		response.arrayBuffer()
		.then(buffer => {
			audioContext.decodeAudioData(buffer)
			.then(audioData => {
				seFlyBuffer = audioData
			})
		})
	}) */
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

window.onresize = () => resizeScene()
window.oncontextmenu = e => {e.preventDefault(); return false}

/* document.onreadystatechange = () => {
	if (document.readyState != 'complete') return
} */
document.onclick = () => {
	document.querySelector('#menu-config').classList.remove('opened')
	if ('requestFullscreen' in document.documentElement && !device.isPC) document.documentElement.requestFullscreen()
	if (!audioAuthorized) {
		audioAuthorized = true
		initAudio()
	}
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
document.body.appendChild(renderer.domElement)
import * as THREE from '/js/modules/three.module.js'
import { GLTFLoader } from '/js/modules/gltfLoader.module.js'
import { FBXLoader } from '/js/modules/fbxLoader.module.js'
import inputSettings from '/js/settings/input.js'
import randomInt from '/js/helpers/randomInt.js'
import device from '/js/device.js'

if (location.protocol.startsWith('https')) {
	navigator.serviceWorker.register('service-worker.js')
	navigator.serviceWorker.onmessage = m => {
		console.info('Update found!')
		if (m?.data == 'update') location.reload(true)
	}
}

window.lastFrameTime = performance.now()
window.camera = new THREE.PerspectiveCamera(75, window.innerWidth /window.innerHeight, 0.1, 1000)
window.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true})

const clock = new THREE.Clock()
const hemisphereLight = new THREE.HemisphereLight(0xddeeff, 0x000000, 0.25)
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5)
const gltfLoader = new GLTFLoader()
const textureLoader = new THREE.TextureLoader()
const fbxLoader = new FBXLoader()
const scene = new THREE.Scene()
const caster = new THREE.Raycaster()
const vertex = new THREE.Vector3()
const groundSize = 200
const keysPressed = {}

var fpsLimit = device.isPC ? null : ((device.cpuCores >= 4 && device.memory >= 4) || device.isApple) ? 1 / 60 : 1 / 30
var gameStarted = false
var fps = 0
var frames = 0
var gamepad
var clockDelta = 0

var dummyCamera
var actions = []

var keyboardActive = device.isPC
var gamepadSettings
var heroMaxHp = 100
var heroHp = 100
var pause = false
var pauseLastUpdate

scene.background = null
renderer.outputEncoding = THREE.sRGBEncoding
renderer.shadowMap.enabled = true
renderer.physicallyCorrectLights = true
renderer.setClearColor(0x000000, 0)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
hemisphereLight.position.set(100, 100, 100)
dirLight.position.set(0, 200, 200)
dirLight.castShadow = true
scene.add(hemisphereLight)
scene.add(dirLight)

var progress = new Proxy({}, {
	set: function(target, key, value) {
		target[key] = value
		let values = Object.values(target).slice()
		let progressbar = document.querySelector('progress')
		let total = values.reduce((a, b) => a + b, 0)
		total = total / 19
		if (progressbar) progressbar.value = parseInt(total || 0)
		if (total >= 100) setTimeout(() => initGame(), 500)
		return true
	}
})

textureLoader.load('/textures/ground.webp', texture => {
	texture.wrapS = THREE.RepeatWrapping
	texture.wrapT = THREE.RepeatWrapping
	texture.encoding = THREE.sRGBEncoding
	texture.anisotropy = 4
	texture.repeat.set(parseInt(texture.wrapS / groundSize), parseInt(texture.wrapT / groundSize))
	window.ground = new THREE.Mesh(new THREE.PlaneGeometry(groundSize, groundSize), new THREE.MeshPhongMaterial({map: texture}))
	ground.rotation.x = - Math.PI / 2
	ground.receiveShadow = true
	scene.add(ground)
}, xhr => {
	progress['ground'] = (xhr.loaded / xhr.total) * 100
}, error => {
	console.error(error)
})
gltfLoader.load('/models/hero/hero.glb',
	gltf => {
		window.hero = gltf.scene
		hero.encoding = THREE.sRGBEncoding
		hero.traverse(el => {if (el.isMesh) el.castShadow = true})
		dummyCamera = camera.clone()
		dummyCamera.position.set(0, hero.position.y+5, hero.position.z-10)
		dummyCamera.lookAt(0, 5, 0)
		hero.add(dummyCamera)
		hero.mixer = new THREE.AnimationMixer(hero)
		dirLight.target = hero
		scene.add(hero)
		let sphere = new THREE.Mesh(
			new THREE.SphereGeometry(),
			new THREE.MeshBasicMaterial({transparent: true, opacity: 0})
		)
		sphere.name = 'collider'
		sphere.scale.set(0.8, 0.8, 0.8)
		hero.add(sphere)
		hero.collider = sphere
		let cylinder = new THREE.Mesh(
			new THREE.CylinderGeometry(),
			new THREE.MeshBasicMaterial({transparent: true, opacity: 0})
		)
		cylinder.name = 'chest'
		cylinder.rotation.x = (Math.PI / 2) - 0.25
		cylinder.position.z -= 4.8
		cylinder.scale.set(0.6, 2.5, 0.6)
		hero.chest = cylinder
		hero.getObjectByName('mixamorigSpine1').attach(cylinder)
		hero.audio = {}
		hero.actions = []
		loadHeroAnimations()
		if (sound.audioContext) sound.initHeroAudio()
	}, xhr => {
		progress['hero'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	}
)
gltfLoader.load('/models/equips/sword.glb', fbx => {
	window.sword = fbx.scene
	sword.encoding = THREE.sRGBEncoding
	sword.collidableMashes = []
	sword.traverse(el => {if (el.isMesh) el.castShadow = true})
}, xhr => {
	progress['sword'] = (xhr.loaded / xhr.total) * 100
}, error => {
	console.error(error)
})
gltfLoader.load('/models/humanoid/humanoid.glb',
	gltf => {
		window.foe = gltf.scene
		foe.encoding = THREE.sRGBEncoding
		foe.traverse(el => {if (el.isMesh) el.castShadow = true})
		foe.position.set(0, 0, 20)
		foe.lookAt(0, 0, -1)
		foe.scale.set(0.045, 0.045, 0.045)
		foe.mixer = new THREE.AnimationMixer(foe)
		foe.se = null
		scene.add(foe)
		let sphere = new THREE.Mesh(
			new THREE.SphereGeometry(),
			new THREE.MeshBasicMaterial({transparent: true, opacity: 0})
		)
		sphere.name = 'collider'
		sphere.scale.set(18, 18, 18)
		foe.add(sphere)
		foe.collider = sphere
		let cylinder = new THREE.Mesh(
			new THREE.CylinderGeometry(),
			new THREE.MeshBasicMaterial({transparent: true, opacity: 0})
		)
		cylinder.name = 'chest'
		cylinder.rotation.x = (Math.PI / 2)
		cylinder.position.z += 24.8
		cylinder.scale.set(0.6, 2.5, 0.6)
		foe.chest = cylinder
		foe.getObjectByName('mixamorigSpine1').attach(cylinder)

		let hand = new THREE.Mesh(
			new THREE.SphereGeometry(),
			new THREE.MeshBasicMaterial({transparent: true, opacity: 0})
		)
		hand.name = 'hand'
		hand.rotation.x = (Math.PI / 2)
		hand.position.x += 0.85
		hand.position.y += 0.5
		hand.position.z += 23.3
		hand.scale.set(0.35, 0.35, 0.35)
		foe.hand = hand
		foe.getObjectByName('mixamorigHead').attach(hand)
		foe.actions = []
		loadFoeAnimations()
		if (sound.audioListener) sound.initFoeAudio()
	}, xhr => {
		progress['foe'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	}
)

function loadHeroAnimations() {
	fbxLoader.load('/models/hero/idle.fbx', fbx => {
		let animation = fbx.animations[0]
		hero.actions['idle'] = hero.mixer.clipAction(animation)
		hero.actions['idle'].name = 'idle'
		hero.lastAction = hero.actions['idle']
		hero.actions['idle'].play()
	}, xhr => {
		progress['idle'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/hero/walking.fbx', fbx => {
		let animation = fbx.animations[0]
		hero.actions['walk'] = hero.mixer.clipAction(animation)
		hero.actions['walk'].name = 'walk'
	}, xhr => {
		progress['walking'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/hero/walkingBack.fbx', fbx => {
		let animation = fbx.animations[0]
		hero.actions['step-back'] = hero.mixer.clipAction(animation)
		hero.actions['step-back'].name = 'step-back'
	}, xhr => {
		progress['step-back'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/hero/running.fbx', fbx => {
		let animation = fbx.animations[0]
		hero.actions['run'] = hero.mixer.clipAction(animation)
		hero.actions['run'].name = 'run'
	}, xhr => {
		progress['running'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/hero/jumping.fbx', fbx => {
		let animation = fbx.animations[0]
		hero.actions['jump'] = hero.mixer.clipAction(animation)
		hero.actions['jump'].name = 'jump'
	}, xhr => {
		progress['jumping'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/hero/jumpingRunning.fbx', fbx => {
		let animation = fbx.animations[0]
		hero.actions['jump-running'] = hero.mixer.clipAction(animation)
		hero.actions['jump-running'].name = 'jump-running'
	}, xhr => {
		progress['g'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/hero/backflip.fbx', fbx => {
		let animation = fbx.animations[0]
		hero.actions['backflip'] = hero.mixer.clipAction(animation)
		hero.actions['backflip'].name = 'backflip'
	}, xhr => {
		progress['backflip'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/hero/kick.fbx', fbx => {
		let animation = fbx.animations[0]
		hero.actions['kick'] = hero.mixer.clipAction(animation)
		hero.actions['kick'].name = 'kick'
	}, xhr => {
		progress['kick'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/hero/rolling.fbx', fbx => {
		let animation = fbx.animations[0]
		hero.actions['roll'] = hero.mixer.clipAction(animation)
		hero.actions['roll'].name = 'roll'
	}, xhr => {
		progress['roll'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/hero/outwardSlash.fbx', fbx => {
		let animation = fbx.animations[0]
		hero.actions['outward-slash'] = hero.mixer.clipAction(animation)
		hero.actions['outward-slash'].name = 'outward-slash'
	}, xhr => {
		progress['outward-slash'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/hero/outwardSlashFast.fbx', fbx => {
		let animation = fbx.animations[0]
		hero.actions['outward-slash-fast'] = hero.mixer.clipAction(animation)
		hero.actions['outward-slash-fast'].name = 'outward-slash-fast'
	}, xhr => {
		progress['outward-slash-fast'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/hero/inwardSlash.fbx', fbx => {
		let animation = fbx.animations[0]
		hero.actions['inward-slash'] = hero.mixer.clipAction(animation)
		hero.actions['inward-slash'].name = 'inward-slash'
	}, xhr => {
		progress['inward-slash'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/hero/stomachHit.fbx', fbx => {
		let animation = fbx.animations[0]
		hero.actions['stomach-hit'] = hero.mixer.clipAction(animation)
		hero.actions['stomach-hit'].name = 'stomach-hit'
	}, xhr => {
		progress['stomach-hit'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/hero/die.fbx', fbx => {
		let animation = fbx.animations[0]
		hero.actions['die'] = hero.mixer.clipAction(animation)
		hero.actions['die'].name = 'die'
	}, xhr => {
		progress['die'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	/* fbxLoader.load('/models/hero/punchingRight.fbx', fbx => {
		let animation = fbx.animations[0]
		hero.punchRightAction = hero.mixer.clipAction(animation)
		hero.punchRightAction.name = 'punch-right'
	}, xhr => {
		progress['punchingRight'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/hero/punchingLeft.fbx', fbx => {
		let animation = fbx.animations[0]
		hero.punchLeftAction = hero.mixer.clipAction(animation)
		hero.punchLeftAction.name = 'punch-left'
	}, xhr => {
		progress['punchingLeft'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		reject(error)
	})
	fbxLoader.load('/models/hero/withdrawSword.fbx', fbx => {
		let animation = fbx.animations[0]
		withdrawSwordAction = hero.mixer.clipAction(animation)
		withdrawSwordAction.name = 'withdrawSword'
	}, xhr => {
		progress['withdrawSword'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/hero/sheathSword.fbx', fbx => {
		let animation = fbx.animations[0]
		sheathSwordAction = hero.mixer.clipAction(animation)
		sheathSwordAction.name = 'sheathSword'
	}, xhr => {
		progress['sheathSword'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	}) */
	/* fbxLoader.load('/models/hero/turningLeft.fbx', fbx => {
		let animation = fbx.animations[0]
		rotateLeftAction = hero.mixer.clipAction(animation)
	}, xhr => {
		progress['turningLeft'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	})
	fbxLoader.load('/models/hero/turningRight.fbx', fbx => {
		let animation = fbx.animations[0]
		rotateRightAction = hero.mixer.clipAction(animation)
	}, xhr => {
		progress['turningRight'] = (xhr.loaded / xhr.total) * 100
	}, error => {
		console.error(error)
	}) */
}

function loadFoeAnimations() {
	fbxLoader.load('/models/humanoid/zombieIdle.fbx',
		fbx => {
			let animation = fbx.animations[0]
			foe.actions['idle'] = foe.mixer.clipAction(animation)
			foe.lastAction = foe.actions['idle']
			foe.actions['idle'].play()
		}, xhr => {
			progress['foe-idle'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		}
	)
	fbxLoader.load('/models/humanoid/zombieWalk.fbx',
		fbx => {
			let animation = fbx.animations[0]
			foe.actions['walk'] = foe.mixer.clipAction(animation)
		}, xhr => {
			progress['foe-walk'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		}
	)
	fbxLoader.load('/models/humanoid/zombieAttack.fbx',
		fbx => {
			let animation = fbx.animations[0]
			foe.actions['attack'] = foe.mixer.clipAction(animation)
		}, xhr => {
			progress['foe-hit'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		}
	)
}

function resizeScene() {
	camera.aspect = window.innerWidth /window.innerHeight
	camera.updateProjectionMatrix()
	refreshHPBar()
	let pixelRatio = 1
	if (window.devicePixelRatio > 1 && device.cpuCores >= 4 && device.memory >= 6) pixelRatio = window.devicePixelRatio
	else if (device.cpuCores < 4 || device.memory < 6) pixelRatio = 0.5
	renderer.setPixelRatio(pixelRatio)
	renderer.setSize(window.innerWidth,window.innerHeight)
}

function animate() {
	requestAnimationFrame(animate)
	if (document.hidden) return
	updateGamepad()
	if (pause|| window.gameover) return
	clockDelta += clock.getDelta()
	if (fpsLimit && clockDelta < fpsLimit) return
	renderer.render(scene, camera)
	hero.mixer?.update(clockDelta)
	foe.mixer?.update(clockDelta)
	updateFPSCounter()
	updateCamera()
	if (!hero.died) {
		updateActions()
		updateFoe()
	}
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
		ctx.textBaseline = 'middle'
		ctx.fillStyle = 'rgba(255,255,255,0.25)'
		ctx.clearRect(0, 0, 80, 20)
		ctx.fillText(`${fps} FPS`, 80, 10)
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
	hero.mixer.addEventListener('finished', () => {
		if (hero.died) {
			return playerDied()
		} else if (actions.includes('slash')) {
			sound.playHeroAttackSE()
			let action = hero.lastAction.name == 'inward-slash' ? hero.actions['outward-slash'] : hero.actions['inward-slash']
			executeCrossFade(hero, action, 0.175, 'once')
		/* } else if (actions.includes('punch')) {
			sound.playHeroAttackSE()
			executeCrossFade(hero, hero.lastAction.name == punchLeftAction ? punchRightAction : punchLeftAction, 0.1, 'once') */
		} else if (actions.includes('kick')) {
			sound.playHeroAttackSE()
			executeCrossFade(hero, hero.actions['kick'], 0.1, 'once')
		} else if (actions.includes('backflip')) {
			executeCrossFade(hero, hero.actions['backflip'], 0.1, 'once')
		} else {
			executeCrossFade(hero, returnAction())
		}
		/* if (isTogglingSword) {
			hero.swordEquipped = !hero.swordEquipped
			sword.parent.remove(sword)
			sword.matrixWorld.decompose(sword.position, sword.quaternion, sword.scale)
			if (hero.swordEquipped) {
				hero.getObjectByName('mixamorigRightHand').attach(sword)
			} else {
				hero.getObjectByName('mixamorigLeftLeg').attach(sword)
			}
		} */
		hero.waitForAnimation = false
		hero.isBackingflip = false
		hero.isRolling = false
		hero.isJumping = false
		hero.isTogglingSword = false
		hero.beenHit = false
		if (!actions.includes('kick')) hero.isKicking = false
		if (!actions.includes('slash')) hero.isSlashing = false
		if (!actions.includes('punch')) hero.isPunching = false
	})
	foe.mixer.addEventListener('finished', () => {
		foe.waitForAnimation = false
		foe.isAttacking = false
		executeCrossFade(foe, foe.actions['walk'])
	})
}

function returnAction() {
	if (actions.some(el => ['walk', 'turn-left', 'turn-right'].includes(el))) {
		return actions.includes('run') ? hero.actions['run'] : hero.actions['walk']
	} else if (actions.includes('step-back')) {
		return hero.actions['step-back']
	} else {
		return hero.actions['idle']
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
	if (actions.length <= 0) synchronizeCrossFade(hero, hero.actions['idle'])
	if (!hero.waitForAnimation && s && !hero.isSlashing) {
		hero.isSlashing = true
		hero.waitForAnimation = true
		sound.playHeroAttackSE()
		executeCrossFade(hero, hero.actions['outward-slash'], 0.1, 'once')
	/* } else if (!waitForAnimation && p && !isPunching) {
		isPunching = true
		waitForAnimation = true
		executeCrossFade(hero, punchRightAction, 0.1, 'once') */
	} else if (!hero.waitForAnimation && k) {
		hero.isKicking = true
		hero.waitForAnimation = true
		sound.playHeroAttackSE()
		executeCrossFade(hero, hero.actions['kick'], 0.1, 'once')
	} else if (!hero.waitForAnimation && bf && !hero.isBackingflip) {
		hero.isBackingflip = true
		executeCrossFade(hero, hero.actions['backflip'], 0.1, 'once')
		setTimeout(() => {updateWalk(false, true, 5)}, 250)
	}
	if (hero.waitForAnimation || hero.isPunching || hero.isKicking || hero.isBackingflip) return
	if (actions.includes('turn-left')) hero.rotation.y += 0.025
	if (actions.includes('turn-right')) hero.rotation.y -= 0.025
	if (w && !hero.isWalking) {
		hero.isWalking = true
		executeCrossFade(hero, hero.actions['walk'])
	} else if (!w && hero.isWalking) {
		if (!t) executeCrossFade(hero, hero.actions['idle'])
		hero.isWalking = false
		hero.isRunning = false
	}
	if (w) {
		updateWalk(r)
		if (r && !hero.isRunning) {
			hero.isRunning = true
			executeCrossFade(hero, hero.actions['run'])
		} else if (!r && hero.isRunning) {
			executeCrossFade(hero, hero.actions['walk'])
			hero.isRunning = false
		}
	}
	if (!hero.waitForAnimation && rl && !hero.isRolling) {
		hero.isRolling = true
		executeCrossFade(hero, hero.actions['roll'], 0.25, 'once')
	}
	if (hero.isRolling) return
	if (!hero.waitForAnimation && j && !hero.isJumping) {
		hero.isJumping = true
		executeCrossFade(hero, w ? hero.actions['jump-running'] : hero.actions['jump'], 0.25, 'once')
	}
	if (w || hero.isJumping) return
	if (sb && !hero.isSteppingBack) {
		hero.isSteppingBack = true
		executeCrossFade(hero, hero.actions['step-back'])
	} else if (!sb && hero.isSteppingBack) {
		executeCrossFade(hero, returnAction())
		hero.isSteppingBack = false
	}
	if (sb) return updateWalk(false, true, 0.025)
	if (!hero.isRotating && t) {
		hero.isRotating = true
		executeCrossFade(hero, hero.actions['walk'])
	} else if (hero.isRotating && !t) {
		if (!w) executeCrossFade(hero, returnAction())
		hero.isRotating = false
	}
	/* if (!hero.waitForAnimation && !hero.isTogglingSword && ts) {
		hero.isTogglingSword = true
		hero.waitForAnimation = true
		executeCrossFade(hero, hero.swordEquipped ? sheathSwordAction : withdrawSwordAction, 0.25, 'once')
	} else if (isTogglingSword && !t) {
		executeCrossFade(hero, returnAction())
		hero.isTogglingSword = false
	} */
}

function updateWalk(running=false, back=false, speed=0.1, ignoreColision=false) {
	//if (!ignoreColision && collide(hero, foe)) return updateWalk(running, !back, 0.1, true)
	let dir = camera.getWorldDirection(hero.position.clone())
	if (back) dir.negate()
	let step = dir.multiplyScalar(running ? speed*2.5 : speed)
	let pos = hero.position.clone()
	pos.add(step)
	if (pos.x >= (groundSize/2-1) || pos.x <= ((groundSize/2-1)*-1)) return
	if (pos.z >= (groundSize/2-1) || pos.z <= ((groundSize/2-1)*-1)) return
	hero.position.add(step)
}

function updateObjectFollow(src, target, collided, speed=0.001) {
	let pos = target.position.clone()
	let dir = src.position.clone().sub(pos)
	let step = dir.multiplyScalar(collided ? speed : speed * -1)
	src.lookAt(pos)
	src.position.add(step)
}

function updateFoe() {
	let check = getDistance(foe, hero)
	if (check?.distance <= 2.5 && !foe.isAttacking) {
		foe.isAttacking = true
		foe.waitForAnimation = true
		executeCrossFade(foe, foe.actions['attack'], 0.1, 'once')
		setTimeout(() => {
			hero.waitForAnimation = true
			hero.beenHit = true
			heroHp -= 100
			refreshHPBar()
			vibrateGamepad()
			sound.playHeroDamageSE()
			executeCrossFade(hero, hero.actions['stomach-hit'], 0.1, 'once')
		}, fpsLimit ? fpsLimit * 100 * 500 : 500)
	}
	if (foe.waitForAnimation) return
	if (foe.isWalking) {
		if (!foe.se) {
			let audios = foe.children.filter(el => el.type == 'Audio')
			if (!audios.length) return
			let i = randomInt(0, audios.length-1)
			if (audios[i] && !audios[i].isPlaying) {
				audios[i].play()
				foe.se = audios[i]
			}
		}
		updateObjectFollow(foe, hero, check?.collided)
	}
	if (check?.distance < 200 && !foe.isWalking) {
		foe.isWalking = true
		executeCrossFade(foe, foe.actions['walk'])
	} else if (check?.distance >= 200 && foe.isWalking) {
		foe.isWalking = false
		synchronizeCrossFade(foe, foe.actions['idle'])
	}
}

function executeCrossFade(object, newAction, duration=0.25, loop='repeat') {
	if (!object.lastAction || !newAction) return
	if (object.died && newAction.name != 'die') return
	if (object == hero && actions.some(el => ['walk', 'run', 'turn-left', 'turn-right', 'step-back'].includes(el)) && newAction.name == 'idle') return
	if (object.lastAction == newAction) return newAction.reset()
	newAction.enabled = true
	newAction.setEffectiveTimeScale(1)
	newAction.setEffectiveWeight(1)
	newAction.loop = loop == 'pingpong' ? THREE.LoopPingPong : loop == 'once' ? THREE.LoopOnce : THREE.LoopRepeat
	newAction.clampWhenFinished = (loop == 'once')
	if (loop == 'once') newAction.reset()
	object.lastAction.crossFadeTo(newAction, duration, true)
	newAction.play()
	object.lastAction = newAction
}

function synchronizeCrossFade(object, newAction, duration=0.25, loop='repeat') {
	object.mixer.addEventListener('loop', onLoopFinished)
	function onLoopFinished(event) {
		if (object.uuid == hero.uuid) {
			object.waitForAnimation = false
			object.isSlashing = false
			object.isPunching = false
			object.isKicking = false
			object.isBackingflip = false
			object.isRolling = false
			object.isJumping = false
		}
		if (event.action == object.lastAction) {
			object.mixer.removeEventListener('loop', onLoopFinished)
			executeCrossFade(object, newAction, duration, loop)
		}
	}
}

function updateGamepad() {
	if (hero.died) return
	gamepad = navigator.getGamepads().find(el => el?.connected)
	if (!gamepad) return
	if (!gamepadSettings) {
		let data = /vendor:\s(\w+)\sproduct:\s(\w+)/i.exec(gamepad.id)
		let vendorId = data[1]
		let productId = data[2]
		gamepadSettings = inputSettings.gamepad[vendorId] ?? inputSettings.gamepad['default']
	}
	if (gamepad.buttons.some(el => el.pressed)) keyboardActive = false
	if (keyboardActive) return
	if (gamepad.axes[gamepadSettings.YAxes] <= -0.05 || gamepad.buttons[gamepadSettings.UP]?.pressed) {
		if (!actions.includes('walk')) actions.push('walk')
	} else if (actions.includes('walk')) {
		actions.splice(actions.findIndex(el => el == 'walk'), 1)
	}
	if (gamepad.axes[gamepadSettings.YAxes] >= 0.5 || gamepad.buttons[gamepadSettings.DOWN]?.pressed) {
		if (!actions.includes('step-back')) actions.push('step-back')
	} else if (actions.includes('step-back')) {
		actions.splice(actions.findIndex(el => el == 'step-back'), 1)
	}
	if (gamepad.axes[gamepadSettings.XAxes] <= -0.05 || gamepad.buttons[gamepadSettings.LEFT]?.pressed) {
		if (!actions.includes('turn-left')) actions.push('turn-left')
	} else if (actions.includes('turn-left')) {
		actions.splice(actions.findIndex(el => el == 'turn-left'), 1)
	}
	if (gamepad.axes[gamepadSettings.XAxes] >= 0.05 || gamepad.buttons[gamepadSettings.RIGHT]?.pressed) {
		if (!actions.includes('turn-right')) actions.push('turn-right')
	} else if (actions.includes('turn-right')) {
		actions.splice(actions.findIndex(el => el == 'turn-right'), 1)
	}
	if (gamepad.buttons[gamepadSettings.A].pressed) {
		if (!actions.includes('run')) actions.push('run')
	} else if (actions.includes('run')) {
		actions.splice(actions.findIndex(el => el == 'run'), 1)
	}
	if (gamepad.buttons[gamepadSettings.B].pressed) {
		if (!actions.includes('roll')) actions.push('roll')
	} else if (actions.includes('roll')) {
		actions.splice(actions.findIndex(el => el == 'roll'), 1)
	}
	if (gamepad.buttons[gamepadSettings.X].pressed) {
		if (!actions.includes('jump')) actions.push('jump')
	} else if (actions.includes('jump')) {
		actions.splice(actions.findIndex(el => el == 'jump'), 1)
	}
	if (gamepad.buttons[gamepadSettings.Y].pressed) {
		if (!actions.includes('backflip')) actions.push('backflip')
	} else if (actions.includes('backflip')) {
		actions.splice(actions.findIndex(el => el == 'backflip'), 1)
	}
	/* if (gamepad.buttons[gamepadSettings.].pressed) {
		if (!actions.includes('punch')) actions.push('punch')
	} else if (actions.includes('punch')) {
		actions.splice(actions.findIndex(el => el == 'punch'), 1)
	} */
	if (gamepad.buttons[gamepadSettings.RB].pressed) {
		if (!actions.includes('slash')) actions.push('slash')
	} else if (actions.includes('slash')) {
		actions.splice(actions.findIndex(el => el == 'slash'), 1)
	}
	if (gamepad.buttons[gamepadSettings.LB].pressed) {
		if (!actions.includes('kick')) actions.push('kick')
	} else if (actions.includes('kick')) {
		actions.splice(actions.findIndex(el => el == 'kick'), 1)
	}
	if (gamepad.buttons[gamepadSettings.MENU].pressed) {
		if (performance.now() < pauseLastUpdate) return
		pause = !pause
		refreshPause()
		pauseLastUpdate = performance.now() + 250
	}
}

function vibrateGamepad(duration=0.1) {
	if (!gamepad) return
	gamepad.vibrationActuator.playEffect(gamepad.vibrationActuator.type, {
		startDelay: 0,
		duration: duration,
		weakMagnitude: 0.1,
		strongMagnitude: 0.25,
	})
}

function getDistance(a, b) {
	if (a.lastCollisionUpdate > (performance.now()-500)) return
	a.lastCollisionUpdate = performance.now()
	let verts = a.collider.geometry.attributes.position
	for (let i = 0; i < verts.count; i++) {
		let localVertex = vertex.fromBufferAttribute(verts, i)
		let globalVertex = localVertex.applyMatrix4(a.matrix)
		let directionVector = globalVertex.sub(a.position)
		caster.set(a.position, directionVector.normalize())
		let collisionResults = caster.intersectObjects([b.collider])
		let collided = collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()
		if(collisionResults.length > 0) return {distance: collisionResults[0].distance, collided: collided}
	}
	return getDistance(b, a)//{distance: undefined, collided: false}
}
function collide(a, b) {
	let distance = getDistance(a, b)
	if (distance?.collided) return true
	/* distance = getDistance(b, a)
	if (distance?.collided) return true */
	distance = a.position.z==b.position.z&&a.position.x==b.position.x&&a.position.y==b.position.y
	return distance
}

function initGame() {
	if (gameStarted) return
	gameStarted = true
	document.body.classList.add('loaded')
	document.body.removeChild(document.querySelector('figure'))
	document.querySelector('header').style.removeProperty('display')
	if (!device.isPC) document.querySelectorAll('footer').forEach(el => el.style.removeProperty('display'))
	hero.getObjectByName('mixamorigRightHand').attach(sword)
	onFinishActions()
	refreshHPBar()
	initControls()
	resizeScene()
	animate()
}

function initControls() {
	window.onkeydown = e => {
		//console.log(e)
		keyboardActive = true
		keysPressed[e.keyCode] = true
		if (keysPressed[inputSettings.keyboard.keyToggleSword] && !actions.includes('toggle-sword')) actions.push('toggle-sword')
		if (keysPressed[inputSettings.keyboard.keySlash] && !actions.includes('slash')) actions.push('slash')
		/* if (keysPressed[inputSettings.keyboard.keyPunch] && !actions.includes('punch')) actions.push('punch') */
		if (keysPressed[inputSettings.keyboard.keyRun] && !actions.includes('run')) actions.push('run')
		if (keysPressed[inputSettings.keyboard.keyTurnLeft] && !actions.includes('turn-left')) actions.push('turn-left')
		if (keysPressed[inputSettings.keyboard.keyTurnRight] && !actions.includes('turn-right')) actions.push('turn-right')
		if (keysPressed[inputSettings.keyboard.keyWalk] && !actions.includes('walk')) actions.push('walk')
		if (keysPressed[inputSettings.keyboard.keyBackflip] && !actions.includes('backflip')) actions.push('backflip')
		if (keysPressed[inputSettings.keyboard.keyStepBack] && !actions.includes('step-back')) actions.push('step-back')
		if (keysPressed[inputSettings.keyboard.keyJump] && !actions.includes('jump')) actions.push('jump')
		if (keysPressed[inputSettings.keyboard.keyKick] && !actions.includes('kick')) actions.push('kick')
		if (keysPressed[inputSettings.keyboard.keyRoll] && !actions.includes('roll')) actions.push('roll')
		if (keysPressed[inputSettings.keyboard.keyPause]) {
			pause = !pause
			refreshPause()
		}
	}
	window.onkeyup = e => {
		keysPressed[e.keyCode] = false
		if (e.keyCode == inputSettings.keyboard.keyToggleSword) actions.splice(actions.findIndex(el => el == 'toggle-sword'), 1)
		if (e.keyCode == inputSettings.keyboard.keySlash) actions.splice(actions.findIndex(el => el == 'slash'), 1)
		/* if (e.keyCode == inputSettings.keyboard.keyPunch) actions.splice(actions.findIndex(el => el == 'punch'), 1) */
		if (e.keyCode == inputSettings.keyboard.keyRun) actions.splice(actions.findIndex(el => el == 'run'), 1)
		if (e.keyCode == inputSettings.keyboard.keyTurnLeft) actions.splice(actions.findIndex(el => el == 'turn-left'), 1)
		if (e.keyCode == inputSettings.keyboard.keyTurnRight) actions.splice(actions.findIndex(el => el == 'turn-right'), 1)
		if (e.keyCode == inputSettings.keyboard.keyWalk) actions.splice(actions.findIndex(el => el == 'walk'), 1)
		if (e.keyCode == inputSettings.keyboard.keyBackflip) actions.splice(actions.findIndex(el => el == 'backflip'), 1)
		if (e.keyCode == inputSettings.keyboard.keyStepBack) actions.splice(actions.findIndex(el => el == 'step-back'), 1)
		if (e.keyCode == inputSettings.keyboard.keyJump) actions.splice(actions.findIndex(el => el == 'jump'), 1)
		if (e.keyCode == inputSettings.keyboard.keyKick) actions.splice(actions.findIndex(el => el == 'kick'), 1)
		if (e.keyCode == inputSettings.keyboard.keyRoll) actions.splice(actions.findIndex(el => el == 'roll'), 1)
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
	/* document.querySelector('#button-roll').ontouchstart = e => {
		if (!actions.includes('roll')) actions.push('roll')
	}
	document.querySelector('#button-roll').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'roll'), 1)
	} */
	document.querySelector('#button-run').ontouchstart = e => {
		if (!actions.includes('run')) actions.push('run')
	}
	document.querySelector('#button-run').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'run'), 1)
	}
	document.querySelector('#button-attack').ontouchstart = e => {
		if (!actions.includes('slash')) actions.push('slash')
	}
	document.querySelector('#button-attack').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'punch'), 1)
	}
	document.querySelector('#button-kick').ontouchstart = e => {
		if (!actions.includes('kick')) actions.push('kick')
	}
	document.querySelector('#button-kick').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'kick'), 1)
	}
	document.querySelector('#button-jump').ontouchstart = e => {
		if (!actions.includes('jump')) actions.push('jump')
	}
	document.querySelector('#button-jump').ontouchend = () => {
		actions.splice(actions.findIndex(el => el == 'jump'), 1)
	}
}

function playerDied() {
	document.querySelector('#game-over').classList.add('show')
	document.querySelector('header').style.setProperty('display', 'none')
	document.querySelectorAll('footer').forEach(el => el.style.setProperty('display', 'none'))
	window.gameover = true
}

window.refreshHPBar = function() {
	let hpbarWidth = document.querySelector('#hpbar').clientWidth - 4
	let barWidth = heroHp * hpbarWidth / heroMaxHp
	document.querySelector('#hpbar').style.setProperty('--hp-width', `${barWidth}px`)
	if (heroHp <= 0 && !hero.morreu) {
		executeCrossFade(hero, hero.actions['die'], 1, 'once')
		sound.playME(sound.gameoverBuffer)
		hero.died = true
	}
}

window.refreshPause = function() {
	if (pause) document.querySelector('#glass').classList.add('opened')
	else document.querySelector('#glass').classList.remove('opened')
}

window.toggleVisibility = function() {
	if (document.hidden) {
		actions.splice(0)
		if (sound.bgmGain) sound.bgmGain.gain.value = 0
		if (sound.audioListener) sound.audioListener.setMasterVolume(0)
	} else {
		if (sound.bgmGain) sound.bgmGain.gain.value = sound.bgmVolume
		if (sound.audioListener) sound.audioListener.setMasterVolume(sound.seVolume)
	}
}

window.onresize = () => resizeScene()

document.body.appendChild(renderer.domElement)
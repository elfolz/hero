'use strict'
import * as THREE from '/js/modules/three.module.js'
import { GLTFLoader } from '/js/modules/gltfLoader.module.js'
import { FBXLoader } from '/js/modules/fbxLoader.module.js'
import inputSettings from '/js/settings/input.js'
import randomInt from '/js/helpers/randomInt.js'
import device from '/js/device.js'

const groundSize = 200

class Game {

	constructor() {
		this.lastFrameTime = performance.now()
		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth /window.innerHeight, 0.1, 1000)
		this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true, preserveDrawingBuffer: true})
		this.clock = new THREE.Clock()
		this.hemisphereLight = new THREE.HemisphereLight(0xddeeff, 0x000000, 0.25)
		this.dirLight = new THREE.DirectionalLight(0xffffff, 0.5)
		this.gltfLoader = new GLTFLoader()
		this.textureLoader = new THREE.TextureLoader()
		this.fbxLoader = new FBXLoader()
		this.scene = new THREE.Scene()
		this.caster = new THREE.Raycaster()
		this.vertex = new THREE.Vector3()
		this.keysPressed = {}
		this.fpsLimit = device.isPC ? null : ((device.cpuCores >= 4 && device.memory >= 4) || device.isApple) ? 1 / 60 : 1 / 30
		this.gameStarted = false
		this.fps = 0
		this.frames = 0
		this.clockDelta = 0
		this.actions = []
		this.setupLoading()
		this.initRender()
		window.onresize = () => this.resizeScene()
		document.body.appendChild(this.renderer.domElement)
	}

	setupLoading() {
		const vm = this
		this.progress = new Proxy({}, {
			set: function(target, key, value) {
				target[key] = value
				let values = Object.values(target).slice()
				let progressbar = document.querySelector('progress')
				let total = values.reduce((a, b) => a + b, 0)
				total = total / 19
				if (progressbar) progressbar.value = parseInt(total || 0)
				if (total >= 100) setTimeout(() => vm.initGame(), 500)
				return true
			}
		})
		this.loadModels()
	}

	initRender() {
		this.scene.background = null
		this.renderer.outputEncoding = THREE.sRGBEncoding
		this.renderer.shadowMap.enabled = true
		this.renderer.physicallyCorrectLights = true
		this.renderer.setClearColor(0x000000, 0)
		this.renderer.shadowMap.enabled = true
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
		this.hemisphereLight.position.set(100, 100, 100)
		this.dirLight.position.set(0, 200, 200)
		this.dirLight.castShadow = true
		this.scene.add(this.hemisphereLight)
		this.scene.add(this.dirLight)
	}

	loadModels() {
		this.textureLoader.load('/textures/ground.webp', texture => {
			texture.wrapS = THREE.RepeatWrapping
			texture.wrapT = THREE.RepeatWrapping
			texture.encoding = THREE.sRGBEncoding
			texture.anisotropy = 4
			texture.repeat.set(parseInt(texture.wrapS / groundSize), parseInt(texture.wrapT / groundSize))
			const ground = new THREE.Mesh(new THREE.PlaneGeometry(groundSize, groundSize), new THREE.MeshPhongMaterial({map: texture}))
			ground.rotation.x = - Math.PI / 2
			ground.receiveShadow = true
			this.scene.add(ground)
		}, xhr => {
			this.progress['ground'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.gltfLoader.load('/models/hero/hero.glb', gltf => {
				this.hero = gltf.scene
				this.hero.encoding = THREE.sRGBEncoding
				this.hero.traverse(el => {if (el.isMesh) el.castShadow = true})
				this.dummyCamera = this.camera.clone()
				this.dummyCamera.position.set(0, this.hero.position.y+5, this.hero.position.z-10)
				this.dummyCamera.lookAt(0, 5, 0)
				this.hero.add(this.dummyCamera)
				this.hero.mixer = new THREE.AnimationMixer(this.hero)
				this.dirLight.target = this.hero
				this.scene.add(this.hero)
				this.hero.collider = new THREE.Mesh(
					new THREE.SphereGeometry(0.8),
					new THREE.MeshBasicMaterial({transparent: true, opacity: 0})
				)
				this.hero.collider.name = 'collider'
				this.hero.add(this.hero.collider)
				this.hero.chest = new THREE.Mesh(
					new THREE.CylinderGeometry(),
					new THREE.MeshBasicMaterial({transparent: true, opacity: 0})
				)
				this.hero.chest.name = 'chest'
				this.hero.chest.rotation.x = (Math.PI / 2) - 0.25
				this.hero.chest.position.z -= 4.8
				this.hero.chest.scale.set(0.6, 2.5, 0.6)
				this.hero.getObjectByName('mixamorigSpine1').attach(this.hero.chest)
				this.hero.hp = 100
				this.hero.maxhp = 100
				this.hero.audio = {}
				this.hero.actions = []
				this.loadHeroAnimations()
				if (sound && sound.audioContext) sound.initHeroAudio()
			}, xhr => {
				this.progress['hero'] = (xhr.loaded / xhr.total) * 100
			}, error => {
				console.error(error)
			}
		)
		this.gltfLoader.load('/models/equips/sword.glb', fbx => {
			this.sword = fbx.scene
			this.sword.encoding = THREE.sRGBEncoding
			this.sword.traverse(el => {if (el.isMesh) el.castShadow = true})
		}, xhr => {
			this.progress['sword'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.gltfLoader.load('/models/humanoid/humanoid.glb', gltf => {
				this.foe = gltf.scene
				this.foe.encoding = THREE.sRGBEncoding
				this.foe.traverse(el => {if (el.isMesh) el.castShadow = true})
				this.foe.position.set(0, 0, 20)
				this.foe.lookAt(0, 0, -1)
				this.foe.scale.set(0.045, 0.045, 0.045)
				this.foe.mixer = new THREE.AnimationMixer(this.foe)
				this.foe.se = null
				this.scene.add(this.foe)
				this.foe.collider = new THREE.Mesh(
					new THREE.SphereGeometry(18),
					new THREE.MeshBasicMaterial({transparent: true, opacity: 0})
				)
				this.foe.collider.name = 'collider'
				this.foe.add(this.foe.collider)
				this.foe.chest = new THREE.Mesh(
					new THREE.CylinderGeometry(),
					new THREE.MeshBasicMaterial({transparent: true, opacity: 0})
				)
				this.foe.chest.name = 'chest'
				this.foe.chest.rotation.x = (Math.PI / 2)
				this.foe.chest.position.z += 24.8
				this.foe.chest.scale.set(0.6, 2.5, 0.6)
				this.foe.getObjectByName('mixamorigSpine1').attach(this.foe.chest)
				this.foe.hand = new THREE.Mesh(
					new THREE.SphereGeometry(0.35),
					new THREE.MeshBasicMaterial({transparent: true, opacity: 0})
				)
				this.foe.hand.name = 'hand'
				this.foe.hand.rotation.x = (Math.PI / 2)
				this.foe.hand.position.x += 0.85
				this.foe.hand.position.y += 0.5
				this.foe.hand.position.z += 23.3
				this.foe.getObjectByName('mixamorigHead').attach(this.foe.hand)
				this.foe.actions = []
				this.loadFoeAnimations()
				if (sound.audioListener) sound.initFoeAudio()
			}, xhr => {
				this.progress['foe'] = (xhr.loaded / xhr.total) * 100
			}, error => {
				console.error(error)
			}
		)
	}

	loadHeroAnimations() {
		this.fbxLoader.load('/models/hero/idle.fbx', fbx => {
			this.hero.actions['idle'] = this.hero.mixer.clipAction(fbx.animations[0])
			this.hero.actions['idle'].name = 'idle'
			this.hero.lastAction = this.hero.actions['idle']
			this.hero.actions['idle'].play()
		}, xhr => {
			this.progress['idle'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/walking.fbx', fbx => {
			this.hero.actions['walk'] = this.hero.mixer.clipAction(fbx.animations[0])
			this.hero.actions['walk'].name = 'walk'
		}, xhr => {
			this.progress['walking'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/walkingBack.fbx', fbx => {
			this.hero.actions['step-back'] = this.hero.mixer.clipAction(fbx.animations[0])
			this.hero.actions['step-back'].name = 'step-back'
		}, xhr => {
			this.progress['step-back'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/running.fbx', fbx => {
			this.hero.actions['run'] = this.hero.mixer.clipAction(fbx.animations[0])
			this.hero.actions['run'].name = 'run'
		}, xhr => {
			this.progress['running'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/jumping.fbx', fbx => {
			this.hero.actions['jump'] = this.hero.mixer.clipAction(fbx.animations[0])
			this.hero.actions['jump'].name = 'jump'
		}, xhr => {
			this.progress['jumping'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/jumpingRunning.fbx', fbx => {
			this.hero.actions['jump-running'] = this.hero.mixer.clipAction(fbx.animations[0])
			this.hero.actions['jump-running'].name = 'jump-running'
		}, xhr => {
			this.progress['jump-running'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/backflip.fbx', fbx => {
			this.hero.actions['backflip'] = this.hero.mixer.clipAction(fbx.animations[0])
			this.hero.actions['backflip'].name = 'backflip'
		}, xhr => {
			this.progress['backflip'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/kick.fbx', fbx => {
			this.hero.actions['kick'] = this.hero.mixer.clipAction(fbx.animations[0])
			this.hero.actions['kick'].name = 'kick'
		}, xhr => {
			this.progress['kick'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/rolling.fbx', fbx => {
			this.hero.actions['roll'] = this.hero.mixer.clipAction(fbx.animations[0])
			this.hero.actions['roll'].name = 'roll'
		}, xhr => {
			this.progress['roll'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/outwardSlash.fbx', fbx => {
			this.hero.actions['outward-slash'] = this.hero.mixer.clipAction(fbx.animations[0])
			this.hero.actions['outward-slash'].name = 'outward-slash'
		}, xhr => {
			this.progress['outward-slash'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/outwardSlashFast.fbx', fbx => {
			this.hero.actions['outward-slash-fast'] = this.hero.mixer.clipAction(fbx.animations[0])
			this.hero.actions['outward-slash-fast'].name = 'outward-slash-fast'
		}, xhr => {
			this.progress['outward-slash-fast'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/inwardSlash.fbx', fbx => {
			this.hero.actions['inward-slash'] = this.hero.mixer.clipAction(fbx.animations[0])
			this.hero.actions['inward-slash'].name = 'inward-slash'
		}, xhr => {
			this.progress['inward-slash'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/stomachHit.fbx', fbx => {
			this.hero.actions['stomach-hit'] = this.hero.mixer.clipAction(fbx.animations[0])
			this.hero.actions['stomach-hit'].name = 'stomach-hit'
		}, xhr => {
			this.progress['stomach-hit'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/die.fbx', fbx => {
			this.hero.actions['die'] = this.hero.mixer.clipAction(fbx.animations[0])
			this.hero.actions['die'].name = 'die'
		}, xhr => {
			this.progress['die'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		/* this.fbxLoader.load('/models/hero/punchingRight.fbx', fbx => {
			let animation = fbx.animations[0]
			hero.punchRightAction = hero.mixer.clipAction(animation)
			hero.punchRightAction.name = 'punch-right'
		}, xhr => {
			this.progress['punchingRight'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/punchingLeft.fbx', fbx => {
			let animation = fbx.animations[0]
			hero.punchLeftAction = hero.mixer.clipAction(animation)
			hero.punchLeftAction.name = 'punch-left'
		}, xhr => {
			this.progress['punchingLeft'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			reject(error)
		})
		this.fbxLoader.load('/models/hero/withdrawSword.fbx', fbx => {
			let animation = fbx.animations[0]
			withdrawSwordAction = hero.mixer.clipAction(animation)
			withdrawSwordAction.name = 'withdrawSword'
		}, xhr => {
			this.progress['withdrawSword'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/sheathSword.fbx', fbx => {
			let animation = fbx.animations[0]
			sheathSwordAction = hero.mixer.clipAction(animation)
			sheathSwordAction.name = 'sheathSword'
		}, xhr => {
			this.progress['sheathSword'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		}) */
		/* this.fbxLoader.load('/models/hero/turningLeft.fbx', fbx => {
			let animation = fbx.animations[0]
			rotateLeftAction = hero.mixer.clipAction(animation)
		}, xhr => {
			this.progress['turningLeft'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/turningRight.fbx', fbx => {
			let animation = fbx.animations[0]
			rotateRightAction = hero.mixer.clipAction(animation)
		}, xhr => {
			this.progress['turningRight'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		}) */
	}

	loadFoeAnimations() {
		this.fbxLoader.load('/models/humanoid/zombieIdle.fbx',
			fbx => {
				this.foe.actions['idle'] = this.foe.mixer.clipAction(fbx.animations[0])
				this.foe.actions['idle'].name = 'idle'
				this.foe.lastAction = this.foe.actions['idle']
				this.foe.actions['idle'].play()
			}, xhr => {
				this.progress['foe-idle'] = (xhr.loaded / xhr.total) * 100
			}, error => {
				console.error(error)
			}
		)
		this.fbxLoader.load('/models/humanoid/zombieWalk.fbx',
			fbx => {
				this.foe.actions['walk'] = this.foe.mixer.clipAction(fbx.animations[0])
				this.foe.actions['walk'].name = 'walk'
			}, xhr => {
				this.progress['foe-walk'] = (xhr.loaded / xhr.total) * 100
			}, error => {
				console.error(error)
			}
		)
		this.fbxLoader.load('/models/humanoid/zombieAttack.fbx',
			fbx => {
				this.foe.actions['attack'] = this.foe.mixer.clipAction(fbx.animations[0])
				this.foe.actions['attack'].name = 'attack'
			}, xhr => {
				this.progress['foe-attack'] = (xhr.loaded / xhr.total) * 100
			}, error => {
				console.error(error)
			}
		)
	}

	initGame() {
		if (this.gameStarted) return
		this.gameStarted = true
		document.body.classList.add('loaded')
		document.body.removeChild(document.querySelector('figure'))
		document.querySelector('header').style.removeProperty('display')
		if (!device.isPC) document.querySelectorAll('footer').forEach(el => el.style.removeProperty('display'))
		this.hero.getObjectByName('mixamorigRightHand').attach(this.sword)
		this.onFinishActions()
		this.refreshHPBar()
		this.initControls()
		this.resizeScene()
		this.animate()
	}

	animate() {
		requestAnimationFrame(() => this.animate())
		if (document.hidden) return
		this.updateGamepad()
		if (this.pause|| this.gameover) return
		this.clockDelta += this.clock.getDelta()
		if (this.fpsLimit && this.clockDelta < this.fpsLimit) return
		this.renderer.render(this.scene, this.camera)
		this.hero.mixer.update(this.clockDelta)
		this.foe.mixer.update(this.clockDelta)
		this.updateFPSCounter()
		this.updateCamera()
		if (!this.hero.died) {
			this.updateActions()
			this.updateFoe()
		}
		this.clockDelta = this.fpsLimit ? this.clockDelta % this.fpsLimit : this.clockDelta % (1 / Math.max(this.fps, 30))
	}

	initControls() {
		window.onkeydown = e => {
			//console.log(e)
			this.keyboardActive = true
			this.keysPressed[e.keyCode] = true
			if (this.keysPressed[inputSettings.keyboard.keyToggleSword] && !this.actions.includes('toggle-sword')) this.actions.push('toggle-sword')
			if (this.keysPressed[inputSettings.keyboard.keySlash] && !this.actions.includes('slash')) this.actions.push('slash')
			/* if (this.keysPressed[inputSettings.keyboard.keyPunch] && !this.actions.includes('punch')) this.actions.push('punch') */
			if (this.keysPressed[inputSettings.keyboard.keyRun] && !this.actions.includes('run')) this.actions.push('run')
			if (this.keysPressed[inputSettings.keyboard.keyTurnLeft] && !this.actions.includes('turn-left')) this.actions.push('turn-left')
			if (this.keysPressed[inputSettings.keyboard.keyTurnRight] && !this.actions.includes('turn-right')) this.actions.push('turn-right')
			if (this.keysPressed[inputSettings.keyboard.keyWalk] && !this.actions.includes('walk')) this.actions.push('walk')
			if (this.keysPressed[inputSettings.keyboard.keyBackflip] && !this.actions.includes('backflip')) this.actions.push('backflip')
			if (this.keysPressed[inputSettings.keyboard.keyStepBack] && !this.actions.includes('step-back')) this.actions.push('step-back')
			if (this.keysPressed[inputSettings.keyboard.keyJump] && !this.actions.includes('jump')) this.actions.push('jump')
			if (this.keysPressed[inputSettings.keyboard.keyKick] && !this.actions.includes('kick')) this.actions.push('kick')
			if (this.keysPressed[inputSettings.keyboard.keyRoll] && !this.actions.includes('roll')) this.actions.push('roll')
			if (this.keysPressed[inputSettings.keyboard.keyPause]) {
				this.pause = !this.pause
				this.refreshPause()
			}
		}
		window.onkeyup = e => {
			this.keysPressed[e.keyCode] = false
			if (e.keyCode == inputSettings.keyboard.keyToggleSword) this.actions.splice(this.actions.findIndex(el => el == 'toggle-sword'), 1)
			if (e.keyCode == inputSettings.keyboard.keySlash) this.actions.splice(this.actions.findIndex(el => el == 'slash'), 1)
			/* if (e.keyCode == inputSettings.keyboard.keyPunch) this.actions.splice(this.actions.findIndex(el => el == 'punch'), 1) */
			if (e.keyCode == inputSettings.keyboard.keyRun) this.actions.splice(this.actions.findIndex(el => el == 'run'), 1)
			if (e.keyCode == inputSettings.keyboard.keyTurnLeft) this.actions.splice(this.actions.findIndex(el => el == 'turn-left'), 1)
			if (e.keyCode == inputSettings.keyboard.keyTurnRight) this.actions.splice(this.actions.findIndex(el => el == 'turn-right'), 1)
			if (e.keyCode == inputSettings.keyboard.keyWalk) this.actions.splice(this.actions.findIndex(el => el == 'walk'), 1)
			if (e.keyCode == inputSettings.keyboard.keyBackflip) this.actions.splice(this.actions.findIndex(el => el == 'backflip'), 1)
			if (e.keyCode == inputSettings.keyboard.keyStepBack) this.actions.splice(this.actions.findIndex(el => el == 'step-back'), 1)
			if (e.keyCode == inputSettings.keyboard.keyJump) this.actions.splice(this.actions.findIndex(el => el == 'jump'), 1)
			if (e.keyCode == inputSettings.keyboard.keyKick) this.actions.splice(this.actions.findIndex(el => el == 'kick'), 1)
			if (e.keyCode == inputSettings.keyboard.keyRoll) this.actions.splice(this.actions.findIndex(el => el == 'roll'), 1)
		}
		const buttonForward = document.querySelector('#button-forward')
		buttonForward.ontouchmove = e => {
			e.stopPropagation()
			e.preventDefault()
			if (!buttonForward.posX && buttonForward.getClientRects()) buttonForward.posX = buttonForward.getClientRects()[0].x
			if (!this.actions.includes('turn-left') && e.changedTouches[0].pageX < (buttonForward.posX)) {
					this.actions.push('turn-left')
					document.querySelector('#button-left').classList.add('active')
			} else if (this.actions.includes('turn-left')) {
				this.actions.splice(actions.findIndex(el => el == 'turn-left'), 1)
				document.querySelector('#button-left').classList.remove('active')
			}
			if (!this.actions.includes('turn-right') && e.changedTouches[0].pageX > (buttonForward.posX+64)) {
					this.actions.push('turn-right')
					document.querySelector('#button-right').classList.add('active')
			} else if (this.actions.includes('turn-right')) {
				this.actions.splice(this.actions.findIndex(el => el == 'turn-right'), 1)
				document.querySelector('#button-right').classList.remove('active')
			}
		}
		buttonForward.ontouchstart = e => {
			e.stopPropagation()
			e.preventDefault()
			if (!this.actions.includes('walk')) this.actions.push('walk')
			buttonForward.classList.add('active')
		}
		buttonForward.ontouchend = () => {
			this.actions.splice(this.actions.findIndex(el => el == 'walk'), 1)
			if (this.actions.includes('turn-left')) this.actions.splice(this.actions.findIndex(el => el == 'turn-left'), 1)
			if (this.actions.includes('turn-right')) this.actions.splice(this.actions.findIndex(el => el == 'turn-right'), 1)
			buttonForward.classList.remove('active')
			document.querySelector('#button-left').classList.remove('active')
			document.querySelector('#button-right').classList.remove('active')
		}
		document.querySelector('#button-backward').ontouchstart = e => {
			e.stopPropagation()
			e.preventDefault()
			if (!this.actions.includes('step-back')) this.actions.push('step-back')
		}
		document.querySelector('#button-backward').ontouchend = () => {
			this.actions.splice(this.actions.findIndex(el => el == 'step-back'), 1)
		}
		document.querySelector('#button-left').ontouchstart = e => {
			e.stopPropagation()
			e.preventDefault()
			if (!this.actions.includes('turn-left')) this.actions.push('turn-left')
		}
		document.querySelector('#button-left').ontouchend = () => {
			this.actions.splice(this.actions.findIndex(el => el == 'turn-left'), 1)
		}
		document.querySelector('#button-right').ontouchstart = e => {
			e.stopPropagation()
			e.preventDefault()
			if (!this.actions.includes('turn-right')) this.actions.push('turn-right')
		}
		document.querySelector('#button-right').ontouchend = () => {
			this.actions.splice(this.actions.findIndex(el => el == 'turn-right'), 1)
		}
		/* document.querySelector('#button-roll').ontouchstart = e => {
			if (!this.actions.includes('roll')) this.actions.push('roll')
		}
		document.querySelector('#button-roll').ontouchend = () => {
			this.actions.splice(this.actions.findIndex(el => el == 'roll'), 1)
		} */
		document.querySelector('#button-run').ontouchstart = e => {
			if (!this.actions.includes('run')) this.actions.push('run')
		}
		document.querySelector('#button-run').ontouchend = () => {
			this.actions.splice(this.actions.findIndex(el => el == 'run'), 1)
		}
		document.querySelector('#button-attack').ontouchstart = e => {
			if (!this.actions.includes('slash')) this.actions.push('slash')
		}
		document.querySelector('#button-attack').ontouchend = () => {
			this.actions.splice(this.actions.findIndex(el => el == 'punch'), 1)
		}
		document.querySelector('#button-kick').ontouchstart = e => {
			if (!this.actions.includes('kick')) this.actions.push('kick')
		}
		document.querySelector('#button-kick').ontouchend = () => {
			this.actions.splice(this.actions.findIndex(el => el == 'kick'), 1)
		}
		document.querySelector('#button-jump').ontouchstart = e => {
			if (!this.actions.includes('jump')) this.actions.push('jump')
		}
		document.querySelector('#button-jump').ontouchend = () => {
			this.actions.splice(this.actions.findIndex(el => el == 'jump'), 1)
		}
	}

	updateGamepad() {
		if (this.hero.died) return
		this.gamepad = navigator.getGamepads().find(el => el?.connected)
		if (!this.gamepad) return
		if (!this.gamepadSettings) {
			let data = /vendor:\s(\w+)\sproduct:\s(\w+)/i.exec(this.gamepad.id)
			let vendorId = data[1]
			let productId = data[2]
			this.gamepadSettings = inputSettings.gamepad[vendorId] ?? inputSettings.gamepad['default']
		}
		if (this.gamepad.buttons.some(el => el.pressed)) this.keyboardActive = false
		if (this.keyboardActive) return
		if (this.gamepad.axes[gamepadSettings.YAxes] <= -0.05 || this.gamepad.buttons[gamepadSettings.UP]?.pressed) {
			if (!this.actions.includes('walk')) actions.push('walk')
		} else if (this.actions.includes('walk')) {
			this.actions.splice(this.actions.findIndex(el => el == 'walk'), 1)
		}
		if (this.gamepad.axes[gamepadSettings.YAxes] >= 0.5 || this.gamepad.buttons[gamepadSettings.DOWN]?.pressed) {
			if (!this.actions.includes('step-back')) this.actions.push('step-back')
		} else if (this.actions.includes('step-back')) {
			this.actions.splice(this.actions.findIndex(el => el == 'step-back'), 1)
		}
		if (this.gamepad.axes[gamepadSettings.XAxes] <= -0.05 || this.gamepad.buttons[gamepadSettings.LEFT]?.pressed) {
			if (!this.actions.includes('turn-left')) this.actions.push('turn-left')
		} else if (this.actions.includes('turn-left')) {
			this.actions.splice(actions.findIndex(el => el == 'turn-left'), 1)
		}
		if (this.gamepad.axes[gamepadSettings.XAxes] >= 0.05 || this.gamepad.buttons[gamepadSettings.RIGHT]?.pressed) {
			if (!this.actions.includes('turn-right')) this.actions.push('turn-right')
		} else if (this.actions.includes('turn-right')) {
			this.actions.splice(this.actions.findIndex(el => el == 'turn-right'), 1)
		}
		if (this.gamepad.buttons[gamepadSettings.A].pressed) {
			if (!this.actions.includes('run')) this.actions.push('run')
		} else if (this.actions.includes('run')) {
			this.actions.splice(this.actions.findIndex(el => el == 'run'), 1)
		}
		if (this.gamepad.buttons[gamepadSettings.B].pressed) {
			if (!this.actions.includes('roll')) this.actions.push('roll')
		} else if (this.actions.includes('roll')) {
			this.actions.splice(this.actions.findIndex(el => el == 'roll'), 1)
		}
		if (this.gamepad.buttons[gamepadSettings.X].pressed) {
			if (!this.actions.includes('jump')) this.actions.push('jump')
		} else if (this.actions.includes('jump')) {
			this.actions.splice(this.actions.findIndex(el => el == 'jump'), 1)
		}
		if (this.gamepad.buttons[gamepadSettings.Y].pressed) {
			if (!this.actions.includes('backflip')) this.actions.push('backflip')
		} else if (this.actions.includes('backflip')) {
			this.actions.splice(this.actions.findIndex(el => el == 'backflip'), 1)
		}
		/* if (this.gamepad.buttons[gamepadSettings.].pressed) {
			if (!this.actions.includes('punch')) this.actions.push('punch')
		} else if (this.actions.includes('punch')) {
			this.actions.splice(this.actions.findIndex(el => el == 'punch'), 1)
		} */
		if (this.gamepad.buttons[gamepadSettings.RB].pressed) {
			if (!this.actions.includes('slash')) this.actions.push('slash')
		} else if (this.actions.includes('slash')) {
			this.actions.splice(this.actions.findIndex(el => el == 'slash'), 1)
		}
		if (this.gamepad.buttons[gamepadSettings.LB].pressed) {
			if (!this.actions.includes('kick')) this.actions.push('kick')
		} else if (this.actions.includes('kick')) {
			this.actions.splice(this.actions.findIndex(el => el == 'kick'), 1)
		}
		if (this.gamepad.buttons[gamepadSettings.MENU].pressed) {
			if (performance.now() < this.pauseLastUpdate) return
			this.pause = !this.pause
			this.refreshPause()
			this.pauseLastUpdate = performance.now() + 250
		}
	}

	updateFPSCounter() {
		this.frames++
		if (performance.now() < this.lastFrameTime + 1000) return
		this.fps = Math.round(( this.frames * 1000 ) / ( performance.now() - this.lastFrameTime ))
		if (!Number.isNaN(this.fps)) {
			let ctx = document.querySelector('#fps').getContext('2d')
			ctx.font = 'bold 20px sans-serif'
			ctx.textAlign = 'end'
			ctx.textBaseline = 'middle'
			ctx.fillStyle = 'rgba(255,255,255,0.25)'
			ctx.clearRect(0, 0, 80, 20)
			ctx.fillText(`${this.fps} FPS`, 80, 10)
		}
		this.lastFrameTime = performance.now()
		this.frames = 0
	}

	updateCamera() {
		let target = this.hero.clone()
		this.dummyCamera.getWorldPosition(target.position)
		this.dummyCamera.getWorldQuaternion(target.quaternion)
		this.camera.position.lerp(target.position, 0.25)
		this.camera.quaternion.slerp(target.quaternion, 0.25)
	}

	updateActions() {
		let w = this.actions.includes('walk')
		let r = this.actions.includes('run')
		let s = this.actions.includes('slash')
		let p = this.actions.includes('punch')
		let k = this.actions.includes('kick')
		let t = this.actions.some(el => ['turn-left', 'turn-right'].includes(el))
		let sb = this.actions.includes('step-back')
		let b = this.actions.includes('backflip')
		let j = this.actions.includes('jump')
		let rl = this.actions.includes('roll')
		let bf = this.actions.includes('backflip')
		let ts = this.actions.includes('toggle-sword')
		if (this.actions.length <= 0) this.synchronizeCrossFade(this.hero, this.hero.actions['idle'])
		if (!this.hero.waitForAnimation && s && !this.hero.isSlashing) {
			this.hero.isSlashing = true
			this.hero.waitForAnimation = true
			sound.playHeroAttackSE()
			 this.executeCrossFade(this.hero, this.hero.actions['outward-slash'], 0.1, 'once')
		/* } else if (!this.waitForAnimation && p && !this.isPunching) {
			this.isPunching = true
			this.waitForAnimation = true
			executeCrossFade(this.hero, this.punchRightAction, 0.1, 'once') */
		} else if (!this.hero.waitForAnimation && k) {
			this.hero.isKicking = true
			this.hero.waitForAnimation = true
			sound.playHeroAttackSE()
			 this.executeCrossFade(this.hero, this.hero.actions['kick'], 0.1, 'once')
		} else if (!this.hero.waitForAnimation && bf && !this.hero.isBackingflip) {
			this.hero.isBackingflip = true
			 this.executeCrossFade(hero, hero.actions['backflip'], 0.1, 'once')
			setTimeout(() => {updateWalk(false, true, 5)}, 250)
		}
		if (this.hero.waitForAnimation || this.hero.isPunching || this.hero.isKicking || this.hero.isBackingflip) return
		if (this.actions.includes('turn-left')) this.hero.rotation.y += 0.025
		if (this.actions.includes('turn-right')) this.hero.rotation.y -= 0.025
		if (w && !this.hero.isWalking) {
			this.hero.isWalking = true
			 this.executeCrossFade(this.hero,this. hero.actions['walk'])
		} else if (!w && this.hero.isWalking) {
			if (!t) this.executeCrossFade(this.hero, this.hero.actions['idle'])
			this.hero.isWalking = false
			this.hero.isRunning = false
		}
		if (w) {
			 this.updateWalk(r)
			if (r && !this.hero.isRunning) {
				this.hero.isRunning = true
				 this.executeCrossFade(this.hero, this.hero.actions['run'])
			} else if (!r && this.hero.isRunning) {
				 this.executeCrossFade(this.hero,this. hero.actions['walk'])
				this.hero.isRunning = false
			}
		}
		if (!this.hero.waitForAnimation && rl && !this.hero.isRolling) {
			this.hero.isRolling = true
			 this.executeCrossFade(this.hero, this.hero.actions['roll'], 0.25, 'once')
		}
		if (this.hero.isRolling) return
		if (!this.hero.waitForAnimation && j && !this.hero.isJumping) {
			this.hero.isJumping = true
			 this.executeCrossFade(hero, w ? this.hero.actions['jump-running'] : this.hero.actions['jump'], 0.25, 'once')
		}
		if (w || this.hero.isJumping) return
		if (sb && !this.hero.isSteppingBack) {
			this.hero.isSteppingBack = true
			 this.executeCrossFade(this.hero, this.hero.actions['step-back'])
		} else if (!sb && this.hero.isSteppingBack) {
			 this.executeCrossFade(this.hero,  this.returnAction())
			this.hero.isSteppingBack = false
		}
		if (sb) return  this.updateWalk(false, true, 0.025)
		if (!this.hero.isRotating && t) {
			this.hero.isRotating = true
			 this.executeCrossFade(this.hero, this.hero.actions['walk'])
		} else if (this.hero.isRotating && !t) {
			if (!w)  this.executeCrossFade(this.hero,  this.returnAction())
			this.hero.isRotating = false
		}
		/* if (!this.hero.waitForAnimation && !this.hero.isTogglingSword && ts) {
			this.hero.isTogglingSword = true
			this.hero.waitForAnimation = true
			 this.executeCrossFade(this.hero, this.hero.swordEquipped ? sheathSwordAction : withdrawSwordAction, 0.25, 'once')
		} else if (this.isTogglingSword && !t) {
			 this.executeCrossFade(this.hero, this.returnAction())
			this.hero.isTogglingSword = false
		} */
	}

	updateWalk(running=false, back=false, speed=0.1, ignoreColision=false) {
		//if (!ignoreColision && this.collide(hero, foe)) return this.updateWalk(running, !back, 0.1, true)
		let dir = this.camera.getWorldDirection(this.hero.position.clone())
		if (back) dir.negate()
		let step = dir.multiplyScalar(running ? speed*2.5 : speed)
		let pos = this.hero.position.clone()
		pos.add(step)
		if (pos.x >= (groundSize/2-1) || pos.x <= ((groundSize/2-1)*-1)) return
		if (pos.z >= (groundSize/2-1) || pos.z <= ((groundSize/2-1)*-1)) return
		this.hero.position.add(step)
	}

	executeCrossFade(object, newAction, duration=0.25, loop='repeat') {
		if (!object.lastAction || !newAction) return
		if (object.died && newAction.name != 'die') return
		if (object == this.hero && this.actions.some(el => ['walk', 'run', 'turn-left', 'turn-right', 'step-back'].includes(el)) && newAction.name == 'idle') return
		if (object.lastAction == newAction) return newAction.reset()
		newAction.enabled = true
		newAction.setEffectiveTimeScale(1)
		newAction.setEffectiveWeight(1)
		newAction.loop = loop == 'pingpong' ? THREE.LoopPingPong : loop == 'once' ? THREE.LoopOnce : THREE.LoopRepeat
		newAction.clampWhenFinished = (loop == 'once')
		if (loop == 'once') newAction.reset()
		object.lastAction.crossFadeTo(newAction, duration, true)
		object.lastAction = newAction
		newAction.play()
	}

	synchronizeCrossFade(object, newAction, duration=0.25, loop='repeat') {
		object.mixer.addEventListener('loop', onLoopFinished)
		function onLoopFinished(event) {
			if (object.uuid == game.hero.uuid) {
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
				 game.executeCrossFade(object, newAction, duration, loop)
			}
		}
	}

	onFinishActions() {
		this.hero.mixer.addEventListener('finished', () => {
			if (this.hero.died) {
				return  this.playerDied()
			} else if (this.actions.includes('slash')) {
				sound.playHeroAttackSE()
				let action = this.hero.lastAction.name == 'inward-slash' ? this.hero.actions['outward-slash'] : this.hero.actions['inward-slash']
				 this.executeCrossFade(this.hero, action, 0.175, 'once')
			/* } else if (this.actions.includes('punch')) {
				sound.playHeroAttackSE()
				executeCrossFade(this.hero, this.hero.lastAction.name == punchLeftAction ? punchRightAction : punchLeftAction, 0.1, 'once') */
			} else if (this.actions.includes('kick')) {
				sound.playHeroAttackSE()
				 this.executeCrossFade(this.hero, this.hero.actions['kick'], 0.1, 'once')
			} else if (this.actions.includes('backflip')) {
				 this.executeCrossFade(this.hero, this.hero.actions['backflip'], 0.1, 'once')
			} else {
				 this.executeCrossFade(this.hero,  this.returnAction())
			}
			/* if (this.isTogglingSword) {
				this.hero.swordEquipped = !this.hero.swordEquipped
				this.sword.parent.remove(this.sword)
				this.sword.matrixWorld.decompose(this.sword.position, this.sword.quaternion, this.sword.scale)
				if (this.hero.swordEquipped) {
					this.hero.getObjectByName('mixamorigRightHand').attach(this.sword)
				} else {
					this.hero.getObjectByName('mixamorigLeftLeg').attach(this.sword)
				}
			} */
			this.hero.waitForAnimation = false
			this.hero.isBackingflip = false
			this.hero.isRolling = false
			this.hero.isJumping = false
			this.hero.isTogglingSword = false
			this.hero.beenHit = false
			if (!this.actions.includes('kick')) this.hero.isKicking = false
			if (!this.actions.includes('slash')) this.hero.isSlashing = false
			if (!this.actions.includes('punch')) this.hero.isPunching = false
		})
		this.foe.mixer.addEventListener('finished', () => {
			this.foe.waitForAnimation = false
			this.foe.isAttacking = false
			 this.executeCrossFade(this.foe, this.foe.actions['walk'])
		})
	}

	returnAction() {
		if (this.actions.some(el => ['walk', 'turn-left', 'turn-right'].includes(el))) {
			return this.actions.includes('run') ? this.hero.actions['run'] : this.hero.actions['walk']
		} else if (this.actions.includes('step-back')) {
			return this.hero.actions['step-back']
		} else {
			return this.hero.actions['idle']
		}
	}

	vibrateGamepad(duration=0.1) {
		if (!this.gamepad) return
		this.gamepad.vibrationActuator.playEffect(this.gamepad.vibrationActuator.type, {
			startDelay: 0,
			duration: duration,
			weakMagnitude: 0.1,
			strongMagnitude: 0.25,
		})
	}

	playerDied() {
		document.querySelector('#game-over').classList.add('show')
		document.querySelector('header').style.setProperty('display', 'none')
		document.querySelectorAll('footer').forEach(el => el.style.setProperty('display', 'none'))
		this.gameover = true
	}

	resizeScene() {
		this.camera.aspect = window.innerWidth /window.innerHeight
		this.camera.updateProjectionMatrix()
		this.refreshHPBar()
		let pixelRatio = 1
		if (window.devicePixelRatio > 1 && device.cpuCores >= 4 && device.memory >= 6) pixelRatio = window.devicePixelRatio
		else if (device.cpuCores < 4 || device.memory < 6) pixelRatio = 0.5
		this.renderer.setPixelRatio(pixelRatio)
		this.renderer.setSize(window.innerWidth, window.innerHeight)
	}

	refreshHPBar() {
		let hpbarWidth = document.querySelector('#hpbar').clientWidth - 4
		let barWidth = Math.max(0, this.hero.hp) * hpbarWidth / this.hero.maxhp
		document.querySelector('#hpbar').style.setProperty('--hp-width', `${barWidth}px`)
		if (this.hero.hp <= 0 && !this.hero.died) {
			this.executeCrossFade(this.hero, this.hero.actions['die'], 1, 'once')
			sound.playME(sound.gameoverBuffer)
			this.hero.died = true
		}
	}

	refreshPause() {
		if (this.pause) document.querySelector('#glass').classList.add('opened')
		else document.querySelector('#glass').classList.remove('opened')
	}

	toggleVisibility() {
		if (document.hidden) this.actions.splice(0)
	}

	getDistance(a, b) {
		if (a.lastCollisionUpdate > (performance.now()-500)) return
		a.lastCollisionUpdate = performance.now()
		let verts = a.collider.geometry.attributes.position
		for (let i = 0; i < verts.count; i++) {
			let localVertex = this.vertex.fromBufferAttribute(verts, i)
			let globalVertex = localVertex.applyMatrix4(a.matrix)
			let directionVector = globalVertex.sub(a.position)
			this.caster.set(a.position, directionVector.normalize())
			let collisionResults = this.caster.intersectObjects([b.collider])
			let collided = collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()
			if(collisionResults.length > 0) return {distance: collisionResults[0].distance, collided: collided}
		}
		return this.getDistance(b, a)//{distance: undefined, collided: false}
	}

	collide(a, b) {
		let distance = getDistance(a, b)
		if (distance?.collided) return true
		/* distance = getDistance(b, a)
		if (distance?.collided) return true */
		distance = a.position.z==b.position.z&&a.position.x==b.position.x&&a.position.y==b.position.y
		return distance
	}

	updateFoe() {
		if (location.search.includes('stop-foe')) return
		let check = this.getDistance(this.foe, this.hero)
		if (check?.distance <= 2.5 && !this.foe.isAttacking) {
			this.foe.isAttacking = true
			this.foe.waitForAnimation = true
			this.executeCrossFade(this.foe, this.foe.actions['attack'], 0.1, 'once')
			setTimeout(() => {
				this.hero.waitForAnimation = true
				this.hero.beenHit = true
				this.hero.hp -= 10
				this.refreshHPBar()
				this.vibrateGamepad()
				sound.playHeroDamageSE()
				this.executeCrossFade(this.hero, this.hero.actions['stomach-hit'], 0.1, 'once')
			}, this.fpsLimit ? this.fpsLimit * 100 * 500 : 500)
		}
		if (this.foe.waitForAnimation) return
		if (this.foe.isWalking) {
			if (!this.foe.se) {
				let audios = this.foe.children.filter(el => el.type == 'Audio')
				if (!audios.length) return
				let i = randomInt(0, audios.length-1)
				if (audios[i] && !audios[i].isPlaying) {
					audios[i].play()
					this.foe.se = audios[i]
				}
			}
			 this.updateObjectFollow(this.foe, this.hero, check?.collided)
		}
		if (check?.distance < 200 && !this.foe.isWalking) {
			this.foe.isWalking = true
			 this.executeCrossFade(this.foe, this.foe.actions['walk'])
		} else if (check?.distance >= 200 && this.foe.isWalking) {
			this.foe.isWalking = false
			this.synchronizeCrossFade(this.foe, this.foe.actions['idle'])
		}
	}
	
	updateObjectFollow(src, target, collided, speed=0.001) {
		let pos = target.position.clone()
		let dir = src.position.clone().sub(pos)
		let step = dir.multiplyScalar(collided ? speed : speed * -1)
		src.lookAt(pos)
		src.position.add(step)
	}

}

window.game = new Game()
'use strict'
import * as THREE from '/js/modules/three.module.js'
import { Entity } from '/js/entity.js'
import inputSettings from '/js/settings/input.js'
import randomInt from '/js/helpers/randomInt.js'

export class Player extends Entity {

	loadingElements = 16

	constructor(camera, callback, onload) {
		super(callback, onload)
		this.camera = camera
		this.actions = []
		this.keysPressed = {}
		this.hp = 100
		this.maxhp = 100
		this.initControls()
	}

	update(clockDelta) {
		super.update(clockDelta)
		this.updateCamera()
		this.updateGamepad()
	}

	loadModel() {
		this.gltfLoader.load('/models/hero/hero.glb', gltf => {
			this.object = gltf.scene
			this.object.encoding = THREE.sRGBEncoding
			this.object.traverse(el => {if (el.isMesh) el.castShadow = true})
			this.dummyCamera = this.camera.clone()
			this.dummyCamera.position.set(0, this.object.position.y+5, this.object.position.z-10)
			this.dummyCamera.lookAt(0, 5, 0)
			this.object.add(this.dummyCamera)
			this.mixer = new THREE.AnimationMixer(this.object)
			this.object.collider = new THREE.Mesh(
				new THREE.SphereGeometry(0.8),
				new THREE.MeshBasicMaterial({transparent: true, opacity: 0})
			)
			this.object.collider.name = 'collider'
			this.object.add(this.object.collider)
			this.object.chest = new THREE.Mesh(
				new THREE.CylinderGeometry(),
				new THREE.MeshBasicMaterial({transparent: true, opacity: 0})
			)
			this.object.chest.name = 'chest'
			this.object.chest.rotation.x = (Math.PI / 2) - 0.25
			this.object.chest.position.z -= 4.8
			this.object.chest.scale.set(0.6, 2.5, 0.6)
			this.object.getObjectByName('mixamorigSpine1').attach(this.object.chest)
			this.onFinishActions()
			this.loadAnimations()
			this.loadWeapon()
			this.callback(this.object)
			/* if (window.sound && window.sound.audioContext) window.sound.initHeroAudio() */
		}, xhr => {
			this.progress['player'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
	}

	loadWeapon() {
		this.gltfLoader.load('/models/equips/sword.glb', fbx => {
			this.sword = fbx.scene
			this.sword.encoding = THREE.sRGBEncoding
			this.sword.traverse(el => {if (el.isMesh) el.castShadow = true})
			this.object.getObjectByName('mixamorigRightHand').attach(this.sword)
		}, xhr => {
			this.progress['sword'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
	}

	loadAnimations() {
		this.fbxLoader.load('/models/hero/idle.fbx', fbx => {
			this.animations['idle'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['idle'].name = 'idle'
			this.lastAction = this.animations['idle']
			this.animations['idle'].play()
		}, xhr => {
			this.progress['idle'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/walking.fbx', fbx => {
			this.animations['walk'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['walk'].name = 'walk'
		}, xhr => {
			this.progress['walk'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/walkingBack.fbx', fbx => {
			this.animations['step-back'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['step-back'].name = 'step-back'
		}, xhr => {
			this.progress['step-back'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/running.fbx', fbx => {
			this.animations['run'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['run'].name = 'run'
		}, xhr => {
			this.progress['running'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/jumping.fbx', fbx => {
			this.animations['jump'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['jump'].name = 'jump'
		}, xhr => {
			this.progress['jump'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/jumpingRunning.fbx', fbx => {
			this.animations['jump-running'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['jump-running'].name = 'jump-running'
		}, xhr => {
			this.progress['jump-running'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/backflip.fbx', fbx => {
			this.animations['backflip'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['backflip'].name = 'backflip'
		}, xhr => {
			this.progress['backflip'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/kick.fbx', fbx => {
			this.animations['kick'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['kick'].name = 'kick'
		}, xhr => {
			this.progress['kick'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/rolling.fbx', fbx => {
			this.animations['roll'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['roll'].name = 'roll'
		}, xhr => {
			this.progress['roll'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/outwardSlash.fbx', fbx => {
			this.animations['outward-slash'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['outward-slash'].name = 'outward-slash'
		}, xhr => {
			this.progress['outward-slash'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/outwardSlashFast.fbx', fbx => {
			this.animations['outward-slash-fast'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['outward-slash-fast'].name = 'outward-slash-fast'
		}, xhr => {
			this.progress['outward-slash-fast'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/inwardSlash.fbx', fbx => {
			this.animations['inward-slash'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['inward-slash'].name = 'inward-slash'
		}, xhr => {
			this.progress['inward-slash'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/stomachHit.fbx', fbx => {
			this.animations['stomach-hit'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['stomach-hit'].name = 'stomach-hit'
		}, xhr => {
			this.progress['stomach-hit'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/hero/die.fbx', fbx => {
			this.animations['die'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['die'].name = 'die'
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
			if (e.changedTouches[0].pageX < (buttonForward.posX)) {
				if (this.actions.includes('turn-left')) return
				this.actions.push('turn-left')
				document.querySelector('#button-left').classList.add('active')
			} else if (this.actions.includes('turn-left')) {
				this.actions.splice(this.actions.findIndex(el => el == 'turn-left'), 1)
				document.querySelector('#button-left').classList.remove('active')
			}
			if (e.changedTouches[0].pageX > (buttonForward.posX+64)) {
				if (this.actions.includes('turn-right')) return
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
		if (this.died) return
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

	updateCamera() {
		let target = this.object.clone()
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
		if (this.actions.length <= 0) this.synchronizeCrossFade(this.animations['idle'])
		if (!this.waitForAnimation && s && !this.isSlashing) {
			this.isSlashing = true
			this.waitForAnimation = true
			this.playAttackSE()
			this.executeCrossFade(this.animations['outward-slash'], 0.1, 'once')
		/* } else if (!this.waitForAnimation && p && !this.isPunching) {
			this.isPunching = true
			this.waitForAnimation = true
			executeCrossFade(this.punchRightAction, 0.1, 'once') */
		} else if (!this.waitForAnimation && k) {
			this.isKicking = true
			this.waitForAnimation = true
			this.playAttackSE()
			 this.executeCrossFade(this.animations['kick'], 0.1, 'once')
		} else if (!this.waitForAnimation && bf && !this.isBackingflip) {
			this.isBackingflip = true
			 this.executeCrossFade(this.animations['backflip'], 0.1, 'once')
			setTimeout(() => {this.updateWalk(false, true, 5)}, 250)
		}
		if (this.waitForAnimation || this.isPunching || this.isKicking || this.isBackingflip) return
		if (this.actions.includes('turn-left')) this.object.rotation.y += 0.025
		if (this.actions.includes('turn-right')) this.object.rotation.y -= 0.025
		if (w && !this.isWalking) {
			this.isWalking = true
			 this.executeCrossFade(this.animations['walk'])
		} else if (!w && this.isWalking) {
			if (!t) this.executeCrossFade(this.animations['idle'])
			this.isWalking = false
			this.isRunning = false
		}
		if (w) {
			 this.updateWalk(r)
			if (r && !this.isRunning) {
				this.isRunning = true
				 this.executeCrossFade(this.animations['run'])
			} else if (!r && this.isRunning) {
				 this.executeCrossFade(this.animations['walk'])
				this.isRunning = false
			}
		}
		if (!this.waitForAnimation && rl && !this.isRolling) {
			this.isRolling = true
			 this.executeCrossFade(this.animations['roll'], 0.25, 'once')
		}
		if (this.isRolling) return
		if (!this.waitForAnimation && j && !this.isJumping) {
			this.isJumping = true
			 this.executeCrossFade(w ? this.animations['jump-running'] : this.animations['jump'], 0.25, 'once')
		}
		if (w || this.isJumping) return
		if (sb && !this.isSteppingBack) {
			this.isSteppingBack = true
			 this.executeCrossFade(this.animations['step-back'])
		} else if (!sb && this.isSteppingBack) {
			 this.executeCrossFade( this.returnAction())
			this.isSteppingBack = false
		}
		if (sb) return  this.updateWalk(false, true, 0.025)
		if (!this.isRotating && t) {
			this.isRotating = true
			 this.executeCrossFade(this.animations['walk'])
		} else if (this.isRotating && !t) {
			if (!w)  this.executeCrossFade( this.returnAction())
			this.isRotating = false
		}
		/* if (!this.waitForAnimation && !this.isTogglingSword && ts) {
			this.isTogglingSword = true
			this.waitForAnimation = true
			 this.executeCrossFade(this.swordEquipped ? sheathSwordAction : withdrawSwordAction, 0.25, 'once')
		} else if (this.isTogglingSword && !t) {
			 this.executeCrossFade(this.returnAction())
			this.isTogglingSword = false
		} */
	}

	updateWalk(running=false, back=false, speed=0.1, ignoreColision=false) {
		//if (!ignoreColision && this.collide(foe)) return this.updateWalk(running, !back, 0.1, true)
		let dir = this.camera.getWorldDirection(this.object.position.clone())
		if (back) dir.negate()
		let step = dir.multiplyScalar(running ? speed*2.5 : speed)
		let pos = this.object.position.clone()
		pos.add(step)
		if (pos.x >= (200/2-1) || pos.x <= ((200/2-1)*-1)) return
		if (pos.z >= (200/2-1) || pos.z <= ((200/2-1)*-1)) return
		this.object.position.add(step)
	}

	returnAction() {
		if (this.actions.some(el => ['walk', 'turn-left', 'turn-right'].includes(el))) {
			return this.actions.includes('run') ? this.animations['run'] : this.animations['walk']
		} else if (this.actions.includes('step-back')) {
			return this.animations['step-back']
		} else {
			return this.animations['idle']
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

	setupDamage(damage) {
		this.hp -= damage
		if (this.hp < 0) this.hp = 0
		this.waitForAnimation = true
		this.beenHit = true
		this.refreshHPBar()
		this.playDamageSE()
		this.vibrateGamepad()
		this.executeCrossFade(this.animations['stomach-hit'], 0.1, 'once')
		if (this.hp <= 0 && !this.died) {
			this.executeCrossFade(this.animations['die'], 1, 'once')
			window.sound.playME(window.sound.gameoverBuffer)
			this.died = true
		}
	}

	playAttackSE() {
		if (this.beenHit || this.sePlaying) return
		const audios = Object.keys(this.audios).filter(el => el.startsWith('attack'))
		if (!audios.length) return
		let i = randomInt(0, audios.length-1)
		this.sePlaying = true
		window.sound.playSE(this.audios[audios[i]], false, this)
	}

	playDamageSE() {
		if (this.sePlaying) return
		const audios = Object.keys(this.audios).filter(el => el.startsWith('damage'))
		if (!audios.length) return
		let i = randomInt(0, audios.length-1)
		this.sePlaying = true
		window.sound.playSE(this.audios[audios[i]], false, this)
	}

	gameover() {
		document.querySelector('#game-over').classList.add('show')
		document.querySelector('header').style.setProperty('display', 'none')
		document.querySelectorAll('footer').forEach(el => el.style.setProperty('display', 'none'))
		game.gameover = true
	}

	refreshHPBar() {
		let hpbarWidth = document.querySelector('#hpbar').clientWidth - 4
		let barWidth = Math.max(0, this.hp) * hpbarWidth / this.maxhp
		document.querySelector('#hpbar').style.setProperty('--hp-width', `${barWidth}px`)
	}

	refreshPause() {
		if (this.pause) document.querySelector('#glass').classList.add('opened')
		else document.querySelector('#glass').classList.remove('opened')
	}

	executeCrossFade(newAction, duration=0.25, loop='repeat') {
		if (this.actions.some(el => ['walk', 'run', 'turn-left', 'turn-right', 'step-back'].includes(el)) && newAction.name == 'idle') return
		super.executeCrossFade(newAction, duration, loop)
	}

	synchronizeCrossFade(newAction, duration=0.25, loop='repeat') {
		this.mixer.addEventListener('loop', onLoopFinished)
		const vm = this
		function onLoopFinished(event) {
			this.waitForAnimation = false
			this.isSlashing = false
			this.isPunching = false
			this.isKicking = false
			this.isBackingflip = false
			this.isRolling = false
			this.isJumping = false
			if (event.action == vm.lastAction) {
				vm.mixer.removeEventListener('loop', onLoopFinished)
				vm.executeCrossFade(newAction, duration, loop)
			}
		}
	}

	onFinishActions() {
		this.mixer.addEventListener('finished', () => {
			if (this.died) {
				return  this.gameover()
			} else if (this.actions.includes('slash')) {
				this.playAttackSE()
				let action = this.lastAction.name == 'inward-slash' ? this.animations['outward-slash'] : this.animations['inward-slash']
				 this.executeCrossFade(action, 0.175, 'once')
			/* } else if (this.actions.includes('punch')) {
				this.playAttackSE()
				executeCrossFade(this, this.lastAction.name == punchLeftAction ? punchRightAction : punchLeftAction, 0.1, 'once') */
			} else if (this.actions.includes('kick')) {
				this.playAttackSE()
				this.executeCrossFade(this.animations['kick'], 0.1, 'once')
			} else if (this.actions.includes('backflip')) {
				this.executeCrossFade(this.animations['backflip'], 0.1, 'once')
			} else {
				this.executeCrossFade(this.returnAction())
			}
			/* if (this.isTogglingSword) {
				this.swordEquipped = !this.swordEquipped
				this.sword.parent.remove(this.sword)
				this.sword.matrixWorld.decompose(this.sword.position, this.sword.quaternion, this.sword.scale)
				if (this.swordEquipped) {
					this.getObjectByName('mixamorigRightHand').attach(this.sword)
				} else {
					this.object.getObjectByName('mixamorigLeftLeg').attach(this.sword)
				}
			} */
			if (!this.actions.includes('kick')) this.isKicking = false
			if (!this.actions.includes('slash')) this.isSlashing = false
			if (!this.actions.includes('punch')) this.isPunching = false
			this.isBackingflip = false
			this.isRolling = false
			this.isJumping = false
			this.isTogglingSword = false
			this.beenHit = false
			this.waitForAnimation = false
		})
	}

	initAudio() {
		for (let i=0; i<=4; i++) {
			this.fetchAudio(`attack-${i}`, `/audio/hero/attack/${i}.mp3`)
			this.fetchAudio(`damage-${i}`, `/audio/hero/damage/${i}.mp3`)
		}
	}

	toggleVisibility() {
		if (document.hidden) this.actions.splice(0)
	}

	resizeScene() {
		this.refreshHPBar()
	}

}
'use strict'
import * as THREE from '/js/modules/three.module.js'
import { Entity } from '/js/classes/entity.js'
import inputSettings from '/js/settings/input.js'
import randomInt from '/js/helpers/randomInt.js'
import device from '/js/helpers/device.js'

export class Player extends Entity {

	loadingElements = 16

	constructor(camera, callback, onload) {
		super(callback, onload)
		this.camera = camera
		this.actions = []
		this.keysPressed = {}
		this.potions = 3
		this.hp = 100
		this.maxhp = 100
		this.initControls()
	}

	update(clockDelta) {
		super.update(clockDelta)
		if (this.gamepadConnected) this.updateGamepad()
		if (this.processingAttack) this.executeMelleeAttack()
	}

	loadModel() {
		this.gltfLoader.load('/models/hero/hero.glb', gltf => {
			this.object = gltf.scene
			this.object.encoding = THREE.sRGBEncoding
			this.object.traverse(el => {if (el.isMesh) el.castShadow = true})
			this.camera.position.set(0, this.object.position.y+5, this.object.position.z-15)
			this.camera.lookAt(0, 5, 0)
			this.object.add(this.camera)
			this.mixer = new THREE.AnimationMixer(this.object)

			this.collider = new THREE.Mesh(new THREE.SphereGeometry(0.8), new THREE.MeshBasicMaterial({visible: false}))
			this.collider.name = 'collider'
			this.object.add(this.collider)
			this.collider.geometry.computeBoundingBox()

			this.pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 2.5), new THREE.MeshBasicMaterial({visible: false}))
			this.pillar.name = 'pillar'
			this.pillar.rotation.x = (Math.PI / 2) - 0.25
			this.pillar.rotation.y += 0.25
			this.pillar.position.z -= 4.8
			this.object.add(this.pillar)
			this.object.getObjectByName('mixamorigSpine1').attach(this.pillar)
			this.pillar.geometry.computeBoundingBox()

			this.onFinishActions()
			this.loadAnimations()
			this.loadWeapon()
			this.callback(this.object)
			this.progress['player'] = 100
		}, xhr => {
			this.progress['player'] = (xhr.loaded / xhr.total) * 99
		}, error => {
			console.error(error)
		})
	}

	loadWeapon() {
		this.gltfLoader.load('/models/equips/sword.glb', fbx => {
			this.sword = fbx.scene
			this.sword.encoding = THREE.sRGBEncoding
			this.sword.traverse(el => {
				if (!el.isMesh) return
				el.castShadow = true
				if (!this.weapon) this.weapon = el
			})
			this.weapon.geometry.computeBoundingBox()
			this.sword.rotation.y = Math.PI / 2
			this.sword.position.set(this.object.position.x-3.3, this.object.position.y-0.1, this.object.position.z-5.6)
			this.object.getObjectByName('mixamorigRightHand').attach(this.sword)
			this.progress['sword'] = 100
		}, xhr => {
			this.progress['sword'] = (xhr.loaded / xhr.total) * 99
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
		this.fbxLoader.load('/models/hero/running.fbx', fbx => {
			this.animations['run'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['run'].name = 'run'
		}, xhr => {
			this.progress['running'] = (xhr.loaded / xhr.total) * 100
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
		this.fbxLoader.load('/models/hero/drinking.fbx', fbx => {
			this.animations['heal'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['heal'].name = 'heal'
		}, xhr => {
			this.progress['heal'] = (xhr.loaded / xhr.total) * 100
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
		window.addEventListener('gamepadconnected', e => {
			this.gamepadConnected = true
			let vendorId = 'default'
			let productId
			let data = /vendor:\s(\w+)\sproduct:\s(\w+)/i.exec(e.gamepad.id)
			if (data) {
				vendorId = data[1]
				productId = data[2]
			}
			this.gamepadSettings = inputSettings.gamepad[vendorId] ?? inputSettings.gamepad['default']
			window.refreshControlsMenu()
		})
		window.addEventListener('gamepaddisconnected', e => {
			this.gamepadConnected = false
			window.refreshControlsMenu()
		})
		window.onkeydown = e => {
			window.refreshControlsMenu()
			this.keysPressed[e.keyCode] = true
			if (this.keysPressed[inputSettings.keyboard.keyToggleSword] && !this.actions.includes('toggle-sword')) this.actions.push('toggle-sword')
			if (this.keysPressed[inputSettings.keyboard.keySlash] && !this.actions.includes('slash')) this.actions.push('slash')
			/* if (this.keysPressed[inputSettings.keyboard.keyRun] && !this.actions.includes('run')) this.actions.push('run') */
			if (this.keysPressed[inputSettings.keyboard.keyTurnLeft] && !this.actions.includes('turn-left')) this.actions.push('turn-left')
			if (this.keysPressed[inputSettings.keyboard.keyTurnRight] && !this.actions.includes('turn-right')) this.actions.push('turn-right')
			if (this.keysPressed[inputSettings.keyboard.keyWalk] && !this.actions.includes('walk')) this.actions.push('walk')
			if (this.keysPressed[inputSettings.keyboard.keyBackflip] && !this.actions.includes('backflip')) this.actions.push('backflip')
			if (this.keysPressed[inputSettings.keyboard.keyStepBack] && !this.actions.includes('step-back')) this.actions.push('step-back')
			if (this.keysPressed[inputSettings.keyboard.keyJump] && !this.actions.includes('jump')) this.actions.push('jump')
			if (this.keysPressed[inputSettings.keyboard.keyKick] && !this.actions.includes('kick')) this.actions.push('kick')
			if (this.keysPressed[inputSettings.keyboard.keyRoll] && !this.actions.includes('roll')) this.actions.push('roll')
			if (this.keysPressed[inputSettings.keyboard.keyHeal] && !this.actions.includes('heal')) this.actions.push('heal')
			if (this.keysPressed[inputSettings.keyboard.keyPause]) {
				window.game.pause = !window.game.pause
				this.refreshPause()
			}
		}
		window.onkeyup = e => {
			this.keysPressed[e.keyCode] = false
			if (e.keyCode == inputSettings.keyboard.keyToggleSword) this.actions.splice(this.actions.findIndex(el => el == 'toggle-sword'), 1)
			if (e.keyCode == inputSettings.keyboard.keySlash) this.actions.splice(this.actions.findIndex(el => el == 'slash'), 1)
			/* if (e.keyCode == inputSettings.keyboard.keyRun) this.actions.splice(this.actions.findIndex(el => el == 'run'), 1) */
			if (e.keyCode == inputSettings.keyboard.keyTurnLeft) this.actions.splice(this.actions.findIndex(el => el == 'turn-left'), 1)
			if (e.keyCode == inputSettings.keyboard.keyTurnRight) this.actions.splice(this.actions.findIndex(el => el == 'turn-right'), 1)
			if (e.keyCode == inputSettings.keyboard.keyWalk) this.actions.splice(this.actions.findIndex(el => el == 'walk'), 1)
			if (e.keyCode == inputSettings.keyboard.keyBackflip) this.actions.splice(this.actions.findIndex(el => el == 'backflip'), 1)
			if (e.keyCode == inputSettings.keyboard.keyStepBack) this.actions.splice(this.actions.findIndex(el => el == 'step-back'), 1)
			if (e.keyCode == inputSettings.keyboard.keyJump) this.actions.splice(this.actions.findIndex(el => el == 'jump'), 1)
			if (e.keyCode == inputSettings.keyboard.keyKick) this.actions.splice(this.actions.findIndex(el => el == 'kick'), 1)
			if (e.keyCode == inputSettings.keyboard.keyRoll) this.actions.splice(this.actions.findIndex(el => el == 'roll'), 1)
			if (e.keyCode == inputSettings.keyboard.keyHeal) this.actions.splice(this.actions.findIndex(el => el == 'heal'), 1)
		}
		const buttonForward = document.querySelector('#button-forward')
		buttonForward.ontouchstart = e => {
			if (!this.actions.includes('walk')) this.actions.push('walk')
			buttonForward.classList.add('active')
		}
		buttonForward.ontouchmove = e => {
			if (e.cancelable) {
				e.preventDefault()
				e.stopPropagation()
			}
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
		buttonForward.ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'walk'), 1)
			if (this.actions.includes('turn-left')) this.actions.splice(this.actions.findIndex(el => el == 'turn-left'), 1)
			if (this.actions.includes('turn-right')) this.actions.splice(this.actions.findIndex(el => el == 'turn-right'), 1)
			buttonForward.classList.remove('active')
			document.querySelector('#button-left').classList.remove('active')
			document.querySelector('#button-right').classList.remove('active')
		}
		document.querySelector('#button-backward').ontouchstart = e => {
			if (!this.actions.includes('step-back')) this.actions.push('step-back')
		}
		document.querySelector('#button-backward').ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'step-back'), 1)
		}
		document.querySelector('#button-left').ontouchstart = e => {
			if (!this.actions.includes('turn-left')) this.actions.push('turn-left')
		}
		document.querySelector('#button-left').ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'turn-left'), 1)
		}
		document.querySelector('#button-right').ontouchstart = e => {
			if (!this.actions.includes('turn-right')) this.actions.push('turn-right')
		}
		document.querySelector('#button-right').ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'turn-right'), 1)
		}
		/* document.querySelector('#button-roll').ontouchstart = e => {
			if (!this.actions.includes('roll')) this.actions.push('roll')
		}
		document.querySelector('#button-roll').ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'roll'), 1)
		} */
		document.querySelector('#button-attack').ontouchstart = e => {
			if (!this.actions.includes('slash')) this.actions.push('slash')
		}
		document.querySelector('#button-attack').ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'slash'), 1)
		}
		document.querySelector('#button-heal').ontouchstart = e => {
			if (!this.actions.includes('heal')) this.actions.push('heal')
		}
		document.querySelector('#button-heal').ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'heal'), 1)
		}
		/* document.querySelector('#button-run').ontouchstart = e => {
			if (!this.actions.includes('run')) this.actions.push('run')
		}
		document.querySelector('#button-run').ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'run'), 1)
		} */
		document.querySelector('#button-kick').ontouchstart = e => {
			if (!this.actions.includes('kick')) this.actions.push('kick')
		}
		document.querySelector('#button-kick').ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'kick'), 1)
		}
		document.querySelector('#button-jump').ontouchstart = e => {
			if (!this.actions.includes('jump')) this.actions.push('jump')
		}
		document.querySelector('#button-jump').ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'jump'), 1)
		}
	}

	updateGamepad() {
		this.gamepad = navigator.getGamepads().find(el => el?.connected)
		if (!this.gamepad || !this.gamepadSettings) return
		if (this.gamepadLastUpdate <= this.gamepad.timestamp) return
		if (this.gamepad.axes[this.gamepadSettings.YAxes] <= -0.05 || this.gamepad.buttons[this.gamepadSettings.UP]?.pressed) {
			if (!this.actions.includes('walk')) this.actions.push('walk')
		} else if (this.actions.includes('walk')) {
			this.actions.splice(this.actions.findIndex(el => el == 'walk'), 1)
		}
		if (this.gamepad.axes[this.gamepadSettings.YAxes] >= 0.5 || this.gamepad.buttons[this.gamepadSettings.DOWN]?.pressed) {
			if (!this.actions.includes('step-back')) this.actions.push('step-back')
		} else if (this.actions.includes('step-back')) {
			this.actions.splice(this.actions.findIndex(el => el == 'step-back'), 1)
		}
		if (this.gamepad.axes[this.gamepadSettings.XAxes] <= -0.05 || this.gamepad.buttons[this.gamepadSettings.LEFT]?.pressed) {
			if (!this.actions.includes('turn-left')) this.actions.push('turn-left')
		} else if (this.actions.includes('turn-left')) {
			this.actions.splice(this.actions.findIndex(el => el == 'turn-left'), 1)
		}
		if (this.gamepad.axes[this.gamepadSettings.XAxes] >= 0.05 || this.gamepad.buttons[this.gamepadSettings.RIGHT]?.pressed) {
			if (!this.actions.includes('turn-right')) this.actions.push('turn-right')
		} else if (this.actions.includes('turn-right')) {
			this.actions.splice(this.actions.findIndex(el => el == 'turn-right'), 1)
		}
		if (this.gamepad.buttons[this.gamepadSettings.A].pressed) {
			if (performance.now() < this.healLastUpdate) return
			if (!this.actions.includes('jump')) this.actions.push('jump')
			this.healLastUpdate = performance.now() + 250
		} else if (this.actions.includes('jump')) {
			this.actions.splice(this.actions.findIndex(el => el == 'jump'), 1)
		}
		if (this.gamepad.buttons[this.gamepadSettings.B].pressed) {
			if (!this.actions.includes('roll')) this.actions.push('roll')
		} else if (this.actions.includes('roll')) {
			this.actions.splice(this.actions.findIndex(el => el == 'roll'), 1)
		}
		if (this.gamepad.buttons[this.gamepadSettings.X].pressed) {
			if (!this.actions.includes('backflip')) this.actions.push('backflip')
		} else if (this.actions.includes('backflip')) {
			this.actions.splice(this.actions.findIndex(el => el == 'backflip'), 1)
		}
		if (this.gamepad.buttons[this.gamepadSettings.Y].pressed) {
			if (!this.actions.includes('heal')) this.actions.push('heal')
		} else if (this.actions.includes('heal')) {
			this.actions.splice(this.actions.findIndex(el => el == 'heal'), 1)
		}
		if (this.gamepad.buttons[this.gamepadSettings.RB].pressed) {
			if (!this.actions.includes('slash')) this.actions.push('slash')
		} else if (this.actions.includes('slash')) {
			this.actions.splice(this.actions.findIndex(el => el == 'slash'), 1)
		}
		if (this.gamepad.buttons[this.gamepadSettings.LB].pressed) {
			if (!this.actions.includes('kick')) this.actions.push('kick')
		} else if (this.actions.includes('kick')) {
			this.actions.splice(this.actions.findIndex(el => el == 'kick'), 1)
		}
		if (this.gamepad.buttons[this.gamepadSettings.MENU].pressed) {
			window.game.togglePause()
		}
		this.gamepadLastUpdate = this.gamepad.timestamp
	}

	updateActions() {
		if (window.game.pause) return
		let w = this.actions.includes('walk')
		let s = this.actions.includes('slash')
		let k = this.actions.includes('kick')
		let h = this.actions.includes('heal')
		let t = this.actions.some(el => ['turn-left', 'turn-right'].includes(el))
		let sb = this.actions.includes('step-back')
		let b = this.actions.includes('backflip')
		let j = this.actions.includes('jump')
		let rl = this.actions.includes('roll')
		if (this.actions.length <= 0) this.synchronizeCrossFade(this.animations['idle'])
		if (!this.waitForAnimation && h && this.potions > 0) {
			this.isHealing = true
			this.waitForAnimation = true
			this.executeCrossFade(this.animations['heal'], 0.1, 'once')
			setTimeout(() => {this.setupHeal()}, window.game.delay * 750)
		} else if (!this.waitForAnimation && s) {
			let animationDelay = 0.1
			this.isSlashing = true
			this.waitForAnimation = true
			this.playAttackSE()
			let action = this.lastAction.name == 'outward-slash' ? this.animations['inward-slash'] : this.animations['outward-slash']
			this.executeCrossFade(action, animationDelay, 'once')
			setTimeout(() => this.executeMelleeAttack(), window.game.delay * (animationDelay * 1000 * 4 / 3))
		} else if (!this.waitForAnimation && k) {
			this.isKicking = true
			this.waitForAnimation = true
			this.playAttackSE()
			this.executeCrossFade(this.animations['kick'], 0.1, 'once')
		} else if (!this.waitForAnimation && b && !this.isBackingflip) {
			this.isBackingflip = true
			this.executeCrossFade(this.animations['backflip'], 0.1, 'once')
			setTimeout(() => {this.updateWalk(false, true, 5)}, window.game.delay * 250)
		}
		if (this.waitForAnimation || this.isSlashing || this.isKicking || this.isBackingflip) return
		if (this.actions.includes('turn-left')) this.object.rotation.y += 0.025
		if (this.actions.includes('turn-right')) this.object.rotation.y -= 0.025
		if (w && !this.isWalking) {
			this.isWalking = true
			this.executeCrossFade(this.animations['run'])
		} else if (!w && this.isWalking) {
			if (!t) this.executeCrossFade(this.animations['idle'])
			this.isWalking = false
			this.isRunning = false
		}
		if (w) this.updateWalk(true)
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
			this.executeCrossFade(this.returnAction)
			this.isSteppingBack = false
		}
		if (sb) return this.updateWalk(false, true, 0.025)
		if (!this.isRotating && t) {
			this.isRotating = true
			this.executeCrossFade(this.animations['walk'])
		} else if (this.isRotating && !t) {
			if (!w) this.executeCrossFade(this.returnAction)
			this.isRotating = false
		}
		/* if (!this.waitForAnimation && !this.isTogglingSword && ts) {
			this.isTogglingSword = true
			this.waitForAnimation = true
			 this.executeCrossFade(this.swordEquipped ? sheathSwordAction : withdrawSwordAction, 0.25, 'once')
		} else if (this.isTogglingSword && !t) {
			 this.executeCrossFade(this.returnAction)
			this.isTogglingSword = false
		} */
	}

	updateWalk(running=false, back=false, speed=0.1) {
		if (this.waitForAnimation) return
		let dir = this.camera.getWorldDirection(this.object.position.clone())
		if (back) dir.negate()
		if (window.game.fps < 45) speed = speed + (5 / window.game.fps)
		let step = dir.multiplyScalar(running ? speed*2.5 : speed)
		let pos = this.object.position.clone()
		pos.add(step)
		if (pos.x >= (200/2-1) || pos.x <= ((200/2-1)*-1)) return
		if (pos.z >= (200/2-1) || pos.z <= ((200/2-1)*-1)) return
		this.object.position.add(step)
	}

	setupDamage(damage) {
		this.hp -= damage
		if (this.hp < 0) this.hp = 0
		this.waitForAnimation = true
		this.beenHit = true
		this.refreshHPBar()
		this.playDamageSE()
		this.vibrate()
		this.executeCrossFade(this.animations['stomach-hit'], 0.1, 'once')
		if (this.hp <= 0 && !this.died) {
			this.executeCrossFade(this.animations['die'], 1, 'once')
			window.sound.playME(window.sound.gameoverBuffer)
			this.died = true
		}
	}

	setupHeal() {
		if (this.potions <= 0) return
		this.potions--
		this.playHealSE()
		this.hp += this.maxhp / 2
		if (this.hp > this.maxhp) this.hp = this.maxhp
		this.refreshHPBar()
		
	}

	playAttackSE() {
		if (this.beenHit || this.sePlaying) return
		const audios = Object.keys(this.audios).filter(el => el.startsWith('attack'))
		if (!audios.length) return
		let i = randomInt(0, audios.length-1)
		this.sePlaying = true
		window.sound.playSE(this.audios[audios[i]], false, this)
	}

	playSlashSE() {
		const audios = Object.keys(this.audios).filter(el => el.startsWith('slash'))
		if (!audios.length) return
		let i = randomInt(0, audios.length-1)
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

	playHealSE() {
		this.sePlaying = true
		window.sound.playSE(this.audios['heal'], false, this)
	}

	gameover() {
		document.querySelector('#game-over').classList.add('show')
		document.querySelector('header').style.setProperty('display', 'none')
		document.querySelectorAll('footer').forEach(el => el.style.setProperty('display', 'none'))
		window.game.gameover = true
	}

	refreshHPBar() {
		let hpbarWidth = document.querySelector('#hpbar').clientWidth - 4
		let barWidth = Math.max(0, this.hp) * hpbarWidth / this.maxhp
		document.querySelector('#hpbar').style.setProperty('--hp-width', `${barWidth}px`)
		document.querySelector('#count-heal').innerHTML = this.potions
	}

	executeCrossFade(newAction, duration=0.25, loop='repeat') {
		if (this.actions.some(el => ['walk', 'run', 'turn-left', 'turn-right', 'step-back'].includes(el)) && newAction.name == 'idle') return
		super.executeCrossFade(newAction, duration, loop)
	}

	synchronizeCrossFade(newAction, duration=0.25, loop='repeat') {
		this.mixer?.addEventListener('loop', onLoopFinished)
		const vm = this
		function onLoopFinished(event) {
			vm.resetActions()
			if (event.action == vm.lastAction) {
				vm.mixer.removeEventListener('loop', onLoopFinished)
				vm.executeCrossFade(newAction, duration, loop)
			}
		}
	}

	onFinishActions() {
		this.mixer.addEventListener('finished', () => {
			if (this.died) return this.gameover()
			if (!this.actions.some(el => ['slash', 'kick', 'backflip'].includes(el))) this.executeCrossFade(this.returnAction)
			this.resetActions()
		})
	}

	resetActions() {
		this.waitForAnimation = false
		this.isBackingflip = false
		this.isRolling = false
		this.isJumping = false
		this.beenHit = false
		this.isTogglingSword = false
		this.isSlashing = false
		this.isKicking = false
		this.isHealing = false
		this.processingAttack = false
	}

	initAudio() {
		for (let i=0; i<=4; i++) {
			this.fetchAudio(`attack-${i}`, `/audio/hero/attack/${i}.mp3`)
			this.fetchAudio(`damage-${i}`, `/audio/hero/damage/${i}.mp3`)
		}
		for (let i=0; i<=3; i++) {
			this.fetchAudio(`slash-${i}`, `/audio/weapons/slash-${i}.mp3`)
		}
		this.fetchAudio(`heal`, `/audio/misc/drinking.mp3`)
	}

	vibrate(magnetude=100, duration=0.1) {
		if (this.gamepad) {
			this.gamepad.vibrationActuator.playEffect(this.gamepad.vibrationActuator.type, {
				startDelay: 0,
				duration: duration,
				weakMagnitude: magnetude / 1000,
				strongMagnitude: magnetude / 500,
			})
		} else if (device.isMobile) {
			try {navigator.vibrate(magnetude)} catch(e){}
		}
	}

	toggleVisibility() {
		if (document.hidden) this.actions.splice(0)
	}

	executeMelleeAttack() {
		if (!this.isSlashing) return
		let hasHit = this.hasHit(window.game.enemy)
		if (hasHit && Math.random() <= 0.75) {
			window.game.enemy.setupDamage(10)
			this.playSlashSE()
		}
		this.processingAttack = !hasHit
	}

	resizeScene() {
		this.refreshHPBar()
	}

	get returnAction() {
		if (this.actions.some(el => ['walk', 'turn-left', 'turn-right'].includes(el))) {
			return this.animations['run']
		} else if (this.actions.includes('step-back')) {
			return this.animations['step-back']
		} else {
			return this.animations['idle']
		}
	}

}
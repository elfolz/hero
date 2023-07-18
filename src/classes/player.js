'use strict'
import * as THREE from '../modules/three.module.js'
import { Entity } from '../classes/entity.js'
import inputSettings from '../settings/input.js'
import randomInt from '../helpers/randomInt.js'
import device from '../helpers/device.js'

export class Player extends Entity {

	loadingElements = 16
	animationModels = ['idle', 'running', 'walkingBack', 'jumping', 'jumpingRunning', 'backflip', 'kick', 'rolling', 'outwardSlash', 'inwardSlash', 'stomachHit', 'dieing', 'drinking', 'walking']

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
		this.gltfLoader.load('./models/hero/hero.glb', gltf => {
			this.object = gltf.scene
			this.object.colorSpace = THREE.SRGBColorSpace
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
			this.loadWeapon()
			this.callback(this.object)
			this.progress['player'] = 100
		}, xhr => {
			this.progress['player'] = parseInt(xhr.loaded / (xhr.total || 1)) * 99
		}, error => {
			console.error(error)
		})
	}

	loadWeapon() {
		this.gltfLoader.load('./models/equips/sword.glb', fbx => {
			this.sword = fbx.scene
			this.sword.colorSpace = THREE.SRGBColorSpace
			this.sword.traverse(el => {
				if (!el.isMesh) return
				el.castShadow = true
				if (!this.weapon) this.weapon = el
			})
			this.weapon.geometry.computeBoundingBox()
			this.sword.rotation.y = Math.PI / 6
			this.sword.position.set(this.object.position.x-2.6, this.object.position.y+0.6, this.object.position.z-4)
			this.object.getObjectByName('mixamorigRightHand').attach(this.sword)
			this.progress['sword'] = 100
			this.loadAnimations()
		}, xhr => {
			this.progress['sword'] = parseInt(xhr.loaded / (xhr.total || 1)) * 99
		}, error => {
			console.error(error)
		})
	}

	loadAnimations() {
		this.animationModels.forEach(el => {
			this.fbxLoader.load(`./models/hero/${el}.fbx`, fbx => {
				this.animations[el] = this.mixer.clipAction(fbx.animations[0])
				this.animations[el].name = el
				this.progress[el] = 100
				if (el == 'idle') {
					this.lastAction = this.animations['idle']
					this.animations['idle'].play()
				}
			}, xhr => {
				this.progress[el] = parseInt(xhr.loaded / (xhr.total || 1)) * 99
			}, error => {
				console.error(error)
			})
		})
	}

	initControls() {
		window.addEventListener('gamepadconnected', e => {
			this.gamepadConnected = true
			let vendorId = 'default'
			let data = /vendor:\s(\w+)\sproduct:\s(\w+)/i.exec(e.gamepad.id)
			if (data) vendorId = data[1]
			this.gamepadSettings = inputSettings.gamepad[vendorId] ?? inputSettings.gamepad['default']
			window.refreshControlsMenu()
		})
		window.addEventListener('gamepaddisconnected', e => {
			this.gamepadConnected = false
			window.refreshControlsMenu()
		})
		window.onkeydown = e => {
			this.keysPressed[e.keyCode] = true
			if (this.keysPressed[inputSettings.keyboard.keySlash] && !this.actions.includes('slash')) this.actions.push('slash')
			if (this.keysPressed[inputSettings.keyboard.keyTurnLeft] && !this.actions.includes('turningLeft')) this.actions.push('turningLeft')
			if (this.keysPressed[inputSettings.keyboard.keyTurnRight] && !this.actions.includes('turningRight')) this.actions.push('turningRight')
			if (this.keysPressed[inputSettings.keyboard.keyWalk] && !this.actions.includes('walking')) this.actions.push('walking')
			if (this.keysPressed[inputSettings.keyboard.keyBackflip] && !this.actions.includes('backflip')) this.actions.push('backflip')
			if (this.keysPressed[inputSettings.keyboard.keyStepBack] && !this.actions.includes('walkingBack')) this.actions.push('walkingBack')
			if (this.keysPressed[inputSettings.keyboard.keyJump] && !this.actions.includes('jumping')) this.actions.push('jumping')
			if (this.keysPressed[inputSettings.keyboard.keyKick] && !this.actions.includes('kick')) this.actions.push('kick')
			if (this.keysPressed[inputSettings.keyboard.keyRoll] && !this.actions.includes('rolling')) this.actions.push('rolling')
			if (this.keysPressed[inputSettings.keyboard.keyHeal] && !this.actions.includes('drinking')) this.actions.push('drinking')
			if (this.keysPressed[inputSettings.keyboard.keyPause]) {
				window.game.togglePause()
			}
		}
		window.onkeyup = e => {
			this.keysPressed[e.keyCode] = false
			if (e.keyCode == inputSettings.keyboard.keySlash) this.actions.splice(this.actions.findIndex(el => el == 'slash'), 1)
			if (e.keyCode == inputSettings.keyboard.keyTurnLeft) this.actions.splice(this.actions.findIndex(el => el == 'turningLeft'), 1)
			if (e.keyCode == inputSettings.keyboard.keyTurnRight) this.actions.splice(this.actions.findIndex(el => el == 'turningRight'), 1)
			if (e.keyCode == inputSettings.keyboard.keyWalk) this.actions.splice(this.actions.findIndex(el => el == 'walking'), 1)
			if (e.keyCode == inputSettings.keyboard.keyBackflip) this.actions.splice(this.actions.findIndex(el => el == 'backflip'), 1)
			if (e.keyCode == inputSettings.keyboard.keyStepBack) this.actions.splice(this.actions.findIndex(el => el == 'walkingBack'), 1)
			if (e.keyCode == inputSettings.keyboard.keyJump) this.actions.splice(this.actions.findIndex(el => el == 'jumping'), 1)
			if (e.keyCode == inputSettings.keyboard.keyKick) this.actions.splice(this.actions.findIndex(el => el == 'kick'), 1)
			if (e.keyCode == inputSettings.keyboard.keyRoll) this.actions.splice(this.actions.findIndex(el => el == 'rolling'), 1)
			if (e.keyCode == inputSettings.keyboard.keyHeal) this.actions.splice(this.actions.findIndex(el => el == 'drinking'), 1)
		}
		const buttonForward = document.querySelector('#button-forward')
		buttonForward.ontouchstart = e => {
			if (!this.actions.includes('walking')) this.actions.push('walking')
			buttonForward.classList.add('active')
		}
		buttonForward.ontouchmove = e => {
			if (e.cancelable) {
				e.preventDefault()
				e.stopPropagation()
			}
			if (!buttonForward.posX && buttonForward.getClientRects()) buttonForward.posX = buttonForward.getClientRects()[0].x
			if (e.changedTouches[0].pageX < (buttonForward.posX)) {
				if (this.actions.includes('turningLeft')) return
				this.actions.push('turningLeft')
				document.querySelector('#button-left').classList.add('active')
			} else if (this.actions.includes('turningLeft')) {
				this.actions.splice(this.actions.findIndex(el => el == 'turningLeft'), 1)
				document.querySelector('#button-left').classList.remove('active')
			}
			if (e.changedTouches[0].pageX > (buttonForward.posX+64)) {
				if (this.actions.includes('turningRight')) return
				this.actions.push('turningRight')
				document.querySelector('#button-right').classList.add('active')
			} else if (this.actions.includes('turningRight')) {
				this.actions.splice(this.actions.findIndex(el => el == 'turningRight'), 1)
				document.querySelector('#button-right').classList.remove('active')
			}
		}
		buttonForward.ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'walking'), 1)
			if (this.actions.includes('turningLeft')) this.actions.splice(this.actions.findIndex(el => el == 'turningLeft'), 1)
			if (this.actions.includes('turningRight')) this.actions.splice(this.actions.findIndex(el => el == 'turningRight'), 1)
			buttonForward.classList.remove('active')
			document.querySelector('#button-left').classList.remove('active')
			document.querySelector('#button-right').classList.remove('active')
		}
		document.querySelector('#button-backward').ontouchstart = e => {
			if (!this.actions.includes('walkingBack')) this.actions.push('walkingBack')
		}
		document.querySelector('#button-backward').ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'walkingBack'), 1)
		}
		document.querySelector('#button-left').ontouchstart = e => {
			if (!this.actions.includes('turningLeft')) this.actions.push('turningLeft')
		}
		document.querySelector('#button-left').ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'turningLeft'), 1)
		}
		document.querySelector('#button-right').ontouchstart = e => {
			if (!this.actions.includes('turningRight')) this.actions.push('turningRight')
		}
		document.querySelector('#button-right').ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'turningRight'), 1)
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
			if (!this.actions.includes('drinking')) this.actions.push('drinking')
		}
		document.querySelector('#button-heal').ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'drinking'), 1)
		}
		document.querySelector('#button-kick').ontouchstart = e => {
			if (!this.actions.includes('kick')) this.actions.push('kick')
		}
		document.querySelector('#button-kick').ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'kick'), 1)
		}
		document.querySelector('#button-jump').ontouchstart = e => {
			if (!this.actions.includes('jumping')) this.actions.push('jumping')
		}
		document.querySelector('#button-jump').ontouchend = e => {
			this.actions.splice(this.actions.findIndex(el => el == 'jumping'), 1)
		}
	}

	updateGamepad() {
		this.gamepad = navigator.getGamepads().find(el => el?.connected)
		if (!this.gamepad || !this.gamepadSettings) return
		if (this.gamepadLastUpdate >= this.gamepad.timestamp) return
		if (!window.sound.initialized && this.gamepad.buttons.some(el => el.pressed)) window.sound.init()
		if (this.gamepad.axes[this.gamepadSettings.YAxes] <= -0.05) {
			if (!this.actions.includes('walking')) this.actions.push('walking')
		} else if (this.actions.includes('walking')) {
			this.actions.splice(this.actions.findIndex(el => el == 'walking'), 1)
		}
		if (this.gamepad.axes[this.gamepadSettings.YAxes] >= 0.5) {
			if (!this.actions.includes('walkingBack')) this.actions.push('walkingBack')
		} else if (this.actions.includes('walkingBack')) {
			this.actions.splice(this.actions.findIndex(el => el == 'walkingBack'), 1)
		}
		if (this.gamepad.axes[this.gamepadSettings.XAxes] <= -0.05) {
			if (!this.actions.includes('turningLeft')) this.actions.push('turningLeft')
		} else if (this.actions.includes('turningLeft')) {
			this.actions.splice(this.actions.findIndex(el => el == 'turningLeft'), 1)
		}
		if (this.gamepad.axes[this.gamepadSettings.XAxes] >= 0.05) {
			if (!this.actions.includes('turningRight')) this.actions.push('turningRight')
		} else if (this.actions.includes('turningRight')) {
			this.actions.splice(this.actions.findIndex(el => el == 'turningRight'), 1)
		}
		if (this.gamepad.buttons[this.gamepadSettings.A].pressed) {
			if (window.menuConfigOpened()) {
				window.executeMenuConfig()
			} else {
				if (performance.now() < this.healLastUpdate) return
				if (!this.actions.includes('jumping')) this.actions.push('jumping')
				this.healLastUpdate = performance.now() + 250
			}
		} else if (this.actions.includes('jumping')) {
			this.actions.splice(this.actions.findIndex(el => el == 'jumping'), 1)
		}
		if (this.gamepad.buttons[this.gamepadSettings.B].pressed) {
			if (document.querySelector('#dialog-controller').classList.contains('opened')) {
				document.querySelector('#dialog-controller').classList.remove('opened')
				window.sound.playCancel()
			} else if (window.menuConfigOpened()) {
				window.toggleMenuConfig()
			} else {
				if (!this.actions.includes('rolling')) this.actions.push('rolling')
			}
		} else if (this.actions.includes('rolling')) {
			this.actions.splice(this.actions.findIndex(el => el == 'rolling'), 1)
		}
		if (this.gamepad.buttons[this.gamepadSettings.X].pressed) {
			if (!this.actions.includes('backflip')) this.actions.push('backflip')
		} else if (this.actions.includes('backflip')) {
			this.actions.splice(this.actions.findIndex(el => el == 'backflip'), 1)
		}
		if (this.gamepad.buttons[this.gamepadSettings.Y].pressed) {
			if (!this.actions.includes('drinking')) this.actions.push('drinking')
		} else if (this.actions.includes('drinking')) {
			this.actions.splice(this.actions.findIndex(el => el == 'drinking'), 1)
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
		if (this.gamepad.buttons[this.gamepadSettings.OPT].pressed) {
			window.toggleMenuConfig(true)
		}
		if (window.menuConfigOpened()) {
			if (this.gamepad.buttons[this.gamepadSettings.UP]?.pressed) window.navigateMenuConfig(-1)
			if (this.gamepad.buttons[this.gamepadSettings.DOWN]?.pressed)  window.navigateMenuConfig(1)
		}
		this.gamepadLastUpdate = this.gamepad.timestamp + 100
	}

	updateActions() {
		if (window.game.paused) return
		let w = this.actions.includes('walking')
		let s = this.actions.includes('slash')
		let k = this.actions.includes('kick')
		let h = this.actions.includes('drinking')
		let t = this.actions.some(el => ['turningLeft', 'turningRight'].includes(el))
		let sb = this.actions.includes('walkingBack')
		let b = this.actions.includes('backflip')
		let j = this.actions.includes('jumping')
		let rl = this.actions.includes('rolling')
		if (this.actions.length <= 0) this.synchronizeCrossFade(this.animations['idle'])
		if (!this.waitForAnimation && h && this.potions > 0) {
			this.isHealing = true
			this.waitForAnimation = true
			this.executeCrossFade(this.animations['drinking'], 0.1, 'once')
			setTimeout(() => {this.setupHeal()}, window.game.delay * 750)
		} else if (!this.waitForAnimation && s) {
			let animationDelay = 0.1
			this.isSlashing = true
			this.waitForAnimation = true
			this.playAttackSE()
			let action = this.lastAction?.name == 'outwardSlash' ? this.animations['inwardSlash'] : this.animations['outwardSlash']
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
		if (this.actions.includes('turningLeft')) this.object.rotation.y += 0.025
		if (this.actions.includes('turningRight')) this.object.rotation.y -= 0.025
		if (w && !this.isWalking) {
			this.isWalking = true
			this.executeCrossFade(this.animations['running'])
		} else if (!w && this.isWalking) {
			if (!t) this.executeCrossFade(this.animations['idle'])
			this.isWalking = false
			this.isRunning = false
		}
		if (w) this.updateWalk(true)
		if (!this.waitForAnimation && rl && !this.isRolling) {
			this.isRolling = true
			this.executeCrossFade(this.animations['rolling'], 0.25, 'once')
		}
		if (this.isRolling) return
		if (!this.waitForAnimation && j && !this.isJumping) {
			this.isJumping = true
			this.executeCrossFade(w ? this.animations['jumpingRunning'] : this.animations['jumping'], 0.25, 'once')
		}
		if (w || this.isJumping) return
		if (sb && !this.isSteppingBack) {
			this.isSteppingBack = true
			this.executeCrossFade(this.animations['walkingBack'])
		} else if (!sb && this.isSteppingBack) {
			this.executeCrossFade(this.returnAction)
			this.isSteppingBack = false
		}
		if (sb) return this.updateWalk(false, true, 0.025)
		if (!this.isRotating && t) {
			this.isRotating = true
			this.executeCrossFade(this.animations['walking'])
		} else if (this.isRotating && !t) {
			if (!w) this.executeCrossFade(this.returnAction)
			this.isRotating = false
		}
	}

	updateWalk(running=false, back=false, speed=0.175) {
		if (this.waitForAnimation) return
		const fpsSpeed = Math.min(60 * speed / window.game.fps, speed)
		const dir = this.camera.getWorldDirection(this.object.position.clone())
		if (back) dir.negate()
		const step = dir.multiplyScalar(running ? fpsSpeed*2.5 : fpsSpeed)
		const pos = this.object.position.clone()
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
		this.executeCrossFade(this.animations['stomachHit'], 0.1, 'once')
		if (this.hp <= 0 && !this.died) {
			this.executeCrossFade(this.animations['dieing'], 1, 'once')
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
		if (!newAction) return
		if (this.actions.some(el => ['walking', 'running', 'turningLeft', 'turningRight', 'walkingBack'].includes(el)) && newAction.name == 'idle') return
		super.executeCrossFade(newAction, duration, loop)
	}

	synchronizeCrossFade(newAction, duration=0.25, loop='repeat') {
		this.mixer.addEventListener('loop', onLoopFinished)
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
		this.isSlashing = false
		this.isKicking = false
		this.isHealing = false
		this.processingAttack = false
	}

	initAudio() {
		for (let i=0; i<=4; i++) {
			this.fetchAudio(`attack-${i}`, `./audio/hero/attack/${i}.mp3`)
			this.fetchAudio(`damage-${i}`, `./audio/hero/damage/${i}.mp3`)
		}
		for (let i=0; i<=3; i++) {
			this.fetchAudio(`slash-${i}`, `./audio/weapons/slash-${i}.mp3`)
		}
		this.fetchAudio(`heal`, `./audio/misc/drinking.mp3`)
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
		if (this.actions.some(el => ['walking', 'turningLeft', 'turningRight'].includes(el))) {
			return this.animations['running']
		} else if (this.actions.includes('walkingBack')) {
			return this.animations['walkingBack']
		} else {
			return this.animations['idle']
		}
	}

}
'use strict'
import * as THREE from '/js/modules/three.module.js'
import { EnemyHumanoid } from '/js/classes/enemyHumanoid.js'
import { Player } from '/js/classes/player.js'
import device from '/js/helpers/device.js'

export class Game {

	loadingElements = 3

	constructor() {
		this.lastFrameTime = performance.now()
		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
		this.clock = new THREE.Clock()
		this.hemisphereLight = new THREE.HemisphereLight(0xddeeff, 0x000000, 0.25)
		this.dirLight = new THREE.DirectionalLight(0xffffff, 0.5)
		this.textureLoader = new THREE.TextureLoader()
		this.scene = new THREE.Scene()
		this.fps = 0
		this.fpsLimit = 0
		this.frames = 0
		this.clockDelta = 0
		this.initRender()
		this.refreshFPS()
		this.refreshResolution()
		this.refreshPixelDensity()
		this.setupLoading()
		window.onresize = () => this.resizeScene()
		document.body.appendChild(this.renderer.domElement)
	}

	initRender() {
		let antialiasing = localStorage.getItem('antialiasing')
		if (antialiasing == undefined && device.cpuCores >= 4) antialiasing = 'true'
		this.antialiasing = antialiasing == 'true'
		this.renderer = new THREE.WebGLRenderer({alpha: true, antialias: this.antialiasing})
		this.scene.background = null
		this.renderer.outputEncoding = THREE.sRGBEncoding
		this.renderer.shadowMap.enabled = true
		this.renderer.physicallyCorrectLights = true
		this.renderer.setClearColor(0x000000, 0)
		this.renderer.shadowMap.enabled = true
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
		this.hemisphereLight.position.set(0, 100, 100)
		this.dirLight.position.set(0, 100, 100)
		this.dirLight.castShadow = true
		this.scene.add(this.hemisphereLight)
		this.scene.add(this.dirLight)
		window.window.refreshAntialiasing(this.antialiasing, false)
	}

	refreshFPS() {
		let fps = localStorage.getItem('fpsLimit')
		if (fps == '60') this.fpsLimit = 1 / 60
		else if (fps == '30') this.fpsLimit = 1 / 30
		else if (device.isPC) fps = 0
		else if (device.cpuCores >= 4 || device.isApple) {this.fpsLimit = 1 / 60; fps = 60}
		else {this.fpsLimit = 1 / 30; fpsl = 30}
		window.refreshFPS(fps, false)
	}

	refreshResolution() {
		let resolution = localStorage.getItem('resolution')
		if (resolution == '1') {
			this.screenWidth = parseInt(window.innerWidth / 4 * 3)
			this.screenHeight = parseInt(window.innerHeight / 4 * 3)
		} else if (resolution == '2') {
			this.screenWidth = parseInt(window.innerWidth / 2)
			this.screenHeight = parseInt(window.innerHeight / 2)
		} else {
			resolution = 0
			this.screenWidth = window.innerWidth
			this.screenHeight = window.innerHeight
		}
		window.refreshResolution(resolution, false)
	}

	refreshPixelDensity() {
		let pixelDensity = localStorage.getItem('pixelDensity')
		if (pixelDensity == '0') this.pixelDensity = window.devicePixelRatio
		else if (pixelDensity == '1') this.pixelDensity = (window.devicePixelRatio / 4 * 3)
		else if (pixelDensity == '2') this.pixelDensity = (window.devicePixelRatio / 2)
		else if (device.cpuCores >= 4 && device.memory >= 6) {this.pixelDensity = window.devicePixelRatio; pixelDensity = 0}
		else if (device.cpuCores < 4) {this.pixelDensity = (window.devicePixelRatio / 4 * 3); pixelDensity = 1}
		else {this.pixelDensity = 1; pixelDensity = 2}
		window.refreshPixelDensity(pixelDensity, false)
	}

	setupLoading() {
		const vm = this
		this.progress = new Proxy({}, {
			set: function(target, key, value) {
				target[key] = value
				let values = Object.values(target).slice()
				let progressbar = document.querySelector('progress')
				let total = values.reduce((a, b) => a + b, 0)
				total = total / vm.loadingElements
				if (progressbar) progressbar.value = parseInt(total || 0)
				if (total >= 100) vm.initGame()
				return true
			}
		})
		this.loadModels()
	}

	loadModels() {
		/* this.textureLoader.load('/textures/tileable1.webp', texture => {
			this.textureLoader.load('/textures/tileable1_nm.webp', textureNm => {
				texture.encoding = THREE.sRGBEncoding
				texture.wrapS = THREE.RepeatWrapping
				texture.wrapT = THREE.RepeatWrapping
				texture.repeat.set(parseInt(texture.wrapS / 200), parseInt(texture.wrapT / 200))
				textureNm.encoding = THREE.sRGBEncoding
				textureNm.wrapS = THREE.RepeatWrapping
				textureNm.wrapT = THREE.RepeatWrapping
				textureNm.repeat.set(parseInt(texture.wrapS / 200), parseInt(texture.wrapT / 200))
				const material = new THREE.MeshPhongMaterial({
					map: texture,
					normalMap: textureNm
				})
				const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), material)
				ground.rotation.x = - Math.PI / 2
				ground.receiveShadow = true
				this.scene.add(ground)
				if (!this.progress['ground']) this.progress['ground'] = 100
			}, xhr => {
				this.progress['ground'] = (xhr.loaded / xhr.total) * 100 / 2
			}, error => {
				console.error(error)
			})
		}, xhr => {
			this.progress['ground'] = (xhr.loaded / xhr.total) * 100 / 2
		}, error => {
			console.error(error)
		}) */
		this.textureLoader.load('/textures/ground.webp', texture => {
			texture.wrapS = THREE.RepeatWrapping
			texture.wrapT = THREE.RepeatWrapping
			texture.encoding = THREE.sRGBEncoding
			texture.repeat.set(parseInt(texture.wrapS / 200), parseInt(texture.wrapT / 200))
			const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({map: texture}))
			ground.rotation.x = - Math.PI / 2
			ground.receiveShadow = true
			this.scene.add(ground)
			if (!this.progress['ground']) this.progress['ground'] = 100
		}, xhr => {
			this.progress['ground'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.player = new Player(this.camera,
			e => {
				this.scene.add(e)
				this.dirLight.target = e
			},
			e => {
				this.progress['player'] = e
			}
		)
		this.enemy = new EnemyHumanoid(this.player,
			e => {
				this.scene.add(e)
			},
			e => {
				this.progress['enemy'] = e
			}
		)
	}

	initGame() {
		document.body.classList.add('loaded')
		document.body.removeChild(document.querySelector('figure'))
		document.querySelector('header').style.removeProperty('display')
		if (!device.isPC) document.querySelectorAll('footer').forEach(el => el.style.removeProperty('display'))
		this.player.refreshHPBar()
		this.resizeScene()
		this.update()
		/* this.renderer.getContext().canvas.addEventListener('webglcontextlost', e => {
			e.preventDefault()
			cancelAnimationFrame(this.animationFrameId)
		}, false)
		this.renderer.getContext().canvas.addEventListener('webglcontextrestored', e => {
			this.update()
		}, false) */
	}

	update() {
		this.animationFrameId = requestAnimationFrame(() => this.update())
		if (document.hidden) return
		if (this.gameover) return
		this.clockDelta += this.clock.getDelta()
		if (this.fpsLimit && this.clockDelta < this.fpsLimit) return
		this.renderer.render(this.scene, this.camera)
		this.player.update(this.clockDelta)
		if (!this.paused) {
			this.updateFPSCounter()
			this.enemy.update(this.clockDelta)
		}
		this.clockDelta = this.fpsLimit ? this.clockDelta % this.fpsLimit : this.clockDelta % (1 / Math.max(this.fps, 30))
	}

	initAudio() {
		this.player.initAudio()
		this.enemy.initAudio()
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

	resizeScene() {
		this.camera.updateProjectionMatrix()
		this.renderer.setPixelRatio(this.pixelDensity)
		this.camera.aspect = this.screenWidth / this.screenHeight
		this.renderer.setSize(this.screenWidth, this.screenHeight, false)
		this.player.resizeScene()
		this.enemy.resizeScene()
	}

	toggleVisibility() {
		this.player?.toggleVisibility()
		this.enemy?.toggleVisibility()
	}

	togglePause() {
		this.paused = !this.paused
		if (this.paused) document.querySelector('#glass').classList.add('opened')
		else document.querySelector('#glass').classList.remove('opened')
	}

	get delay() {
		return this.fpsLimit ? this.fpsLimit * 100 : 1
	}

}
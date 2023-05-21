'use strict'
import * as THREE from '/js/modules/three.module.js'
import { GLTFLoader } from '/js/modules/gltfLoader.module.js'
import { FBXLoader } from '/js/modules/fbxLoader.module.js'
import { DecalGeometry } from '/js/modules/decalGeometry.module.js'
import randomInt from '/js/helpers/randomInt.js'

export class Entity {

	loadingElements = 1
	animationModels = []

	constructor(callback, onload) {
		this.callback = callback
		this.onload = onload
		this.gltfLoader = new GLTFLoader()
		this.fbxLoader = new FBXLoader()
		this.textureLoader = new THREE.TextureLoader()
		this.caster = new THREE.Raycaster()
		this.vertex = new THREE.Vector3()
		this.position = new THREE.Vector3()
		this.scale = new THREE.Vector3()
		this.roration = new THREE.Vector3()
		this.box1 = new THREE.Box3()
		this.box2 = new THREE.Box3()
		this.progress = []
		this.animations = []
		this.audios = {}
		this.pendingSounds = []
		this.setupLoading()
		this.loadModel()
		/* this.setupDecalMaterial() */
	}

	setupLoading() {
		if (!this.onload) return
		const vm = this
		this.progress = new Proxy({}, {
			set: function(target, key, value) {
				target[key] = value
				let values = Object.values(target).slice()
				let total = values.reduce((a, b) => a + b, 0)
				total = total / vm.loadingElements
				vm.onload(total)
				return true
			}
		})
	}

	setupDecalMaterial() {
		this.decalMaterial = new THREE.MeshPhongMaterial( { 
			specular: 0x444444,
			shininess: 30,
			color: 0xff0000,
			map: this.textureLoader.load('/textures/decal-blood/diffuse.webp'),
			normalMap: this.textureLoader.load('/textures/decal-blood/normal.webp'),
			transparent: true,
			depthTest: true,
			depthWrite: false,
			polygonOffset: true,
			polygonOffsetFactor: -4,
			wireframe: false
		})
	}

	update(clockDelta) {
		if (this.dead) return
		if (!window.game.pause) this.mixer?.update(clockDelta)
		if (this.object) this.updateActions()
	}

	executeCrossFade(newAction, duration=0.25, loop='repeat') {
		if (!this.lastAction || !newAction) return
		if (this.died && newAction.name != 'die') return
		if (this.lastAction == newAction) return newAction.reset()
		newAction.enabled = true
		newAction.setEffectiveTimeScale(1)
		newAction.setEffectiveWeight(1)
		newAction.loop = loop == 'pingpong' ? THREE.LoopPingPong : loop == 'once' ? THREE.LoopOnce : THREE.LoopRepeat
		newAction.clampWhenFinished = (loop == 'once')
		if (loop == 'once') newAction.reset()
		this.lastAction.crossFadeTo(newAction, duration, true)
		this.lastAction = newAction
		newAction.play()
	}

	synchronizeCrossFade(newAction, duration=0.25, loop='repeat') {
		this.mixer.addEventListener('finished', onLoopFinished)
		const vm = this
		function onLoopFinished(event) {
			vm.mixer.removeEventListener('finished', onLoopFinished)
			vm.executeCrossFade(newAction, duration, loop)
		}
	}

	updateObjectFollow(target, collided, speed=0.001) {
		let pos = target.object.position.clone()
		let dir = this.object.position.clone().sub(pos)
		let step = dir.multiplyScalar(collided ? speed : speed * -1)
		this.object.lookAt(pos)
		this.object.position.add(step)
	}

	getDistance(target) {
		if (!this.collider || !target.collider) return
		if (this.lastCollisionUpdate > (performance.now()-500)) return
		this.lastCollisionUpdate = performance.now()
		let verts = this.collider.geometry.attributes.position
		for (let i = 0; i < verts.count; i++) {
			let localVertex = this.vertex.fromBufferAttribute(verts, i)
			let globalVertex = localVertex.applyMatrix4(this.object.matrix)
			let directionVector = globalVertex.sub(this.object.position)
			this.caster.set(this.object.position, directionVector.normalize())
			let collisionResults = this.caster.intersectObjects([target.collider])
			let collided = collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()
			if (collisionResults.length > 0) return {distance: collisionResults[0].distance, collided: collided}
		}
		return
	}

	hasHit(target, src='weapon', dest='pillar') {
		if (!this[src] || !target[dest]) return
		this[src].updateMatrixWorld(true)
		target[dest].updateMatrixWorld(true)
		this.box1.copy(this[src].geometry.boundingBox)
		this.box1.applyMatrix4(this[src].matrixWorld)
		this.box2.copy(target[dest].geometry.boundingBox)
		this.box2.applyMatrix4(target[dest].matrixWorld)
		return this.box1.intersectsBox(this.box2)
	}

	async fetchAudio(key, url, positional=false, refDistance=10, maxDistance=100) {
		if (!window.sound?.audioContext) return
		try {
			let response = await fetch(url)
			let buffer = await response.arrayBuffer()
			let data = await window.sound.audioContext.decodeAudioData(buffer)
			this.audios[key] = data
			if (positional) this.setPositionalAudio(key, data, refDistance, maxDistance)
		} catch(error) {
			console.log(error)
		}
	}

	setPositionalAudio(name, data, refDistance=10, maxDistance=100) {
		if (!window.sound?.audioListener) return
		const sound = new THREE.PositionalAudio(window.sound?.audioListener)
		sound.name = name
		sound.setBuffer(data)
		sound.setRefDistance(refDistance)
		sound.setMaxDistance(maxDistance)
		sound.onEnded = () => {
			sound.stop()
			this.se = undefined
		}
		if (this.object) this.object.add(sound)
		else this.pendingSounds.push(sound)
	}

	setupBlood() {
		if (!this.pillar) return
		this.position = this.pillar.position.clone()
		/* this.position = this.pillar.position.clone() */
		/* this.position.x += randomInt(-1, 1, false)
		this.position.y += randomInt(-1, 1, false)
		this.position.z -=5//+= randomInt(-5, 5, false) */
		this.roration.z = Math.random() * 2 * Math.PI
		let s = randomInt(3, 5, false)
		this.scale.set(s, s, s)
		const decalGeometry = new DecalGeometry(this.pillar, this.position, this.roration, this.scale)
		const decal = new THREE.Mesh(decalGeometry, this.decalMaterial)
		decal.receiveShadow = true
		window.game.scene.add(decal)
		/* this.pillar.add(decal) */
	}

	loadModel() {}

	initAudio() {}

	updateActions() {}

	resizeScene() {}

	toggleVisibility() {}

	setupDamage(damage) {}

}
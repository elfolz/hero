'use strict'
import * as THREE from '/js/modules/three.module.js'
import { GLTFLoader } from '/js/modules/gltfLoader.module.js'
import { FBXLoader } from '/js/modules/fbxLoader.module.js'

export class Entity {

	loadingElements = 1

	constructor(callback, onload) {
		this.callback = callback
		this.onload = onload
		this.gltfLoader = new GLTFLoader()
		this.fbxLoader = new FBXLoader()
		this.caster = new THREE.Raycaster()
		this.vertex = new THREE.Vector3()
		this.progress = []
		this.animations = []
		this.audios = {}
		this.pendingSounds = []
		this.setupLoading()
		this.loadModel()
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

	update(clockDelta) {
		if (this.dead) return
		this.mixer?.update(clockDelta)
		this.updateActions()
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
		this.mixer.addEventListener('loop', onLoopFinished)
		const vm = this
		function onLoopFinished(event) {
			if (event.action == vm.lastAction) {
				vm.mixer.removeEventListener('loop', onLoopFinished)
				vm.executeCrossFade(newAction, duration, loop)
			}
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
		if (!this.object.collider || !target.object.collider) return
		if (this.lastCollisionUpdate > (performance.now()-500)) return
		this.lastCollisionUpdate = performance.now()
		let verts = this.object.collider.geometry.attributes.position
		for (let i = 0; i < verts.count; i++) {
			let localVertex = this.vertex.fromBufferAttribute(verts, i)
			let globalVertex = localVertex.applyMatrix4(this.object.matrix)
			let directionVector = globalVertex.sub(this.object.position)
			this.caster.set(this.object.position, directionVector.normalize())
			let collisionResults = this.caster.intersectObjects([target.object.collider])
			let collided = collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()
			if (collisionResults.length > 0) return {distance: collisionResults[0].distance, collided: collided}
		}
		return {distance: undefined, collided: false}
	}

	getMelleeDistance(target, src='weapon', dest='chest') {
		if (!this.object[src] || !target.object[dest]) return
		/* if (this.lastMelleeCollisionUpdate > (performance.now()-500)) return
		this.lastMelleeCollisionUpdate = performance.now() */
		let verts = this.object[src].geometry.attributes.position
		for (let i = 0; i < verts.count; i++) {
			let localVertex = this.vertex.fromBufferAttribute(verts, i)
			let globalVertex = localVertex.applyMatrix4(this.object[src].matrix)
			let directionVector = globalVertex.sub(target.object[dest].position)
			this.caster.set(this.object[src].position, directionVector.normalize())
			let collisionResults = this.caster.intersectObjects([target.object[dest]])
			
			if (collisionResults.length) console.log(collisionResults)

			let collided = collisionResults.length > 0 && collisionResults[0].distance <= directionVector.length()
			if (collided) return true
		}
		return false
	}

	async fetchAudio(key, url, positional=false, refDistance=10, maxDistance=100) {
		if (!window.sound?.audioContext) return
		try {
			let response = await fetch(url)
			let buffer = await response.arrayBuffer()
			let data = await window.sound.audioContext.decodeAudioData(buffer)
			this.audios[key] = data
			if (positional) this.setPositionalAudio(data, refDistance, maxDistance)
		} catch(error) {
			console.log(error)
		}
	}

	setPositionalAudio(data, refDistance=10, maxDistance=100) {
		if (!window.sound?.audioListener) return
		const sound = new THREE.PositionalAudio(window.sound?.audioListener)
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

	loadModel() {}

	initAudio() {}

	updateActions() {}

	resizeScene() {}

	toggleVisibility() {}

}
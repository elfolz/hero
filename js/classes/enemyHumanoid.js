'use strict'
import * as THREE from '/js/modules/three.module.js'
import { Entity } from '/js/classes/entity.js'
import randomInt from '/js/helpers/randomInt.js'

export class EnemyHumanoid extends Entity {

	loadingElements = 4

	constructor(player, callback, onload) {
		super(callback, onload)
		this.player = player
	}

	loadModel() {
		this.gltfLoader.load('/models/humanoid/humanoid.glb', gltf => {
			this.object = gltf.scene
			this.object.encoding = THREE.sRGBEncoding
			this.object.traverse(el => {if (el.isMesh) el.castShadow = true})
			this.object.position.set(0, 0, 20)
			this.object.lookAt(0, 0, -1)
			this.object.scale.set(0.045, 0.045, 0.045)
			this.mixer = new THREE.AnimationMixer(this.object)
			this.object.collider = new THREE.Mesh(
				new THREE.SphereGeometry(18),
				new THREE.MeshBasicMaterial({transparent: true, opacity: 0})
			)
			this.object.collider.name = 'collider'
			this.object.add(this.object.collider)
			this.object.chest = new THREE.Mesh(
				new THREE.CylinderGeometry(),
				new THREE.MeshBasicMaterial({transparent: true, opacity: 0})
			)
			this.object.chest.name = 'chest'
			this.object.chest.rotation.x = (Math.PI / 2)
			this.object.chest.position.z += 24.8
			this.object.chest.scale.set(0.6, 2.5, 0.6)
			this.object.getObjectByName('mixamorigSpine1').attach(this.object.chest)
			this.object.hand = new THREE.Mesh(
				new THREE.SphereGeometry(0.35),
				new THREE.MeshBasicMaterial({transparent: true, opacity: 0})
			)
			this.object.hand.name = 'hand'
			this.object.hand.rotation.x = (Math.PI / 2)
			this.object.hand.position.x += 0.85
			this.object.hand.position.y += 0.5
			this.object.hand.position.z += 23.3
			this.object.getObjectByName('mixamorigHead').attach(this.object.hand)
			this.onFinishActions()
			this.loadAnimations()
			this.callback(this.object)
			this.pendingSounds.forEach(el => this.object.add(el))
			this.pendingSounds.splice(0)
		}, xhr => {
			this.progress['foe'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
	}

	loadAnimations() {
		this.fbxLoader.load('/models/humanoid/zombieIdle.fbx', fbx => {
			this.animations['idle'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['idle'].name = 'idle'
			this.lastAction = this.animations['idle']
			this.animations['idle'].play()
		}, xhr => {
			this.progress['idle'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/humanoid/zombieWalk.fbx', fbx => {
			this.animations['walk'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['walk'].name = 'walk'
		}, xhr => {
			this.progress['walk'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/humanoid/zombieAttack.fbx', fbx => {
			this.animations['attack'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['attack'].name = 'attack'
		}, xhr => {
			this.progress['attack'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
	}

	updateActions() {
		if (location.search.includes('stop-enemy')) return
		let check = this.getDistance(this.player)
		if (check?.distance <= 2.5 && !this.isAttacking) {
			this.isAttacking = true
			this.waitForAnimation = true
			this.executeCrossFade(this.animations['attack'], 0.1, 'once')
			setTimeout(() => {this.player.setupDamage(10)}, window.game.delay * 500)
		}
		if (this.waitForAnimation) return
		if (this.isWalking) {
			if (!this.se) {
				let audios = this.object.children.filter(el => el.type == 'Audio')
				if (!audios.length) return
				let i = randomInt(0, audios.length-1)
				if (audios[i] && !audios[i].isPlaying) {
					audios[i].play()
					this.se = audios[i]
				}
			}
			 this.updateObjectFollow(this.player, check?.collided)
		}
		if (check?.distance < 200 && !this.isWalking) {
			this.isWalking = true
			this.executeCrossFade(this.animations['walk'])
		} else if (check?.distance >= 200 && this.isWalking) {
			this.isWalking = false
			this.synchronizeCrossFade(this.animations['idle'])
		}
	}

	onFinishActions() {
		this.mixer.addEventListener('finished', () => {
			this.waitForAnimation = false
			this.isAttacking = false
			this.executeCrossFade(this.animations['walk'])
		})
	}

	initAudio() {
		for (let i=0; i<=8; i++) {
			this.fetchAudio(`attack-${i}`, `/audio/monster/homanoid-${i}.mp3`, true)
		}
	}

}
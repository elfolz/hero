'use strict'
import * as THREE from '/js/modules/three.module.js'
import { Entity } from '/js/classes/entity.js'
import randomInt from '/js/helpers/randomInt.js'

export class EnemyHumanoid extends Entity {

	loadingElements = 6
	animationModels = ['idle', 'walk', 'attack', 'hit', 'die']

	constructor(player, callback, onload) {
		super(callback, onload)
		this.player = player
		this.hp = 100
		this.maxhp = 100
	}

	loadModel() {
		this.gltfLoader.load('/models/humanoid/humanoid.glb', gltf => {
			this.object = gltf.scene
			this.object.colorSpace = THREE.sRGBEColorSpace
			this.object.traverse(el => {if (el.isMesh) el.castShadow = true})
			this.object.position.set(0, 0, 20)
			this.object.lookAt(0, 0, -1)
			this.mixer = new THREE.AnimationMixer(this.object)

			this.collider = new THREE.Mesh(new THREE.SphereGeometry(1.1), new THREE.MeshBasicMaterial({visible: false}))
			this.collider.name = 'collider'
			this.object.add(this.collider)
			this.collider.geometry.computeBoundingBox()

			this.pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 2.6), new THREE.MeshBasicMaterial({visible: false}))
			this.pillar.name = 'pillar'
			this.pillar.rotation.x = (Math.PI / 2) - 0.12
			this.pillar.position.z -= 5.5
			this.object.add(this.pillar)
			this.object.getObjectByName('mixamorigSpine1').attach(this.pillar)
			this.pillar.geometry.computeBoundingBox()

			this.weapon = new THREE.Mesh(new THREE.SphereGeometry(0.35), new THREE.MeshBasicMaterial({visible: false}))
			this.weapon.name = 'weapon'
			this.weapon.position.set(this.object.position.x+3.7, this.object.position.y-0.3, this.object.position.z+6.5)
			this.object.getObjectByName('mixamorigRightHand').attach(this.weapon)
			this.weapon.geometry.computeBoundingBox()

			this.onFinishActions()
			this.loadAnimations()
			this.callback(this.object)
			this.pendingSounds.forEach(el => this.object.add(el))
			this.pendingSounds.splice(0)
			this.progress['foe'] = 100
		}, xhr => {
			this.progress['foe'] = xhr.loaded / (xhr.total || 1) * 100
		}, error => {
			console.error(error)
		})
	}

	loadAnimations() {
		this.animationModels.forEach(el => {
			this.fbxLoader.load(`/models/humanoid/${el}.fbx`, fbx => {
				this.animations[el] = this.mixer.clipAction(fbx.animations[0])
				this.animations[el].name = el
				if (el == 'idle') {
					this.lastAction = this.animations[el]
					this.animations[el].play()
				}
				this.progress[el] = 100
			}, xhr => {
				this.progress[el] = xhr.loaded / (xhr.total || 1) * 100
			}, error => {
				console.error(error)
			})
		})
	}

	update(clockDelta) {
		super.update(clockDelta)
		if (this.processingAttack) this.executeMelleeAttack()
	}

	updateActions() {
		if (location.search.includes('stop-enemy')) return
		if (this.isAttacking || this.beenHit || this.died) return
		let check = this.getDistance(this.player)
		if (check?.distance <= 3.5 && !this.isAttacking) {
			this.isAttacking = true
			this.waitForAnimation = true
			let animationDelay = 0.1
			this.executeCrossFade(this.animations['attack'], animationDelay, 'once')
			setTimeout(() => this.executeMelleeAttack(), window.game.delay * (animationDelay * 1000 * 4 / 3))
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
			this.processingAttack = false
			this.beenHit = false
			this.executeCrossFade(this.returnAction)
		})
	}

	initAudio() {
		for (let i=0; i<9; i++) {
			this.fetchAudio(`attack-${i}`, `/audio/monster/homanoid-${i}.mp3`, true)
		}
	}

	executeMelleeAttack() {
		if (!this.isAttacking) return
		let hasHit = this.hasHit(this.player)
		if (hasHit && Math.random() <= 0.75) this.player.setupDamage(10)
		this.processingAttack = !hasHit
	}

	setupDamage(damage) {
		this.hp -= damage
		if (this.hp < 0) this.hp = 0
		this.waitForAnimation = true
		this.beenHit = true
		/* this.playDamageSE() */
		/* this.setupBlood() */
		this.executeCrossFade(this.animations['hit'], 0.1, 'once')
		if (this.hp <= 0 && !this.died) {
			let audio = this.object.children.find(el => el.name == 'attack-8')
			audio.play()
			this.se = audio
			this.executeCrossFade(this.animations['die'], 1, 'once')
			this.died = true
		}
	}

	get returnAction() {
		return this.isWalking ? this.animations['walk'] : this.animations['idle']
	}

}
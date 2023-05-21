'use strict'
import * as THREE from '/js/modules/three.module.js'
import { Entity } from '/js/classes/entity.js'

export class Support extends Entity {

	loadingElements = 13
	animationModels = ['idle', 'backflip', 'dieing', 'drinking', 'inwardSlash', 'jumping', 'jumpingRunning', 'outwardSlash', 'rolling', 'running', 'stomachHit']

	constructor(player, callback, onload) {
		super(callback, onload)
		this.player = player
		this.hp = 100
		this.maxhp = 100
	}

	loadModel() {
		this.gltfLoader.load('/models/support/knight.glb', gltf => {
			this.object = gltf.scene
			this.object.colorSpace = THREE.sRGBEColorSpace
			this.object.scale.set(3.75, 3.75, 3.75)
			this.object.traverse(el => {if (el.isMesh) el.castShadow = true})
			this.object.position.set(2, 0, 0)
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
			this.loadWeapon()
			this.loadAnimations()
			this.callback(this.object)
			this.progress['support'] = 100
		}, xhr => {
			this.progress['support'] = xhr.loaded / (xhr.total || 1) * 99
		}, error => {
			console.error(error)
		})
	}

	loadWeapon() {
		this.gltfLoader.load('./models/equips/damascusSword.glb', fbx => {
			this.sword = fbx.scene
			this.sword.colorSpace = THREE.sRGBEColorSpace
			this.sword.traverse(el => {
				if (!el.isMesh) return
				el.castShadow = true
				if (!this.weapon) this.weapon = el
			})
			this.weapon.geometry.computeBoundingBox()
			this.sword.rotation.x = Math.PI / 2
			this.sword.rotation.z = Math.PI / 2
			this.sword.position.set(this.object.position.x-1.3, this.object.position.y+2.1, this.object.position.z-3.6)
			this.sword.scale.set(4, 4, 4)
			this.object.getObjectByName('mixamorigRightHand').attach(this.sword)
			this.progress['sword'] = 99.9
			this.animate()
		}, xhr => {
			this.progress['sword'] = xhr.loaded / (xhr.total || 1) * 99
		}, error => {
			console.error(error)
		})
	}

	loadAnimations() {
		this.animationModels.forEach(el => {
			this.fbxLoader.load(`./models/support/${el}.fbx`, fbx => {
				this.animations[el] = this.mixer.clipAction(fbx.animations[0])
				this.animations[el].name = el
				this.progress[el] = 100
				if (el == 'idle') this.animate()
			}, xhr => {
				this.progress[el] = parseInt(xhr.loaded / (xhr.total || 1)) * 99
			}, error => {
				console.error(error)
			})
		})
	}

	animate() {
		if ((this.progress['idle'] || 0) < 100) return
		if ((this.progress['sword'] || 0) < 99.9) return
		this.lastAction = this.animations['idle']
		this.animations['idle'].play()
		this.progress['sword'] = 100
	}

}
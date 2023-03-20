'use strict'
import * as THREE from '/js/modules/three.module.js'
import { Entity } from '/js/classes/entity.js'

export class Support extends Entity {

	loadingElements = 12

	constructor(player, callback, onload) {
		super(callback, onload)
		this.player = player
		this.hp = 100
		this.maxhp = 100
	}

	loadModel() {
		this.gltfLoader.load('/models/support/knight.glb', gltf => {
			this.object = gltf.scene
			this.object.encoding = THREE.sRGBEncoding
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
			this.progress['support'] = (xhr.loaded / xhr.total) * 99
		}, error => {
			console.error(error)
		})
	}

	loadWeapon() {
		this.gltfLoader.load('/models/equips/damascusSword.glb', fbx => {
			this.sword = fbx.scene
			this.sword.encoding = THREE.sRGBEncoding
			this.sword.traverse(el => {
				if (!el.isMesh) return
				el.castShadow = true
				if (!this.weapon) this.weapon = el
			})
			this.weapon.geometry.computeBoundingBox()
			this.sword.rotation.x = 1.4
			this.sword.rotation.z = Math.PI / 2
			this.sword.position.set(this.object.position.x-1.1, this.object.position.y+2.1, this.object.position.z-3.6)
			this.sword.scale.set(4, 4, 4)
			this.object.getObjectByName('mixamorigRightHand').attach(this.sword)
			this.progress['sword'] = 100
		}, xhr => {
			this.progress['sword'] = (xhr.loaded / xhr.total) * 99
		}, error => {
			console.error(error)
		})
	}

	loadAnimations() {
		this.fbxLoader.load('/models/support/idle.fbx', fbx => {
			this.animations['idle'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['idle'].name = 'idle'
			this.lastAction = this.animations['idle']
			this.animations['idle'].play()
		}, xhr => {
			this.progress['idle'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/support/backflip.fbx', fbx => {
			this.animations['backflip'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['backflip'].name = 'backflip'
		}, xhr => {
			this.progress['backflip'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/support/die.fbx', fbx => {
			this.animations['die'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['die'].name = 'die'
		}, xhr => {
			this.progress['dieing'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/support/drinking.fbx', fbx => {
			this.animations['drinking'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['drinking'].name = 'drinking'
		}, xhr => {
			this.progress['drinking'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/support/inwardSlash.fbx', fbx => {
			this.animations['inwardSlash'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['inwardSlash'].name = 'inwardSlash'
		}, xhr => {
			this.progress['inwardSlash'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/support/jumping.fbx', fbx => {
			this.animations['jumping'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['jumping'].name = 'jumping'
		}, xhr => {
			this.progress['jumping'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/support/jumpingRunning.fbx', fbx => {
			this.animations['jumpingRunning'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['jumpingRunning'].name = 'jumpingRunning'
		}, xhr => {
			this.progress['jumpingRunning'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/support/outwardSlash.fbx', fbx => {
			this.animations['outwardSlash'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['outwardSlash'].name = 'outwardSlash'
		}, xhr => {
			this.progress['outwardSlash'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/support/rolling.fbx', fbx => {
			this.animations['rolling'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['rolling'].name = 'rolling'
		}, xhr => {
			this.progress['rolling'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
		this.fbxLoader.load('/models/support/running.fbx', fbx => {
			this.animations['run'] = this.mixer.clipAction(fbx.animations[0])
			this.animations['run'].name = 'run'
		}, xhr => {
			this.progress['running'] = (xhr.loaded / xhr.total) * 100
		}, error => {
			console.error(error)
		})
	}

}
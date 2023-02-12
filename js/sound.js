import { AudioListener, PositionalAudio } from '/js/modules/three.module.js'
import randomInt from '/js/helpers/randomInt.js'

class Sound {

	constructor() {
		this.audio = new Audio()
		this.bgmVolume = 0.25
		this.seVolume = 1
	}

	init() {
		this.audioContext = new AudioContext()
		this.bgmGain = this.audioContext.createGain()
		this.bgmGain.gain.value = this.bgmVolume
		this.seGain = this.audioContext.createGain()
		this.seGain.gain.value = this.seVolume
		const destination = this.audioContext.createMediaStreamDestination()
		this.bgmGain.connect(this.audioContext.destination)
		this.seGain.connect(this.audioContext.destination)
		this.audio.srcObject = destination.stream
		this.audio.play()
		fetch('/audio/bgm/bgm.mp3')
		.then(response => {
			response.arrayBuffer()
			.then(buffer => {
				this.audioContext.decodeAudioData(buffer)
				.then(audioData => {
					this.bgmBuffer = audioData
					this.playBGM()
				})
			})
		})
		fetch('/audio/me/gameover.mp3')
		.then(response => {
			response.arrayBuffer()
			.then(buffer => {
				this.audioContext.decodeAudioData(buffer)
				.then(audioData => {
					this.gameoverBuffer = audioData
				})
			})
		})
		this.audioListener = new AudioListener()
		this.audioListener.setMasterVolume(this.seVolume)
		window.camera.add(this.audioListener)
		if (window.hero && !Object.keys(hero.audio).length) this.initHeroAudio()
		if (window.foe && !foe.children.some(el => el.type == 'Audio')) this.initFoeAudio()
	}

	initHeroAudio() {
		hero.audio.attack = []
		hero.audio.damage = []
		for (let i=0; i<=4; i++) {
			fetch(`/audio/hero/attack/${i}.mp3`)
			.then(response => {
				response.arrayBuffer()
				.then(buffer => {
					this.audioContext.decodeAudioData(buffer)
					.then(audioData => {
						hero.audio.attack.push(audioData)
					})
				})
			})
			fetch(`/audio/hero/damage/${i}.mp3`)
			.then(response => {
				response.arrayBuffer()
				.then(buffer => {
					this.audioContext.decodeAudioData(buffer)
					.then(audioData => {
						hero.audio.damage.push(audioData)
					})
				})
			})
		}
	}

	initFoeAudio() {
		for (let i=0; i<=8; i++) {
			fetch(`/audio/monster/homanoid-${i}.mp3`)
			.then(response => {
				response.arrayBuffer()
				.then(buffer => {
					this.audioContext.decodeAudioData(buffer)
					.then(audioData => {
						const sound = new PositionalAudio(this.audioListener)
						sound.setBuffer(audioData)
						sound.setRefDistance(10)
						sound.setMaxDistance(100)
						sound.onEnded = () => {
							sound.stop()
							foe.se = undefined
						}
						foe.add(sound)
					})
				})
			})
		}
	}

	playBGM(restart=true) {
		if (window.gameover || !this.audioContext || !this.bgmBuffer) return
		this.bgmSource = this.audioContext.createBufferSource()
		this.bgmSource.buffer = this.bgmBuffer
		this.bgmSource.loop = true
		this.bgmSource.connect(this.bgmGain)
		if (localStorage.getItem('bgm') !== 'false') {
			restart ? this.bgmSource.start(0) : this.bgmSource.start()
		}
		this.bgmSource.onended = () => {
			this.bgmSource.disconnect()
			this.bgmSource = undefined
		}
	}

	stopBGM() {
		try {if (this.bgmSource) this.bgmSource.stop()} catch(e){}
	}

	playME(buffer) {
		if (!buffer) return
		this.stopBGM()
		this.meSource = this.audioContext.createBufferSource()
		this.meSource.buffer = buffer
		this.meSource.connect(this.bgmGain)
		this.bgmGain.gain.value = 0.8
		this.meSource.start(0)
		this.meSource.onended = () => {
			this.bgmGain.gain.value = document.hidden ? 0 : this.bgmVolume
			this.meSource?.disconnect()
			this.meSource = undefined
			this.playBGM(false)
		}
	}

	playHeroAttackSE() {
		if (!hero.audio.attack || hero.beenHit) return
		let i = randomInt(0, hero.audio.attack.length-1)
		if (hero.sePlaying) return
		hero.sePlaying = true
		this.playSE(hero.audio.attack[i], false, hero)
	}

	playHeroDamageSE() {
		if (!hero.audio.damage) return
		let i = randomInt(0, hero.audio.damage.length-1)
		if (hero.sePlaying) return
		hero.sePlaying = true
		this.playSE(hero.audio.damage[i], false, hero)
	}

	playSE(buffer, loop=false, srcObject) {
		if (!this.audioContext || !buffer) return
		const src = this.audioContext.createBufferSource()
		src.buffer = buffer
		src.loop = loop
		src.connect(this.seGain)
		src.start(0)
		src.onended = () => {
			src.disconnect()
			if (srcObject) srcObject.sePlaying = undefined
		}
		return src
	}

}

window.sound = new Sound()
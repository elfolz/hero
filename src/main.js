'use strict'
import './gui.js'
import { Sound } from './classes/sound.js'
import { Game } from './classes/game.js'

window.sound = new Sound()
window.game = new Game()

if (location.protocol.startsWith('https')) {
	navigator.serviceWorker.register('service-worker.js')
	navigator.serviceWorker.onmessage = e => {
		console.info('Update found!')
		if (e?.data == 'update') location.reload(true)
	}
}
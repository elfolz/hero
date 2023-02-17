'use strict'
import '/js/gui.js'
import { Sound } from '/js/sound.js'
import { Game } from '/js/game.js'

window.sound = new Sound()
window.game = new Game()

if (location.protocol.startsWith('https')) {
	navigator.serviceWorker.register('service-worker.js')
	navigator.serviceWorker.onmessage = e => {
		console.info('Update found!')
		if (e?.data == 'update') location.reload(true)
	}
}
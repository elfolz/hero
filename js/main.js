'use strict'
import '/js/gui.js'
import { Sound } from '/js/classes/sound.js'
import { Game } from '/js/classes/game.js'

window.sound = new Sound()
window.game = new Game()

if (location.protocol.startsWith('https')) {
	navigator.serviceWorker.register('service-worker.js')
	navigator.serviceWorker.onmessage = e => {
		console.info('Update found!')
		if (e?.data == 'update') location.reload(true)
	}
}

if (!document.hidden) try { navigator.wakeLock.request('screen') } catch(e) {}
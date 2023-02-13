'use strict'
import '/js/game.js'
import '/js/sound.js'
import '/js/gui.js'

if (location.protocol.startsWith('https')) {
	navigator.serviceWorker.register('service-worker.js')
	navigator.serviceWorker.onmessage = e => {
		console.info('Update found!')
		if (e?.data == 'update') location.reload(true)
	}
}
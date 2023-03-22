'use strict'
import '/js/gui.js'
import { Sound } from '/js/classes/sound.js'
import { Game } from '/js/classes/game.js'
import {RTC } from '/js/classes/rtc.js'

window.rtc = new RTC()
window.sound = new Sound()
window.game = new Game()

if (location.protocol.startsWith('https')) {
	navigator.serviceWorker.register('service-worker.js')
	navigator.serviceWorker.onmessage = e => {
		console.info('Update found!')
		if (e?.data == 'update') location.reload(true)
	}
}

window.onbeforeunload = async () => await window.rtc.disconnect()
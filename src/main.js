'use strict'

import './stylesheet.scss'

import './gui.js'
import { Sound } from './classes/sound.js'
import { Game } from './classes/game.js'

window.sound = new Sound()
window.game = new Game()

if (location.protocol.startsWith('https')) {
	var swUpdating = false
	navigator.serviceWorker.register('service-worker.js')
	.then(reg => {
		reg.onupdatefound = () => {swUpdating = true}
		if (reg.active && swUpdating) location.reload()
	})
}
'use strict'
import device from '/js/helpers/device.js'

function initGUI() {
	if (localStorage.getItem('bgm') == 'false') {
		document.querySelector('#menu-button-music-on').classList.remove('off')
		document.querySelector('#menu-button-music-off').classList.add('off')
	}
	document.querySelector('#button-config').onclick = e => {
		e.stopPropagation()
		document.querySelector('#menu-config').classList.toggle('opened')
	}
	document.querySelector('#menu-button-music-off').onclick = e => {
		e.stopPropagation()
		localStorage.setItem('bgm', 'false')
		document.querySelector('#menu-button-music-off').classList.add('off')
		document.querySelector('#menu-button-music-on').classList.remove('off')
		window.sound.stopBGM()
	}
	document.querySelector('#menu-button-music-on').onclick = e => {
		e.stopPropagation()
		localStorage.setItem('bgm', 'true')
		document.querySelector('#menu-button-music-on').classList.add('off')
		document.querySelector('#menu-button-music-off').classList.remove('off')
		window.sound.playBGM()
	}
	document.querySelector('#menu-button-gamepad').onclick = e => {
		document.querySelector('#dialog-controller').classList.add('opened')
	}
	document.querySelector('#dialog-controller button').onclick = e => {
		document.querySelector('#dialog-controller').classList.remove('opened')
	}
	document.querySelector('#menu-button-fps').onclick = e => {
		if (!window.game.fpsLimit) {
			window.game.fpsLimit = 1/60
			refreshFPS(60)
		} else if (window.game.fpsLimit == 1/60) {
			window.game.fpsLimit = 1/30
			refreshFPS(30)
		} else if (window.game.fpsLimit == 1/30) {
			window.game.fpsLimit = undefined
			refreshFPS()
		}
		e.stopPropagation()
		e.preventDefault()
	}
}

window.refreshFPS = function(value) {
	if (value) localStorage.setItem('fpsLimit', value.toString())
	else localStorage.removeItem('fpsLimit')
	document.querySelector('#menu-button-fps label').innerHTML = `${value ?? 'Auto'} FPS`
}

document.onclick = () => {
	document.querySelector('#menu-config').classList.remove('opened')
	if ('requestFullscreen' in document.documentElement && !device.isPC && !device.isLocalhost) {
		document.documentElement.requestFullscreen()
		/* .then(() => {return screen?.orientation.lock('landscape')})
		.catch(e => {}) */
	}
	if (!window.audioAuthorized) {
		window.audioAuthorized = true
		window.sound.init()
	}
}

document.onvisibilitychange = () => {
	game?.toggleVisibility()
	sound?.toggleVisibility()
	if (document.hidden) {
		document.querySelectorAll('footer section button').forEach(el => {
			el.classList.remove('active')
		})
	}
}

document.onreadystatechange = () => {
	if (document.readyState == 'complete') initGUI()
}

window.oncontextmenu = e => {e.preventDefault(); return false}
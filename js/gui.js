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
		e.stopPropagation()
		if (!window.game.fpsLimit) {
			window.game.fpsLimit = 1/60
			refreshFPS(60)
		} else if (window.game.fpsLimit == 1/60) {
			window.game.fpsLimit = 1/30
			refreshFPS(30)
		} else if (window.game.fpsLimit == 1/30) {
			window.game.fpsLimit = 0
			refreshFPS(0)
		}
	}
	document.querySelector('#menu-button-resolution').onclick = e => {
		e.stopPropagation()
		if (!window.game.resolution) {
			window.game.resolution = 1
			refreshResolution(1)
		} else if (window.game.resolution == 1) {
			window.game.resolution = 2
			refreshResolution(2)
		} else if (window.game.resolution == 2) {
			window.game.resolution = 0
			refreshResolution(0)
		}
		window.game.resizeScene()
	}
	document.querySelector('#menu-button-pixel_density').onclick = e => {
		e.stopPropagation()
		if (!window.game.pixelDensity) {
			window.game.pixelDensity = 1
			refreshPixelDensity(1)
		} else if (window.game.pixelDensity == 1) {
			window.game.pixelDensity = 2
			refreshPixelDensity(2)
		} else if (window.game.pixelDensity == 2) {
			window.game.pixelDensity = 0
			refreshPixelDensity(0)
		}
		window.game.resizeScene()
	}
}

window.refreshFPS = function(value, save=true) {
	if (save) {
		if (typeof value == 'number') localStorage.setItem('fpsLimit', value.toString())
		else localStorage.removeItem('fpsLimit')
	}
	document.querySelector('#menu-button-fps label').innerHTML = `${value > 0 ? value : 'Auto'} FPS`
}

window.refreshResolution = function(value, save=true) {
	if (save) {
		if (typeof value == 'number') localStorage.setItem('resolution', value)
		else localStorage.removeItem('resolution')
	}
	let label = `${value == 1 ? 'Média' : value == 2 ? 'Baixa' : 'Alta'} resolução`
	document.querySelector('#menu-button-resolution label').innerHTML = label
}

window.refreshPixelDensity = function(value, save=true) {
	if (save) {
		if (typeof value == 'number') localStorage.setItem('pixelDensity', value.toString())
		else localStorage.removeItem('pixelDensity')
	}
	let label = `${value == 1 ? 'Média' : value == 2 ? 'Baixa' : 'Alta'} densidade de pixels`
	document.querySelector('#menu-button-pixel_density label').innerHTML = label
}

document.onclick = () => {
	document.querySelector('#menu-config').classList.remove('opened')
	if (window.firstClick) return
	if ('requestFullscreen' in document.documentElement && !device.isPC && !device.isLocalhost) {
		document.documentElement.requestFullscreen({navigationUI: 'hide'})
		.then(() => {
			return screen.orientation.lock('landscape')
		})
		.catch(e => {})
	}
	window.sound.init()
	window.firstClick = true
}

document.onvisibilitychange = () => {
	window.game?.toggleVisibility()
	window.sound?.toggleVisibility()
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

if ('screen' in window) {
	screen.orientation.onchange = () => {
		window.game?.refreshResolution()
		window.game?.resizeScene()
	}
}
'use strict'
import device from './helpers/device.js'

var wakeLockObj

function initGUI() {
	if (localStorage.getItem('bgm') == 'false') {
		document.querySelector('#menu-button-music-on').classList.remove('off')
		document.querySelector('#menu-button-music-off').classList.add('off')
	}
	document.querySelector('#button-config').onclick = e => {
		e.stopPropagation()
		window.toggleMenuConfig()
	}
	document.querySelector('#menu-button-music-off').onclick = e => {
		e.stopPropagation()
		window.executeMenuConfig('music-off')
	}
	document.querySelector('#menu-button-music-on').onclick = e => {
		e.stopPropagation()
		window.executeMenuConfig('music-on')
	}
	document.querySelector('#menu-button-controls').onclick = e => {
		window.executeMenuConfig('controls')
	}
	document.querySelector('#dialog-controller button').onclick = e => {
		document.querySelector('#dialog-controller').classList.remove('opened')
	}
	document.querySelector('#menu-button-fps').onclick = e => {
		e.stopPropagation()
		window.executeMenuConfig('fps')
	}
	document.querySelector('#menu-button-resolution').onclick = e => {
		e.stopPropagation()
		window.executeMenuConfig('resolution')
	}
	document.querySelector('#menu-button-pixel_density').onclick = e => {
		e.stopPropagation()
		window.executeMenuConfig('pixel_density')
	}
	document.querySelector('#menu-button-antialiasing').onclick = e => {
		e.stopPropagation()
		window.executeMenuConfig('antialiasing')
	}
	document.querySelector('#menu-button-force_refresh').onclick = e => {
		e.stopPropagation()
		window.executeMenuConfig('force_refresh')
	}
	window.refreshControlsMenu()
}

function lockScreen() {
	if (document.hidden) return
	if ('wakeLock' in navigator) navigator.wakeLock.request('screen').then(el => wakeLockObj = el)
}

window.menuConfigOpened = function() {
	return document.querySelector('#menu-config').classList.contains('opened')
}

window.toggleMenuConfig = function(activeFirstOption=false) {
	const el = document.querySelector('#menu-config')
	el.classList.toggle('opened')
	el.classList.contains('opened') ? window.sound.playClick() : window.sound.playCancel()
	if (activeFirstOption && el.classList.contains('opened')) el.firstChild.classList.add('active')
	else el.childNodes.forEach(el => el.classList.remove('active'))
}

window.navigateMenuConfig = function(nextIndex) {
	const els = Array.from(document.querySelector('#menu-config').childNodes).filter(el => !el.classList.contains('off'))
	const currentIndex = els.findIndex(el => el.classList.contains('active'))
	let activeIndex
	if (nextIndex > 0 && currentIndex < (els.length-1)) activeIndex = currentIndex + 1
	else if (nextIndex < 0 && currentIndex > 0) activeIndex = currentIndex - 1
	if (activeIndex >= 0) {
		window.sound.playCursor()
		document.querySelector('#menu-config').childNodes.forEach(el => el.classList.remove('active'))
		els[activeIndex].classList.add('active')
	}
}

window.executeMenuConfig = function(index) {
	if (!index) index = Array.from(document.querySelector('#menu-config').childNodes).find(el => el.classList.contains('active')).id
	if (index.includes('music-on')) {
		localStorage.setItem('bgm', 'true')
		document.querySelector('#menu-button-music-on').classList.add('off')
		document.querySelector('#menu-button-music-off').classList.remove('off')
		document.querySelector('#menu-config').childNodes.forEach(el => el.classList.remove('active'))
		document.querySelector('#menu-config').childNodes[1].classList.add('active')
		window.sound.playBGM()
	} else if (index.includes('music-off')) {
		localStorage.setItem('bgm', 'false')
		document.querySelector('#menu-button-music-off').classList.add('off')
		document.querySelector('#menu-button-music-on').classList.remove('off')
		document.querySelector('#menu-config').childNodes.forEach(el => el.classList.remove('active'))
		document.querySelector('#menu-config').childNodes[0].classList.add('active')
		window.sound.stopBGM()
	} else if (index.includes('controls')) {
		let el = document.querySelector('#dialog-controller')
		el.classList.toggle('opened')
		el.classList.contains('opened') ? window.sound.playClick() : window.sound.playCancel()
	} else if (index.includes('fps')) {
		if (!localStorage.getItem('fpsLimit') || localStorage.getItem('fpsLimit') == '0') {
			window.refreshFPS(60)
		} else if (localStorage.getItem('fpsLimit') == '60') {
			window.refreshFPS(30)
		} else if (localStorage.getItem('fpsLimit') == '30') {
			window.refreshFPS(0)
		}
		window.game.refreshFPS(false)
	} else if (index.includes('resolution')) {
		if (!localStorage.getItem('resolution') || localStorage.getItem('resolution') == '0') {
			window.refreshResolution(1)
		} else if (localStorage.getItem('resolution') == '1') {
			window.refreshResolution(2)
		} else if (localStorage.getItem('resolution') == '2') {
			window.refreshResolution(0)
		}
		window.game.refreshResolution(false)
		window.game.resizeScene()
	} else if (index.includes('pixel_density')) {
		if (!localStorage.getItem('pixelDensity') || localStorage.getItem('pixelDensity') == '0') {
			window.refreshPixelDensity(1)
		} else if (localStorage.getItem('pixelDensity') == '1') {
			window.refreshPixelDensity(2)
		} else if (localStorage.getItem('pixelDensity') == '2') {
			window.refreshPixelDensity(0)
		}
		window.game.refreshPixelDensity()
		window.game.resizeScene()
	} else if (index.includes('antialiasing')) {
		if (localStorage.getItem('antialiasing') == 'true') {
			window.refreshAntialiasing(false)
		} else {
			window.refreshAntialiasing(true)
		}
		window.game.refreshAntialiasing(false)
	} else if (index.includes('force_refresh')) {
		caches.delete('hero').then(() => location.reload(true) )
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

window.refreshAntialiasing = function(value, save=true) {
	if (save) {
		if (typeof value == 'boolean') localStorage.setItem('antialiasing', value.toString())
		else localStorage.removeItem('antialiasing')
	}
	let label = `Antialiasing ${value ? 'ligado' : 'desligado'}`
	document.querySelector('#menu-button-antialiasing label').innerHTML = label
	if (value) {
		document.querySelector('#antialiasing-on').style.removeProperty('display')
		document.querySelector('#antialiasing-off').style.setProperty('display', 'none')
	} else {
		document.querySelector('#antialiasing-on').style.setProperty('display', 'none')
		document.querySelector('#antialiasing-off').style.removeProperty('display')
	}
}

window.refreshControlsMenu = () => {
	if (window.game?.player?.gamepadConnected || device.isPC) {
		document.querySelector('#menu-button-controls').style.removeProperty('display')
	} else {
		document.querySelector('#menu-button-controls').style.setProperty('display', 'none')
	}
	if (window.game?.player?.gamepadConnected) {
		document.querySelectorAll('#gamepad')?.forEach(el => el.style.removeProperty('display'))
		document.querySelectorAll('#keyboard')?.forEach(el => el.style.setProperty('display', 'none'))
	} else {
		document.querySelectorAll('#gamepad')?.forEach(el => el.style.setProperty('display', 'none'))
		document.querySelectorAll('#keyboard')?.forEach(el => el.style.removeProperty('display'))
	}
}

document.onclick = () => {
	document.querySelector('#menu-config').classList.remove('opened')
	/* if (!navigator.standalone) {
		if ('requestFullscreen' in document.documentElement && !device.isPC && !device.isLocalhost) {
			document.documentElement.requestFullscreen({navigationUI: 'hide'})
			.then(() => {
				return screen.orientation.lock('landscape')
			})
			.catch(e => {})
		}
	} */
	if (!window.sound.initialized) window.sound.init()
}

document.onvisibilitychange = () => {
	window.game?.toggleVisibility()
	window.sound?.toggleVisibility()
	if (document.hidden) {
		document.querySelectorAll('footer section button').forEach(el => {
			el.classList.remove('active')
		})
		if (wakeLockObj) wakeLockObj.release()
	} else {
		lockScreen()
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

lockScreen()
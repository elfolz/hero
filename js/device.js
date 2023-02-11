export default {
	get name() {
		if (/(iphone)/i.test(navigator.userAgent)) return 'iphone'
		else if (/(ipad)/i.test(navigator.userAgent)) return 'ipad'
		else if (/(android)/i.test(navigator.userAgent)) return 'android'
		else if (/(windows)/i.test(navigator.userAgent)) return 'windows'
		else if (/(linux|arch|ubuntu|mint|manjaro|debian)/i.test(navigator.userAgent)) return 'linux'
		else if (/(mac|macos|macintosh)/i.test(navigator.userAgent)) return 'mac'
		else return null
	},
	get osVersion() {
		if (/(iphone)/i.test(navigator.userAgent)) return parseInt(/OS\s(\d+)_(\d+)_?(\d+)?/i.exec(navigator.userAgent)[1] || '0')
		else return parseInt(/(?:linux|arch|ubuntu|mint|manjaro|debian|windows|android|mac)\s([\.\_\d]+)/i.exec(navigator.userAgent)[1] || '0')
	},
	get memory() {
		return navigator.deviceMemory ?? 0
	},
	get cpuCores() {
		return navigator.hardwareConcurrency ?? 0
	},
	get isPC() {
		return /(linux|arch|ubuntu|mint|manjaro|debian|windows|mac)/i.test(navigator.userAgent)
	},
	get isApple() {
		return /(iphone|ipad|mac)/i.test(navigator.userAgent)
	},
	get isLocalhost() {
		return ['127.0.0.1', 'localhost'].includes(location.hostname)
	}
}
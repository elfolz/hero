import { ref, onValue, set, remove } from 'https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js'
import { database } from '/js/helpers/firebase.js'

export class RTC {

	constructor() {
		this.pcs = []
		this.watch()
		this.init()
	}

	async init() {
		const params = location.search.substring(1).split('&').map(el => {
			let data = el.split('=')
			return { [data[0]]: data[1]}
		}).reduce((a, b) => {
			return {...a, [Object.keys(b)[0]]: Object.values(b)[0]}
		}, {})
		this.playerName = params?.player ?? 'Player1'
		if (this.playerName != 'Player1') return
		this.createPeerConnection()
		const offer = await this.localPeer.createOffer()
		await this.localPeer.setLocalDescription(offer)
		await set(ref(database, `rooms/room/players/${this.playerName}/offer`), JSON.stringify(offer))
	}
 
	async createPeerConnection() {
		this.localPeer = new RTCPeerConnection()
		this.channel = this.localPeer.createDataChannel('channel')
		this.channel.onmessage = m => {
			console.log(m)
		}
		this.localPeer.onicecandidate = async e => {
			if (e.candidate) await set(ref(database, `rooms/room/players/${this.playerName}/candidate`), JSON.stringify(e.candidate))
		}
	}

	async handleCandidate(candidate) {
		if (!this.localPeer) return
		this.localPeer.addIceCandidate(candidate)
	}

	async handleOffer(offer) {
		if (this.localPeer) return
		this.createPeerConnection()
		this.localPeer.ondatachannel = e => {
			this.channel = e.channel
			this.channel.onmessage = m => {
				console.log(m)
			}
		}
		await this.localPeer.setRemoteDescription(offer)
		const answer = await this.localPeer.createAnswer()
		await this.localPeer.setLocalDescription(answer)
		await set(ref(database, `rooms/room/players/${this.playerName}/answer`), JSON.stringify(answer))
	}

	async handleAnswer(answer) {
		if (!this.localPeer || this.localPeer?.remoteDescription) return
		await this.localPeer.setRemoteDescription(answer)
	}

	sendData(data) {
		this.channel.send(this.playerName)
	}

	watch() {
		this.unsubscribe = onValue(ref(database, 'rooms'), snapshot => {
			if (!snapshot.exists()) return
			for (let i in snapshot.val().room.players) {
				if (i != this.playerName) {
					if (snapshot.val().room.players[i].candidate) this.handleCandidate(JSON.parse(snapshot.val().room.players[i].candidate))
					if (snapshot.val().room.players[i].answer) this.handleAnswer(JSON.parse(snapshot.val().room.players[i].answer))
					if (snapshot.val().room.players[i].offer) this.handleOffer(JSON.parse(snapshot.val().room.players[i].offer))
				}
			}
		})
	}

	async disconnect() {
		await remove(ref(database, `rooms/room/players/${this.playerName}`))
		if (this.unsubscribe) this.unsubscribe()
	}

}
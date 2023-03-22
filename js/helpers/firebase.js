import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.17.2/firebase-app.js'
import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.17.2/firebase-database.js'
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js'

const firebaseApp = initializeApp({
	projectId: 'hero-5fac9',
	apiKey: 'AIzaSyCgUWoPNSq44iFzXjFOS__noR5wpNyv5a8',
	appId: '1:89977001112:web:6e5cebec76725944f8aced'
})

const database = getDatabase(firebaseApp)
const auth = getAuth(firebaseApp)

signInAnonymously(auth)

export { firebaseApp, database }
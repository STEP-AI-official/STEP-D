import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

const firebaseConfig = {
  apiKey:            'AIzaSyC-lvyK-PF30dXXCILbUpHzjqOAB-OtnQE',
  authDomain:        'step-d.firebaseapp.com',
  projectId:         'step-d',
  storageBucket:     'step-d.firebasestorage.app',
  messagingSenderId: '872105344568',
  appId:             '1:872105344568:web:d173f5faa8b5408ee430cd',
}

export const firebaseApp    = initializeApp(firebaseConfig)
export const auth           = getAuth(firebaseApp)
export const googleProvider = new GoogleAuthProvider()

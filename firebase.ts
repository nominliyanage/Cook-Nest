import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBB-J-C0zCmNSJb1Edtp-a-aiy86bGVJX8",
  authDomain: "cook-nest-b6bef.firebaseapp.com",
  projectId: "cook-nest-b6bef",
  storageBucket: "cook-nest-b6bef.firebasestorage.app",
  messagingSenderId: "872590064110",
  appId: "1:872590064110:web:5e6e3efe43c537e9d236ff"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
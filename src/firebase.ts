import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCT9neuRPxayLxgOvHwagjVWl98iPQHBzI",
  authDomain: "tabiwari-f977a.firebaseapp.com",
  projectId: "tabiwari-f977a",
  storageBucket: "tabiwari-f977a.firebasestorage.app",
  messagingSenderId: "519636537080",
  appId: "1:519636537080:web:7e2029398faaa1b00f750d",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

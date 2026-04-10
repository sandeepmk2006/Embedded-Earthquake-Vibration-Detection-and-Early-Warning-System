import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyBcqPzu2Yidk6eAblwnlf_JSlhUwMqrtMc",
  authDomain: "earth-quack-67676.firebaseapp.com",
  databaseURL: "https://earth-quack-67676-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "earth-quack-67676",
  storageBucket: "earth-quack-67676.firebasestorage.app",
  messagingSenderId: "895598284495",
  appId: "1:895598284495:web:855e9dec51afd78103b1ba",
  measurementId: "G-0EBL2P2MBM"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };

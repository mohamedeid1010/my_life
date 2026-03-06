import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAWPGftVLRq_3y7d4ABOtAUaWMg5nF_QXM",
  authDomain: "my-life-3519c.firebaseapp.com",
  projectId: "my-life-3519c",
  storageBucket: "my-life-3519c.firebasestorage.app",
  messagingSenderId: "628407543082",
  appId: "1:628407543082:web:e281446795ab10b333aa53"
};

const app = initializeApp(firebaseConfig);
const dbDefaultId = getFirestore(app, "default");
const dbParentheses = getFirestore(app, "(default)");

async function run() {
  try {
    const q = collection(dbDefaultId, "system_settingg");
    const snap = await getDocs(q);
    console.log("Success with 'default'!", snap.size);
  } catch(e) {
    console.log("Error with 'default':", e.message);
  }
  
  try {
    const q2 = collection(dbParentheses, "system_settingg");
    const snap2 = await getDocs(q2);
    console.log("Success with '(default)'!", snap2.size);
  } catch(e) {
    console.log("Error with '(default)':", e.message);
  }
}
run();

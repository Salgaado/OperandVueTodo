import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCmXlvQLY2jAbWJwL8xCEQuVNQDCA6zxHc",
  authDomain: "operand-test-8c9e8.firebaseapp.com",
  projectId: "operand-test-8c9e8",
  storageBucket: "operand-test-8c9e8.appspot.com",
  messagingSenderId: "830535948345",
  appId: "1:830535948345:web:exampleAppId",
};


const app = initializeApp(firebaseConfig);


const auth = getAuth(app);
const db = getFirestore(app);
(console.log(db))
export { auth, db };


const admin = require('firebase-admin');

function initializeFirestore() {
    admin.initializeApp({
        credential: admin.credential.cert(require('./firebaseCredential.json'))
    });

    return admin.firestore();
}

const db = initializeFirestore();

module.exports = db;

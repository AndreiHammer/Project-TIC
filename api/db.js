const admin = require('firebase-admin');

function initializeFirestore() {
    if (admin.apps.length === 0) {
        admin.initializeApp(); 
    }

    return admin.firestore();
}

const db = initializeFirestore();

module.exports = db;
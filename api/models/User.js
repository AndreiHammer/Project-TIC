const db = require('../db');
const { comparePassword } = require('../utils/jwtUtils');

const usersCollection = db.collection('users');

const findUserByEmail = async (email) => {
    const snapshot = await usersCollection.where('email', '==', email).get();
    if (snapshot.empty) {
        return null;
    }
    const userDoc = snapshot.docs[0];
    const user = {
        id: userDoc.id, 
        ...userDoc.data()
    };

    return user;
};

const findUserByUsername = async (username) => {
    const snapshot = await usersCollection.where('username', '==', username).get();
    if (snapshot.empty) {
        return null;
    }
    const userDoc = snapshot.docs[0];
    const user = {
        id: userDoc.id, 
        ...userDoc.data()
    };
    return user;
};

const verifyPassword = async (plainPassword, hashedPassword) => {
    return await comparePassword(plainPassword, hashedPassword);
};

const addNewUser = async (userData) => {
    const docRef = await usersCollection.add(userData);
    return docRef;
};

const updateLastLogin = async (userId) => {
    const currentTime = new Date().toISOString();
    const userRef = usersCollection.doc(userId);
    await userRef.update({
        'metadata.lastLogin': currentTime,
        'metadata.updatedAt': currentTime
    });
    return currentTime;
};

const findUserById = async (userId) => {
    const userDoc = await usersCollection.doc(userId).get();
    if (!userDoc.exists) {
        return null;
    }
    return {
        id: userDoc.id,
        ...userDoc.data()
    };
};

module.exports = {
    findUserByEmail,
    findUserByUsername,
    verifyPassword,
    addNewUser,
    updateLastLogin,
    findUserById
};

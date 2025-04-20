import { db } from './firebase.js';

// Quiz operations
export const quizService = {
    // Get all quizzes
    async getQuizzes() {
        const snapshot = await db.collection('quizzes').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Get quiz by ID
    async getQuizById(quizId) {
        const doc = await db.collection('quizzes').doc(quizId).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    // Get quizzes by category
    async getQuizzesByCategory(category) {
        const snapshot = await db.collection('quizzes')
            .where('category', '==', category)
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};

// Test operations
export const testService = {
    // Get all tests
    async getTests() {
        const snapshot = await db.collection('tests').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Get test by ID
    async getTestById(testId) {
        const doc = await db.collection('tests').doc(testId).get();
        return doc.exists ? { id: doc.id, ...doc.data() } : null;
    },

    // Save test results
    async saveTestResult(userId, testId, resultData) {
        const resultRef = await db.collection('results').add({
            userId,
            testId,
            ...resultData,
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        return resultRef.id;
    }
};

// User operations
export const userService = {
    // Get user profile
    async getUserProfile(userId) {
        const doc = await db.collection('users').doc(userId).get();
        return doc.exists ? doc.data() : null;
    },

    // Update user profile
    async updateUserProfile(userId, profileData) {
        await db.collection('users').doc(userId).set(profileData, { merge: true });
    },

    // Get user test history
    async getUserTestHistory(userId) {
        const snapshot = await db.collection('results')
            .where('userId', '==', userId)
            .orderBy('completedAt', 'desc')
            .get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
};

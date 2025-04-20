import { auth } from './firebase.js';

// Sign up function
export async function signUp(email, password, name) {
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        await userCredential.user.updateProfile({
            displayName: name
        });
        return userCredential.user;
    } catch (error) {
        throw error;
    }
}

// Sign in function
export async function signIn(email, password) {
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        return userCredential.user;
    } catch (error) {
        throw error;
    }
}

// Password reset
export async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
    } catch (error) {
        throw error;
    }
}

// Auth state listener (for other pages)
export function initAuthStateListener() {
    auth.onAuthStateChanged(user => {
        const authButtons = document.getElementById('auth-buttons');
        const userProfile = document.getElementById('user-profile');
        
        if (user) {
            if (authButtons) authButtons.style.display = 'none';
            if (userProfile) userProfile.style.display = 'block';
        } else {
            if (authButtons) authButtons.style.display = 'block';
            if (userProfile) userProfile.style.display = 'none';
        }
    });
}

import { auth } from './firebase.js';

// DOM elements
const authNavItems = document.querySelectorAll('.auth-nav-item');
const userNavItems = document.querySelectorAll('.user-nav-item');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');

// Auth state listener
auth.onAuthStateChanged(user => {
    if (user) {
        // User is signed in
        authNavItems.forEach(item => item.style.display = 'none');
        userNavItems.forEach(item => item.style.display = 'block');
        userName.textContent = user.displayName || user.email;
        userAvatar.src = user.photoURL || 'https://via.placeholder.com/40';
    } else {
        // User is signed out
        authNavItems.forEach(item => item.style.display = 'block');
        userNavItems.forEach(item => item.style.display = 'none');
    }
});

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

// Sign out function
export async function signOut() {
    try {
        await auth.signOut();
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

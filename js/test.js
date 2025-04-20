import { auth, db } from './firebase.js';

// DOM Elements
const testsContainer = document.getElementById('tests-container');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const categoryFilter = document.getElementById('category-filter');
const difficultyFilter = document.getElementById('difficulty-filter');
const durationFilter = document.getElementById('duration-filter');
const resetFiltersBtn = document.getElementById('reset-filters');
const authButtons = document.getElementById('auth-buttons');
const userProfile = document.getElementById('user-profile');
const usernameSpan = document.getElementById('username');
const logoutBtn = document.getElementById('logout-btn');
const testPreviewModal = new bootstrap.Modal(document.getElementById('testPreviewModal'));
const startTestBtn = document.getElementById('startTestBtn');

// Global Variables
let currentUser = null;
let tests = [];
let filteredTests = [];

// Initialize the page
async function init() {
    // Check auth state
    auth.onAuthStateChanged(user => {
        currentUser = user;
        if (user) {
            // User is logged in
            authButtons.classList.add('d-none');
            userProfile.classList.remove('d-none');
            usernameSpan.textContent = user.displayName || user.email;
        } else {
            // User is logged out
            authButtons.classList.remove('d-none');
            userProfile.classList.add('d-none');
        }
    });

    // Load tests from Firestore
    await loadTests();
    
    // Set up event listeners
    setupEventListeners();
}

// Load tests from Firestore
async function loadTests() {
    try {
        testsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3">Loading tests...</p>
            </div>
        `;

        const snapshot = await db.collection('tests').get();
        tests = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderTests(tests);
    } catch (error) {
        console.error("Error loading tests:", error);
        testsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-danger">
                    Failed to load tests. Please try again later.
                </div>
            </div>
        `;
    }
}

// Render tests to the page
function renderTests(testsToRender) {
    if (testsToRender.length === 0) {
        testsContainer.innerHTML = `
            <div class="col-12 text-center py-5">
                <div class="alert alert-info">
                    No tests found matching your criteria.
                </div>
            </div>
        `;
        return;
    }

    testsContainer.innerHTML = '';
    
    testsToRender.forEach(test => {
        const testCard = document.createElement('div');
        testCard.className = 'col-md-6 col-lg-4 mb-4';
        testCard.innerHTML = `
            <div class="card h-100 test-card">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">${test.title}</h5>
                </div>
                <div class="card-body">
                    <p class="card-text">${test.description || 'No description available'}</p>
                    <div class="d-flex justify-content-between mb-2">
                        <span class="badge bg-secondary">${test.category || 'General'}</span>
                        <span class="badge bg-${getDifficultyBadgeColor(test.difficulty)}">
                            ${test.difficulty || 'Medium'}
                        </span>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <span><i class="bi bi-clock me-1"></i> ${test.duration || 'N/A'}</span>
                        <span><i class="bi bi-question-circle me-1"></i> ${test.questions?.length || 0} Qs</span>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-outline-primary btn-sm me-2 preview-btn" data-test-id="${test.id}">
                        Preview
                    </button>
                    <a href="/test.html?id=${test.id}" class="btn btn-primary btn-sm">
                        Start Test
                    </a>
                </div>
            </div>
        `;
        testsContainer.appendChild(testCard);
    });

    // Add event listeners to preview buttons
    document.querySelectorAll('.preview-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const testId = e.target.dataset.testId;
            await showTestPreview(testId);
        });
    });
}

// Show test preview in modal
async function showTestPreview(testId) {
    try {
        const testDoc = await db.collection('tests').doc(testId).get();
        if (!testDoc.exists) {
            alert('Test not found!');
            return;
        }

        const test = testDoc.data();
        document.getElementById('testPreviewTitle').textContent = test.title;
        
        // Build preview content
        let previewContent = `
            <p><strong>Description:</strong> ${test.description || 'No description'}</p>
            <p><strong>Category:</strong> ${test.category || 'General'}</p>
            <p><strong>Difficulty:</strong> ${test.difficulty || 'Medium'}</p>
            <p><strong>Duration:</strong> ${test.duration || 'N/A'}</p>
            <p><strong>Questions:</strong> ${test.questions?.length || 0}</p>
        `;

        if (test.instructions) {
            previewContent += `
                <div class="mt-3">
                    <h6>Instructions:</h6>
                    <p>${test.instructions}</p>
                </div>
            `;
        }

        document.getElementById('testPreviewContent').innerHTML = previewContent;
        startTestBtn.href = `/test.html?id=${testId}`;
        testPreviewModal.show();
    } catch (error) {
        console.error("Error loading test preview:", error);
        alert('Failed to load test preview');
    }
}

// Filter tests based on search and filters
function filterTests() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;
    const difficulty = difficultyFilter.value;
    const duration = durationFilter.value;

    filteredTests = tests.filter(test => {
        // Search filter
        const matchesSearch = 
            test.title.toLowerCase().includes(searchTerm) ||
            (test.description && test.description.toLowerCase().includes(searchTerm)) ||
            (test.category && test.category.toLowerCase().includes(searchTerm));
        
        // Category filter
        const matchesCategory = category === 'all' || test.category === category;
        
        // Difficulty filter
        const matchesDifficulty = difficulty === 'all' || 
            (test.difficulty && test.difficulty.toLowerCase() === difficulty);
        
        // Duration filter (simplified example)
        let matchesDuration = true;
        if (duration !== 'all' && test.duration) {
            const durationMins = parseInt(test.duration);
            if (duration === 'short') matchesDuration = durationMins < 30;
            else if (duration === 'medium') matchesDuration = durationMins >= 30 && durationMins <= 60;
            else if (duration === 'long') matchesDuration = durationMins > 60;
        }
        
        return matchesSearch && matchesCategory && matchesDifficulty && matchesDuration;
    });

    renderTests(filteredTests);
}

// Helper function to get badge color based on difficulty
function getDifficultyBadgeColor(difficulty) {
    if (!difficulty) return 'secondary';
    
    const diffLower = difficulty.toLowerCase();
    if (diffLower.includes('easy')) return 'success';
    if (diffLower.includes('medium')) return 'warning';
    if (diffLower.includes('hard')) return 'danger';
    return 'secondary';
}

// Set up event listeners
function setupEventListeners() {
    // Search and filter events
    searchBtn.addEventListener('click', filterTests);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') filterTests();
    });
    
    categoryFilter.addEventListener('change', filterTests);
    difficultyFilter.addEventListener('change', filterTests);
    durationFilter.addEventListener('change', filterTests);
    resetFiltersBtn.addEventListener('click', resetFilters);
    
    // Auth events
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = '/';
            });
        });
    }
}

// Reset all filters
function resetFilters() {
    searchInput.value = '';
    categoryFilter.value = 'all';
    difficultyFilter.value = 'all';
    durationFilter.value = 'all';
    filterTests();
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

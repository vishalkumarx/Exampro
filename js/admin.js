 import { auth, db } from './firebase.js';

// DOM Elements
const testForm = document.getElementById('testForm');
const questionsContainer = document.getElementById('questionsContainer');
const addQuestionBtn = document.getElementById('addQuestionBtn');
const importJsonBtn = document.getElementById('importJsonBtn');
const jsonFileInput = document.getElementById('jsonFileInput');
const previewTestBtn = document.getElementById('previewTestBtn');
const submitTestBtn = document.getElementById('submitTestBtn');
const submitBtnText = document.getElementById('submitBtnText');
const submitSpinner = document.getElementById('submitSpinner');
const logoutBtn = document.getElementById('logoutBtn');
const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));

// Templates
const questionTemplate = document.getElementById('questionTemplate');
const optionTemplate = document.getElementById('optionTemplate');

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Check admin auth status
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = '/auth.html?mode=login';
        }
        // Add additional admin role check here if needed
    });

    // Set up event listeners
    addQuestionBtn.addEventListener('click', addNewQuestion);
    importJsonBtn.addEventListener('click', () => jsonFileInput.click());
    jsonFileInput.addEventListener('change', handleJsonImport);
    previewTestBtn.addEventListener('click', previewTest);
    testForm.addEventListener('submit', saveTest);
    logoutBtn.addEventListener('click', () => auth.signOut().then(() => window.location.href = '/'));
});

// Add a new empty question
function addNewQuestion() {
    const questionCount = questionsContainer.querySelectorAll('.question-card').length;
    const newQuestion = questionTemplate.cloneNode(true);
    newQuestion.classList.remove('d-none');
    newQuestion.querySelector('.question-number').textContent = questionCount + 1;
    
    // Set up delete button
    newQuestion.querySelector('.delete-question').addEventListener('click', () => {
        newQuestion.remove();
        updateQuestionNumbers();
    });
    
    // Set up add option button
    newQuestion.querySelector('.add-option').addEventListener('click', () => {
        addNewOption(newQuestion);
    });
    
    questionsContainer.appendChild(newQuestion);
    updateQuestionNumbers();
    
    // Remove the "no questions" message if present
    const infoAlert = questionsContainer.querySelector('.alert');
    if (infoAlert) infoAlert.remove();
}

// Add a new option to a question
function addNewOption(questionElement) {
    const optionsContainer = questionElement.querySelector('.options-container');
    const correctAnswerSelect = questionElement.querySelector('.correct-answer');
    const newOption = optionTemplate.cloneNode(true);
    newOption.classList.remove('d-none');
    
    // Set up delete button
    newOption.querySelector('.delete-option').addEventListener('click', () => {
        newOption.remove();
        updateCorrectAnswerOptions(questionElement);
    });
    
    optionsContainer.appendChild(newOption);
    
    // Add option to correct answer dropdown
    updateCorrectAnswerOptions(questionElement);
}

// Update correct answer dropdown options
function updateCorrectAnswerOptions(questionElement) {
    const correctAnswerSelect = questionElement.querySelector('.correct-answer');
    const options = questionElement.querySelectorAll('.option-text');
    
    // Save current selection
    const currentValue = correctAnswerSelect.value;
    
    // Clear and rebuild options
    correctAnswerSelect.innerHTML = '<option value="">Select correct option</option>';
    
    options.forEach((option, index) => {
        const optionElement = document.createElement('option');
        optionElement.value = index;
        optionElement.textContent = option.value || `Option ${index + 1}`;
        correctAnswerSelect.appendChild(optionElement);
    });
    
    // Restore selection if still valid
    if (currentValue && currentValue < options.length) {
        correctAnswerSelect.value = currentValue;
    }
}

// Update question numbers
function updateQuestionNumbers() {
    const questions = questionsContainer.querySelectorAll('.question-card');
    questions.forEach((question, index) => {
        question.querySelector('.question-number').textContent = index + 1;
    });
}

// Handle JSON file import
function handleJsonImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            importQuestionsFromJson(data);
        } catch (error) {
            alert('Error parsing JSON file: ' + error.message);
        }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

// Import questions from JSON data
function importQuestionsFromJson(data) {
    // Clear existing questions
    questionsContainer.innerHTML = '';
    
    // Validate JSON structure
    if (!Array.isArray(data)) {
        alert('JSON should contain an array of questions');
        return;
    }
    
    // Add each question
    data.forEach((questionData, index) => {
        addNewQuestion();
        const questionElements = questionsContainer.querySelectorAll('.question-card');
        const currentQuestion = questionElements[questionElements.length - 1];
        
        // Set question text
        currentQuestion.querySelector('.question-text').value = questionData.text || '';
        
        // Set options
        const optionsContainer = currentQuestion.querySelector('.options-container');
        optionsContainer.innerHTML = '';
        
        if (Array.isArray(questionData.options)) {
            questionData.options.forEach(option => {
                addNewOption(currentQuestion);
                const optionElements = optionsContainer.querySelectorAll('.option-text');
                optionElements[optionElements.length - 1].value = option;
            });
        }
        
        // Set correct answer
        if (questionData.correctAnswer !== undefined) {
            currentQuestion.querySelector('.correct-answer').value = questionData.correctAnswer;
        }
        
        // Set explanation
        if (questionData.explanation) {
            currentQuestion.querySelector('.explanation').value = questionData.explanation;
        }
    });
}

// Preview test before saving
function previewTest() {
    const testData = collectTestData();
    
    if (!testData.questions || testData.questions.length === 0) {
        alert('Please add at least one question');
        return;
    }
    
    document.getElementById('previewModalTitle').textContent = testData.title || 'Test Preview';
    
    let previewHtml = `
        <div class="mb-4">
            <h4>${testData.title || 'Untitled Test'}</h4>
            <p class="text-muted">${testData.description || 'No description'}</p>
            <div class="d-flex gap-3">
                <span class="badge bg-primary">${testData.category || 'Uncategorized'}</span>
                <span class="badge bg-secondary">${testData.difficulty || 'Medium'}</span>
                <span class="badge bg-info">${testData.duration} minutes</span>
            </div>
        </div>
        <hr>
        <h5 class="mb-3">Instructions</h5>
        <p>${testData.instructions || 'No instructions provided.'}</p>
        <hr>
        <h5 class="mb-3">Questions (${testData.questions.length})</h5>
    `;
    
    testData.questions.forEach((question, index) => {
        previewHtml += `
            <div class="card mb-3">
                <div class="card-body">
                    <h6>Question ${index + 1}</h6>
                    <p class="mb-3">${question.text}</p>
                    
                    <div class="mb-3">
                        <h6>Options:</h6>
                        <ul class="list-group">
                            ${question.options.map((option, i) => `
                                <li class="list-group-item ${i === question.correctAnswer ? 'list-group-item-success' : ''}">
                                    ${option}
                                    ${i === question.correctAnswer ? '<span class="badge bg-success float-end">Correct</span>' : ''}
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    
                    ${question.explanation ? `
                        <div class="alert alert-light">
                            <h6>Explanation:</h6>
                            <p>${question.explanation}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    document.getElementById('previewModalBody').innerHTML = previewHtml;
    previewModal.show();
}

// Collect all test data from the form
function collectTestData() {
    const questions = [];
    
    questionsContainer.querySelectorAll('.question-card').forEach(questionEl => {
        const options = [];
        questionEl.querySelectorAll('.option-text').forEach(optionEl => {
            options.push(optionEl.value);
        });
        
        questions.push({
            text: questionEl.querySelector('.question-text').value,
            options: options,
            correctAnswer: parseInt(questionEl.querySelector('.correct-answer').value),
            explanation: questionEl.querySelector('.explanation').value
        });
    });
    
    return {
        title: document.getElementById('testTitle').value,
        category: document.getElementById('testCategory').value,
        difficulty: document.getElementById('testDifficulty').value,
        duration: parseInt(document.getElementById('testDuration').value),
        passingScore: parseInt(document.getElementById('testPassingScore').value),
        description: document.getElementById('testDescription').value,
        instructions: document.getElementById('testInstructions').value,
        questions: questions,
        createdAt: new Date().toISOString()
    };
}

// Save test to Firestore
async function saveTest(e) {
    e.preventDefault();
    
    const testData = collectTestData();
    
    // Validate form
    if (!testData.title || !testData.category || !testData.difficulty || !testData.duration) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (testData.questions.length === 0) {
        alert('Please add at least one question');
        return;
    }
    
    // Validate all questions
    for (const question of testData.questions) {
        if (!question.text || question.options.length < 2 || isNaN(question.correctAnswer)) {
            alert('Each question must have text, at least 2 options, and a correct answer selected');
            return;
        }
    }
    
    // Show loading state
    submitBtnText.textContent = 'Saving...';
    submitSpinner.classList.remove('d-none');
    submitTestBtn.disabled = true;
    
    try {
        // Save to Firestore
        await db.collection('tests').add(testData);
        alert('Test saved successfully!');
        testForm.reset();
        questionsContainer.innerHTML = '<div class="alert alert-info">No questions added yet. Import from JSON or add manually.</div>';
    } catch (error) {
        console.error('Error saving test:', error);
        alert('Error saving test: ' + error.message);
    } finally {
        // Reset button state
        submitBtnText.textContent = 'Save Test';
        submitSpinner.classList.add('d-none');
        submitTestBtn.disabled = false;
    }
}

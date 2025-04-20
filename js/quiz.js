import { auth } from './firebase.js';
import { quizService } from './database.js';

// DOM elements
const quizContainer = document.getElementById('quiz-container');
const quizTimer = document.getElementById('quiz-timer');
const questionElement = document.getElementById('question');
const optionsContainer = document.getElementById('options-container');
const progressBar = document.getElementById('progress-bar');
const prevButton = document.getElementById('prev-btn');
const nextButton = document.getElementById('next-btn');
const submitButton = document.getElementById('submit-btn');
const reviewButton = document.getElementById('review-btn');

// Quiz state
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let timeLeft = 0;
let timerInterval = null;

// Initialize quiz
async function initQuiz(quizId) {
    currentQuiz = await quizService.getQuizById(quizId);
    if (!currentQuiz) {
        quizContainer.innerHTML = '<div class="alert alert-danger">Quiz not found</div>';
        return;
    }

    timeLeft = currentQuiz.timeLimit * 60;
    userAnswers = new Array(currentQuiz.questions.length).fill(null);
    
    renderQuestion();
    startTimer();
}

// Render current question
function renderQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    
    questionElement.textContent = question.text;
    optionsContainer.innerHTML = '';
    
    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = `form-check mb-3 ${userAnswers[currentQuestionIndex] === index ? 'selected-option' : ''}`;
        optionElement.innerHTML = `
            <input class="form-check-input" type="radio" name="quiz-option" 
                   id="option-${index}" value="${index}" 
                   ${userAnswers[currentQuestionIndex] === index ? 'checked' : ''}>
            <label class="form-check-label" for="option-${index}">${option}</label>
        `;
        optionElement.querySelector('input').addEventListener('change', () => {
            userAnswers[currentQuestionIndex] = index;
            optionElement.classList.add('selected-option');
        });
        optionsContainer.appendChild(optionElement);
    });
    
    updateProgress();
    updateNavigationButtons();
}

// Timer functions
function startTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitQuiz();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    quizTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 300) { // 5 minutes left
        quizTimer.classList.add('text-danger', 'fw-bold');
    }
}

// Navigation functions
function updateProgress() {
    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute('aria-valuenow', progress);
}

function updateNavigationButtons() {
    prevButton.disabled = currentQuestionIndex === 0;
    nextButton.disabled = currentQuestionIndex === currentQuiz.questions.length - 1;
}

function goToQuestion(index) {
    currentQuestionIndex = index;
    renderQuestion();
}

// Quiz submission
async function submitQuiz() {
    clearInterval(timerInterval);
    
    // Calculate score
    let score = 0;
    currentQuiz.questions.forEach((question, index) => {
        if (userAnswers[index] === question.correctAnswer) {
            score++;
        }
    });
    
    const percentage = Math.round((score / currentQuiz.questions.length) * 100);
    
    // Save result if user is logged in
    if (auth.currentUser) {
        try {
            await quizService.saveQuizResult(auth.currentUser.uid, currentQuiz.id, {
                score,
                percentage,
                answers: userAnswers,
                timeTaken: currentQuiz.timeLimit * 60 - timeLeft
            });
        } catch (error) {
            console.error("Error saving result:", error);
        }
    }
    
    // Show results
    quizContainer.innerHTML = `
        <div class="quiz-result text-center">
            <h3 class="mb-4">Quiz Completed!</h3>
            <div class="result-card p-4 mb-4 bg-light rounded">
                <h4 class="text-primary">${percentage}%</h4>
                <p>${score} out of ${currentQuiz.questions.length} correct</p>
                <p>Time taken: ${formatTime(currentQuiz.timeLimit * 60 - timeLeft)}</p>
            </div>
            <a href="/quizzes.html" class="btn btn-primary">Back to Quizzes</a>
        </div>
    `;
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
}

// Event listeners
prevButton.addEventListener('click', () => goToQuestion(currentQuestionIndex - 1));
nextButton.addEventListener('click', () => goToQuestion(currentQuestionIndex + 1));
reviewButton.addEventListener('click', () => {
    userAnswers[currentQuestionIndex] = 'review';
    goToQuestion(currentQuestionIndex + 1);
});
submitButton.addEventListener('click', submitQuiz);

// Initialize quiz when page loads
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');
    
    if (quizId) {
        initQuiz(quizId);
    } else {
        quizContainer.innerHTML = '<div class="alert alert-danger">No quiz specified</div>';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    // Quiz variables
    const totalQuestions = 15;
    let currentQuestion = 1;
    let timeLeft = 30 * 60; // 30 minutes in seconds
    let timerInterval;
    let quizData = []; // This would be loaded from an API in a real app
    
    // DOM elements
    const quizTimer = document.getElementById('quiz-timer');
    const currentQuestionDisplay = document.getElementById('current-question');
    const questionNavBtns = document.getElementById('question-nav-btns');
    const mobileQuestionNavBtns = document.getElementById('mobile-question-nav-btns');
    const prevQuestionBtn = document.getElementById('prev-question');
    const nextQuestionBtn = document.getElementById('next-question');
    const markReviewBtn = document.getElementById('mark-review-btn');
    const endQuizBtn = document.getElementById('end-quiz-btn');
    const confirmEndQuizBtn = document.getElementById('confirm-end-quiz');
    const endQuizModal = new bootstrap.Modal(document.getElementById('endQuizModal'));
    const quizResultsModal = new bootstrap.Modal(document.getElementById('quizResultsModal'));
    
    // Initialize the quiz
    function initQuiz() {
        // Start timer
        startTimer();
        
        // Create question navigation buttons
        createQuestionNavButtons();
        
        // Load first question
        loadQuestion(currentQuestion);
    }
    
    // Start the quiz timer
    function startTimer() {
        updateTimerDisplay();
        timerInterval = setInterval(function() {
            timeLeft--;
            updateTimerDisplay();
            
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                endQuiz();
            }
        }, 1000);
    }
    
    // Update the timer display
    function updateTimerDisplay() {
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        quizTimer.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Change color when time is running low
        if (timeLeft <= 5 * 60) { // 5 minutes left
            quizTimer.classList.add('text-danger');
            quizTimer.classList.add('fw-bold');
        }
    }
    
    // Create navigation buttons for all questions
    function createQuestionNavButtons() {
        questionNavBtns.innerHTML = '';
        mobileQuestionNavBtns.innerHTML = '';
        
        for (let i = 1; i <= totalQuestions; i++) {
            const btn = document.createElement('button');
            btn.className = 'btn btn-sm btn-outline-secondary question-nav-btn';
            btn.textContent = i;
            btn.dataset.question = i;
            
            const mobileBtn = btn.cloneNode(true);
            
            btn.addEventListener('click', function() {
                navigateToQuestion(parseInt(this.dataset.question));
            });
            
            mobileBtn.addEventListener('click', function() {
                navigateToQuestion(parseInt(this.dataset.question));
            });
            
            questionNavBtns.appendChild(btn);
            mobileQuestionNavBtns.appendChild(mobileBtn);
        }
    }
    
    // Load a specific question
    function loadQuestion(questionNumber) {
        // In a real app, this would fetch question data from an API
        currentQuestion = questionNumber;
        currentQuestionDisplay.textContent = currentQuestion;
        
        // Update active state of navigation buttons
        document.querySelectorAll('.question-nav-btn').forEach(btn => {
            if (parseInt(btn.dataset.question) === currentQuestion) {
                btn.classList.remove('btn-outline-secondary');
                btn.classList.add('btn-primary');
            } else {
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-outline-secondary');
            }
        });
        
        // Update previous/next buttons
        prevQuestionBtn.disabled = currentQuestion === 1;
        nextQuestionBtn.disabled = currentQuestion === totalQuestions;
        
        // Scroll to top of question (for mobile)
        window.scrollTo(0, 0);
    }
    
    // Navigate to a specific question
    function navigateToQuestion(questionNumber) {
        // Save current answer before navigating away
        saveAnswer();
        loadQuestion(questionNumber);
    }
    
    // Save the current answer
    function saveAnswer() {
        // In a real app, this would save to the server
        const selectedOption = document.querySelector('input[name="quiz-question"]:checked');
        if (selectedOption) {
            console.log(`Saved answer for question ${currentQuestion}: ${selectedOption.id}`);
        }
    }
    
    // Mark current question for review
    function markForReview() {
        const currentBtn = document.querySelector(`.question-nav-btn[data-question="${currentQuestion}"]`);
        if (currentBtn.classList.contains('btn-warning')) {
            currentBtn.classList.remove('btn-warning');
            currentBtn.classList.add('btn-outline-secondary');
            markReviewBtn.innerHTML = '<i class="bi bi-bookmark me-1"></i>Mark for Review';
        } else {
            currentBtn.classList.remove('btn-outline-secondary');
            currentBtn.classList.add('btn-warning');
            markReviewBtn.innerHTML = '<i class="bi bi-bookmark-check-fill me-1"></i>Marked for Review';
        }
    }
    
    // End the quiz
    function endQuiz() {
        clearInterval(timerInterval);
        saveAnswer();
        quizResultsModal.show();
    }
    
    // Event listeners
    prevQuestionBtn.addEventListener('click', function() {
        navigateToQuestion(currentQuestion - 1);
    });
    
    nextQuestionBtn.addEventListener('click', function() {
        navigateToQuestion(currentQuestion + 1);
    });
    
    markReviewBtn.addEventListener('click', markForReview);
    
    endQuizBtn.addEventListener('click', function() {
        endQuizModal.show();
    });
    
    confirmEndQuizBtn.addEventListener('click', endQuiz);
    
    // Initialize the quiz
    initQuiz();
});

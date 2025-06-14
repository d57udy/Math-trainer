document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const views = {
        mainMenu: document.getElementById('main-menu-view'),
        game: document.getElementById('game-view'),
        settings: document.getElementById('settings-view'),
        trainingList: document.getElementById('training-list-view'),
        scoreSummary: document.getElementById('score-summary-view'),
        achievements: document.getElementById('achievements-view')
    };

    // Main Menu Buttons
    const startRegularGameBtn = document.getElementById('start-regular-game-btn');
    const startTrainingModeBtn = document.getElementById('start-training-mode-btn');
    const viewTrainingListBtn = document.getElementById('view-training-list-btn');
    const settingsBtn = document.getElementById('settings-btn');

    // Settings View Elements
    const settingsForm = document.getElementById('settings-form');
    const opCheckboxes = document.querySelectorAll('input[name="op"]');
    const minRangeInput = document.getElementById('min-range');
    const maxRangeInput = document.getElementById('max-range');
    const allowNegativesCheckbox = document.getElementById('allow-negatives');
    const allowFractionsCheckbox = document.getElementById('allow-fractions');
    const allowDecimalsCheckbox = document.getElementById('allow-decimals');
    const timerDurationMinInput = document.getElementById('timer-duration-min');
    const timerDurationSecInput = document.getElementById('timer-duration-sec');
    const requiredCorrectSolvesInput = document.getElementById('required-correct-solves');
    const resetAchievementsBtn = document.getElementById('reset-achievements-btn');
    const resetHistoryBtn = document.getElementById('reset-history-btn');
    const opError = document.getElementById('op-error');
    const rangeError = document.getElementById('range-error');
    const timerDurationError = document.getElementById('timer-duration-error');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const backToMenuFromSettingsBtn = document.getElementById('back-to-menu-from-settings-btn');

    // Game View Elements
    const timerDisplay = document.getElementById('timer-display');
    const scoreDisplay = document.getElementById('score-display');
    const equationDisplay = document.getElementById('equation-display');
    const awardIndicator = document.getElementById('award-indicator');
    const answerInput = document.getElementById('answer-input');
    const submitAnswerBtn = document.getElementById('submit-answer-btn');
    const feedbackDisplay = document.getElementById('feedback-display');
    const quitGameBtn = document.getElementById('quit-game-btn');
    const skipEquationBtn = document.getElementById('skip-equation-btn');
    const gameAchievementsList = document.getElementById('game-achievements-list');
    const unlockedAchievementsList = document.getElementById('unlocked-achievements-list');

    // Training List View Elements
    const equationsToTrainListUl = document.getElementById('equations-to-train-list');
    const trainingListEmptyMsg = document.getElementById('training-list-empty-message');
    const startTrainingFromListBtn = document.getElementById('start-training-from-list-btn');
    const backToMenuFromTrainingListBtn = document.getElementById('back-to-menu-from-training-list-btn');

    // Score Summary View Elements
    const finalScoreSpan = document.getElementById('final-score');
    const playAgainBtn = document.getElementById('play-again-btn');
    const backToMenuFromScoreBtn = document.getElementById('back-to-menu-from-score-btn');

    // Achievements View Elements
    const viewAchievementsBtn = document.getElementById('view-achievements-btn');
    const backToMenuFromAchievementsBtn = document.getElementById('back-to-menu-from-achievements-btn');
    const achievementsList = document.getElementById('achievements-list');
    const calculationsHistory = document.getElementById('calculations-history');

    // --- State Variables ---
    let currentSettings = {};
    let progressData = {}; // { "equationString": { correctCount: 0, fastestTime: null, currentAward: 'None' } }
    let trainingList = JSON.parse(localStorage.getItem('trainingList') || '[]');
    let trainingListProgress = JSON.parse(localStorage.getItem('trainingListProgress') || '{}');
    let currentView = 'mainMenu';
    let gameTimerInterval = null;
    let timeLeft = 0;
    let currentScore = 0;
    let currentGameMode = null; // 'regular' or 'training'
    let currentEquation = null;
    let equationsInCurrentTrainingSession = [];
    let equationStartTime = null; // Added for timing
    let currentStreak = 0;
    let lastAnswerTime = 0;
    let achievements = JSON.parse(localStorage.getItem('achievements') || '{}');
    // Session-specific stats
    let totalEquationsPresented = 0;
    let incorrectAnswersCount = 0;
    let sessionAchievements = new Set();
    let calculationHistory = []; // Keep for now, will be replaced
    let isGameOver = false; // Declare the isGameOver flag
    let isAnswerSubmitted = false; // Flag to prevent multiple submissions
    const MAX_HISTORY_ITEMS = 50; // Keep last 50 calculations - NOW MAX SESSIONS
    const MAX_SESSIONS_TO_KEEP = 20; // Maximum number of sessions to store

    const SETTINGS_STORAGE_KEY = 'mathTrainerSettings';
    const PROGRESS_STORAGE_KEY = 'mathTrainerProgress';
    const TRAINING_LIST_STORAGE_KEY = 'mathTrainerTrainingList';
    // const HISTORY_STORAGE_KEY = 'mathTrainerHistory'; // Old key
    const SESSION_HISTORY_STORAGE_KEY = 'mathTrainerSessionHistory'; // New key for sessions

    // New state variables for session tracking
    let gameSessionHistory = []; // Array of session objects
    let currentSessionData = null; // Holds data for the currently active game

    // --- Award Constants ---
    const AWARD_THRESHOLDS = {
        SILVER: 3,
        GOLD: 10,
        DIAMOND: 25
    };
    const AWARD_SYMBOLS = {
        None: '',
        Silver: '🥈',
        Gold: '🥇',
        Diamond: '💎'
    };

    // Define sound file paths (adjust extensions if needed)
    const SOUND_FILES = {
        correct: 'sounds/correct.mp3',
        incorrect: 'sounds/incorrect.mp3',
        achievement: 'sounds/achievement.mp3',
        gameOver: 'sounds/gameOver.mp3',
        click: 'sounds/click.mp3',
        start: 'sounds/start.mp3',
        skip: 'sounds/skip.mp3'
    };

    // Simple reusable function to play a sound
    function playSound(soundName) {
        console.log(`[playSound] Playing sound: ${soundName} (${SOUND_FILES[soundName] || 'File not defined'})`); // Add log
        if (SOUND_FILES[soundName]) {
            try {
                const audio = new Audio(SOUND_FILES[soundName]);
                audio.play().catch(error => console.log(`Playback failed for ${soundName}:`, error)); // Restore original play call
            } catch (error) {
                console.error(`Error loading sound ${soundName}:`, error);
            }
        } else {
            console.warn(`Sound not defined: ${soundName}`);
        }
    }

    // Enhanced Achievement System
    const ACHIEVEMENTS = {
        SPEED_DEMON: {
            id: 'speed_demon',
            title: '⚡ Speed Demon',
            description: 'Solve an equation in under 2 seconds!',
            icon: '⚡',
            threshold: 2,
            type: 'time'
        },
        PERFECT_STREAK: {
            id: 'perfect_streak',
            title: '🔥 Perfect Streak',
            description: 'Get 5 correct answers in a row!',
            icon: '🔥',
            threshold: 5,
            type: 'streak'
        },
        MATH_WIZARD: {
            id: 'math_wizard',
            title: '🧙‍♂️ Math Wizard',
            description: 'Solve 50 equations correctly!',
            icon: '🧙‍♂️',
            threshold: 50,
            type: 'total'
        },
        DIVISION_MASTER: {
            id: 'division_master',
            title: '➗ Division Master',
            description: 'Solve 20 division problems correctly!',
            icon: '➗',
            threshold: 20,
            type: 'operation',
            operation: 'div'
        },
        // New Achievement Categories
        OPERATION_MASTERS: {
            ADDITION_MASTER: {
                id: 'addition_master',
                title: '➕ Addition Master',
                description: 'Solve 30 addition problems correctly!',
                icon: '➕',
                threshold: 30,
                type: 'operation',
                operation: 'add'
            },
            SUBTRACTION_MASTER: {
                id: 'subtraction_master',
                title: '➖ Subtraction Master',
                description: 'Solve 30 subtraction problems correctly!',
                icon: '➖',
                threshold: 30,
                type: 'operation',
                operation: 'sub'
            },
            MULTIPLICATION_MASTER: {
                id: 'multiplication_master',
                title: '✖️ Multiplication Master',
                description: 'Solve 30 multiplication problems correctly!',
                icon: '✖️',
                threshold: 30,
                type: 'operation',
                operation: 'mul'
            }
        },
        SPEED_ACHIEVEMENTS: {
            LIGHTNING_FAST: {
                id: 'lightning_fast',
                title: '⚡ Lightning Fast',
                description: 'Solve an equation in under 1 second!',
                icon: '⚡',
                threshold: 1,
                type: 'time'
            },
            CONSISTENT_SPEED: {
                id: 'consistent_speed',
                title: '🏃 Consistent Speed',
                description: 'Solve 5 equations in under 3 seconds each!',
                icon: '🏃',
                threshold: 5,
                type: 'speed_streak'
            }
        },
        STREAK_ACHIEVEMENTS: {
            UNSTOPPABLE: {
                id: 'unstoppable',
                title: '💪 Unstoppable',
                description: 'Get 10 correct answers in a row!',
                icon: '💪',
                threshold: 10,
                type: 'streak'
            },
            PERFECTIONIST: {
                id: 'perfectionist',
                title: '🎯 Perfectionist',
                description: 'Get 20 correct answers in a row!',
                icon: '🎯',
                threshold: 20,
                type: 'streak'
            }
        },
        TRAINING_ACHIEVEMENTS: {
            DEDICATED_LEARNER: {
                id: 'dedicated_learner',
                title: '📚 Dedicated Learner',
                description: 'Complete 20 equations from your training list!',
                icon: '📚',
                threshold: 20,
                type: 'training_total'
            },
            MASTERY: {
                id: 'mastery',
                title: '🏆 Mastery',
                description: 'Master 10 equations (solve them correctly the required number of times)!',
                icon: '🏆',
                threshold: 10,
                type: 'mastered_equations'
            }
        },
        SPECIAL_ACHIEVEMENTS: {
            NEGATIVE_NINJA: {
                id: 'negative_ninja',
                title: '🕶️ Negative Ninja',
                description: 'Solve 20 negative number problems correctly!',
                icon: '🕶️',
                threshold: 20,
                type: 'negative_total'
            },
            LARGE_NUMBER_WIZARD: {
                id: 'large_number_wizard',
                title: '🔢 Large Number Wizard',
                description: 'Solve 20 problems with numbers greater than 100!',
                icon: '🔢',
                threshold: 20,
                type: 'large_number_total'
            }
        }
    };

    // Helper function to recursively initialize achievements
    function initializeAchievements(achievementObj) {
        Object.entries(achievementObj).forEach(([key, value]) => {
            if (typeof value === 'object' && !value.id) {
                // This is a category of achievements
                initializeAchievements(value);
            } else if (value.id) {
                // This is an achievement
                achievements[value.id] = {
                    unlocked: false,
                    progress: 0
                };
            }
        });
    }

    // Initialize achievements if not exists
    if (Object.keys(achievements).length === 0) {
        // Initialize all achievements, including nested ones
        initializeAchievements(ACHIEVEMENTS);
        saveAchievements();
    }

    function saveAchievements() {
        localStorage.setItem('achievements', JSON.stringify(achievements));
    }

    function checkAchievements(isCorrect) {
        // Flatten the nested achievement structure
        const flatAchievements = {};
        Object.entries(ACHIEVEMENTS).forEach(([category, value]) => {
            if (typeof value === 'object' && !value.id) {
                // This is a category of achievements
                Object.entries(value).forEach(([key, achievement]) => {
                    flatAchievements[achievement.id] = achievement;
                });
            } else {
                // This is a single achievement
                flatAchievements[value.id] = value;
            }
        });

        Object.entries(flatAchievements).forEach(([id, achievement]) => {
            if (!achievements[id] || !achievements[id].unlocked) {
                let shouldUnlock = false;
                
                switch (achievement.type) {
                    case 'time':
                        // Only unlock if correct AND fast
                        shouldUnlock = isCorrect && lastAnswerTime <= achievement.threshold;
                        break;
                    case 'streak':
                        // Streak logic is handled outside based on isCorrect, just check threshold
                        shouldUnlock = currentStreak >= achievement.threshold;
                        break;
                    case 'total':
                        // Only increment progress if correct
                        if (isCorrect) {
                            achievements[id].progress = (achievements[id].progress || 0) + 1;
                            shouldUnlock = achievements[id].progress >= achievement.threshold;
                        }
                        break;
                    case 'operation':
                        // Only increment progress if correct and operation matches
                        if (isCorrect && currentEquation && currentEquation.operator === achievement.operation) {
                            achievements[id].progress = (achievements[id].progress || 0) + 1;
                            shouldUnlock = achievements[id].progress >= achievement.threshold;
                        }
                        break;
                    case 'speed_streak':
                        // Ensure speedStreak exists and initialize if not
                        if (!achievements[id].hasOwnProperty('speedStreak')) {
                            achievements[id].speedStreak = 0;
                        }
                        // Only increment streak if correct AND fast. Reset if incorrect OR slow.
                        if (isCorrect && lastAnswerTime <= 3) { // 3 seconds threshold
                            achievements[id].speedStreak++;
                            shouldUnlock = achievements[id].speedStreak >= achievement.threshold;
                        } else {
                            achievements[id].speedStreak = 0; // Reset if incorrect or too slow
                        }
                        break;
                    case 'training_total':
                        // Only increment progress if correct AND in training mode
                        if (isCorrect && currentGameMode === 'training') {
                            achievements[id].progress = (achievements[id].progress || 0) + 1;
                            shouldUnlock = achievements[id].progress >= achievement.threshold;
                        }
                        break;
                    case 'mastered_equations':
                        // This relies on trainingListProgress which is only updated on correct answers
                        const settings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
                        const requiredSolves = settings.requiredCorrectSolves || defaultSettings.requiredCorrectSolves;
                        achievements[id].progress = Object.values(trainingListProgress)
                            .filter(progress => progress >= requiredSolves).length;
                        shouldUnlock = achievements[id].progress >= achievement.threshold;
                        break;
                    case 'negative_total':
                        // Only increment progress if correct AND involves negative numbers
                        if (isCorrect && currentEquation && 
                            (currentEquation.operand1 < 0 || currentEquation.operand2 < 0 || 
                             currentEquation.correctResult < 0)) {
                            achievements[id].progress = (achievements[id].progress || 0) + 1;
                            shouldUnlock = achievements[id].progress >= achievement.threshold;
                        }
                        break;
                    case 'large_number_total':
                         // Only increment progress if correct AND involves large numbers
                        if (isCorrect && currentEquation && 
                            (Math.abs(currentEquation.operand1) > 100 || 
                             Math.abs(currentEquation.operand2) > 100 || 
                             Math.abs(currentEquation.correctResult) > 100)) {
                            achievements[id].progress = (achievements[id].progress || 0) + 1;
                            shouldUnlock = achievements[id].progress >= achievement.threshold;
                        }
                        break;
                }

                if (shouldUnlock) {
                    unlockAchievement(id);
                }
            }
        });
        saveAchievements();
    }

    function unlockAchievement(id) {
        if (!achievements[id]) {
            console.error(`Attempted to unlock non-existent achievement: ${id}`);
            // Try to re-initialize if structure is missing
            if (Object.keys(achievements).length === 0) {
                initializeAchievements(ACHIEVEMENTS);
            } else { // If partially initialized, just add this one
                achievements[id] = { unlocked: false, progress: 0 };
            }
            // If still not found after potential init, something is wrong
            if (!achievements[id]) return;
        }
        if (!achievements[id].unlocked) { // Check if already unlocked in general
            achievements[id].unlocked = true;
            sessionAchievements.add(id); // Add to session unlocks

            // Find the achievement object in the nested structure
            let achievementObj = null;
            Object.entries(ACHIEVEMENTS).forEach(([category, value]) => {
                if (typeof value === 'object' && !value.id) {
                    // This is a category of achievements
                    Object.entries(value).forEach(([key, achievement]) => {
                        if (achievement.id === id) {
                            achievementObj = achievement;
                        }
                    });
                } else if (value.id === id) {
                    // This is a single achievement
                    achievementObj = value;
                }
            });

            if (achievementObj) {
                showAchievementPopup(achievementObj);
                playSound('achievement');
                // Update the unlocked achievements view when a new achievement is unlocked
                updateUnlockedAchievementsView();
            } else {
                console.error(`Achievement object not found for ID: ${id}`);
            }
        }
    }

    function showAchievementPopup(achievement) {
        const popup = document.getElementById('achievement-popup');
        if (!popup) return; // Safety check

        popup.querySelector('.achievement-icon').textContent = achievement.icon;
        popup.querySelector('.achievement-title').textContent = achievement.title;
        popup.querySelector('.achievement-description').textContent = achievement.description;

        // Remove animation class first if it exists
        popup.classList.remove('animate-achievement-popup');

        // Show the popup and trigger animation
        popup.classList.add('show'); // This now triggers the animation defined in CSS

        playSound('achievement');

        // Hide after duration
        setTimeout(() => {
            popup.classList.remove('show');
        }, 3500); // Slightly longer display time
    }

    // Enhanced Feedback System
    function showFeedback(isCorrect, correctAnswer) {
        const feedbackDisplay = document.getElementById('feedback-display');
        const gameView = document.getElementById('game-view'); // Get game view for shake

        feedbackDisplay.textContent = isCorrect ? '🎉 Correct!' : `❌ Try again! The answer is ${correctAnswer}`;
        feedbackDisplay.className = `feedback-display ${isCorrect ? 'feedback-correct' : 'feedback-incorrect'}`;

        // Remove previous animation classes
        feedbackDisplay.classList.remove('animate-correct-pulse', 'animate-incorrect-shake');
        gameView.classList.remove('animate-incorrect-shake'); // Remove shake from game view

        // Trigger animation
        void feedbackDisplay.offsetWidth; // Force reflow to restart animation

        if (isCorrect) {
            playSound('correct');
            feedbackDisplay.classList.add('animate-correct-pulse');
        } else {
            playSound('incorrect');
            gameView.classList.add('animate-incorrect-shake'); // Shake the whole game view slightly
            // feedbackDisplay.classList.add('animate-incorrect-shake'); // Optionally shake feedback text too
        }

        // Remove animation class after it finishes
        const animationDuration = isCorrect ? 500 : 400;
        setTimeout(() => {
            feedbackDisplay.classList.remove('animate-correct-pulse', 'animate-incorrect-shake');
            gameView.classList.remove('animate-incorrect-shake');
        }, animationDuration);

        // Update streak counter
        const streakCounter = document.getElementById('streak-counter');
        if (isCorrect) {
            currentStreak++;
            streakCounter.textContent = `🔥 ${currentStreak}`;
            streakCounter.classList.remove('animate-streak-pop'); // Remove class before adding
            void streakCounter.offsetWidth; // Reflow
            streakCounter.classList.add('active', 'animate-streak-pop'); // Add animation class
            setTimeout(() => streakCounter.classList.remove('animate-streak-pop'), 300); // Remove after animation
        } else {
            currentStreak = 0;
            document.getElementById('streak-counter').textContent = '🔥 0';
            streakCounter.classList.remove('active'); // Remove active class if streak breaks
        }

        // Check for achievements
        checkAchievements(isCorrect);
    }

    // --- Equation Generation (FR1) ---
    function generateEquation() {
        const { operations, minRange, maxRange, allowNegatives } = currentSettings;
        const availableOps = Object.entries(operations)
                               .filter(([_, isEnabled]) => isEnabled)
                               .map(([op, _]) => op); // ['add', 'sub', ...]

        if (availableOps.length === 0) {
            console.error("No operations enabled!");
            // Display an error to the user?
            return null; // Or throw an error
        }

        let op1, op2, operator, result, displayString;
        let attempts = 0;
        const MAX_ATTEMPTS = 100; // Prevent infinite loops for tricky settings

        while (attempts < MAX_ATTEMPTS) {
            attempts++;
            // 1. Choose Operator
            operator = availableOps[Math.floor(Math.random() * availableOps.length)];

            // 2. Choose Operands respecting range and negatives
            const rangeSize = maxRange - minRange + 1;
            op1 = minRange + Math.floor(Math.random() * rangeSize);
            op2 = minRange + Math.floor(Math.random() * rangeSize);

            if (!allowNegatives) {
                // Ensure operands are non-negative if negatives are disallowed
                // This might conflict with minRange < 0, but we prioritize the checkbox
                 if (op1 < 0) op1 = Math.abs(op1) % maxRange || 0; // Use modulo or make 0
                 if (op2 < 0) op2 = Math.abs(op2) % maxRange || 0;
                 // Re-check if they fall back into range after abs/modulo
                 if (op1 < minRange || op1 > maxRange) op1 = minRange + Math.floor(Math.random() * (maxRange - minRange + 1));
                 if (op2 < minRange || op2 > maxRange) op2 = minRange + Math.floor(Math.random() * (maxRange - minRange + 1));
            }


            // 3. Calculate Result & Handle Specific Operation Logic
            switch (operator) {
                case 'add':
                    result = op1 + op2;
                    displayString = `${op1} + ${op2} =`;
                    break;
                case 'sub':
                    result = op1 - op2;
                    displayString = `${op1} - ${op2} =`;
                    break;
                case 'mul':
                    result = op1 * op2;
                    displayString = `${op1} * ${op2} =`;
                    break;
                case 'div':
                    // Avoid division by zero
                    if (op2 === 0) continue; // Try generating a new equation

                    // Ensure integer result (FR1.8 for now)
                    if (op1 % op2 !== 0) continue; // Regenerate if not perfectly divisible

                    result = op1 / op2;
                    displayString = `${op1} / ${op2} =`;
                    break;
                default:
                    console.error("Invalid operator selected:", operator);
                    continue; // Try again
            }

            // 4. Validate Result (FR1.7)
            const isResultInRange = result >= minRange && result <= maxRange;
            const isResultNegativeOk = allowNegatives || result >= 0;

            if (isResultInRange && isResultNegativeOk) {
                 // Ensure generated operands are also valid under negative settings (edge case for subtraction)
                const isOp1NegativeOk = allowNegatives || op1 >= 0;
                const isOp2NegativeOk = allowNegatives || op2 >= 0;

                if(isOp1NegativeOk && isOp2NegativeOk) {
                     // Valid equation found!
                    return {
                        operand1: op1,
                        operand2: op2,
                        operator: operator, // 'add', 'sub', 'mul', 'div'
                        correctResult: result,
                        displayString: displayString
                    };
                }
                 // If operands became negative implicitly (e.g., 3 - 5) and negatives are off, regenerate.
                 // This check might be redundant given the result check, but better safe.
                 continue;
            }

            // If result is not valid, the loop continues to regenerate
        }

        console.warn(`Failed to generate a valid equation after ${MAX_ATTEMPTS} attempts. Check settings constraints (range, negatives, operations).`);
        // Consider returning a default equation or null/error
        return null;
    }

    // --- View Management ---
    function showView(viewId) {
        for (const key in views) {
            views[key].classList.remove('active');
        }
        if (views[viewId]) {
            views[viewId].classList.add('active');
            currentView = viewId;
        } else {
            console.error(`View with id '${viewId}' not found.`);
            views.mainMenu.classList.add('active'); // Fallback to main menu
            currentView = 'mainMenu';
        }
    }

    // --- Settings Management ---
    const defaultSettings = {
        operations: { add: true, sub: true, mul: false, div: false },
        minRange: 1,
        maxRange: 10,
        allowNegatives: false,
        allowFractions: false,
        allowDecimals: false,
        timerDuration: 600,
        requiredCorrectSolves: 2
    };

    function loadSettings() {
        const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            // Set operation checkboxes
            Object.entries(settings.operations).forEach(([op, isEnabled]) => {
                const checkbox = document.querySelector(`input[name="op"][value="${op}"]`);
                if (checkbox) checkbox.checked = isEnabled;
            });
            // Set number range
            minRangeInput.value = settings.minRange;
            maxRangeInput.value = settings.maxRange;
            // Set other options
            allowNegativesCheckbox.checked = settings.allowNegatives;
            allowFractionsCheckbox.checked = settings.allowFractions;
            allowDecimalsCheckbox.checked = settings.allowDecimals;
            // Set timer duration
            const minutes = Math.floor(settings.timerDuration / 60);
            const seconds = settings.timerDuration % 60;
            timerDurationMinInput.value = minutes;
            timerDurationSecInput.value = seconds;
            // Set required correct solves
            requiredCorrectSolvesInput.value = settings.requiredCorrectSolves || defaultSettings.requiredCorrectSolves;
        } else {
            // Apply default settings to the form if nothing is saved
            Object.entries(defaultSettings.operations).forEach(([op, isEnabled]) => {
                const checkbox = document.querySelector(`input[name="op"][value="${op}"]`);
                if (checkbox) checkbox.checked = isEnabled;
            });
            minRangeInput.value = defaultSettings.minRange;
            maxRangeInput.value = defaultSettings.maxRange;
            allowNegativesCheckbox.checked = defaultSettings.allowNegatives;
            const minutes = Math.floor(defaultSettings.timerDuration / 60);
            const seconds = defaultSettings.timerDuration % 60;
            timerDurationMinInput.value = minutes;
            timerDurationSecInput.value = seconds;
            requiredCorrectSolvesInput.value = defaultSettings.requiredCorrectSolves; // Apply default here too
        }
    }

    function saveSettings() {
        // Validation first
        const checkedOps = Array.from(opCheckboxes).filter(cb => cb.checked);
        if (checkedOps.length === 0) {
            opError.textContent = 'Please select at least one operation';
            return false; // Indicate failure
        } else {
            opError.textContent = ''; // Clear error
        }

        const minRange = parseInt(minRangeInput.value);
        const maxRange = parseInt(maxRangeInput.value);
        if (isNaN(minRange) || isNaN(maxRange) || minRange >= maxRange) {
            rangeError.textContent = 'Valid min/max range required (max > min)';
            return false; // Indicate failure
        } else {
            rangeError.textContent = ''; // Clear error
        }

        const minutes = parseInt(timerDurationMinInput.value) || 0;
        const seconds = parseInt(timerDurationSecInput.value) || 0;
        const totalSeconds = minutes * 60 + seconds;
        if (totalSeconds <= 0 || totalSeconds > 3600) { // Added upper bound check
            timerDurationError.textContent = 'Duration must be between 1 second and 60 minutes';
            return false; // Indicate failure
        } else {
            timerDurationError.textContent = ''; // Clear error
        }

        // Construct the settings object with operations as an object
        const operationsSettings = {};
        opCheckboxes.forEach(checkbox => {
            operationsSettings[checkbox.value] = checkbox.checked;
        });

        const settings = {
            operations: operationsSettings, // Save as {add: true, sub: true, ...}
            minRange: minRange,
            maxRange: maxRange,
            allowNegatives: allowNegativesCheckbox.checked,
            allowFractions: allowFractionsCheckbox.checked,
            allowDecimals: allowDecimalsCheckbox.checked,
            timerDuration: totalSeconds,
            requiredCorrectSolves: parseInt(requiredCorrectSolvesInput.value) || defaultSettings.requiredCorrectSolves
        };

        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
        // Provide user feedback
        // Maybe a small temporary message near the save button?
        console.log("Settings saved successfully."); 
        return true; // Indicate success
    }

    // --- Data Persistence (Placeholders) ---
    function loadProgressData() {
        const storedData = localStorage.getItem(PROGRESS_STORAGE_KEY);
        progressData = storedData ? JSON.parse(storedData) : {};
        // Update UI elements if needed (e.g., display total achievements, etc. - future)
    }

    function saveProgressData() {
        localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progressData));
    }

    function loadTrainingList() {
        const storedList = localStorage.getItem(TRAINING_LIST_STORAGE_KEY);
        trainingList = storedList ? JSON.parse(storedList) : [];
        updateTrainingListUI(); // Update count and list display
    }

    function saveTrainingList() {
        localStorage.setItem(TRAINING_LIST_STORAGE_KEY, JSON.stringify(trainingList));
        localStorage.setItem('trainingListProgress', JSON.stringify(trainingListProgress));
        updateTrainingListUI();
    }

    // --- UI Update Functions ---
    function updateTrainingListUI() {
        equationsToTrainListUl.innerHTML = ''; // Clear existing list

        if (trainingList.length === 0) {
            trainingListEmptyMsg.style.display = 'block';
            startTrainingFromListBtn.disabled = true;
        } else {
            trainingListEmptyMsg.style.display = 'none';
            startTrainingFromListBtn.disabled = false;
            trainingList.forEach(eqString => {
                const li = document.createElement('li');
                const progress = trainingListProgress[eqString] || 0;
                const settings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
                const requiredSolves = settings.requiredCorrectSolves || 3;
                li.textContent = `${eqString.replace(' = ?', '')} (${progress}/${requiredSolves})`;
                equationsToTrainListUl.appendChild(li);
            });
        }
    }

    // Function to format time in M:SS or SSs format
    function formatTime(totalSeconds) {
        if (totalSeconds < 0) totalSeconds = 0;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        if (minutes > 0) {
            return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
        } else {
            return `${seconds}s`;
        }
    }

    // --- Game Logic ---

    function startGame(mode) {
        console.log(`Starting game in ${mode} mode.`);
        
        // Play start sound
        playSound('start');

        isGameOver = false; // Reset game over flag
        isAnswerSubmitted = false; // Reset submission flag

        // Initialize current session data
        currentSessionData = {
            sessionId: Date.now(), // Simple unique ID for the session
            startTime: new Date().toISOString(),
            endTime: null,
            mode: mode,
            score: 0,
            totalEquations: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            skippedAnswers: 0,
            calculations: [] // Array to hold individual calculation objects within this session
        };

        // --- Robust Settings Loading for Game Logic ---
        currentSettings = { ...defaultSettings }; // Start with defaults

        // Explicitly clear any existing timer *before* setting a new one
        if (gameTimerInterval) {
            console.log('[startGame] Clearing existing gameTimerInterval before start.');
            clearInterval(gameTimerInterval);
            gameTimerInterval = null;
        }

        const savedSettingsJSON = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (savedSettingsJSON) {
            try {
                const saved = JSON.parse(savedSettingsJSON);

                // Merge saved settings, ensuring correct types/formats
                if (typeof saved.operations === 'object' && saved.operations !== null && !Array.isArray(saved.operations)) {
                     // Operations: Ensure all default keys exist, overwrite with saved boolean values
                     currentSettings.operations = { ...defaultSettings.operations };
                     for (const opKey in saved.operations) {
                         if (currentSettings.operations.hasOwnProperty(opKey)) {
                             currentSettings.operations[opKey] = !!saved.operations[opKey]; // Force boolean
                         }
                     }
                } // else: keep default operations if saved format is wrong/array

                if (typeof saved.minRange === 'number') currentSettings.minRange = saved.minRange;
                if (typeof saved.maxRange === 'number' && saved.maxRange > currentSettings.minRange) currentSettings.maxRange = saved.maxRange; // Add validation
                if (typeof saved.allowNegatives === 'boolean') currentSettings.allowNegatives = saved.allowNegatives;
                // Keep allowFractions/allowDecimals default for now as they are NYI
                if (typeof saved.timerDuration === 'number' && saved.timerDuration > 0 && saved.timerDuration <= 3600) currentSettings.timerDuration = saved.timerDuration; // Add validation
                if (typeof saved.requiredCorrectSolves === 'number' && saved.requiredCorrectSolves >= 1 && saved.requiredCorrectSolves <= 10) currentSettings.requiredCorrectSolves = saved.requiredCorrectSolves; // Add validation

            } catch (e) {
                console.error("Failed to parse saved settings, using defaults.", e);
                // Keep defaultSettings assigned via the initial spread syntax
            }
        }
        // Ensure at least one operation is selected after merging
        const anyOpSelected = Object.values(currentSettings.operations).some(isEnabled => isEnabled);
        if (!anyOpSelected) {
            console.warn("No operations selected in loaded/default settings, defaulting to addition.");
            currentSettings.operations = { ...defaultSettings.operations, add: true }; // Force addition minimum
        }
        // --- End Robust Settings Loading ---
        
        currentGameMode = mode;
        currentScore = 0;
        if (feedbackDisplay) {
            feedbackDisplay.textContent = '';
            feedbackDisplay.className = 'feedback-display';
        }
        if (awardIndicator) {
            awardIndicator.textContent = '';
        }
        if (scoreDisplay) {
            scoreDisplay.textContent = `Score: ${currentScore}`;
        }
        if (answerInput) {
            answerInput.value = '';
            answerInput.disabled = false; // Ensure input is enabled on game start
        }
        if (submitAnswerBtn) {
            submitAnswerBtn.disabled = false; // Ensure button is enabled on game start
        }
        if (skipEquationBtn) {
            skipEquationBtn.disabled = false; // Ensure button is enabled on game start
        }
        currentStreak = 0;
        const streakCounter = document.getElementById('streak-counter');
        if (streakCounter) {
            streakCounter.textContent = '🔥 0';
        }

        // Reset session stats
        totalEquationsPresented = 0;
        incorrectAnswersCount = 0;
        sessionAchievements.clear();

        if (mode === 'regular') {
            console.log(`[startGame] Starting timer with duration: ${currentSettings.timerDuration} seconds`); // Add log
            timeLeft = currentSettings.timerDuration;
            if (timerDisplay) {
                timerDisplay.textContent = `Time: ${formatTime(timeLeft)}`;
                timerDisplay.style.display = 'block';
            }
            if (scoreDisplay) {
                scoreDisplay.style.display = 'block';
            }

            console.log('[startGame] About to set interval.'); // <<< ADD LOG
            gameTimerInterval = setInterval(updateTimer, 1000);
            console.log('[startGame] Interval set. Calling nextEquation...'); // <<< ADD LOG

            nextEquation();
            showView('game');
            if (answerInput) {
                answerInput.focus();
            }
        }
        // TODO: Add logic for 'training' mode start
        else if (mode === 'training') {
            console.log("Training mode start NYI");
             // Based on FR5.3, training mode uses the list
             if (trainingList.length === 0) {
                alert("Cannot start training mode, the list is empty!");
                return; // Don't start
             }
             equationsInCurrentTrainingSession = [...trainingList]; // Copy list for the session
             // Shuffle the training list for variety?
             equationsInCurrentTrainingSession.sort(() => Math.random() - 0.5);

             // Training mode specifics
             console.log(`[startGame] Starting timer with duration: ${currentSettings.timerDuration} seconds`); // Add log
             timeLeft = currentSettings.timerDuration;
             if (timerDisplay) {
                timerDisplay.style.display = 'none'; // Hide timer
             }
             if (scoreDisplay) {
                scoreDisplay.style.display = 'none'; // Hide score (or maybe show Q count?)
             }

             nextEquation(); // Get first equation from the session list
             showView('game');
             if (answerInput) {
                answerInput.focus();
             }
        } else {
            console.error("Unknown game mode:", mode);
            showView('mainMenu');
        }

        // Update achievements view when starting game
        updateUnlockedAchievementsView();
    }

    function updateTimer() {
        timeLeft--;
        console.log(`[updateTimer] timeLeft is now: ${timeLeft}`); // Add log
        if (timerDisplay) {
            timerDisplay.textContent = `Time: ${formatTime(timeLeft)}`;
        }
        if (timeLeft <= 0) {
            console.log(`[updateTimer] Time is <= 0, calling endGame().`); // Add log
            endGame();
        }
    }

    function endGame() {
        console.log('[endGame] Function entered.');
        console.log('Game Over!');
        isGameOver = true; // Set game over flag
        isAnswerSubmitted = false; // Reset flag on game end

        if (gameTimerInterval) {
            console.log('[endGame] Clearing gameTimerInterval.'); // Log clearing
            clearInterval(gameTimerInterval);
            gameTimerInterval = null;
        }
        // Ensure controls are disabled visually after game ends
        if (answerInput) answerInput.disabled = true;
        if (submitAnswerBtn) submitAnswerBtn.disabled = true;
        if (skipEquationBtn) skipEquationBtn.disabled = true;

        // --- Finalize and Save Session Data ---
        if (currentSessionData) {
            currentSessionData.endTime = new Date().toISOString();
            currentSessionData.score = currentScore; // Final score
            // Stats like totalEquations, correctAnswers, incorrectAnswers are updated during checkAnswer/skip

            // Add the completed session to the history
            gameSessionHistory.unshift(currentSessionData);

            // Limit the number of stored sessions
            if (gameSessionHistory.length > MAX_SESSIONS_TO_KEEP) {
                gameSessionHistory = gameSessionHistory.slice(0, MAX_SESSIONS_TO_KEEP);
            }

            saveSessionHistory(); // Save the updated history array
            currentSessionData = null; // Clear current session data
        } else {
             console.warn("[endGame] No currentSessionData found to finalize.");
        }
        // --- End Finalize Session Data ---

        // Log right before playing the sound
        console.log('[endGame] About to play gameOver sound.');
        playSound('gameOver'); // Play game over sound

        // Update Score Summary View (using stats from the *just finished* session if possible)
        // Find the session we just finished (should be the first one now)
        const finishedSession = gameSessionHistory[0];

        if (finalScoreSpan) {
            finalScoreSpan.textContent = currentScore; // Use the final score from the game
        }
        currentGameMode = null; // Reset mode (already done implicitly by setting currentSessionData=null)
        currentEquation = null;
        showView('scoreSummary');

        // Populate detailed summary stats from the finished session data
        if (finishedSession) {
            const timePlayed = finishedSession.startTime && finishedSession.endTime
                ? Math.round((new Date(finishedSession.endTime) - new Date(finishedSession.startTime)) / 1000)
                : currentSettings.timerDuration; // Fallback to setting duration
            document.getElementById('summary-time-played').textContent = formatTime(timePlayed);
            document.getElementById('summary-total-equations').textContent = finishedSession.totalEquations;
            document.getElementById('summary-correct-answers').textContent = finishedSession.correctAnswers;
            document.getElementById('summary-incorrect-answers').textContent = finishedSession.incorrectAnswers + finishedSession.skippedAnswers; // Combine incorrect + skipped for training link relevance
        } else {
             // Fallback if session data wasn't found (shouldn't happen)
             document.getElementById('summary-time-played').textContent = formatTime(currentSettings.timerDuration);
             document.getElementById('summary-total-equations').textContent = totalEquationsPresented; // Use older session vars as fallback
             document.getElementById('summary-correct-answers').textContent = currentScore;
             document.getElementById('summary-incorrect-answers').textContent = incorrectAnswersCount;
        }

        const summaryAchievementsList = document.getElementById('summary-achievements-list');
        summaryAchievementsList.innerHTML = ''; // Clear previous
        if (sessionAchievements.size > 0) {
            // Find achievement details using the flat structure method
            const flatAchievementsLookup = {};
            Object.values(ACHIEVEMENTS).forEach(value => {
                if (typeof value === 'object' && !value.id) {
                    Object.values(value).forEach(achievement => {
                        flatAchievementsLookup[achievement.id] = achievement;
                    });
                } else {
                    flatAchievementsLookup[value.id] = value;
                }
            });

            sessionAchievements.forEach(id => {
                const achievement = flatAchievementsLookup[id];
                if (achievement) {
                    const li = document.createElement('li');
                    li.textContent = `${achievement.icon} ${achievement.title}`;
                    summaryAchievementsList.appendChild(li);
                }
            });
        } else {
            summaryAchievementsList.innerHTML = '<li>None this session!</li>';
        }
    }

    function nextEquation() {
        console.log('[nextEquation] Function entered.'); // <<< ADD LOG
        if (!equationDisplay) {
            console.error('Equation display element not found');
            return;
        }

        // equationDisplay.textContent = ''; // Clear previous equation immediately
        // feedbackDisplay.textContent = ''; // REMOVED: Don't clear feedback here
        // feedbackDisplay.className = 'feedback-display'; // REMOVED: Don't clear feedback class here

        if (answerInput) {
            answerInput.value = '';
        }
        if (awardIndicator) {
            awardIndicator.textContent = ''; // Clear award indicator initially
        }

        if (currentGameMode === 'regular') {
            currentEquation = generateEquation();
            console.log('[nextEquation] Equation generated/retrieved.', currentEquation); // <<< ADD LOG
        } else if (currentGameMode === 'training') {
             if (equationsInCurrentTrainingSession.length > 0) {
                const nextEqString = equationsInCurrentTrainingSession.shift();
                // Re-parse the string (as before)
                const parts = nextEqString.match(/(-?\d+)\s*([+\-*\/])\s*(-?\d+)/);
                if (parts) {
                    const op1 = parseInt(parts[1], 10);
                    const operatorSymbol = parts[2];
                    const op2 = parseInt(parts[3], 10);
                    let result;
                    let opName;
                    switch (operatorSymbol) {
                        case '+': result = op1 + op2; opName = 'add'; break;
                        case '-': result = op1 - op2; opName = 'sub'; break;
                        case '*': result = op1 * op2; opName = 'mul'; break;
                        case '/': result = op1 / op2; opName = 'div'; break;
                    }
                    currentEquation = {
                        operand1: op1,
                        operand2: op2,
                        operator: opName,
                        correctResult: result,
                        displayString: nextEqString
                    };
                } else {
                     console.error("Failed to parse training equation string:", nextEqString);
                     currentEquation = null;
                }
             } else {
                 alert("Training complete! All equations practiced.");
                 playSound('achievement'); // Sound for finishing training
                 showView('mainMenu');
                 currentEquation = null;
                 return;
             }
        }

        if (currentEquation) {
            equationDisplay.textContent = currentEquation.displayString;
            totalEquationsPresented++; // Increment here, as equation is now shown
            console.log('[nextEquation] Equation string displayed.'); // <<< ADD LOG

            // Trigger fade-in animation
            void equationDisplay.offsetWidth; // Force reflow
            equationDisplay.classList.add('animate-equation-fadein');

            // Display award status (FR4.2)
            const stats = progressData[currentEquation.displayString] || { currentAward: 'None' };
            if (awardIndicator) {
                awardIndicator.textContent = AWARD_SYMBOLS[stats.currentAward] || '';
                console.log('[nextEquation] Award indicator set.'); // <<< ADD LOG
            }

            // Record start time for timing this question (FR3.1.2)
            equationStartTime = Date.now();
            console.log('[nextEquation] Start time recorded.'); // <<< ADD LOG
        } else {
            // Handle generation failure or end of training list
            equationDisplay.textContent = "Error: Could not generate a valid equation.";
            if(currentGameMode === 'regular') {
                console.error("Equation generation failed in regular mode, likely due to restrictive settings.");
                // Don't call endGame() immediately on startup failure.
                // Instead, stop the timer, alert the user, and go back to the menu.
                if (gameTimerInterval) {
                    clearInterval(gameTimerInterval);
                    gameTimerInterval = null;
                }
                currentGameMode = null; // Reset mode
                alert("Could not generate an equation with the current settings. Please adjust the number range or allowed operations.");
                showView('mainMenu');
                return; // Stop further processing in nextEquation
            } else if (currentGameMode === 'training' && equationsInCurrentTrainingSession.length === 0) {
                // Training completion is handled earlier
            } else if (currentGameMode === 'training'){
                console.error("Failed to get next equation in training mode (unexpected error).");
                showView('mainMenu'); // Go back to menu if error occurs mid-training
            } else {
                console.error("Failed to get next equation in unknown mode or state.")
                showView('mainMenu');
            }
        }
        if (answerInput) {
            answerInput.focus();
            console.log('[nextEquation] Input focused.'); // Restore log
        }
 
        // Remove fade-in class after animation completes
        setTimeout(() => {
            console.log('[nextEquation] Timeout: Removing fade-in animation class.'); // <<< ADD LOG
            equationDisplay.classList.remove('animate-equation-fadein');
        }, 400); // Match animation duration
        console.log('[nextEquation] SetTimeout for animation removal scheduled.'); // <<< ADD LOG
    }

    function checkAnswer() {
        if (isGameOver || isAnswerSubmitted || !currentSessionData) return; // Exit if game over, submitted, or no active session

        const userAnswerText = answerInput.value.trim();
        if (userAnswerText === '') {
            feedbackDisplay.textContent = "Please enter an answer.";
            feedbackDisplay.className = 'feedback-display';
            return;
        }
        const userAnswer = parseInt(userAnswerText, 10);
        if (isNaN(userAnswer)) {
            feedbackDisplay.textContent = "Please enter a valid number.";
            feedbackDisplay.className = 'feedback-display feedback-incorrect';
            // totalEquationsPresented++; // Don't count invalid input as an attempt?
            // incorrectAnswersCount++; // Or count it as incorrect?
            // Decision: Let's not count invalid entries as attempts for now.
            answerInput.value = '';
            return;
        }
        
        isAnswerSubmitted = true; // Set flag to prevent further submissions
        submitAnswerBtn.disabled = true; // Disable submit button
        answerInput.disabled = true; // Disable input field
        skipEquationBtn.disabled = true; // Disable skip button

        const correctAnswer = currentEquation.correctResult;
        const isCorrect = userAnswer === correctAnswer;

        // Calculate time taken (needed for fastest time stats & achievements)
        const answerTime = Date.now();
        const timeTaken = equationStartTime ? (answerTime - equationStartTime) / 1000 : Infinity; // Time in seconds, handle null start time
        lastAnswerTime = timeTaken; // Update last answer time for achievements

        // Get or initialize progress stats for this equation
        const equationString = currentEquation.displayString;
        if (!progressData[equationString]) {
            progressData[equationString] = { correctCount: 0, fastestTime: null, currentAward: 'None' };
        }
        const stats = progressData[equationString];

        // Create calculation record for the session history
        const calculationRecord = {
            equationString: equationString,
            operand1: currentEquation.operand1,
            operand2: currentEquation.operand2,
            operator: currentEquation.operator,
            userAnswer: userAnswerText,
            correctAnswer: correctAnswer,
            timeTaken: timeTaken,
            isCorrect: isCorrect,
            timestamp: Date.now()
        };
        currentSessionData.calculations.push(calculationRecord);
        currentSessionData.totalEquations++; // Increment equations attempted in this session

        if (isCorrect) {
            // --- CORRECT Answer Path --- Corrected Flow ---
            showFeedback(true, correctAnswer);
            currentScore++;
            currentSessionData.correctAnswers++; // Update session stats
            if (scoreDisplay) {
                scoreDisplay.textContent = `Score: ${currentScore}`;
            }

            // Ensure controls are enabled (in case of pending incorrect feedback timeout)
            submitAnswerBtn.disabled = false;
            answerInput.disabled = false;
            skipEquationBtn.disabled = false;

            // Update Progress Data (FR3)
            stats.correctCount++;

            // Update fastest time (FR3.1.3)
            if (stats.fastestTime === null || timeTaken < stats.fastestTime) {
                stats.fastestTime = timeTaken;
            }

            // Determine Award Level (FR4)
            let newAward = 'None';
            if (stats.correctCount >= AWARD_THRESHOLDS.DIAMOND) {
                newAward = 'Diamond';
            } else if (stats.correctCount >= AWARD_THRESHOLDS.GOLD) {
                newAward = 'Gold';
            } else if (stats.correctCount >= AWARD_THRESHOLDS.SILVER) {
                newAward = 'Silver';
            }
            stats.currentAward = newAward;

            saveProgressData();

            // Update training list progress
            updateTrainingListProgress(equationString, true);
            removeFromTrainingList(equationString);

            // Add to history - handled by pushing calculationRecord above
            // addToHistory(currentEquation, userAnswerText, correctAnswer, timeTaken, isCorrect);

            // Reset start time immediately before getting next equation
            equationStartTime = null;

            // Briefly set flag to prevent re-entry during immediate nextEquation call
            isAnswerSubmitted = true;

            // Immediately load the next question
            if (currentGameMode && !isGameOver) {
                nextEquation();
            }

            // Reset flag immediately after nextEquation is initiated
            isAnswerSubmitted = false;

            // Clear the "Correct!" feedback after a delay, without blocking
            setTimeout(() => {
                // Check if the feedback hasn't already been replaced by incorrect feedback
                if (feedbackDisplay.classList.contains('feedback-correct')) {
                    feedbackDisplay.textContent = '';
                    feedbackDisplay.className = 'feedback-display';
                }
            }, 1200); // Keep feedback visible for 1.2 seconds
            // --- END CORRECT Answer Path ---

        } else {
            // --- INCORRECT Answer Path (Keep existing logic) ---
            isAnswerSubmitted = true; // Set flag to prevent further submissions
            submitAnswerBtn.disabled = true; // Disable submit button
            answerInput.disabled = true; // Disable input field
            skipEquationBtn.disabled = true; // Disable skip button

            // incorrectAnswersCount++; // Now handled within session data
            currentSessionData.incorrectAnswers++; // Update session stats
            showFeedback(false, correctAnswer);

            // Add to history - handled by pushing calculationRecord above
            // addToHistory(currentEquation, userAnswerText, correctAnswer, timeTaken, isCorrect);

            // Add to training list if answered incorrectly
            addToTrainingList(equationString);

            // Update training list progress (even for incorrect answers)
            updateTrainingListProgress(equationString, false);

            // Reset start time for the next equation (can be done here or in setTimeout)
            equationStartTime = null;

            // Load the next question after a short delay to allow reading feedback
            setTimeout(() => {
                // Reset submission flag and re-enable controls *before* getting next equation
                isAnswerSubmitted = false;
                if (!isGameOver) { // Only re-enable if game is still running
                    submitAnswerBtn.disabled = false;
                    answerInput.disabled = false;
                     skipEquationBtn.disabled = false; // Re-enable skip button
                    answerInput.focus(); // Focus back on input for next question
                }

                if (currentGameMode && !isGameOver) {
                     nextEquation();
                }
            }, 1200); // Keep delay for incorrect answers
            // --- END INCORRECT Answer Path ---
        }

        // Update achievements view after checking answer
        updateUnlockedAchievementsView();
    }

    // --- Navigation Event Listeners ---
    settingsBtn.addEventListener('click', () => showView('settings'));
    backToMenuFromSettingsBtn.addEventListener('click', () => showView('mainMenu'));
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveSettings();
    });

    viewTrainingListBtn.addEventListener('click', () => {
        updateTrainingListUI(); // Explicitly update UI when navigating to the view
        showView('trainingList');
    });
    backToMenuFromTrainingListBtn.addEventListener('click', () => showView('mainMenu'));

    quitGameBtn.addEventListener('click', () => {
        if (gameTimerInterval) {
            console.log('[quitGameBtn] Clearing gameTimerInterval.');
            clearInterval(gameTimerInterval);
            gameTimerInterval = null;
        }
         // Finalize session data if quitting mid-game
         if (currentSessionData && !isGameOver) { // Only finalize if not already ended normally
             console.log('[quitGameBtn] Finalizing session data on quit.');
             currentSessionData.endTime = new Date().toISOString();
             currentSessionData.score = currentScore; // Save current score on quit
             gameSessionHistory.unshift(currentSessionData);
             if (gameSessionHistory.length > MAX_SESSIONS_TO_KEEP) {
                 gameSessionHistory = gameSessionHistory.slice(0, MAX_SESSIONS_TO_KEEP);
             }
             saveSessionHistory();
         }

        // Reset state variables
        currentGameMode = null;
        currentEquation = null;
        isAnswerSubmitted = false;
        isGameOver = true; // Treat quitting as game over state
        currentSessionData = null; // Clear current session

        showView('mainMenu');
         // Ensure controls are re-enabled visually if quitting mid-submission (although view changes)
         if (answerInput) answerInput.disabled = false;
         if (submitAnswerBtn) submitAnswerBtn.disabled = false;
         if (skipEquationBtn) skipEquationBtn.disabled = false;
    });

    backToMenuFromScoreBtn.addEventListener('click', () => showView('mainMenu'));

    // --- Game Action Event Listeners ---
    startRegularGameBtn.addEventListener('click', () => {
        startGame('regular');
    });

    // Button on main menu - starts training *using the list*
    startTrainingModeBtn.addEventListener('click', () => {
        if (trainingList.length > 0) {
             startGame('training');
        } else {
            alert("Your training list is empty! Answer some questions incorrectly first, or go to 'View Training List'.");
        }
    });

    // Button within the training list view
    startTrainingFromListBtn.addEventListener('click', () => {
         startGame('training');
    });

    playAgainBtn.addEventListener('click', () => {
        startGame('regular');
    });

    // Add listener for the "Train Them!" link on the score summary
    const summaryTrainLink = document.getElementById('summary-train-link');
    if (summaryTrainLink) {
        summaryTrainLink.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent navigating to #
            if (trainingList.length > 0) {
                console.log('[summary-train-link] Starting training from summary.');
                startGame('training');
            } else {
                alert("Your training list is currently empty!");
            }
        });
    } else {
        console.error('Could not find summary-train-link element.');
    }

    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && currentView === 'game') {
            // console.log('Submitting Answer (Enter)...'); // Logged inside checkAnswer now
            if (!isAnswerSubmitted) { // Check flag here too
                 checkAnswer();
            }
            // submitAnswerBtn.click(); // No longer needed, direct call is fine
        }
    });

    submitAnswerBtn.addEventListener('click', () => {
        if (currentView === 'game') {
            checkAnswer();
        }
    });

    // --- New Functions for Achievements and History ---
    function updateAchievementsView() {
        achievementsList.innerHTML = '';
        // Flatten the nested achievement structure
        const flatAchievements = {};
        Object.entries(ACHIEVEMENTS).forEach(([category, value]) => {
            if (typeof value === 'object' && !value.id) {
                // This is a category of achievements
                Object.entries(value).forEach(([key, achievement]) => {
                    flatAchievements[achievement.id] = achievement;
                });
            } else {
                // This is a single achievement
                flatAchievements[value.id] = value;
            }
        });

        Object.entries(flatAchievements).forEach(([id, achievement]) => {
            const achievementData = achievements[id];
            if (!achievementData) return; // Skip if achievement data not found
            
            const card = document.createElement('div');
            card.className = `achievement-card ${achievementData.unlocked ? '' : 'locked'}`;
            
            const progress = achievementData.progress || 0;
            const progressPercent = Math.min((progress / achievement.threshold) * 100, 100);
            
            card.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-progress">
                    <div class="achievement-progress-bar" style="width: ${progressPercent}%"></div>
                </div>
                <div class="achievement-status">
                    ${achievementData.unlocked ? '✅ Unlocked' : `${progress}/${achievement.threshold}`}
                </div>
            `;
            
            achievementsList.appendChild(card);
        });
    }

    function updateHistoryView() {
        if (!calculationsHistory) return; // Check if element exists (using old ID for now)

        calculationsHistory.innerHTML = ''; // Clear previous history
        calculationsHistory.classList.remove('history-list'); // Remove old class if needed
        calculationsHistory.classList.add('session-history-container'); // Add new class for styling

        if (gameSessionHistory.length === 0) {
            calculationsHistory.innerHTML = '<div class="history-item-empty">No game sessions recorded yet.</div>';
        } else {
            gameSessionHistory.forEach(session => {
                const sessionDiv = document.createElement('div');
                sessionDiv.className = 'session-history-item';

                const startTime = new Date(session.startTime);
                const endTime = session.endTime ? new Date(session.endTime) : null;
                const duration = endTime ? Math.round((endTime - startTime) / 1000) : null; // Duration in seconds

                // Format dates and times nicely
                 const startFormatted = startTime.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
                 const endFormatted = endTime ? endTime.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' }) : 'In Progress?'; // Or maybe just duration
                 const durationFormatted = duration !== null ? formatTime(duration) : 'N/A';

                // Determine mode text
                const modeText = session.mode === 'regular' ? 'Challenge' : 'Training';

                sessionDiv.innerHTML = `
                    <div class="session-header">
                        <span class="session-mode">${modeText}</span>
                        <span class="session-time">Started: ${startFormatted} (${durationFormatted})</span>
                        ${session.mode === 'regular' ? `<span class="session-score">Score: ${session.score}</span>` : ''}
                    </div>
                    <div class="session-stats">
                         Correct: ${session.correctAnswers}, Incorrect: ${session.incorrectAnswers}, Skipped: ${session.skippedAnswers} (Total: ${session.totalEquations})
                    </div>
                    <details class="session-calculations-details">
                         <summary>View Calculations (${session.calculations.length})</summary>
                         <ul class="session-calculations-list">
                             ${session.calculations.map(calc => `
                                 <li class="calculation-item ${calc.isCorrect ? 'correct' : 'incorrect'}">
                                     <span class="calc-equation">${calc.equationString.replace(' = ?', '')} = ${calc.correctAnswer}</span>
                                     <span class="calc-user-answer">(You: ${calc.userAnswer})</span>
                                     <span class="calc-indicator">${calc.isCorrect ? '✔' : '✘'}</span>
                                     <span class="calc-time">(${calc.timeTaken ? calc.timeTaken.toFixed(1) + 's' : '-'})</span>
                                 </li>
                             `).join('')}
                         </ul>
                     </details>
                `;
                calculationsHistory.appendChild(sessionDiv);
            });
        }
    }

    // Add to Navigation Event Listeners section
    viewAchievementsBtn.addEventListener('click', () => {
        updateAchievementsView();
        updateHistoryView();
        showView('achievements');
    });

    backToMenuFromAchievementsBtn.addEventListener('click', () => showView('mainMenu'));

    // --- Training List Management ---
    function addToTrainingList(equationString) {
        if (!trainingList.includes(equationString)) {
            trainingList.push(equationString);
            trainingListProgress[equationString] = 0;
            saveTrainingList();
            // No UI update needed here usually, happens when viewing list
        }
    }

    function updateTrainingListProgress(equationString, isCorrect) {
        if (trainingList.includes(equationString)) {
            if (isCorrect) {
                trainingListProgress[equationString] = (trainingListProgress[equationString] || 0) + 1;
            }
            saveTrainingList();
            updateTrainingListUI();
        }
    }

    function removeFromTrainingList(equationString) {
        const settings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
        const requiredSolves = settings.requiredCorrectSolves || defaultSettings.requiredCorrectSolves;
        
        if (trainingListProgress[equationString] >= requiredSolves) {
            const index = trainingList.indexOf(equationString);
            if (index > -1) {
                trainingList.splice(index, 1);
                delete trainingListProgress[equationString];
                saveTrainingList();
                updateTrainingListUI();
            }
        }
    }

    // --- Initialization ---
    console.log('Math Trainer Initializing...');
    loadSettings();
    loadProgressData();
    loadTrainingList();
    loadHistory(); // Ensure history is loaded

    // // Temporarily disabled generic button click sound for debugging
    // document.querySelectorAll('button').forEach(button => {
    //     button.addEventListener('click', () => {
    //         console.log(`[ClickDebug] Clicked button: ${button.id || 'no id'}`)
    //         playSound('click');
    //      });
    // });

    showView('mainMenu'); // Start at the main menu
    console.log('Initialization Complete.');

    function updateGameAchievementsView() {
        if (!gameAchievementsList) return;
        
        gameAchievementsList.innerHTML = '';
        // Flatten the nested achievement structure
        const flatAchievements = {};
        Object.entries(ACHIEVEMENTS).forEach(([category, value]) => {
            if (typeof value === 'object' && !value.id) {
                // This is a category of achievements
                Object.entries(value).forEach(([key, achievement]) => {
                    flatAchievements[achievement.id] = achievement;
                });
            } else {
                // This is a single achievement
                flatAchievements[value.id] = value;
            }
        });

        Object.entries(flatAchievements).forEach(([id, achievement]) => {
            const achievementData = achievements[id];
            if (!achievementData) return; // Skip if achievement data not found
            
            const card = document.createElement('div');
            card.className = `achievement-card ${achievementData.unlocked ? '' : 'locked'}`;
            
            const progress = achievementData.progress || 0;
            const progressPercent = Math.min((progress / achievement.threshold) * 100, 100);
            
            card.innerHTML = `
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-title">${achievement.title}</div>
                <div class="achievement-progress">
                    <div class="achievement-progress-bar" style="width: ${progressPercent}%"></div>
                </div>
                <div class="achievement-status">
                    ${achievementData.unlocked ? '✅' : `${progress}/${achievement.threshold}`}
                </div>
            `;
            
            gameAchievementsList.appendChild(card);
        });
    }

    // Add skip button event listener
    skipEquationBtn.addEventListener('click', () => {
        if (isAnswerSubmitted || isGameOver || !currentSessionData) return; // Don't allow skipping during feedback, game over, or no session

        playSound('skip'); // Play skip sound
        if (currentEquation && currentGameMode) { // Ensure there is an equation and game is active
            // Add current equation to training list
            addToTrainingList(currentEquation.displayString);

            // Record the skip in the current session data
            const calculationRecord = {
                equationString: currentEquation.displayString,
                operand1: currentEquation.operand1,
                operand2: currentEquation.operand2,
                operator: currentEquation.operator,
                userAnswer: 'Skipped',
                correctAnswer: currentEquation.correctResult,
                timeTaken: null, // No time taken for skip
                isCorrect: false, // Treat skip as incorrect for history purposes
                timestamp: Date.now()
            };
            currentSessionData.calculations.push(calculationRecord);
            currentSessionData.totalEquations++; // Increment total equations attempted
            currentSessionData.skippedAnswers++; // Increment skipped count

            // Move to next equation
            nextEquation();
        }
    });

    // Update the reset achievements event listener
    resetAchievementsBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset all achievements? This cannot be undone.')) {
            // Reset achievements to initial state
            achievements = {};
            initializeAchievements(ACHIEVEMENTS);
            saveAchievements();
            
            // Update any visible achievement displays
            updateGameAchievementsView();
            updateAchievementsView();
            
            alert('Achievements have been reset successfully.');
        }
    });

    resetHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to reset your calculation history and training list? This cannot be undone.')) {
            // Reset calculation history (session history)
            gameSessionHistory = [];
            saveSessionHistory(); // Save the empty array

            // Reset training list and progress
            trainingList = [];
            trainingListProgress = {};
            localStorage.setItem(TRAINING_LIST_STORAGE_KEY, JSON.stringify(trainingList));
            localStorage.setItem('trainingListProgress', JSON.stringify(trainingListProgress));
            
            // Update all relevant views
            updateHistoryView();
            updateTrainingListUI();
            
            alert('Calculation history and training list have been reset successfully.');
        }
    });

    function updateUnlockedAchievementsView() {
        if (!unlockedAchievementsList) return;
        
        unlockedAchievementsList.innerHTML = '';
        // Flatten the nested achievement structure
        const flatAchievements = {};
        Object.entries(ACHIEVEMENTS).forEach(([category, value]) => {
            if (typeof value === 'object' && !value.id) {
                // This is a category of achievements
                Object.entries(value).forEach(([key, achievement]) => {
                    flatAchievements[achievement.id] = achievement;
                });
            } else {
                // This is a single achievement
                flatAchievements[value.id] = value;
            }
        });

        // Only show unlocked achievements
        Object.entries(flatAchievements).forEach(([id, achievement]) => {
            const achievementData = achievements[id];
            if (!achievementData || !achievementData.unlocked) return;
            
            const item = document.createElement('div');
            item.className = 'unlocked-achievement-item';
            
            item.innerHTML = `
                <div class="unlocked-achievement-icon">${achievement.icon}</div>
                <div class="unlocked-achievement-title">${achievement.title}</div>
            `;
            
            unlockedAchievementsList.appendChild(item);
        });
    }

    function loadHistory() {
        const savedHistory = localStorage.getItem(SESSION_HISTORY_STORAGE_KEY); // Use new key
        if (savedHistory) {
            try {
                 gameSessionHistory = JSON.parse(savedHistory);
                 // Basic validation (ensure it's an array)
                 if (!Array.isArray(gameSessionHistory)) {
                     console.warn("Loaded session history is not an array, resetting.");
                     gameSessionHistory = [];
                 }
                 // Can add more validation here if needed (e.g., check object structure)
            } catch (e) {
                 console.error("Failed to parse session history, resetting.", e);
                 gameSessionHistory = [];
            }
        } else {
            gameSessionHistory = [];
        }
        // Ensure calculationHistory is cleared (or remove its usage entirely later)
        calculationHistory = [];
    }

    function saveSessionHistory() {
        localStorage.setItem(SESSION_HISTORY_STORAGE_KEY, JSON.stringify(gameSessionHistory));
    }
}); 
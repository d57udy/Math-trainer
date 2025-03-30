document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const views = {
        mainMenu: document.getElementById('main-menu-view'),
        game: document.getElementById('game-view'),
        settings: document.getElementById('settings-view'),
        trainingList: document.getElementById('training-list-view'),
        scoreSummary: document.getElementById('score-summary-view')
    };

    // Main Menu Buttons
    const startRegularGameBtn = document.getElementById('start-regular-game-btn');
    const startTrainingModeBtn = document.getElementById('start-training-mode-btn');
    const viewTrainingListBtn = document.getElementById('view-training-list-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const trainingListCountSpan = document.getElementById('training-list-count');

    // Settings View Elements
    const settingsForm = document.getElementById('settings-form');
    const opCheckboxes = settingsForm.querySelectorAll('input[name="op"]');
    const minRangeInput = document.getElementById('min-range');
    const maxRangeInput = document.getElementById('max-range');
    const allowNegativesCheckbox = document.getElementById('allow-negatives');
    const allowFractionsCheckbox = document.getElementById('allow-fractions'); // NYI
    const allowDecimalsCheckbox = document.getElementById('allow-decimals');   // NYI
    const timerDurationMinInput = document.getElementById('timer-duration-min');
    const timerDurationSecInput = document.getElementById('timer-duration-sec');
    const timerDurationErrorMsg = document.getElementById('timer-duration-error');
    const saveSettingsBtn = document.getElementById('save-settings-btn');
    const backToMenuFromSettingsBtn = document.getElementById('back-to-menu-from-settings-btn');
    const opErrorMsg = document.getElementById('op-error');
    const rangeErrorMsg = document.getElementById('range-error');

    // Game View Elements
    const timerDisplay = document.getElementById('timer-display');
    const scoreDisplay = document.getElementById('score-display');
    const equationText = document.getElementById('equation-text');
    const awardIndicator = document.getElementById('award-indicator');
    const answerInput = document.getElementById('answer-input');
    const submitAnswerBtn = document.getElementById('submit-answer-btn');
    const feedbackDisplay = document.getElementById('feedback-display');
    const quitGameBtn = document.getElementById('quit-game-btn');

    // Training List View Elements
    const equationsToTrainListUl = document.getElementById('equations-to-train-list');
    const trainingListEmptyMsg = document.getElementById('training-list-empty-message');
    const startTrainingFromListBtn = document.getElementById('start-training-from-list-btn');
    const backToMenuFromTrainingListBtn = document.getElementById('back-to-menu-from-training-list-btn');

    // Score Summary View Elements
    const finalScoreSpan = document.getElementById('final-score');
    const playAgainBtn = document.getElementById('play-again-btn');
    const backToMenuFromScoreBtn = document.getElementById('back-to-menu-from-score-btn');

    // --- State Variables ---
    let currentSettings = {};
    let progressData = {}; // { "equationString": { correctCount: 0, fastestTime: null, currentAward: 'None' } }
    let trainingList = []; // [ "equationString1", "equationString2" ]
    let currentView = 'mainMenu';
    let gameTimerInterval = null;
    let timeLeft = 0;
    let currentScore = 0;
    let currentGameMode = null; // 'regular' or 'training'
    let currentEquation = null;
    let equationsInCurrentTrainingSession = [];
    let equationStartTime = null; // Added for timing

    const SETTINGS_STORAGE_KEY = 'mathTrainerSettings';
    const PROGRESS_STORAGE_KEY = 'mathTrainerProgress';
    const TRAINING_LIST_STORAGE_KEY = 'mathTrainerTrainingList';

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
                    displayString = `${op1} + ${op2} = ?`;
                    break;
                case 'sub':
                    result = op1 - op2;
                    displayString = `${op1} - ${op2} = ?`;
                    break;
                case 'mul':
                    result = op1 * op2;
                    displayString = `${op1} * ${op2} = ?`;
                    break;
                case 'div':
                    // Avoid division by zero
                    if (op2 === 0) continue; // Try generating a new equation

                    // Ensure integer result (FR1.8 for now)
                    if (op1 % op2 !== 0) continue; // Regenerate if not perfectly divisible

                    result = op1 / op2;
                    displayString = `${op1} / ${op2} = ?`;
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
        allowFractions: false, // NYI
        allowDecimals: false,  // NYI
        timerDuration: 60 // Default remains 60 seconds
    };

    function loadSettings() {
        const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
        currentSettings = storedSettings ? JSON.parse(storedSettings) : { ...defaultSettings };

        // Apply loaded settings to the form
        opCheckboxes.forEach(checkbox => {
            checkbox.checked = currentSettings.operations[checkbox.value] || false;
        });
        minRangeInput.value = currentSettings.minRange;
        maxRangeInput.value = currentSettings.maxRange;
        allowNegativesCheckbox.checked = currentSettings.allowNegatives;
        allowFractionsCheckbox.checked = false; allowFractionsCheckbox.disabled = true;
        allowDecimalsCheckbox.checked = false; allowDecimalsCheckbox.disabled = true;

        // Calculate and set minutes/seconds from total seconds
        const totalSeconds = currentSettings.timerDuration || 60;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        timerDurationMinInput.value = minutes;
        timerDurationSecInput.value = seconds;
    }

    function saveSettings() {
        // Clear previous errors
        opErrorMsg.textContent = '';
        rangeErrorMsg.textContent = '';
        timerDurationErrorMsg.textContent = ''; // Clear timer error

        // Read settings from form
        const ops = {};
        opCheckboxes.forEach(checkbox => { ops[checkbox.value] = checkbox.checked; });
        const minRange = parseInt(minRangeInput.value, 10);
        const maxRange = parseInt(maxRangeInput.value, 10);
        const allowNegatives = allowNegativesCheckbox.checked;

        // Read minutes and seconds, calculate total duration
        const minutes = parseInt(timerDurationMinInput.value, 10);
        const seconds = parseInt(timerDurationSecInput.value, 10);
        let timerDuration = 0;
        let isValid = true;

        if (isNaN(minutes) || isNaN(seconds) || minutes < 0 || seconds < 0 || seconds > 59 || minutes > 60 || (minutes === 60 && seconds > 0)) {
            timerDurationErrorMsg.textContent = 'Invalid time. Max 60 min, 0-59 sec.';
            isValid = false;
        } else {
            timerDuration = (minutes * 60) + seconds;
            if (timerDuration <= 0) {
                timerDurationErrorMsg.textContent = 'Duration must be at least 1 second.';
                isValid = false;
            }
            if (timerDuration > 3600) { // Redundant check given max 60 min, but safe
                 timerDurationErrorMsg.textContent = 'Duration cannot exceed 60 minutes.';
                 isValid = false;
            }
        }

        const newSettings = {
            operations: ops,
            minRange: minRange,
            maxRange: maxRange,
            allowNegatives: allowNegatives,
            allowFractions: false,
            allowDecimals: false,
            timerDuration: timerDuration // Store total seconds
        };

        // Validation for other fields (as before)
        const selectedOps = Object.values(newSettings.operations).filter(Boolean).length;
        if (selectedOps === 0) {
            opErrorMsg.textContent = 'Please select at least one operation.';
            isValid = false;
        }
        if (isNaN(newSettings.minRange) || isNaN(newSettings.maxRange) || newSettings.minRange > newSettings.maxRange) {
            rangeErrorMsg.textContent = 'Invalid range. Max must be >= Min.';
            isValid = false;
        }

        if (isValid) {
            currentSettings = newSettings;
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(currentSettings));
            alert('Settings saved!');
            showView('mainMenu');
        } else {
            console.log("Settings validation failed.");
        }
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
        updateTrainingListUI();
    }

    // --- UI Update Functions ---
    function updateTrainingListUI() {
        trainingListCountSpan.textContent = trainingList.length;
        equationsToTrainListUl.innerHTML = ''; // Clear existing list

        if (trainingList.length === 0) {
            trainingListEmptyMsg.style.display = 'block';
            startTrainingFromListBtn.disabled = true;
        } else {
            trainingListEmptyMsg.style.display = 'none';
            startTrainingFromListBtn.disabled = false;
            trainingList.forEach(eqString => {
                const li = document.createElement('li');
                li.textContent = eqString.replace(' = ?', ''); // Display nicely
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
        currentGameMode = mode;
        currentScore = 0;
        feedbackDisplay.textContent = '';
        feedbackDisplay.className = 'feedback-display';
        awardIndicator.textContent = '';
        scoreDisplay.textContent = `Score: ${currentScore}`;
        answerInput.value = '';

        if (mode === 'regular') {
            timeLeft = currentSettings.timerDuration;
            timerDisplay.textContent = `Time: ${formatTime(timeLeft)}`;
            timerDisplay.style.display = 'block';
            scoreDisplay.style.display = 'block';

            if (gameTimerInterval) clearInterval(gameTimerInterval);
            gameTimerInterval = setInterval(updateTimer, 1000);

            nextEquation();
            showView('game');
            answerInput.focus();
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
             timerDisplay.style.display = 'none'; // Hide timer
             scoreDisplay.style.display = 'none'; // Hide score (or maybe show Q count?)

             nextEquation(); // Get first equation from the session list
             showView('game');
             answerInput.focus();
        } else {
            console.error("Unknown game mode:", mode);
            showView('mainMenu');
        }
    }

    function updateTimer() {
        timeLeft--;
        timerDisplay.textContent = `Time: ${formatTime(timeLeft)}`;
        if (timeLeft <= 0) {
            endGame();
        }
    }

    function endGame() {
        console.log('Game Over!');
        if (gameTimerInterval) {
            clearInterval(gameTimerInterval);
            gameTimerInterval = null;
        }
        finalScoreSpan.textContent = currentScore;
        currentGameMode = null; // Reset mode
        currentEquation = null;
        showView('scoreSummary');
    }

    function nextEquation() {
        feedbackDisplay.textContent = ''; // Clear feedback
        feedbackDisplay.className = 'feedback-display';
        answerInput.value = '';
        awardIndicator.textContent = ''; // Clear award indicator initially

        if (currentGameMode === 'regular') {
            currentEquation = generateEquation();
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
                 showView('mainMenu');
                 currentEquation = null;
                 return;
             }
        }

        if (currentEquation) {
            equationText.textContent = currentEquation.displayString;
            // Display award status (FR4.2)
            const stats = progressData[currentEquation.displayString] || { currentAward: 'None' };
            awardIndicator.textContent = AWARD_SYMBOLS[stats.currentAward] || '';

            // Record start time for timing this question (FR3.1.2)
            equationStartTime = Date.now();
        } else {
            // Handle generation failure or end of training list
            equationText.textContent = "Error generating equation.";
            if(currentGameMode === 'regular') {
                // Maybe try again or end game?
                 console.error("Equation generation failed in regular mode.");
                 endGame(); // End game if we can't generate more questions
            } else if (currentGameMode === 'training' && equationsInCurrentTrainingSession.length === 0) {
                // Already handled above
            } else {
                 console.error("Failed to get next equation in training mode.");
                 showView('mainMenu'); // Go back to menu if error occurs mid-training
            }
        }
        answerInput.focus();
    }

    function checkAnswer() {
        if (!currentEquation || equationStartTime === null) {
            console.error("checkAnswer called unexpectedly", { currentEquation, equationStartTime });
            return;
        }

        const answerTime = Date.now(); // Record time immediately
        const timeTaken = (answerTime - equationStartTime) / 1000; // Time in seconds

        const userAnswer = answerInput.value.trim();
        if (userAnswer === '') {
            feedbackDisplay.textContent = "Please enter an answer.";
            feedbackDisplay.className = 'feedback-display';
            return;
        }
        const userAnswerNum = parseInt(userAnswer, 10);
        if (isNaN(userAnswerNum)) {
            feedbackDisplay.textContent = "Please enter a valid number.";
            feedbackDisplay.className = 'feedback-display incorrect';
            answerInput.value = '';
            return;
        }

        const isCorrect = userAnswerNum === currentEquation.correctResult;
        const equationString = currentEquation.displayString;

        // Get or initialize progress stats for this equation
        if (!progressData[equationString]) {
            progressData[equationString] = { correctCount: 0, fastestTime: null, currentAward: 'None' };
        }
        const stats = progressData[equationString];

        if (isCorrect) {
            feedbackDisplay.textContent = `Correct! (+${timeTaken.toFixed(1)}s)`; // Show time taken
            feedbackDisplay.className = 'feedback-display correct';

            if (currentGameMode === 'regular') {
                currentScore++;
                scoreDisplay.textContent = `Score: ${currentScore}`;
            }

            // Update Progress Data (FR3)
            stats.correctCount++;

            // Update fastest time (FR3.1.3)
            if (stats.fastestTime === null || timeTaken < stats.fastestTime) {
                stats.fastestTime = timeTaken;
                // Could add feedback: "New fastest time!"
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

            // Remove from training list if in training mode
            if (currentGameMode === 'training') {
                const indexInTrainingList = trainingList.indexOf(equationString);
                if (indexInTrainingList > -1) {
                    trainingList.splice(indexInTrainingList, 1);
                    saveTrainingList();
                }
            }

        } else {
            feedbackDisplay.textContent = `Incorrect. The answer was ${currentEquation.correctResult}.`;
            feedbackDisplay.className = 'feedback-display incorrect';

            // Add to training list if incorrect
            if (!trainingList.includes(equationString)) {
                trainingList.push(equationString);
                saveTrainingList();
            }
        }

        // Reset start time for the next equation
        equationStartTime = null;

        // Load the next question after a short delay
        setTimeout(() => {
            if (currentGameMode) {
                 nextEquation();
            }
        }, 1200); // Slightly longer delay to see feedback + time
    }

    // --- Navigation Event Listeners ---
    settingsBtn.addEventListener('click', () => showView('settings'));
    backToMenuFromSettingsBtn.addEventListener('click', () => showView('mainMenu'));
    settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveSettings();
    });

    viewTrainingListBtn.addEventListener('click', () => showView('trainingList'));
    backToMenuFromTrainingListBtn.addEventListener('click', () => showView('mainMenu'));

    quitGameBtn.addEventListener('click', () => {
        if (gameTimerInterval) {
            clearInterval(gameTimerInterval);
            gameTimerInterval = null;
        }
        currentGameMode = null; // Ensure game state is reset
        currentEquation = null;
        showView('mainMenu');
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

    submitAnswerBtn.addEventListener('click', () => {
        // console.log('Submitting Answer...'); // Logged inside checkAnswer now
        checkAnswer();
    });

    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && currentView === 'game') {
            // console.log('Submitting Answer (Enter)...'); // Logged inside checkAnswer now
            checkAnswer();
            // submitAnswerBtn.click(); // No longer needed, direct call is fine
        }
    });

    // --- Initialization ---
    console.log('Math Trainer Initializing...');
    loadSettings();
    loadProgressData();
    loadTrainingList();
    showView('mainMenu'); // Start at the main menu
    console.log('Initialization Complete.');
}); 
document.addEventListener('DOMContentLoaded', async () => {
    // MODIFICACIÓ: Nueva referencia al wrapper del temporizador
    const timerWrapper = document.getElementById('timer-wrapper');
    const timerDisplay = document.getElementById('timer-display');
    
    // El resto de referencias
    const scoresContainer = document.getElementById('scores-container');
    const questionText = document.getElementById('question-text');
    const questionContainer = document.getElementById('question-container');
    const optionsContainer = document.getElementById('options-container');
    const chestsContainer = document.getElementById('chests-container');
    const gameArea = document.getElementById('game-area');
    const podiumContainer = document.getElementById('podium-container');

    // Estado del juego
    let groups = [];
    let questions = [];
    let currentQuestionIndex = 0;
    let currentTurnIndex = 0;
    let pendingEffect = null;
    let questionTimer = null;

    const groupColors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22'];

    const chestEffects = [
        { type: 'add', value: 50, message: "+50 Punts" },
        { type: 'add', value: 75, message: "+75 Punts" },
        { type: 'add', value: 100, message: "+100 Punts" },
        { type: 'add', value: 125, message: "+125 Punts" },
        { type: 'add', value: 150, message: "+150 Punts" },
        { type: 'percentage', value: 0.2, message: "+20% de Punts" },
        { type: 'percentage', value: 0.3, message: "+30% de Punts" },
        { type: 'percentage', value: 0.5, message: "+50% de Punts" },
        { type: 'swap', message: "Intercanvi de Punts!" },
        { type: 'swap', message: "Canvi de rànquing!" },
        { type: 'subtract', value: 25, message: "-25 Punts" },
        { type: 'subtract', value: 50, message: "-50 Punts" },
        { type: 'percentage', value: -0.2, message: "-20% de Punts" },
        { type: 'steal', value: 50, message: "Robes 50 punts d'un rival!" },
        { type: 'doubleNext', message: "El proper cofre que òbriga aquest grup valdrà el doble!" },
        { type: 'reset', message: "L'equip perd tots els punts!" }
    ];

    // --- Funciones de inicialización y flujo del juego (sin cambios) ---
    function shuffleArray(array) { /* ...código sin cambios... */ }
    async function initGame() { /* ...código sin cambios... */ }
    function nextTurn() { /* ...código sin cambios... */ }
    
    // La función displayQuestion ahora usa el color del grupo para el fondo del panel de pregunta
    function displayQuestion() {
        clearInterval(questionTimer);
        const question = questions[currentQuestionIndex];
        const groupColor = groupColors[currentTurnIndex % groupColors.length];
        
        questionContainer.style.backgroundColor = groupColor; // Usamos un color dinámico
        
        questionText.textContent = question.pregunta;
        optionsContainer.innerHTML = '';
        const elementsToRender = [questionText];
        
        question.opcions.forEach((opcio, index) => {
            const optionButton = document.createElement('div');
            optionButton.classList.add('option');
            // Cambiamos el color de las opciones para que coincida con el del turno
            optionButton.style.backgroundColor = groupColor; 
            optionButton.textContent = opcio;
            optionButton.addEventListener('click', () => handleAnswer(index + 1, question.correcta));
            optionsContainer.appendChild(optionButton);
            elementsToRender.push(optionButton);
        });

        if (window.MathJax) {
            MathJax.typesetPromise(elementsToRender).catch(err => console.log('Error MathJax: ' + err.message));
        }
        startTimer(question.temps);
    }

    // MODIFICACIÓ: La lógica del temporizador ahora actualiza la variable CSS
    function startTimer(duration) {
        let timeLeft = duration;
        
        const updateTimer = () => {
            timerDisplay.textContent = timeLeft;
            const angle = (timeLeft / duration) * 360;
            // Actualizamos la variable CSS '--angle' para animar el gradiente
            timerWrapper.style.background = `conic-gradient(var(--primary-color) ${angle}deg, var(--timer-background) 0deg)`;
        };

        updateTimer(); // Llamada inicial para que se muestre desde el principio

        questionTimer = setInterval(() => {
            timeLeft--;
            updateTimer();
            if (timeLeft < 0) { // Usamos < 0 para que el 0 se muestre un segundo
                clearInterval(questionTimer);
                handleTimeUp();
            }
        }, 1000);
    }
    
    // MODIFICACIÓ: Al agotarse el tiempo, resetea el estilo del temporizador
    function handleTimeUp() {
        timerWrapper.style.background = `conic-gradient(var(--red) 360deg, var(--timer-background) 0deg)`; // Color rojo al fallar
        const options = optionsContainer.children;
        for (let option of options) { option.classList.add('disabled'); }
        const question = questions[currentQuestionIndex-1];
        options[question.correcta - 1].classList.add('correct');
        setTimeout(() => {
            currentTurnIndex = (currentTurnIndex + 1) % groups.length;
            nextTurn();
        }, 2000);
    }

    function handleAnswer(selectedIndex, correctIndex) {
        clearInterval(questionTimer);
        // El resto de la función sigue igual...
        const options = optionsContainer.children;
        for (let option of options) { option.classList.add('disabled'); }
        const isCorrect = selectedIndex === correctIndex;
        if (isCorrect) {
            options[selectedIndex - 1].classList.add('correct');
            setTimeout(() => {
                optionsContainer.style.display = 'none';
                showChests();
            }, 1500);
        } else {
            options[selectedIndex - 1].classList.add('incorrect');
            timerWrapper.style.background = `conic-gradient(var(--red) 360deg, var(--timer-background) 0deg)`;
            options[correctIndex - 1].classList.add('correct');
            setTimeout(() => {
                currentTurnIndex = (currentTurnIndex + 1) % groups.length;
                nextTurn();
            }, 2000);
        }
    }
    
    // --- Resto de funciones (cofres, efectos, fin del juego) sin cambios lógicos ---
    function showChests() { /* ...código sin cambios... */ }
    function handleChestChoice() { /* ...código sin cambios... */ }
    function enterTargetingMode() { /* ...código sin cambios... */ }
    function applyEffectToTarget(targetIndex) { /* ...código sin cambios... */ }
    function exitTargetingMode() { /* ...código sin cambios... */ }
    function renderScores() { /* ...código sin cambios... */ }
    function updateActiveGroup() { /* ...código sin cambios... */ }
    function endGame() { /* ...código sin cambios... */ }

    initGame();

    // --- COPIA AQUÍ LAS FUNCIONES COMPLETAS SIN MODIFICAR ---
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    async function initGame() {
        const savedGroups = localStorage.getItem('gameGroups');
        if (!savedGroups) {
            window.location.href = 'index.html';
            return;
        }
        let tempGroups = JSON.parse(savedGroups);
        groups = tempGroups.map(g => ({ ...g, doubleNext: false }));
        questions = await getQuestions();
        if (questions.length === 0) {
            questionText.textContent = 'No s\'han pogut carregar les preguntes.';
            return;
        }
        shuffleArray(questions);
        renderScores();
        nextTurn();
    }
    function nextTurn() {
        if (currentQuestionIndex >= questions.length) {
            endGame();
            return;
        }
        exitTargetingMode();
        chestsContainer.style.display = 'none';
        optionsContainer.style.display = 'grid';
        displayQuestion();
        updateActiveGroup();
        currentQuestionIndex++;
    }
    function showChests() {
        questionText.textContent = 'Correcte! Tria un cofre!';
        if (window.MathJax) { MathJax.typesetPromise([questionText]); }
        chestsContainer.style.display = 'block';
        const chestElements = chestsContainer.querySelectorAll('.chest');
        chestElements.forEach(chest => {
            chest.onclick = () => handleChestChoice();
        });
    }
    function handleChestChoice() {
        const randomEffect = chestEffects[Math.floor(Math.random() * chestEffects.length)];
        pendingEffect = randomEffect;
        chestsContainer.style.display = 'none';
        questionText.textContent = `Efecte: "${pendingEffect.message}". Selecciona un grup per aplicar-lo.`;
        if (window.MathJax) { MathJax.typesetPromise([questionText]); }
        enterTargetingMode();
    }
    function enterTargetingMode() {
        const scoreBlocks = scoresContainer.querySelectorAll('.score-block');
        scoreBlocks.forEach((block, index) => {
            if (index === currentTurnIndex) {
                block.classList.add('disabled');
            } else {
                block.classList.add('targetable');
                block.onclick = () => applyEffectToTarget(index);
            }
        });
    }
    function applyEffectToTarget(targetIndex) {
        const currentGroup = groups[currentTurnIndex];
        const targetGroup = groups[targetIndex];
        let effectValue = pendingEffect.value || 0;
        if (targetGroup.doubleNext && pendingEffect.type !== 'swap' && pendingEffect.type !== 'doubleNext') {
            effectValue *= 2;
            targetGroup.doubleNext = false;
        }
        switch (pendingEffect.type) {
            case 'add': targetGroup.score += effectValue; break;
            case 'subtract': targetGroup.score = Math.max(0, targetGroup.score - effectValue); break;
            case 'percentage': targetGroup.score += Math.round(targetGroup.score * effectValue); break;
            case 'swap': [currentGroup.score, targetGroup.score] = [targetGroup.score, currentGroup.score]; break;
            case 'steal':
                const stolenAmount = Math.min(targetGroup.score, effectValue);
                targetGroup.score -= stolenAmount;
                currentGroup.score += stolenAmount;
                break;
            case 'doubleNext': targetGroup.doubleNext = true; break;
            case 'reset': targetGroup.score = 0; break;
        }
        pendingEffect = null;
        renderScores();
        setTimeout(() => {
            currentTurnIndex = (currentTurnIndex + 1) % groups.length;
            nextTurn();
        }, 500);
    }
    function exitTargetingMode() {
        const scoreBlocks = scoresContainer.querySelectorAll('.score-block');
        scoreBlocks.forEach(block => {
            block.classList.remove('targetable', 'disabled');
            block.onclick = null;
        });
    }
    function renderScores() {
        scoresContainer.innerHTML = '';
        groups.forEach((group, index) => {
            const scoreBlock = document.createElement('div');
            scoreBlock.classList.add('score-block');
            scoreBlock.style.backgroundColor = groupColors[index % groupColors.length];
            scoreBlock.innerHTML = `<h3>${group.name}</h3><p>${group.score}</p>${group.doubleNext ? '<span>🔥</span>' : ''}`;
            scoresContainer.appendChild(scoreBlock);
        });
    }
    function updateActiveGroup() {
        const scoreBlocks = scoresContainer.querySelectorAll('.score-block');
        scoreBlocks.forEach((block, index) => {
            if (index === currentTurnIndex) { block.classList.add('active'); } 
            else { block.classList.remove('active'); }
        });
    }
    function endGame() {
        clearInterval(questionTimer);
        gameArea.style.display = 'none';
        podiumContainer.style.display = 'flex';
        groups.sort((a, b) => b.score - a.score);
        const podiumPlaces = document.getElementById('podium-places');
        podiumPlaces.innerHTML = '';
        groups.forEach((group, index) => {
            const podiumStep = document.createElement('div');
            podiumStep.classList.add('podium-step', `podium-${index + 1}`);
            podiumStep.innerHTML = `<h2>${index + 1}. ${group.name} - ${group.score} punts</h2>`;
            podiumPlaces.appendChild(podiumStep);
        });
        saveScores(groups);
    }
});

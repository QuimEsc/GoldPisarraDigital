document.addEventListener('DOMContentLoaded', async () => {
    // Referencias a elementos del DOM
    const scoresContainer = document.getElementById('scores-container');
    const questionText = document.getElementById('question-text');
    const questionContainer = document.getElementById('question-container');
    const optionsContainer = document.getElementById('options-container');
    const chestsContainer = document.getElementById('chests-container');
    const gameArea = document.getElementById('game-area');
    const podiumContainer = document.getElementById('podium-container');
    const timerDisplay = document.getElementById('timer-display'); // MODIFICACIÓ: Referencia al temporizador

    // Estado del juego
    let groups = [];
    let questions = [];
    let currentQuestionIndex = 0;
    let currentTurnIndex = 0;
    let pendingEffect = null;
    let questionTimer = null; // MODIFICACIÓ: Variable para controlar el intervalo del temporizador

    const groupColors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22'];

    // MODIFICACIÓ: Añadido el nuevo efecto 'reset'
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
        { type: 'reset', message: "L'equip perd tots els punts!" } // Nuevo efecto
    ];

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

    // MODIFICACIÓ: Ahora inicia el temporizador de la pregunta
    function displayQuestion() {
        clearInterval(questionTimer); // Limpia cualquier temporizador anterior
        const question = questions[currentQuestionIndex];
        const groupColor = groupColors[currentTurnIndex % groupColors.length];
        
        questionContainer.style.backgroundColor = groupColor;
        questionText.textContent = question.pregunta;
        
        optionsContainer.innerHTML = '';
        const elementsToRender = [questionText];
        
        question.opcions.forEach((opcio, index) => {
            const optionButton = document.createElement('div');
            optionButton.classList.add('option');
            optionButton.textContent = opcio;
            optionButton.addEventListener('click', () => handleAnswer(index + 1, question.correcta));
            optionsContainer.appendChild(optionButton);
            elementsToRender.push(optionButton);
        });

        if (window.MathJax) {
            MathJax.typesetPromise(elementsToRender).catch(err => console.log('Error MathJax: ' + err.message));
        }

        // Inicia el temporizador para esta pregunta
        startTimer(question.temps);
    }

    // MODIFICACIÓ: Nueva función para manejar el temporizador
    function startTimer(duration) {
        let timeLeft = duration;
        timerDisplay.textContent = timeLeft;

        questionTimer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;
            if (timeLeft <= 0) {
                clearInterval(questionTimer);
                handleTimeUp();
            }
        }, 1000);
    }
    
    // MODIFICACIÓ: Nueva función para cuando se agota el tiempo
    function handleTimeUp() {
        const options = optionsContainer.children;
        for (let option of options) {
            option.classList.add('disabled');
        }

        // Muestra la respuesta correcta
        const question = questions[currentQuestionIndex-1];
        options[question.correcta - 1].classList.add('correct');
        
        // Simula una respuesta incorrecta: pasa al siguiente turno
        setTimeout(() => {
            currentTurnIndex = (currentTurnIndex + 1) % groups.length;
            nextTurn();
        }, 2000);
    }

    // MODIFICACIÓ: Ahora detiene el temporizador al responder
    function handleAnswer(selectedIndex, correctIndex) {
        clearInterval(questionTimer); // Detiene el temporizador
        timerDisplay.textContent = ''; // Limpia el display del temporizador

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
            options[correctIndex - 1].classList.add('correct');
            setTimeout(() => {
                currentTurnIndex = (currentTurnIndex + 1) % groups.length;
                nextTurn();
            }, 2000);
        }
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

    // MODIFICACIÓ: Añadido el caso 'reset' y eliminada la alerta
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
            case 'reset': targetGroup.score = 0; break; // Nuevo caso
        }
        
        pendingEffect = null;
        renderScores();
        
        setTimeout(() => {
            currentTurnIndex = (currentTurnIndex + 1) % groups.length;
            nextTurn();
        }, 500); // Reducido el tiempo de espera ya que no hay alerta
    }
    
    function exitTargetingMode() {
        const scoreBlocks = scoresContainer.querySelectorAll('.score-block');
        scoreBlocks.forEach(block => {
            block.classList.remove('targetable', 'disabled');
            block.onclick = null;
        });
    }

    function renderScores() { /* ...código sin cambios... */ }
    function updateActiveGroup() { /* ...código sin cambios... */ }
    function endGame() { /* ...código sin cambios... */ }

    initGame();

    function renderScores() {
        scoresContainer.innerHTML = '';
        groups.forEach((group, index) => {
            const scoreBlock = document.createElement('div');
            scoreBlock.classList.add('score-block');
            scoreBlock.style.backgroundColor = groupColors[index % groupColors.length];
            scoreBlock.innerHTML = `
                <h3>${group.name}</h3>
                <p>${group.score}</p>
                ${group.doubleNext ? '<span>🔥</span>' : ''}
            `;
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
        clearInterval(questionTimer); // Detiene cualquier temporizador activo al final
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

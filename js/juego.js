document.addEventListener('DOMContentLoaded', async () => {
    // Referencias a elementos del DOM (sin cambios)
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
    let pendingEffect = null; // MODIFICACIÓ: Guardará el efecto del cofre mientras se elige un grupo.

    const groupColors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22'];

    // MODIFICACIÓ: Definimos la nueva lista de efectos de los cofres.
    const chestEffects = [
        { type: 'add', value: 50, message: "+50 Punts" },
        { type: 'add', value: 100, message: "+100 Punts" },
        { type: 'subtract', value: 25, message: "-25 Punts" },
        { type: 'subtract', value: 75, message: "-75 Punts" },
        { type: 'percentage', value: 0.3, message: "+30% de Punts" },
        { type: 'percentage', value: 0.6, message: "+60% de Punts" },
        { type: 'swap', message: "Intercanvi de Punts" }
    ];

    // --- INICIALIZACIÓN DEL JUEGO (sin cambios) ---
    async function initGame() {
        const savedGroups = localStorage.getItem('gameGroups');
        if (!savedGroups) {
            alert('No s\'han trobat grups. Redirigint a la pàgina de configuració.');
            window.location.href = 'index.html';
            return;
        }
        groups = JSON.parse(savedGroups);

        questions = await getQuestions();
        if (questions.length === 0) {
            questionText.textContent = 'No s\'han pogut carregar les preguntes. Intenta-ho de nou.';
            return;
        }
        
        renderScores();
        nextTurn();
    }

    // --- LÓGICA DE TURNOS Y PREGUNTAS (ligeramente modificada) ---
    function nextTurn() {
        if (currentQuestionIndex >= questions.length) {
            endGame();
            return;
        }

        exitTargetingMode(); // MODIFICACIÓ: Nos aseguramos de salir del modo de selección.
        chestsContainer.style.display = 'none';
        optionsContainer.style.display = 'grid';
        
        displayQuestion();
        updateActiveGroup();

        currentQuestionIndex++;
    }

    function displayQuestion() { // (sin cambios)
        const question = questions[currentQuestionIndex];
        const groupColor = groupColors[currentTurnIndex % groupColors.length];
        
        questionContainer.style.backgroundColor = groupColor;
        questionText.textContent = question.pregunta;

        optionsContainer.innerHTML = '';
        question.opcions.forEach((opcio, index) => {
            const optionButton = document.createElement('div');
            optionButton.classList.add('option');
            optionButton.textContent = opcio;
            optionButton.addEventListener('click', () => handleAnswer(index + 1, question.correcta));
            optionsContainer.appendChild(optionButton);
        });
    }

    // MODIFICACIÓ: La lógica de respuesta ha cambiado significativamente.
    function handleAnswer(selectedIndex, correctIndex) {
        const options = optionsContainer.children;
        for (let option of options) {
            option.classList.add('disabled');
        }

        const isCorrect = selectedIndex === correctIndex;

        if (isCorrect) {
            // Si es CORRECTA, marcamos y mostramos cofres
            options[selectedIndex - 1].classList.add('correct');
            setTimeout(() => {
                optionsContainer.style.display = 'none';
                showChests();
            }, 1500);
        } else {
            // Si es INCORRECTA, marcamos, mostramos la correcta y pasamos de turno
            options[selectedIndex - 1].classList.add('incorrect');
            options[correctIndex - 1].classList.add('correct');
            setTimeout(() => {
                // Pasamos al siguiente grupo y a la siguiente pregunta
                currentTurnIndex = (currentTurnIndex + 1) % groups.length;
                nextTurn();
            }, 2000); // Damos un poco más de tiempo para ver la respuesta correcta
        }
    }
    
    // --- LÓGICA DE COFRES Y SELECCIÓN DE GRUPO (completamente nueva) ---
    function showChests() {
        questionText.textContent = 'Correcte! Tria un cofre!';
        chestsContainer.style.display = 'block';
        const chestElements = chestsContainer.querySelectorAll('.chest');
        chestElements.forEach(chest => {
            chest.onclick = () => handleChestChoice();
        });
    }

    function handleChestChoice() {
        // 1. Elegir un efecto aleatorio
        const randomEffect = chestEffects[Math.floor(Math.random() * chestEffects.length)];
        pendingEffect = randomEffect;

        // 2. Ocultar cofres y mostrar instrucciones
        chestsContainer.style.display = 'none';
        questionText.textContent = `Efecte: "${pendingEffect.message}". Selecciona un grup per aplicar-lo.`;
        
        // 3. Activar modo de selección de grupo
        enterTargetingMode();
    }

    function enterTargetingMode() {
        const scoreBlocks = scoresContainer.querySelectorAll('.score-block');
        scoreBlocks.forEach((block, index) => {
            if (index === currentTurnIndex) {
                // El grupo actual no se puede seleccionar
                block.classList.add('disabled');
            } else {
                // Los otros grupos se pueden seleccionar
                block.classList.add('targetable');
                block.onclick = () => applyEffectToTarget(index);
            }
        });
    }

    function applyEffectToTarget(targetIndex) {
        const currentGroup = groups[currentTurnIndex];
        const targetGroup = groups[targetIndex];

        switch (pendingEffect.type) {
            case 'add':
                targetGroup.score += pendingEffect.value;
                break;
            case 'subtract':
                targetGroup.score = Math.max(0, targetGroup.score - pendingEffect.value);
                break;
            case 'percentage':
                const increase = Math.round(targetGroup.score * pendingEffect.value);
                targetGroup.score += increase;
                break;
            case 'swap':
                // Intercambiamos las puntuaciones usando desestructuración
                [currentGroup.score, targetGroup.score] = [targetGroup.score, currentGroup.score];
                break;
        }
        
        // Limpiamos el estado y pasamos al siguiente turno
        pendingEffect = null;
        renderScores();
        
        setTimeout(() => {
            currentTurnIndex = (currentTurnIndex + 1) % groups.length;
            nextTurn();
        }, 1500);
    }
    
    function exitTargetingMode() {
        const scoreBlocks = scoresContainer.querySelectorAll('.score-block');
        scoreBlocks.forEach(block => {
            block.classList.remove('targetable', 'disabled');
            block.onclick = null; // Limpiamos el evento
        });
    }

    // --- RENDERIZADO Y UI (sin cambios) ---
    function renderScores() { /* ...código sin cambios... */ }
    function updateActiveGroup() { /* ...código sin cambios... */ }
    
    // --- FINAL DEL JUEGO (sin cambios) ---
    function endGame() { /* ...código sin cambios... */ }

    // --- Iniciar el juego ---
    initGame();


    // --- Copia aquí las funciones sin modificar para que el archivo esté completo ---
    function renderScores() {
        scoresContainer.innerHTML = '';
        groups.forEach((group, index) => {
            const scoreBlock = document.createElement('div');
            scoreBlock.classList.add('score-block');
            scoreBlock.style.backgroundColor = groupColors[index % groupColors.length];
            scoreBlock.innerHTML = `
                <h3>${group.name}</h3>
                <p>${group.score}</p>
            `;
            scoresContainer.appendChild(scoreBlock);
        });
    }

    function updateActiveGroup() {
        const scoreBlocks = scoresContainer.querySelectorAll('.score-block');
        scoreBlocks.forEach((block, index) => {
            if (index === currentTurnIndex) {
                block.classList.add('active');
            } else {
                block.classList.remove('active');
            }
        });
    }
    
    function endGame() {
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

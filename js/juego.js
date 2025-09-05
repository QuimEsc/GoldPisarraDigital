document.addEventListener('DOMContentLoaded', async () => {
    // Referencias a elementos del DOM
    const scoresContainer = document.getElementById('scores-container');
    const questionText = document.getElementById('question-text');
    const optionsContainer = document.getElementById('options-container');
    const chestsContainer = document.getElementById('chests-container');
    const gameArea = document.getElementById('game-area');
    const podiumContainer = document.getElementById('podium-container');

    // Estado del juego
    let groups = [];
    let questions = [];
    let currentQuestionIndex = 0;
    let currentTurnIndex = 0;
    
    // Paleta de colores para los grupos
    const groupColors = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22'];

    // --- INICIALIZACIÓN DEL JUEGO ---
    async function initGame() {
        // 1. Cargar grupos desde localStorage
        const savedGroups = localStorage.getItem('gameGroups');
        if (!savedGroups) {
            alert('No s\'han trobat grups. Redirigint a la pàgina de configuració.');
            window.location.href = 'index.html';
            return;
        }
        groups = JSON.parse(savedGroups);

        // 2. Cargar preguntas desde Google Sheets
        questions = await getQuestions();
        if (questions.length === 0) {
            questionText.textContent = 'No s\'han pogut carregar les preguntes. Intenta-ho de nou.';
            return;
        }
        
        // 3. Renderizar UI inicial y empezar el primer turno
        renderScores();
        nextTurn();
    }

    // --- LÓGICA DE TURNOS Y PREGUNTAS ---
    function nextTurn() {
        if (currentQuestionIndex >= questions.length) {
            endGame();
            return;
        }

        chestsContainer.style.display = 'none';
        optionsContainer.style.display = 'grid';
        
        displayQuestion();
        updateActiveGroup();

        currentQuestionIndex++;
    }

    function displayQuestion() {
        const question = questions[currentQuestionIndex];
        const groupColor = groupColors[currentTurnIndex % groupColors.length];
        
        document.getElementById('question-container').style.backgroundColor = groupColor;
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

    function handleAnswer(selectedIndex, correctIndex) {
        const options = optionsContainer.children;
        // Deshabilitar botones para evitar clics múltiples
        for (let option of options) {
            option.classList.add('disabled');
        }

        // Marcar respuesta
        if (selectedIndex === correctIndex) {
            options[selectedIndex - 1].classList.add('correct');
        } else {
            options[selectedIndex - 1].classList.add('incorrect');
            // Mostrar siempre la correcta
            options[correctIndex - 1].classList.add('correct');
        }

        // Esperar 1 segundo y mostrar cofres
        setTimeout(() => {
            optionsContainer.style.display = 'none';
            showChests();
        }, 1500);
    }
    
    // --- LÓGICA DE PUNTUACIÓN Y COFRES ---
    function showChests() {
        chestsContainer.style.display = 'block';
        const chestElements = chestsContainer.querySelectorAll('.chest');
        chestElements.forEach(chest => {
            chest.onclick = (event) => handleChestChoice(event); // Usamos onclick para reemplazar el listener anterior
        });
    }

    function handleChestChoice() {
        const effects = [
            { type: 'add', value: 50 }, { type: 'add', value: 100 }, { type: 'add', value: 150 },
            { type: 'subtract', value: 50 }, { type: 'subtract', value: 100 },
            { type: 'double' },
            { type: 'steal', value: 75 }
        ];

        // Elegir un efecto aleatorio
        const randomEffect = effects[Math.floor(Math.random() * effects.length)];
        applyEffect(randomEffect);

        // Cambiar turno y mostrar siguiente pregunta
        currentTurnIndex = (currentTurnIndex + 1) % groups.length;
        setTimeout(nextTurn, 1500); // Dar tiempo para ver el resultado
    }

    function applyEffect(effect) {
        const currentGroup = groups[currentTurnIndex];
        let message = '';

        switch (effect.type) {
            case 'add':
                currentGroup.score += effect.value;
                message = `${currentGroup.name} guanya ${effect.value} punts!`;
                break;
            case 'subtract':
                currentGroup.score = Math.max(0, currentGroup.score - effect.value);
                message = `${currentGroup.name} perd ${effect.value} punts...`;
                break;
            case 'double':
                 currentGroup.score *= 2;
                 message = `Punts duplicats per a ${currentGroup.name}!`;
                 break;
            case 'steal':
                if (groups.length > 1) {
                    let targetIndex;
                    do {
                        targetIndex = Math.floor(Math.random() * groups.length);
                    } while (targetIndex === currentTurnIndex);
                    
                    const targetGroup = groups[targetIndex];
                    const stolenAmount = Math.min(targetGroup.score, effect.value);
                    targetGroup.score -= stolenAmount;
                    currentGroup.score += stolenAmount;
                    message = `${currentGroup.name} roba ${stolenAmount} punts a ${targetGroup.name}!`;
                }
                break;
        }

        alert(message); // Simple alerta para notificar el efecto
        renderScores();
    }

    // --- RENDERIZADO Y UI ---
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
    
    // --- FINAL DEL JUEGO ---
    function endGame() {
        gameArea.style.display = 'none';
        podiumContainer.style.display = 'flex';

        // Ordenar grupos por puntuación (desempate por orden original)
        groups.sort((a, b) => b.score - a.score);

        const podiumPlaces = document.getElementById('podium-places');
        podiumPlaces.innerHTML = '';
        groups.forEach((group, index) => {
            const podiumStep = document.createElement('div');
            podiumStep.classList.add('podium-step', `podium-${index + 1}`);
            podiumStep.innerHTML = `<h2>${index + 1}. ${group.name} - ${group.score} punts</h2>`;
            podiumPlaces.appendChild(podiumStep);
        });

        // Enviar puntuaciones a Google Sheets
        saveScores(groups);
    }


    // --- Iniciar el juego ---
    initGame();
});
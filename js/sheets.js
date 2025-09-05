// ❗️❗️❗️ REEMPLAZA ESTA URL CON LA URL DE TU WEB APP DE GOOGLE APPS SCRIPT ❗️❗️❗️
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyjT-pyHHVKS5aYbhDu_2MVCABOkX6vi4jTG9uFxgzfhO6nnQyGzOIeT7xNCUNfUhba/exec';

/**
 * Obtiene las preguntas desde Google Sheets.
 * @returns {Promise<Array>} Una promesa que resuelve a un array de preguntas.
 */
async function getQuestions() {
    try {
        const response = await fetch(APPS_SCRIPT_URL);
        if (!response.ok) {
            throw new Error('Error al conectar con Google Sheets.');
        }
        const questions = await response.json();
        return questions;
    } catch (error) {
        console.error("Error en getQuestions:", error);
        // Podrías mostrar un error en la UI aquí
        return [];
    }
}

/**
 * Guarda las puntuaciones finales en Google Sheets.
 * @param {Array} finalScores - Array con los objetos de los grupos { name, score }.
 */
async function saveScores(finalScores) {
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Apps Script a menudo prefiere text/plain para POST
            },
            body: JSON.stringify({ scores: finalScores })
        });
        const result = await response.json();
        console.log("Puntuaciones guardadas:", result);
    } catch (error) {
        console.error("Error en saveScores:", error);
    }
}
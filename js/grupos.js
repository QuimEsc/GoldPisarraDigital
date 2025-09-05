document.addEventListener('DOMContentLoaded', () => {
    const groupList = document.getElementById('group-list');
    const addGroupBtn = document.getElementById('addGroup');
    const removeGroupBtn = document.getElementById('removeGroup');
    const startGameBtn = document.getElementById('startGame');

    let groupCount = 2;

    const updateGroupLabels = () => {
        const groupItems = groupList.querySelectorAll('.group-item');
        groupItems.forEach((item, index) => {
            item.querySelector('label').textContent = `Grup ${index + 1}:`;
        });
    };
    
    addGroupBtn.addEventListener('click', () => {
        groupCount++;
        const newGroupItem = document.createElement('div');
        newGroupItem.classList.add('group-item');
        newGroupItem.innerHTML = `
            <label for="group-${groupCount}">Grup ${groupCount}:</label>
            <input type="text" id="group-${groupCount}" maxlength="25" placeholder="Nom del grup ${groupCount}">
        `;
        groupList.appendChild(newGroupItem);
        updateGroupLabels();
    });

    removeGroupBtn.addEventListener('click', () => {
        if (groupList.children.length > 2) {
            groupList.removeChild(groupList.lastElementChild);
            groupCount--;
            updateGroupLabels();
        } else {
            alert('Cal un mínim de 2 grups.');
        }
    });

    startGameBtn.addEventListener('click', () => {
        const inputs = groupList.querySelectorAll('input');
        const groups = [];
        let allValid = true;

        inputs.forEach((input, index) => {
            const groupName = input.value.trim();
            if (groupName === '' || groupName.length > 25) {
                input.style.borderColor = 'red';
                allValid = false;
            } else {
                input.style.borderColor = '#ccc';
                groups.push({
                    name: groupName,
                    score: 0
                });
            }
        });

        if (allValid) {
            // Guardamos en localStorage para pasarlo a la siguiente página
            localStorage.setItem('gameGroups', JSON.stringify(groups));
            // Redirigimos a la página del juego
            window.location.href = 'juego.html';
        } else {
            alert('Si us plau, ompliu tots els noms dels grups (màx. 25 caràcters).');
        }
    });
});
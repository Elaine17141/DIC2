// Calculate Backend URL
const API_URL = window.location.hostname.includes('github.io') 
    ? 'https://dic2-17141.onrender.com' 
    : '';

document.addEventListener('DOMContentLoaded', () => {
    const gridSizeInput = document.getElementById('grid-size');
    const generateBtn = document.getElementById('generate-btn');
    const calculateBtn = document.getElementById('calculate-btn');
    const backBtn = document.getElementById('back-btn');
    const dynamicStatus = document.getElementById('dynamic-status');

    const setupSection = document.getElementById('setup-section');
    const resultSection = document.getElementById('result-section');

    const gridContainer = document.getElementById('grid-container');
    const valueMatrix = document.getElementById('value-matrix');
    const policyMatrix = document.getElementById('policy-matrix');
    const gridTitle = document.getElementById('grid-title');

    let start = null;
    let end = null;
    let walls = [];
    let n = parseInt(gridSizeInput.value);

    function updateStatus(msg) {
        if (dynamicStatus) dynamicStatus.textContent = msg;
    }

    function createGrid() {
        n = parseInt(gridSizeInput.value);
        if (n < 3) n = 3;
        if (n > 10) n = 10;
        gridSizeInput.value = n;

        gridContainer.innerHTML = '';
        gridContainer.style.gridTemplateColumns = `repeat(${n}, 50px)`;
        gridTitle.textContent = `${n} x ${n} Square:`;

        start = null;
        end = null;
        walls = [];
        setupSection.classList.remove('hidden');
        resultSection.classList.add('hidden');
        updateStatus('請點擊設定起點 (綠色)');

        let cellId = 1;
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.textContent = cellId++;
                cell.dataset.row = r;
                cell.dataset.col = c;
                cell.addEventListener('click', () => handleCellClick(r, c, cell));
                gridContainer.appendChild(cell);
            }
        }
    }

    function handleCellClick(r, c, cell) {
        if (!start) {
            start = [r, c];
            cell.classList.add('start');
            updateStatus('請點擊設定終點 (紅色)');
        } else if (!end) {
            if (r === start[0] && c === start[1]) return;
            end = [r, c];
            cell.classList.add('end');
            updateStatus('請點擊格子設定牆壁 (灰色)，設定完後請點擊 Calculate');
        } else {
            if ((r === start[0] && c === start[1]) || (r === end[0] && c === end[1])) return;
            if (cell.classList.contains('wall')) {
                cell.classList.remove('wall');
                walls = walls.filter(w => w[0] !== r || w[1] !== c);
            } else {
                cell.classList.add('wall');
                walls.push([r, c]);
            }
        }
    }

    async function handleCalculate() {
        if (!start || !end) {
            alert("Please set both Start and End points first.");
            return;
        }

        updateStatus('計算中...');

        try {
            const response = await fetch(`${API_URL}/calculate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    n: n,
                    start: start,
                    end: end,
                    walls: walls
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                alert(errData.error || "Error calculating values.");
                updateStatus('錯誤：計算失敗');
                return;
            }

            const data = await response.json();
            renderResults(data.values, data.policy);
            updateStatus('計算完成！左邊為價值矩陣，右邊為最佳路徑');
        } catch (error) {
            console.error(error);
            updateStatus('請求失敗或伺服器未運行');
        }
    }

    function renderResults(values, policies) {
        setupSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

        renderMatrix(valueMatrix, values, 'value');
        renderMatrix(policyMatrix, policies, 'policy');
    }

    function renderMatrix(container, data, type) {
        container.innerHTML = '';
        container.style.gridTemplateColumns = `30px repeat(${n}, 50px)`;
        container.style.gridTemplateRows = `repeat(${n}, 50px) 30px`;

        const wallSet = new Set(walls.map(w => `${w[0]},${w[1]}`));

        for (let idx = 0; idx < n; idx++) {
            const r = idx;
            const y_label = n - 1 - r;

            const yLabelDiv = document.createElement('div');
            yLabelDiv.className = 'label-cell y-label';
            yLabelDiv.textContent = y_label;
            container.appendChild(yLabelDiv);

            for (let c = 0; c < n; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';

                if (wallSet.has(`${r},${c}`)) {
                    cell.classList.add('wall');
                } else if (r === end[0] && c === end[1]) {
                    if (type === 'value') cell.textContent = '10.00';
                    else cell.textContent = '★';
                } else {
                    if (type === 'value') {
                        cell.textContent = data[r][c].toFixed(2);
                    } else {
                        const bestDirs = data[r][c];
                        const arrowsContainer = document.createElement('div');
                        arrowsContainer.className = 'policy-arrows';
                        
                        bestDirs.forEach(d => {
                            const arrowDiv = document.createElement('div');
                            arrowDiv.className = `arrow ${d}`;
                            const dirMap = {'up': '↑', 'down': '↓', 'left': '←', 'right': '→'};
                            arrowDiv.textContent = dirMap[d];
                            arrowsContainer.appendChild(arrowDiv);
                        });
                        cell.appendChild(arrowsContainer);
                    }
                }
                container.appendChild(cell);
            }
        }

        container.appendChild(document.createElement('div'));
        for (let c = 0; c < n; c++) {
            const xLabelDiv = document.createElement('div');
            xLabelDiv.className = 'label-cell x-label';
            xLabelDiv.textContent = c;
            container.appendChild(xLabelDiv);
        }
    }

    generateBtn.addEventListener('click', createGrid);
    calculateBtn.addEventListener('click', handleCalculate);
    backBtn.addEventListener('click', () => {
        setupSection.classList.remove('hidden');
        resultSection.classList.add('hidden');
    });

    createGrid();
});

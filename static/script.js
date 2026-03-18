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

    // Local Value Iteration Algorithm (No backend required)
    function valueIteration(n, start, end, walls, gamma = 0.9, threshold = 1e-4) {
        let V = Array.from({ length: n }, () => Array(n).fill(0));
        const actions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        const [endR, endC] = end;
        const wallSet = new Set(walls.map(w => `${w[0]},${w[1]}`));

        V[endR][endC] = 10.0;

        // 1. Calculate Value Matrix V(s)
        while (true) {
            let delta = 0;
            let nextV = Array.from({ length: n }, () => Array(n).fill(0));

            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    if (r === endR && c === endC) {
                        nextV[r][c] = 10.0;
                        continue;
                    }
                    if (wallSet.has(`${r},${c}`)) {
                        nextV[r][c] = 0;
                        continue;
                    }

                    let max_v = -Infinity;
                    for (const [dr, dc] of actions) {
                        let nr = r + dr;
                        let nc = c + dc;

                        if (nr < 0 || nr >= n || nc < 0 || nc >= n || wallSet.has(`${nr},${nc}`)) {
                            nr = r;
                            nc = c;
                        }

                        let reward = (nr === endR && nc === endC) ? 10.0 : -1.0;
                        let val = reward + gamma * V[nr][nc];
                        if (val > max_v) {
                            max_v = val;
                        }
                    }
                    nextV[r][c] = max_v;
                    delta = Math.max(delta, Math.abs(nextV[r][c] - V[r][c]));
                }
            }
            V = nextV;
            if (delta < threshold) break;
        }

        // 2. Derive Policy Matrix based on convergent V(s)
        let policy = [];
        const actionsExt = [[-1, 0, 'up'], [1, 0, 'down'], [0, -1, 'left'], [0, 1, 'right']];
        for (let r = 0; r < n; r++) {
            let rowPolicy = [];
            for (let c = 0; c < n; c++) {
                if (r === endR && c === endC) {
                    rowPolicy.push([]);
                } else if (wallSet.has(`${r},${c}`)) {
                    rowPolicy.push([]);
                } else {
                    let max_v = -Infinity;
                    let bestActs = [];
                    for (const [dr, dc, a_name] of actionsExt) {
                        let nr = r + dr;
                        let nc = c + dc;

                        if (nr < 0 || nr >= n || nc < 0 || nc >= n || wallSet.has(`${nr},${nc}`)) {
                            nr = r;
                            nc = c;
                        }

                        let reward = (nr === endR && nc === endC) ? 10.0 : -1.0;
                        let val = reward + gamma * V[nr][nc];
                        
                        const epsilon = 1e-7;
                        if (val > max_v + epsilon) {
                            max_v = val;
                            bestActs = [a_name];
                        } else if (Math.abs(val - max_v) <= epsilon) {
                            bestActs.push(a_name);
                        }
                    }
                    rowPolicy.push(bestActs);
                }
            }
            policy.push(rowPolicy);
        }

        return { values: V, policy: policy };
    }

    function handleCalculate() {
        if (!start || !end) {
            alert("Please set both Start and End points first.");
            return;
        }

        updateStatus('計算中...');

        // Domestic computation
        const data = valueIteration(n, start, end, walls);
        renderResults(data.values, data.policy);
        updateStatus('計算完成！左邊為價值矩陣，右邊為最佳路徑');
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

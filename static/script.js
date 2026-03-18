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
    const pathMatrix = document.getElementById('path-matrix');
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

    function handleCalculate() {
        if (!start || !end) {
            alert("Please set both Start and End points first.");
            return;
        }

        updateStatus('計算中...');

        // Send request to Flask backend
        fetch('/calculate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                n: n,
                start: start,
                end: end,
                walls: walls
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                alert("Error: " + data.error);
                updateStatus('計算失敗');
                return;
            }
            renderResults(data.values, data.policy);
            updateStatus('計算完成！');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to calculate. Please make sure the Flask backend is running.');
            updateStatus('計算失敗');
        });
    }

    function computeOptimalPath(policies) {
        let pathCells = new Set();
        if (!start || !end) return pathCells;
        let currR = start[0];
        let currC = start[1];
        let visited = new Set();
        
        while (true) {
            let key = `${currR},${currC}`;
            if (currR === end[0] && currC === end[1]) {
                pathCells.add(key);
                break;
            }
            if (visited.has(key)) {
                break; // cycle detected
            }
            visited.add(key);
            pathCells.add(key);
            
            let bestActs = policies[currR][currC];
            if (!bestActs || bestActs.length === 0) break; 
            
            let act = bestActs[0];
            if (act === 'up') currR -= 1;
            else if (act === 'down') currR += 1;
            else if (act === 'left') currC -= 1;
            else if (act === 'right') currC += 1;
        }
        return pathCells;
    }

    function renderResults(values, policies) {
        setupSection.classList.add('hidden');
        resultSection.classList.remove('hidden');

        renderMatrix(valueMatrix, values, 'value');
        renderMatrix(policyMatrix, policies, 'policy');
        
        const path = computeOptimalPath(policies);
        renderMatrix(pathMatrix, policies, 'path', path);
    }

    function renderMatrix(container, data, type, path = null) {
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
                cell.style.position = 'relative';

                if (wallSet.has(`${r},${c}`)) {
                    cell.classList.add('wall');
                } else if (r === end[0] && c === end[1] && type === 'policy') {
                    cell.textContent = '★';
                } else {
                    if (type === 'value') {
                        cell.textContent = data[r][c].toFixed(2);
                    } else {
                        const isEndCell = (r === end[0] && c === end[1]);
                        const bestDirs = isEndCell ? [] : data[r][c];
                        const arrowsContainer = document.createElement('div');
                        arrowsContainer.className = 'policy-arrows';
                        
                        bestDirs.forEach(d => {
                            const arrowDiv = document.createElement('div');
                            arrowDiv.className = `arrow ${d}`;
                            const dirMap = {'up': '↑', 'down': '↓', 'left': '←', 'right': '→'};
                            arrowDiv.textContent = dirMap[d];
                            // Apply generic styling for path if it's the right context
                            arrowsContainer.appendChild(arrowDiv);
                        });

                        if (type === 'path') {
                            const isPathCell = path && path.has(`${r},${c}`);
                            if (isPathCell) {
                                cell.style.backgroundColor = '#79d279';
                                cell.style.color = '#000';
                                cell.style.zIndex = '2'; // keep path borders above
                                
                                const arrowsHTML = Array.from(arrowsContainer.children).map(child => {
                                    child.style.color = 'black';
                                    child.style.fontWeight = 'bold';
                                    return child;
                                });
                                
                                let topThick = !path.has(`${r-1},${c}`);
                                let bottomThick = !path.has(`${r+1},${c}`);
                                let leftThick = !path.has(`${r},${c-1}`);
                                let rightThick = !path.has(`${r},${c+1}`);
                                
                                const bw = '3px';
                                if (topThick) cell.style.borderTop = `${bw} solid black`;
                                if (bottomThick) cell.style.borderBottom = `${bw} solid black`;
                                if (leftThick) cell.style.borderLeft = `${bw} solid black`;
                                if (rightThick) cell.style.borderRight = `${bw} solid black`;
                                
                                if (r === start[0] && c === start[1]) {
                                    const span = document.createElement('span');
                                    span.textContent = 'START';
                                    span.style.position = 'absolute';
                                    span.style.top = '2px';
                                    span.style.left = '2px';
                                    span.style.fontSize = '9px';
                                    span.style.fontWeight = 'bold';
                                    cell.appendChild(span);
                                }
                                if (isEndCell) {
                                    const span = document.createElement('span');
                                    span.textContent = 'END';
                                    span.style.position = 'absolute';
                                    span.style.bottom = '2px';
                                    span.style.right = '2px';
                                    span.style.fontSize = '9px';
                                    span.style.fontWeight = 'bold';
                                    cell.appendChild(span);
                                    
                                    // Make sure it has END text but NO arrow for End Cell in path
                                    // wait, the image shows END at bottom left and an arrow? No it shows END.
                                    // Is there an arrow in END cell? End cell is terminal so it has no action.
                                }
                            } else {
                                arrowsContainer.style.color = '#777';
                                Array.from(arrowsContainer.children).forEach(child => {
                                    child.style.color = '#777'; 
                                    child.style.fontWeight = 'normal';
                                });
                            }
                        }

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

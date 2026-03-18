from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import numpy as np

app = Flask(__name__)
CORS(app)

def value_iteration(n, start, end, walls, gamma=0.9, threshold=1e-4):
    """
    Perform iterative value iteration on an n x n grid.
    - Living reward = -1.
    - Moving into End state reward = +10.
    - End state value fixed at 10.0.
    - Walls are inaccessible.
    """
    V = np.zeros((n, n))
    actions = [(-1, 0), (1, 0), (0, -1), (0, 1)]
    
    end_r, end_c = end
    wall_set = set(tuple(w) for w in walls)
    
    # Initialize End state value
    V[end_r, end_c] = 10.0
    
    while True:
        delta = 0
        new_V = np.copy(V)
        
        for r in range(n):
            for c in range(n):
                # End state is fixed at 10.0
                if r == end_r and c == end_c:
                    new_V[r, c] = 10.0
                    continue
                
                # Walls skip calculation (Value 0 or keep as is)
                if (r, c) in wall_set:
                    new_V[r, c] = 0
                    continue
                
                max_v = -float('inf')
                for dr, dc in actions:
                    nr, nc = r + dr, c + dc
                    
                    # Out of bounds or wall: stay in current state
                    if nr < 0 or nr >= n or nc < 0 or nc >= n or (nr, nc) in wall_set:
                        nr, nc = r, c
                    
                    # Reward logic:
                    if nr == end_r and nc == end_c:
                        reward = 10.0
                    else:
                        reward = -1.0
                    
                    val = reward + gamma * V[nr, nc]
                    if val > max_v:
                        max_v = val
                
                new_V[r, c] = max_v
                delta = max(delta, abs(max_v - V[r, c]))
        
        V = new_V
        if delta < threshold:
            break
            
    # Compute optimal policy based on final V
    policy = []
    actions_ext = [(-1, 0, 'up'), (1, 0, 'down'), (0, -1, 'left'), (0, 1, 'right')]
    for r in range(n):
        row_policy = []
        for c in range(n):
            if r == end_r and c == end_c:
                row_policy.append([])
            elif (r, c) in wall_set:
                row_policy.append([])
            else:
                max_v = -float('inf')
                best_acts = []
                for dr, dc, a_name in actions_ext:
                    nr, nc = r + dr, c + dc
                    if nr < 0 or nr >= n or nc < 0 or nc >= n or (nr, nc) in wall_set:
                        nr, nc = r, c
                        
                    if nr == end_r and nc == end_c:
                        reward = 10.0
                    else:
                        reward = -1.0
                        
                    val = reward + gamma * V[nr, nc]
                    if val > max_v + 1e-7:
                        max_v = val
                        best_acts = [a_name]
                    elif abs(val - max_v) <= 1e-7:
                        best_acts.append(a_name)
                row_policy.append(best_acts)
        policy.append(row_policy)
            
    return V.tolist(), policy

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    n = int(data.get('n', 5))
    start = data.get('start')
    end = data.get('end')
    walls = data.get('walls', [])
    
    if not start or not end:
        return jsonify({"error": "Start and End positions are required"}), 400
    
    values, policy = value_iteration(n, start, end, walls)
    return jsonify({"values": values, "policy": policy})

if __name__ == '__main__':
    app.run(debug=True)

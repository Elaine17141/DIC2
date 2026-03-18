import numpy as np
from app import value_iteration

n = 5
start = [0, 0]
end = [4, 4]
walls = [[1, 1], [2, 2], [3, 3]]
gamma = 0.9

V = value_iteration(n, start, end, walls, gamma)
wall_set = set(tuple(w) for w in walls)

# Compute policy arrows
actions = [(-1, 0, '^'), (1, 0, 'v'), (0, -1, '<'), (0, 1, '>')]

arrows = []
for r in range(n):
    row_arrows = []
    for c in range(n):
        if (r, c) == tuple(end):
            row_arrows.append(' * ')
        elif (r, c) in wall_set:
            row_arrows.append('###')
        else:
            max_v = -float('inf')
            best_acts = []
            for dr, dc, a in actions:
                nr, nc = r + dr, c + dc
                if nr < 0 or nr >= n or nc < 0 or nc >= n or (nr, nc) in wall_set:
                    nr, nc = r, c
                
                reward = 10.0 if (nr == end[0] and nc == end[1]) else -1.0
                val = reward + gamma * V[nr][nc]
                if val > max_v + 1e-7:
                    max_v = val
                    best_acts = [a]
                elif abs(val - max_v) <= 1e-7:
                    best_acts.append(a)
            row_arrows.append("".join(best_acts))
    arrows.append(row_arrows)

with open('output_utf8.txt', 'w', encoding='utf-8') as f:
    f.write("Policy Matrix (Arrows):\n")
    for r in range(n):
        f.write(" | ".join([f"{arrows[r][c]:3}" for c in range(n)]) + "\n")

    f.write("\nValue Matrix:\n")
    for r in range(n):
        f.write(" | ".join([f"{V[r][c]:6.2f}" for c in range(n)]) + "\n")

function createInitialState() {
    const board = Array(9).fill(null).map(() => Array(9).fill(0));
    board[4][8] = 1;
    board[4][0] = 2;
    return {
        board,
        players: [
            { id: 1, x: 4, y: 8, walls: 10 },
            { id: 2, x: 4, y: 0, walls: 10 }
        ],
        walls: [],
        currentPlayer: 0,
        wallPreview: null,
        winner: null,
        selectedPlayer: null,
        isWallMode: false
    };
}
function isWithinBounds(x, y) {
    return x >= 0 && x < 9 && y >= 0 && y < 9;
}
function getAdjacentSquares(x, y) {
    const adjacent = [];
    const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of directions) {
        const newX = x + dx;
        const newY = y + dy;
        if (isWithinBounds(newX, newY)) {
            adjacent.push([newX, newY]);
        }
    }
    return adjacent;
}
function isWallBlocking(state, fromX, fromY, toX, toY) {
    const minX = Math.min(fromX, toX);
    const maxX = Math.max(fromX, toX);
    const minY = Math.min(fromY, toY);
    const maxY = Math.max(fromY, toY);
    for (const wall of state.walls) {
        if (wall.orientation === 'h' &&
            minY === wall.y - 1 && maxY === wall.y &&
            minX >= wall.x - 1 && maxX <= wall.x) {
            return true;
        }
        if (wall.orientation === 'v' &&
            minX === wall.x - 1 && maxX === wall.x &&
            minY >= wall.y - 1 && maxY <= wall.y) {
            return true;
        }
    }
    return false;
}
function getLegalMoves(state, playerIdx) {
    const player = state.players[playerIdx];
    const opponent = state.players[1 - playerIdx];
    const moves = [];
    const adjacent = getAdjacentSquares(player.x, player.y);
    for (const [x, y] of adjacent) {
        if (x === opponent.x && y === opponent.y) {
            const jumpMoves = getAdjacentSquares(x, y).filter(([sx, sy]) => state.board[sx][sy] === 0);
            for (const [sx, sy] of jumpMoves) {
                if (!isWallBlocking(state, x, y, sx, sy)) {
                    moves.push({ x: sx, y: sy, type: 'jump' });
                }
            }
        }
        else {
            if (state.board[x][y] === 0 && !isWallBlocking(state, player.x, player.y, x, y)) {
                moves.push({ x, y, type: 'normal' });
            }
        }
    }
    return moves;
}
function hasPathToGoal(state, playerIdx) {
    const player = state.players[playerIdx];
    const goalY = playerIdx === 0 ? 0 : 8;
    const visited = new Set();
    const queue = [[player.x, player.y]];
    while (queue.length > 0) {
        const [x, y] = queue.shift();
        const key = `${x},${y}`;
        if (visited.has(key))
            continue;
        visited.add(key);
        if (y === goalY)
            return true;
        const adjacent = getAdjacentSquares(x, y);
        for (const [ax, ay] of adjacent) {
            if (!visited.has(`${ax},${ay}`) &&
                !isWallBlocking(state, x, y, ax, ay)) {
                queue.push([ax, ay]);
            }
        }
    }
    return false;
}
function isLegalWall(state, wall) {
    if (wall.x < 1 || wall.x > 8 || wall.y < 1 || wall.y > 8)
        return false;
    for (const existingWall of state.walls) {
        if (existingWall.x === wall.x && existingWall.y === wall.y)
            return false;
        if (wall.orientation === 'h') {
            if (existingWall.orientation === 'h') {
                if (existingWall.y === wall.y && Math.abs(existingWall.x - wall.x) <= 1)
                    return false;
            }
        }
        else {
            if (existingWall.orientation === 'v') {
                if (existingWall.x === wall.x && Math.abs(existingWall.y - wall.y) <= 1)
                    return false;
            }
        }
    }
    const tempState = Object.assign(Object.assign({}, state), { walls: [...state.walls, wall] });
    return hasPathToGoal(tempState, 0) && hasPathToGoal(tempState, 1);
}
function applyMove(state, playerIdx, x, y) {
    const player = state.players[playerIdx];
    const newBoard = state.board.map(row => [...row]);
    newBoard[player.x][player.y] = 0;
    newBoard[x][y] = player.id;
    const newPlayers = [
        Object.assign({}, state.players[0]),
        Object.assign({}, state.players[1])
    ];
    newPlayers[playerIdx] = Object.assign(Object.assign({}, player), { x, y });
    let winner = null;
    if (playerIdx === 0 && y === 0)
        winner = 0;
    if (playerIdx === 1 && y === 8)
        winner = 1;
    return Object.assign(Object.assign({}, state), { board: newBoard, players: newPlayers, currentPlayer: winner === null ? (1 - playerIdx) : state.currentPlayer, winner, selectedPlayer: null });
}
function applyWall(state, wall) {
    const player = state.players[state.currentPlayer];
    const newPlayers = [
        Object.assign({}, state.players[0]),
        Object.assign({}, state.players[1])
    ];
    newPlayers[state.currentPlayer] = Object.assign(Object.assign({}, player), { walls: player.walls - 1 });
    return Object.assign(Object.assign({}, state), { walls: [...state.walls, wall], players: newPlayers, currentPlayer: (1 - state.currentPlayer), wallPreview: null });
}
function render(state) {
    const gameRoot = document.getElementById('game-root');
    if (!gameRoot)
        return;
    gameRoot.innerHTML = `
    <div class="board-container">
      <div class="board ${state.isWallMode ? 'wall-mode' : ''}">
        ${generateBoardHTML(state)}
      </div>
      <div class="info-panel">
        <div>Player 1: ${state.players[0].walls} walls</div>
        <div>Player 2: ${state.players[1].walls} walls</div>
        <div>Turn: Player ${state.players[state.currentPlayer].id}</div>
        <button onclick="toggleWallMode()">Place Wall</button>
        <button onclick="resetGame()">Reset Game</button>
      </div>
    </div>
    ${state.winner !== null ? `<div class="winner ${state.winner === 0 ? 'player1' : 'player2'}">Player ${state.players[state.winner].id} wins!</div>` : ''}
  `;
}
function generateBoardHTML(state) {
    let html = '';
    for (let row = 8; row >= 0; row--) {
        for (let col = 0; col < 9; col++) {
            const cellValue = state.board[col][row];
            const cellClass = cellValue === 1 ? 'player1' : cellValue === 2 ? 'player2' : '';
            const playerAttr = cellValue > 0 ? ` data-player="${cellValue}"` : '';
            const isLegalMove = state.selectedPlayer !== null ?
                getLegalMoves(state, state.selectedPlayer).some(move => move.x === col && move.y === row) : false;
            const isSelected = state.selectedPlayer !== null &&
                state.players[state.selectedPlayer].x === col && state.players[state.selectedPlayer].y === row;
            html += `<div class="cell ${cellClass} ${isLegalMove ? 'legal-move' : ''} ${isSelected ? 'selected' : ''}"${playerAttr} data-x="${col}" data-y="${row}">`;
            if (col < 8 && row < 8) {
                const wallX = col + 1;
                const wallY = row + 1;
                const wall = state.walls.find(w => w.x === wallX && w.y === wallY);
                const isPreview = state.wallPreview && state.wallPreview.x === wallX && state.wallPreview.y === wallY;
                html += `<div class="intersection" style="position: absolute; left: 100%; top: 0;" data-wall-x="${wallX}" data-wall-y="${wallY}">`;
                html += '</div>';
                if (wall || isPreview) {
                    const wallData = wall || state.wallPreview;
                    html += `<div class="wall-${wallData.orientation}${isPreview ? ' wall-preview' : ''}"></div>`;
                }
            }
            html += '</div>';
        }
    }
    return html;
}
function setupEventHandlers(state) {
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('cell')) {
            const x = parseInt(target.dataset.x);
            const y = parseInt(target.dataset.y);
            handleSquareClick(state, x, y);
        }
        else if (target.classList.contains('intersection')) {
            const x = parseInt(target.dataset.wallX);
            const y = parseInt(target.dataset.wallY);
            handleWallClick(state, x, y);
        }
    });
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const target = e.target;
        if (target.classList.contains('intersection')) {
            const x = parseInt(target.dataset.wallX);
            const y = parseInt(target.dataset.wallY);
            handleWallRightClick(state, x, y);
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && state.isWallMode) {
            state.isWallMode = false;
            state.wallPreview = null;
            render(state);
        }
    });
}
function handleSquareClick(state, x, y) {
    if (state.winner || state.isWallMode || state.wallPreview)
        return;
    const currentPlayer = state.players[state.currentPlayer];
    const opponent = state.players[1 - state.currentPlayer];
    if (x === currentPlayer.x && y === currentPlayer.y) {
        state.selectedPlayer = state.currentPlayer;
        render(state);
        return;
    }
    if (state.selectedPlayer === state.currentPlayer) {
        const moves = getLegalMoves(state, state.currentPlayer);
        const move = moves.find(m => m.x === x && m.y === y);
        if (move) {
            const newState = applyMove(state, state.currentPlayer, x, y);
            Object.assign(state, newState);
            render(state);
        }
        else if (x !== opponent.x || y !== opponent.y) {
            state.selectedPlayer = null;
            render(state);
        }
    }
}
function handleWallClick(state, x, y) {
    if (state.winner || !state.isWallMode)
        return;
    const existingWall = state.walls.find(w => w.x === x && w.y === y);
    if (existingWall)
        return;
    const currentPlayer = state.players[state.currentPlayer];
    if (currentPlayer.walls <= 0)
        return;
    if (state.wallPreview && state.wallPreview.x === x && state.wallPreview.y === y) {
        state.wallPreview.orientation = state.wallPreview.orientation === 'h' ? 'v' : 'h';
    }
    else {
        state.wallPreview = { x, y, orientation: 'h' };
    }
    render(state);
}
function handleWallRightClick(state, x, y) {
    if (state.winner || !state.isWallMode || !state.wallPreview)
        return;
    const existingWall = state.walls.find(w => w.x === x && w.y === y);
    if (existingWall)
        return;
    const currentPlayer = state.players[state.currentPlayer];
    if (currentPlayer.walls <= 0)
        return;
    if (state.wallPreview.x === x && state.wallPreview.y === y && isLegalWall(state, state.wallPreview)) {
        const newState = applyWall(state, state.wallPreview);
        Object.assign(state, newState);
        state.isWallMode = false;
    }
    render(state);
}
window.resetGame = function () {
    Object.assign(state, createInitialState());
    render(state);
};
window.toggleWallMode = function () {
    state.isWallMode = !state.isWallMode;
    state.selectedPlayer = null;
    render(state);
};
let state = createInitialState();
render(state);
setupEventHandlers(state);
export {};
//# sourceMappingURL=index.js.map
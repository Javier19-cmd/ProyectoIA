const io = require('socket.io-client');
const serverUrl = "http://192.168.5.122:4000";
const socket = io(serverUrl);

const INF = Infinity;

function alphabeta(board, depth, alpha, beta, maximizingPlayer) {
  if (depth === 0 || isTerminal(board)) {
    return evaluate(board);
  }

  if (maximizingPlayer) {
    let maxEval = -INF;
    for (let column = 0; column < 7; column++) {
      if (isValidMove(board, column)) {
        const newBoard = makeMove(board, column, 1);
        const eval = alphabeta(newBoard, depth - 1, alpha, beta, false);
        maxEval = Math.max(maxEval, eval);
        alpha = Math.max(alpha, maxEval);
        if (beta <= alpha) {
          break;
        }
      }
    }
    return maxEval;
  } else {
    let minEval = INF;
    for (let column = 0; column < 7; column++) {
      if (isValidMove(board, column)) {
        const newBoard = makeMove(board, column, 2);
        const eval = alphabeta(newBoard, depth - 1, alpha, beta, true);
        minEval = Math.min(minEval, eval);
        beta = Math.min(beta, minEval);
        if (beta <= alpha) {
          break;
        }
      }
    }
    return minEval;
  }
}

function isTerminal(board) {
  if (hasWinner(board, 1) || hasWinner(board, 2)) {
    return true;
  }

  for (let row of board) {
    if (row.includes(0)) {
      return false;
    }
  }
  return true;
}

function hasWinner(board, player) {
  // Check rows
  for (let row = 0; row < 6; row++) {
    for (let col = 0; col < 4; col++) {
      if (
        board[row][col] === player &&
        board[row][col + 1] === player &&
        board[row][col + 2] === player &&
        board[row][col + 3] === player
      ) {
        return true;
      }
    }
  }

  // Check columns
  for (let col = 0; col < 7; col++) {
    for (let row = 0; row < 3; row++) {
      if (
        board[row][col] === player &&
        board[row + 1][col] === player &&
        board[row + 2][col] === player &&
        board[row + 3][col] === player
      ) {
        return true;
      }
    }
  }

  // Check ascending diagonals
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      if (
        board[row][col] === player &&
        board[row + 1][col + 1] === player &&
        board[row + 2][col + 2] === player &&
        board[row + 3][col + 3] === player
      ) {
        return true;
      }
    }
  }

  // Check descending diagonals
  for (let row = 0; row < 3; row++) {
    for (let col = 3; col < 7; col++) {
      if (
        board[row][col] === player &&
        board[row + 1][col - 1] === player &&
        board[row + 2][col - 2] === player &&
        board[row + 3][col - 3] === player
      ) {
        return true;
      }
    }
  }

  return false;
}

function isValidMove(board, column) {
  return board[0][column] === 0;
}

function makeMove(board, column, player) {
  const newBoard = board.map((row) => [...row]);
  for (let row = 5; row >= 0; row--) {
    if (newBoard[row][column] === 0) {
      newBoard[row][column] = player;
      return newBoard;
    }
  }
}

function evaluate(board) {
  let score = 0;
  const mobilityScore = getMobilityScore(board);
  for (let row of board) {
    for (let cell of row) {
      if (cell === 1) {
        score += 1;
      } else if (cell === 2) {
        score -= 1;
      }
    }
  }
  return score + mobilityScore;
}

function getMobilityScore(board) {
  let mobilityScore = 0;
  for (let column = 0; column < 7; column++) {
    if (isValidMove(board, column)) {
      mobilityScore++;
    }
  }
  return mobilityScore;
}

// Connect to the server
socket.on('connect', () => {
  console.log("Connected to server");

  socket.emit('signin', {
    user_name: "Willy",
    tournament_id: 142857,
    user_role: 'player'
  });
});

// Sign in successful
socket.on('ok_signin', () => {
  console.log("Login");
});

// Ready
socket.on('ready', function (data) {
  var gameID = data.game_id;
  var playerTurnID = data.player_turn_id;
  var board = data.board;

  console.log("Board: ", board);

  const clonedBoard = board.map((row) => [...row]);
  const depth = 6;
  const alpha = -INF;
  const beta = INF;
  const maximizingPlayer = playerTurnID === 1;
  const result = alphabeta(clonedBoard, depth, alpha, beta, maximizingPlayer);
  const move = getBestMove(clonedBoard, result, maximizingPlayer);

  console.log("Move: ", move);
  console.log("Board: ", clonedBoard);

  socket.emit('play', {
    tournament_id: 142857,
    player_turn_id: playerTurnID,
    game_id: gameID,
    board: clonedBoard,
    movement: move
  });
});

socket.on('finish', function (data) {
  var gameID = data.game_id;
  var playerTurnID = data.player_turn_id;
  var winnerTurnID = data.winner_turn_id;
  var board = data.board;

  // Your cleaning board logic here

  console.log("Winner: ", winnerTurnID);
  console.log(board);
  socket.emit('player_ready', {
    tournament_id: 142857,
    player_turn_id: playerTurnID,
    game_id: gameID
  });
});

function getBestMove(board, maxEval, maximizingPlayer) {
  const validMoves = [];
  for (let column = 0; column < 7; column++) {
    if (isValidMove(board, column)) {
      const newBoard = makeMove(board, column, maximizingPlayer ? 1 : 2);
      if (hasWinner(newBoard, maximizingPlayer ? 1 : 2)) {
        // Bloquear jugadas del oponente que lleven a la victoria
        continue;
      }
      const eval = alphabeta(newBoard, 0, -INF, INF, !maximizingPlayer);
      if (eval === maxEval) {
        validMoves.push(column);
      } else if (eval < maxEval && maximizingPlayer) {
        // Evaluar posiciones desfavorables
        validMoves.length = 0; // Vaciar el array
        validMoves.push(column);
        maxEval = eval;
      } else if (eval > maxEval && !maximizingPlayer) {
        // Evaluar posiciones desfavorables
        validMoves.length = 0; // Vaciar el array
        validMoves.push(column);
        maxEval = eval;
      }
    }
  }

  console.log("Valid moves: ", validMoves);

  if (validMoves.length > 0) {
    return validMoves[Math.floor(Math.random() * validMoves.length)];
  } else {
    const availableColumns = board[0].map((_, index) => index);
    return availableColumns[Math.floor(Math.random() * availableColumns.length)];
  }
}

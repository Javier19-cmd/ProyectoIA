const io = require('socket.io-client')
const serverUrl = "http://192.168.1.131:4000"
const socket = io(serverUrl)

const INF = Infinity;

// Algoritmo Alpha-Beta
function alphabeta(board, depth, alpha, beta, maximizingPlayer) {
  // Condición de salida: alcanzado el límite de profundidad o estado terminal
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

// Verifica si el tablero alcanzó un estado terminal (ganador o empate)
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

// Verifica si un jugador ha ganado en el tablero dado
function hasWinner(board, player) {
  // Verificar filas
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

  // Verificar columnas
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

  // Verificar diagonales ascendentes
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

  // Verificar diagonales descendentes
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

// Verifica si un movimiento es válido en el tablero dado
function isValidMove(board, column) {
  return board[0][column] === 0;
}

// Realiza un movimiento en el tablero dado para el jugador especificado
function makeMove(board, column, player) {
  const newBoard = board.map((row) => [...row]);
  for (let row = 5; row >= 0; row--) {
    if (newBoard[row][column] === 0) {
      newBoard[row][column] = player;
      return newBoard;
    }
  }
}

// Evalúa el tablero actual para el jugador maximizante
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

// Calcula la puntuación de movilidad del tablero (número de movimientos válidos disponibles)
function getMobilityScore(board) {
  let mobilityScore = 0;
  for (let column = 0; column < 7; column++) {
    if (isValidMove(board, column)) {
      mobilityScore++;
    }
  }
  return mobilityScore;
}

// Conexión al servidor
socket.on('connect', () => {
  console.log("Connected to server");

  // Inicio de sesión en el torneo
  socket.emit('signin', {
    user_name: "Willy",
    tournament_id: 142857,
    user_role: 'player'
  });
});

// Inicio de sesión exitoso
socket.on('ok_signin', () => {
  console.log("Login");
});

// Listo para jugar
socket.on('ready', function (data) {
  var gameID = data.game_id;
  var playerTurnID = data.player_turn_id;
  var board = data.board;

  console.log("Board: ", board);

  const clonedBoard = board.map((row) => [...row]);
  const depth = 6;
  const alpha = -INF;
  const beta = INF;
  const maximizingPlayer = playerTurnID;
  const result = alphabeta(clonedBoard, depth, alpha, beta, maximizingPlayer);
  const move = getBestMove(clonedBoard, result, maximizingPlayer);

  console.log("Move: ", move);
  console.log("Board: ", clonedBoard);

  // Emitir el movimiento al servidor
  socket.emit('play', {
    tournament_id: 142857,
    player_turn_id: playerTurnID,
    game_id: gameID,
    board: clonedBoard,
    movement: move
  });
});

// Juego finalizado
socket.on('finish', function (data) {
  var gameID = data.game_id;
  var playerTurnID = data.player_turn_id;
  var winnerTurnID = data.winner_turn_id;
  var board = data.board;

  // Lógica para reiniciar el tablero aquí

  console.log("Winner: ", winnerTurnID);
  console.log(board);

  // Indicar al servidor que el jugador está listo para jugar nuevamente
  socket.emit('player_ready', {
    tournament_id: 142857,
    player_turn_id: playerTurnID,
    game_id: gameID
  });
})

/**
 * Obtiene el mejor movimiento a partir de la evaluación del tablero y el jugador maximizante
 * @param {Array} board - El tablero actual
 * @param {Number} maxEval - La evaluación máxima obtenida
 * @param {Boolean} maximizingPlayer - Indica si el jugador es el jugador maximizante
 * @returns {Number} - El mejor movimiento disponible
 */
function getBestMove(board, maxEval, maximizingPlayer) {
  const validMoves = [];
  const bestMoves = [];
  let bestEval = -INF;

  for (let column = 0; column < 7; column++) {
    if (isValidMove(board, column)) {
      const newBoard = makeMove(board, column, maximizingPlayer ? 1 : 2);
      if (hasWinner(newBoard, maximizingPlayer ? 1 : 2)) {
        continue;
      }
      const eval = alphabeta(newBoard, 0, -INF, INF, !maximizingPlayer);
      if (eval === maxEval) {
        validMoves.push(column);
      } else if (eval < maxEval && maximizingPlayer) {
        validMoves.length = 0;
        validMoves.push(column);
        maxEval = eval;
      } else if (eval > maxEval && !maximizingPlayer) {
        validMoves.length = 0;
        validMoves.push(column);
        maxEval = eval;
      }
      
      if (eval === bestEval) {
        bestMoves.push(column);
      } else if (eval > bestEval) {
        bestMoves.length = 0;
        bestMoves.push(column);
        bestEval = eval;
      }
    }
  }

  console.log("Valid moves: ", validMoves);
  console.log("Best moves: ", bestMoves);

  if (bestMoves.length > 0) {
    // Seleccionar un movimiento basado en la evaluación
    return selectMoveBasedOnEvaluation(bestMoves, maximizingPlayer, board);
  } else if (validMoves.length > 0) {
    // Seleccionar un movimiento basado en la evaluación
    return selectMoveBasedOnEvaluation(validMoves, maximizingPlayer, board);
  } else {
    const availableColumns = board[0].map((_, index) => index);
    return availableColumns[Math.floor(Math.random() * availableColumns.length)];
  }
}

// Función para seleccionar un movimiento basado en la evaluación
function selectMoveBasedOnEvaluation(moves, maximizingPlayer, board) {
  let selectedMove = moves[0];
  let selectedEval = maximizingPlayer ? -INF : INF;

  for (const move of moves) {
    const player = maximizingPlayer ? 1 : 2;
    const newBoard = makeMove(board, move, player);
    const eval = evaluate(newBoard);
    
    if ((maximizingPlayer && eval > selectedEval) || (!maximizingPlayer && eval < selectedEval)) {
      selectedMove = move;
      selectedEval = eval;
    }
  }

  return selectedMove;
}

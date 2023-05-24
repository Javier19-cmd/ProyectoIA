const io = require('socket.io-client')
const serverUrl = "http://192.168.5.122:4000"
const socket = io(serverUrl)

const INF = Infinity;

function alphabeta(tablero, profundidad, alpha, beta, jugador_maximizador) {
    if (profundidad === 0 || tableroEsTerminal(tablero)) {
        return evaluar(tablero);
    }

    if (jugador_maximizador) {
        let valor_max = -INF;
        for (let columna = 0; columna < 7; columna++) {
            if (movimientoValido(tablero, columna)) {
                const nuevo_tablero = hacerMovimiento(tablero, columna, jugador_maximizador);
                const valor = alphabeta(nuevo_tablero, profundidad - 1, alpha, beta, false);
                valor_max = Math.max(valor_max, valor);
                alpha = Math.max(alpha, valor_max);
                if (beta <= alpha) {
                    break;
                }
            }
        }
        return valor_max;
    } else {
        let valor_min = INF;
        for (let columna = 0; columna < 7; columna++) {
            if (movimientoValido(tablero, columna)) {
                const nuevo_tablero = hacerMovimiento(tablero, columna, jugador_maximizador);
                const valor = alphabeta(nuevo_tablero, profundidad - 1, alpha, beta, true);
                valor_min = Math.min(valor_min, valor);
                beta = Math.min(beta, valor_min);
                if (beta <= alpha) {
                    break;
                }
            }
        }
        return valor_min;
    }
}

function tableroEsTerminal(tablero) {
    // Verificar si hay un ganador
    if (hayGanador(tablero, 1) || hayGanador(tablero, 2)) {
        return true;
    }

    // Verificar si el tablero está lleno
    for (let fila of tablero) {
        if (fila.includes(0)) {
            return false;
        }
    }
    return true;
}

function hayGanador(tablero, jugador) {
    // Verificar filas
    for (let fila = 0; fila < 6; fila++) {
        for (let columna = 0; columna < 4; columna++) {
            if (
                tablero[fila][columna] === jugador &&
                tablero[fila][columna + 1] === jugador &&
                tablero[fila][columna + 2] === jugador &&
                tablero[fila][columna + 3] === jugador
            ) {
                return true;
            }
        }
    }

    // Verificar columnas
    for (let columna = 0; columna < 7; columna++) {
        for (let fila = 0; fila < 3; fila++) {
            if (
                tablero[fila][columna] === jugador &&
                tablero[fila + 1][columna] === jugador &&
                tablero[fila + 2][columna] === jugador &&
                tablero[fila + 3][columna] === jugador
            ) {
                return true;
            }
        }
    }

    // Verificar diagonales ascendentes
    for (let fila = 0; fila < 3; fila++) {
        for (let columna = 0; columna < 4; columna++) {
            if (
                tablero[fila][columna] === jugador &&
                tablero[fila + 1][columna + 1] === jugador &&
                tablero[fila + 2][columna + 2] === jugador &&
                tablero[fila + 3][columna + 3] === jugador
            ) {
                return true;
            }
        }
    }

    // Verificar diagonales descendentes
    for (let fila = 0; fila < 3; fila++) {
        for (let columna = 3; columna < 7; columna++) {
            if (
                tablero[fila][columna] === jugador &&
                tablero[fila + 1][columna - 1] === jugador &&
                tablero[fila + 2][columna - 2] === jugador &&
                tablero[fila + 3][columna - 3] === jugador
            ) {
                return true;
            }
        }
    }

    return false;
}

function movimientoValido(tablero, columna) {
    return tablero[0][columna] === 0;
}

function hacerMovimiento(tablero, columna, jugador) {
    const nuevo_tablero = tablero.map((fila) => [...fila]);
    for (let fila = 5; fila >= 0; fila--) {
        if (nuevo_tablero[fila][columna] === 0) {
            nuevo_tablero[fila][columna] = jugador;
            return nuevo_tablero;
        }
    }
}

function obtenerMejorMovimiento(tablero, valorMax, jugador_maximizador) {
  const movimientosValidos = [];
  for (let columna = 0; columna < 7; columna++) {
      if (movimientoValido(tablero, columna)) {
          const nuevo_tablero = hacerMovimiento(tablero, columna, jugador_maximizador ? 1 : 2);
          const valor = alphabeta(nuevo_tablero, 0, -INF, INF, !jugador_maximizador);
          if (valor === valorMax) {
              movimientosValidos.push(columna);
          }
      }
  }

  console.log("Movimientos válidos: ", movimientosValidos);

  // Verificar si hay movimientos válidos antes de devolver uno aleatorio
  if (movimientosValidos.length > 0) {
      return movimientosValidos[Math.floor(Math.random() * movimientosValidos.length)];
  } else {
      // Si no hay movimientos válidos, devolver un movimiento aleatorio
      const columnasDisponibles = [];
      for (let columna = 0; columna < 7; columna++) {
          if (movimientoValido(tablero, columna)) {
              columnasDisponibles.push(columna);
          }
      }
      return columnasDisponibles[Math.floor(Math.random() * columnasDisponibles.length)];
  }
}

function evaluar(tablero) {
  // Implementa tu función de evaluación personalizada aquí
  // Puedes asignar puntajes a diferentes situaciones del tablero y calcular una puntuación global para el estado actual del juego
  // Por ejemplo, puedes dar más puntos por tener fichas en línea y restar puntos por tener fichas del oponente en línea
  // La función debe devolver un valor numérico que representa la evaluación del tablero

  // Aquí hay un ejemplo simple de evaluación que cuenta el número de fichas en el tablero
  let puntaje = 0;
  for (let fila of tablero) {
      for (let casilla of fila) {
          if (casilla === 1) {
              puntaje += 1; // Ficha del jugador 1
          } else if (casilla === 2) {
              puntaje -= 1; // Ficha del jugador 2
          }
      }
  }
  return puntaje;
}

// Conectar.
socket.on('connect', () => {
    console.log("Connected to server")

    socket.emit('signin', {
        user_name: "Willy",
        tournament_id: 142857,
        user_role: 'player'
    })
})

// Sign in correcto.
socket.on('ok_signin', () => {
    console.log("Login")
})

// Ready.
socket.on('ready', function(data){
    var gameID = data.game_id;
    var playerTurnID = data.player_turn_id;
    var board = data.board;
  });

  // Finish.
socket.on('finish', function(data){
    var gameID = data.game_id;
    var playerTurnID = data.player_turn_id;
    var winnerTurnID = data.winner_turn_id;
    var board = data.board;
});

socket.on('ready', function(data){
    var gameID = data.game_id;
    var playerTurnID = data.player_turn_id;
    var board = data.board;

    console.log("Board: ", board)
    
    // TODO: Your logic / user input here

    const tablero = board.map((fila) => [...fila])
    const profundidad = 6
    const alpha = -INF
    const beta = INF
    const jugador_maximizador = playerTurnID
    const resultado = alphabeta(tablero, profundidad, alpha, beta, jugador_maximizador)
    const move = obtenerMejorMovimiento(tablero, resultado, jugador_maximizador)

    // var move = Math.floor(Math.random() * 7)

    console.log("Movimiento: ", move)
    console.log(" Tablero: ", tablero)
    
    socket.emit('play', {
      tournament_id: 142857,
      player_turn_id: playerTurnID,
      game_id: gameID,
      board: board,
      movement:  move
    });

    console.log(board)
  });


  socket.on('finish', function(data){
    var gameID = data.game_id;
    var playerTurnID = data.player_turn_id;
    var winnerTurnID = data.winner_turn_id;
    var board = data.board;
    
    // TODO: Your cleaning board logic here
    
    console.log("Ganador: ", winnerTurnID)
    console.log(board)
    socket.emit('player_ready', {
      tournament_id: 142857,
      player_turn_id: playerTurnID,
      game_id: gameID
    });
  });

// socket.on('disconnect', function() {
//   console.log('Desconectado');
// });
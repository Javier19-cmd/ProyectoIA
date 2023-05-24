const io = require('socket.io-client')
const serverUrl = "http://192.168.5.122:4000"
const socket = io(serverUrl)

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

    console.log(board)
    
    // TODO: Your logic / user input here

    var move = Math.floor(Math.random() * 7)

    console.log("Movimiento: ", move)
    
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
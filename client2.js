const io = require('socket.io-client')
const serverUrl = "http://192.168.1.132:4000"
const socket = io(serverUrl)

// Conectar.
socket.on('connect', () => {
    console.log("Connected to server")

    socket.emit('signin', {
        user_name: "Willy2",
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
    
    // TODO: Your logic / user input here
    
    socket.emit('play', {
      tournament_id: 142857,
      player_turn_id: playerTurnID,
      game_id: gameID,
      board: board,
      movement: Math.random() * 10
    });
  });

const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger');
const dbc = require("./dbc.js");
const am = require("./authorizeManager.js");



const webSocketsServerPort = 3001;
const webSocketServer = require('websocket').server;
const http = require('http');
const { SocketCommunication } = require('./std/SocketCommunication.js');
// Spinning the http server and the websocket server.
const server = http.createServer();
server.listen(webSocketsServerPort, "0.0.0.0");
const wsServer = new webSocketServer({
  httpServer: server
});

// I'm maintaining all active connections in this object
const clients = new Map();

// This code generates unique userid for everyuser.
const getUniqueID = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return s4() + s4() + '-' + s4();
};

wsServer.on('request', function (request) {
  var userID = getUniqueID();
  console.log('Recieved a new connection.');
  // You can rewrite this part of the code to accept only the requests from allowed origin
  const connection = request.accept(null, request.origin);

  //on message
  connection.on('message', manageRequest);

  //on close
  connection.on('close', () => {
    console.log(userID + " disconnected");
    let c = clients.get(userID);
    let g = '';
    if(c!==undefined && c.game!==null)
      g = c.game;
    clients.delete(userID);
    if(g!=='')
      updateGamePlayerList(g);
    console.log(clients.size + " clients connected");
  });

  //send back the sessionID
  connection.send(SocketCommunication("sessionId", userID, '', userID).getMsg());

  //store new connection in map 
  let client = { game: null, socket: connection, user: { id: null, name: '' } };
  clients.set(userID, client);
  console.log(clients.size + " clients connected");

  console.log('connected: ' + userID);
});

/**
 * manages all the incomming ws-requests
 * @param {import('websocket').IMessage} req 
 */
function manageRequest(req) {

  let msg = SocketCommunication();
  msg.set(req.utf8Data);

  resyncClientData(msg);

  //login request
  if (msg.type === 'login') {
    //console.log(msg.data.name+" : "+msg.data.pwd + " : " + msg.id);
    console.log('try to loggin in');
    login(msg);
    //request that needs a token to access
  } else {
    am.verifyWsToken(msg.token).then(b => {
      //b===true we have access
      if (b)
        handleRequest(msg);
      else {
        msg.data = "403";
        sendToClient(msg) ? '' : console.log("no client with ID: " + msg.id);
      }
    });
  }
}

/**
 * trys to find name and pwd in database. if so it generates a token and retuns it to the client
 * @param {SocketCommunication} msg 
 */
function login(msg) {
  dbc.login(msg.data.name, msg.data.pwd).then(async data => {
    let s;
    if (data !== -1 && data !== -2) {
      s = SocketCommunication("login", msg.id, await am.getUserToken(data), true);
    } else
      s = SocketCommunication("login", msg.id, '', false);
    resyncClientData(s);

    sendToClient(s) ? '' : console.log("no client with ID: " + msg.id);
  });
}

/**
 * Takes the tokendata and resyncs it with the clients array
 * @param {SocketCommunication} msg 
 */
function resyncClientData(msg) {
  let c = clients.get(msg.id);
  if (msg.token !== '' && msg.token !== null && c !== undefined) {
    let user = am.getUser(msg.token);
    c.user = { id: user.id, name: user.name };
  }
}

/**
 * handles the requests accessible via token
 * @param {SocketCommunication} msg 
 */
function handleRequest(msg) {
  switch (msg.type) {
    case 'sec':
      checkAccess(msg);
      break;
    case 'creategame':
      createGame(msg);
      break;
    case 'joingame':
      joinGame(msg);
      break;
    case 'leavegame':
      leaveGame(msg);
      break;
    case 'addround':
      addRound(msg);
      break;
    case 'getquestions':
      getQuestions(msg);
      break;
    case 'getquestion':
      getQuestion(msg);
      break;
    case 'endround':
      endRound(msg);
      break;
    case 'updateroundselected':
      updateRoundSelected(msg);
      break;
    case 'getopengames':
      getOpenGames(msg);
      break;
    //Add here new types
    default:
      break;
  }
}

/**
 * 
 * @param {SocketCommunication} msg 
 */
function checkAccess(msg) {
  msg.data = "top secret";
  sendToClient(msg) ? '' : console.log("no client with ID: " + msg.id);
}

/**
 * creates game in database and returns the new generated object
 * @param {SocketCommunication} msg 
 */
function createGame(msg) {
  dbc.createGame(am.getUser(msg.token).id).then(data => {
    msg.data = data;
    sendToClient(msg) ? '' : console.log("no client with ID: " + msg.id);
  });
}

/**
 * add user in client list to a game and sends the gameobject to the cleint
 * @param {SocketCommunication} msg 
 * @param {String} id 
 */
function joinGame(msg) {
  dbc.getGame(msg.data.id).then(data => {
    if (data !== null && data !== undefined && data !== -1) {
      let c = clients.get(msg.id);
      if (c !== undefined) {
        c.game = data._id;
        console.log("player w/ sessionID " + msg.id + " joined game " + clients.get(msg.id).game);
        updateGamePlayerList(clients.get(msg.id).game);
      } else {
        console.log("client couldn't join game " + data._id);
      }
      msg.data = data;
    } else {
      msg.data = null;
    }
    sendToClient(msg) ? '' : console.log("no client with ID: " + msg.id);
  });
}

/**
 * set current game from user in client list to null
 * @param {SocketCommunication} msg 
 */
function leaveGame(msg) {
  let c = clients.get(msg.id);
  if (c !== undefined) {
    let g = c.game;
    c.game = null;
    if(!!g) updateGamePlayerList(g);
  }
}

/**
 * Adds new Round for Game where player is in it
 * @param {SocketCommunication} msg 
 */
function addRound(msg) {
  let client = clients.get(msg.id);
  if(client!==undefined && client.game!==null) {
    let list = [];
    clients.forEach(c => {
      if (c.game+'' === client.game+'') {
        let user = {player: c.user.id};
        if(msg.data.player === c.user.id) //player who will be ask next
          user.ask = true;
        list.push(user);
      }
    });
    dbc.openRound(client.game+'', list, msg.data.question).then(
      data => {
        console.log(data?"error in creating round":"created new round");
        sendGameUpdate(client.game);
      }
    );
  }
}

function endRound(msg) {
  let client = clients.get(msg.id);
  if(client!==undefined && client.game!==null) {
    dbc.closeRound(client.game).then(data => {
      sendGameUpdate(client.game);
    });
    
  }
}

/**
 * sends all open games from db to client
 * @param {SocketCommunication} msg 
 */
function getOpenGames(msg) {
  dbc.getOpenGames().then(data => {
    msg.data = data;
    sendToClient(msg);
  });
}

/**
 * sends all questions from db to client
 * @param {SocketCommunication} msg 
 */
function getQuestions(msg) {
  dbc.getQuestions().then(questions => {
    msg.data = questions;
    sendToClient(msg);
  });
}

/**
 * sends just one spesific question
 * @param {SocketCommunication}
 */
function getQuestion(msg) {
  dbc.getQuestion(msg.data.id).then(question => {
    msg.data = question;
    sendToClient(msg);
  });
}

/**
 * saves the new selected state
 * @param {SocketCommunication} msg 
 */
function updateRoundSelected(msg) {
  let client = clients.get(msg.id);
  if(client!==undefined && client.game!==null) {
    dbc.updateRoundSelected(client.game, msg.data.roundID, client.user.id, msg.data.selected).then(data => {
      sendGameUpdate(client.game);
    });
  }
}

/**
 * send the newest gameobject to all players in game 
 * @param {String} gameID 
 */
function sendGameUpdate(gameID) {
  dbc.getGame(gameID).then(game => {
    sendToAllInGame(gameID, SocketCommunication("updategame", '', '', game));
  });
}

/**
 * sends to all users in game with id gameID the current playerlist {id, name}
 * @param {String} userID 
 */
function updateGamePlayerList(gameID) {
  let list = [];
  let debug_i = 0;
  clients.forEach(c => {
    //console.log(typeof gameID);
    //console.log(c.game.trim() == gameID.trim());
    if (c.game+'' === gameID+'') {
      debug_i++;
      list.push({ id: c.user.id, name: c.user.name });
    }
  });
  console.log("updateing playerlist for " + debug_i + " players; tot: " + clients.size);
  let s = SocketCommunication('updateplayerlist', '', '', list);
  sendToAllInGame(gameID, s);
}

/**
 * send msg to client with id msg.id in client list
 * @param {SocketCommunication} msg 
 */
function sendToClient(msg) {
  debugListClients();
  let c = clients.get(msg.id);
  if (c !== undefined) c.socket.send(msg.getMsg());
  else return false;
  return true;
}

/**
 * send msg to all user in game with id gameID
 * @param {String} gameID 
 * @param {SocketCommunication} msg 
 */
function sendToAllInGame(gameID, msg) {
  clients.forEach(c => {
    if (c.game+'' === gameID+'')
      c.socket.send(msg.getMsg());
  });
}

function debugListClients() {
  Array.from(clients.keys()).forEach(a => {
    if(clients.get(a)!==undefined)
      console.log('sid: '+a+' game: '+clients.get(a).game+' user: '+clients.get(a).user.name);
    //console.log('sid: '+a);

  });
}
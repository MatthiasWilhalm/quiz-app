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
server.listen(webSocketsServerPort);
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
  console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
  // You can rewrite this part of the code to accept only the requests from allowed origin
  const connection = request.accept(null, request.origin);
  let client = {game: null, socket: connection, user: {id: null, name: ''}};
  clients.set(userID, client);
  console.log(clients.size+" clients connected");

  connection.on('message', req => {
    let msg = SocketCommunication();
    msg.set(req.utf8Data);
    resyncClientData(msg);
    //login request
    if (msg.type === 'login') {
      //console.log(msg.data);
      //console.log(msg.data.name+" : "+msg.data.pwd + " : " + msg.id);
      login(msg.data.name, msg.data.pwd, msg.id).then(token => {
        let s;
        if (token !== -1 && token !== -2) {
          s = SocketCommunication("login", msg.id, token, true);
        } else {
          s = SocketCommunication("login", msg.id, '', false);
        }
        let c = clients.get(msg.id);
        if(c!==undefined) {
          c.user.id = am.getUser(token).id;
          c.user.name = am.getUser(token).name;
        }
        //Array.from(clients.keys()).forEach(a => console.log(a));
        sendToClient(s)?'':console.log("no client with ID: "+msg.id);
      });
      //request that needs a token to access
    } else {
      am.verifyWsToken(msg.token).then(b => {
        //b===true if we have acccess
        if (b)
          handleRequest(msg);
        else {
          msg.data = "access denied";
          sendToClient(msg)?'':console.log("no client with ID: "+msg.id);
        }
      });
    }
  });

  connection.on('close', () => {
    console.log(userID+" disconnected");
    clients.delete(userID);
    console.log(clients.size+" clients connected");
  });

  connection.send(SocketCommunication("sessionId", userID, '', userID).getMsg());
  console.log('connected: ' + userID);
});

function login(name, pwd, id) {
  return new Promise(resolve => {
    dbc.login(name, pwd).then(data => {
      if (data !== -1 && data !== -2) {
        resolve(am.getUserToken(data));
      } else resolve(data);
    });
  });
}

/**
 * Takes the tokendata and resyncs it with the clients array
 * @param {SocketCommunication} msg 
 */
function resyncClientData(msg) {
  let c = clients.get(msg.id);
  if(msg.token!=='' && c!==undefined) {
    let user = am.getUser(msg.token);
    c.user.id = user.id;
    c.user.name = user.name;
  }
} 

/**
 * 
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
  sendToClient(msg)?'':console.log("no client with ID: "+msg.id);
}

/**
 * 
 * @param {SocketCommunication} msg 
 */
function createGame(msg) {
  dbc.createGame().then(data => {
    msg.data = data;
    sendToClient(msg)?'':console.log("no client with ID: "+msg.id);
  });
}

/**
 * 
 * @param {SocketCommunication} msg 
 * @param {String} id 
 */
function joinGame(msg) {
  dbc.getGame(msg.data.id).then(data => {
    let c = clients.get(msg.id);
    if(c!==undefined) {
      c.game = data._id;
      console.log("player w/ sessionID "+msg.id+" joined game "+clients.get(msg.id).game);
      updateGamePlayerList(clients.get(msg.id).game);
    } else {
      console.log("client couldn't join to game "+data._id);
    }
    msg.data = data;
    sendToClient(msg)?'':console.log("no client with ID: "+msg.id);
  });
}

function leaveGame(msg) {
  let c = clients.get(msg.id);
  if(c!==undefined) {
    c.game = null;
    updateGamePlayerList(clients.get(msg.id).game);
  }
}

/**
 * 
 * @param {String} userID 
 * @param {String} gameID 
 */
function updateGamePlayerList(gameID) {
  let list = [];
  clients.forEach(c => {
    if(c.game === gameID) {
      list.push({id: c.user.id, name: c.user.name});
    }
  });
  let s = SocketCommunication('updateplayerlist', '', '', list);
  sendToAllInGame(gameID, s);
}

function sendToClient(msg) {
  let c = clients.get(msg.id);
  if(c!==undefined) c.socket.send(msg.getMsg());
  else return false;
  return true;
}

function sendToAllInGame(gameID, msg) {
  clients.forEach(c => {
    if(c.game===gameID)
      c.socket.send(msg.getMsg());
  });
}


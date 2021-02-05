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

wsServer.on('request', function(request) {
  var userID = getUniqueID();
  console.log((new Date()) + ' Recieved a new connection from origin ' + request.origin + '.');
  // You can rewrite this part of the code to accept only the requests from allowed origin
  const connection = request.accept(null, request.origin);
  clients.set(userID, connection);

  connection.on('message', req => {
    let msg = SocketCommunication();
    msg.set(req.utf8Data);
    //login request
    if(msg.type==='login') {
      //console.log(msg.data.name+" : "+msg.data.pwd + " : " + msg.id);
      login(msg.data.name, msg.data.pwd, msg.id).then(token => {
        let s;
        if(token!==-1 && token!==-2) {
          s = SocketCommunication("login", msg.id, token, true);
        } else {
          s = SocketCommunication("login", msg.id, '', false);
        }
        clients.get(msg.id).send(s.getMsg());
      });
    //request that needs a token to access
    } else {
      am.verifyWsToken(msg.token).then(b => {
        //b===true if we have acccess
        if(b)
          handleRequest(msg);
        else {
          msg.data = "access denied";
          clients.get(msg.id).send(msg.getMsg());
        }
      });
    }
  });

  connection.send(SocketCommunication("sessionId", userID,'', userID).getMsg());
  console.log('connected: ' + userID);
});

function login(name, pwd, id) {
  return new Promise(resolve => {
    dbc.login(name, pwd).then(data => {
      if(data!==-1 && data!==-2) {
        resolve(am.getUserToken(data));
      } else resolve(data);
    });
  });
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
  clients.get(msg.id).send(msg.getMsg());
}


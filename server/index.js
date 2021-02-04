const express = require('express');
const bodyParser = require('body-parser');
const pino = require('express-pino-logger');
const dbc = require("./dbc.js");
const am = require("./authorizeManager.js");



const webSocketsServerPort = 3001;
const webSocketServer = require('websocket').server;
const http = require('http');
// Spinning the http server and the websocket server.
const server = http.createServer();
server.listen(webSocketsServerPort);
const wsServer = new webSocketServer({
  httpServer: server
});

// I'm maintaining all active connections in this object
const clients = {};

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
  clients[userID] = connection;

  connection.on('message', req => {
    let msg = JSON.parse(req.utf8Data);
    if(msg.type==='login') {
      console.log(msg.data.name+" : "+msg.data.pwd + " : " + msg.id);
      console.log("cc: "+clients[msg.id]); //TODO
      clients[msg.id].send("logging in..."+msg.data.name+" : "+msg.data.pwd);
    }
  });

  connection.send(userID);
  console.log('connected: ' + userID + ' in ' + Object.getOwnPropertyNames(clients));
});


// const app = express();
// app.use(bodyParser.urlencoded({ extended: false }));
// app.use(pino);

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, access-control-allow-origin, authorization, vary, Accept");
//   if ('OPTIONS' === req.method)
//     res.sendStatus(200);
//   else next();
// });

// app.listen(3001, () =>
//   console.log('Express server is running on localhost:3001')
// );

// app.get('/api/hello', (req, res) => {
//   console.log('hello');
//   res.setHeader('Content-Type', 'application/json');
//   res.send(JSON.stringify({ greeting: 'Hello World' }));
// });

// app.get('/api/verify', am.verifyToken, (req, res) => {
//   res.sendStatus(200);
// });

// app.post('/api/login', (req, res) => {
//   dbc.login(req.body.user.name, req.body.user.pwd).then(data => {
//     if (data==-1) {
//       res.status(403).send("Cant find user");
//       console.log("wrong username or password");
//     }
//     else if (data==-2) {
//       console.log("error on login (server error)");
//       res.status(500).send("Server error");
//     } 
//     else {
//       am.getUserToken(data).then(token => {
//         res.set('authorization','Bearer '+ token);
//         res.set("Access-Control-Expose-Headers", "Authorization");
//         res.set('Access-Control-Allow-Origin', '*');
//         res.status(200).send();
//       });
//     }
//   });
// });

// app.get('/api/addexuser', (req, res) => {
//   console.log('odd');
//   dbc.addExUser().then(data => {
//     console.log(data);
//     res.sendStatus(200);
//   });
// });

import { w3cwebsocket as W3CWebSocket } from "websocket";

const client = new W3CWebSocket('ws://127.0.0.1:3001');
var baseURL = "http://localhost:3001";


export function addToken(token) {
    localStorage.setItem('token', token);
}

export function getToken() {
    return localStorage.getItem('token');
}

var defaultHeaders = {
    'Content-Type': 'application/json',
    'authorization': getToken()
  }

var lightHeaders = {
'authorization': getToken()
};

function updateHeaders() {
    defaultHeaders.authorization = getToken();
    lightHeaders.authorization = getToken();
}

export function setSessionId(id) {
    console.log(id);
    sessionStorage.setItem('sessionId', id);
}

export function getSessionId() {
    sessionStorage.getItem('sessionId');
}

export function getNewSessionId() {
    return new Promise(resolve => {
        client.onopen = () => {
            console.log('WebSocket Client Connected');
          };
          client.onmessage = (message) => {
            resolve(message);
          };
    });

}

export function login(name, pwd) {
    client.send(JSON.stringify({type: "login", id: getSessionId(), data: {name: name, pwd: pwd}}));
}


/**
 * Hello
 */
export function ping() {
    //get token via sessionStorage.getItem("token")
    //updateHeaders();
	 return new Promise(resolve => {
        fetch(baseURL+'/api/hello', {
            headers: defaultHeaders,
            //mode: 'cors'
        }).then(res => resolve(res)).catch(err => {resolve(err)});
    });
}

export function verify() {
    updateHeaders();
    return new Promise(resolve => {
        fetch(baseURL+'/api/verify');
    });
}

export function login_(name, pwd) {
    updateHeaders();
	 return new Promise(resolve => {
        fetch(baseURL+'/api/login', {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json'
              }, body: JSON.stringify({
                name: name,
                pwd: pwd,
              })
            }).then(res => resolve(res));
    });
}
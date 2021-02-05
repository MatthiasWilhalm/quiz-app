import SocketCommunication from "../std/SocketCommunication";

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
    return sessionStorage.getItem('sessionId');
}

export function login(client, name, pwd) {
    client.send(new SocketCommunication('login', getSessionId(), getToken(), {name: name, pwd: pwd}).getMsg());
}

export function checkAccess(client) {
    client.send(new SocketCommunication('sec', getSessionId(), getToken(), "hi").getMsg());
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
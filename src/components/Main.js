import useWebSocket from 'react-use-websocket';
import React, { Component, useState, useEffect, useRef } from 'react';

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect,
    withRouter,
    useHistory
} from "react-router-dom";
import { addToken, getSessionId, getToken, ping, setSessionId } from '../tools/connection';
import Home from './Home';
import Login from './Login';
import { SocketCommunication } from "../std/SocketCommunication";


//const client = new W3CWebSocket('ws://127.0.0.1:3001');
/**
 * Hauptsächlich für das Routen zuständig
 */
const Main = () => {
    const history = useHistory();
    const socketUrl = 'ws://127.0.0.1:3001';

    const {
        sendMessage,
        sendJsonMessage,
        lastMessage,
        lastJsonMessage,
        readyState,
        getWebSocket
    } = useWebSocket(socketUrl, {
        onopen: () => {
            console.log('WebSocket Client Connected');
        },
        shouldReconnect: (closeEvent) => true,
        share: true,
        onmessage: e => {
            let data = new SocketCommunication();
            data.set(e.data);
            switch (data.type) {
                case 'sessionId':
                    setSessionId(data.data);
                    console.log(getSessionId());
                    break;
                case 'login':
                    console.log(data.token);
                    addToken(data.token);
                    this.redirect('/home');
                    break;
                default:
                    console.log(data);
                    break;
            }
        }
    });

    const redirect = p => {
        history.push(p);
    }

    const send = (type, data) => {
        let s = new SocketCommunication(type, getSessionId(), getToken(), data).getMsg();
        console.log(s);
        sendMessage(s);
    }

    useEffect(() => {
        console.log(getWebSocket());
    });


    return (
        <div>
            <div>
                Hello
                </div>
            <Router>
                <div>
                    <Switch>
                        <Route exact path="/" render={props => <Home {...props}></Home>}></Route>
                        <Route path="/home" render={props => <Home {...props}></Home>}></Route>
                        <Route path="/login"><Login send={send} redirect={redirect}></Login></Route>
                    </Switch>
                </div>
            </Router>
        </div>
    );
}

export default Main

import useWebSocket from 'react-use-websocket';
import React, { Component, useState, useEffect, useRef, createRef } from 'react';

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
import Game from './Game';


//const client = new W3CWebSocket('ws://127.0.0.1:3001');
/**
 * Hauptsächlich für das Routen zuständig
 */
const Main = () => {
    const socketUrl = 'ws://127.0.0.1:3001';

    const loginChild = createRef();
    const createGameChild = createRef();
    const getGameChild = createRef();

    const {
        sendMessage,
        sendJsonMessage,
        lastMessage,
        lastJsonMessage,
        readyState,
        getWebSocket
    } = useWebSocket(socketUrl, {
        onOpen: e => {
            console.log('WebSocket Client Connected');
        },
        share: true,
        onMessage: e => {
            let msg = new SocketCommunication();
            msg.set(e.data);
            //setSessionId(data.id);
            switch (msg.type) {
                case 'sessionId':
                    setSessionId(msg.id);
                    console.log(getSessionId());
                    break;
                case 'login':
                    console.log(msg.token);
                    addToken(msg.token);
                    loginChild.current.goHome();
                    break;
                case 'creategame':
                    console.log("reseaved new game");
                    createGameChild.current.goGame(msg.data._id);
                    break;
                case 'joingame':
                case 'updategame':
                    console.log("getting game");
                    getGameChild.current.loadGame(msg.data);
                    break;
                case 'updateplayerlist':
                    console.log('new player joined game');
                    getGameChild.current.updatePlayerList(msg.data);
                    break;
                case 'getquestions':
                    getGameChild.current.getQuestions(msg.data);
                    break;
                default:
                    console.log(msg);
                    break;
            }
        }
    });

    const send = (type, data) => {
        let s = new SocketCommunication(type, getSessionId(), getToken(), data).getMsg();
        console.log(JSON.parse(s));
        sendMessage(s);
    }

    useEffect(() => {
        //TODO: sessionID wird nach reload neu generiert, aber nicht richtig gesetzt
    }, []);


    return (
        <div>
            <div>
                <p className="debug">{"token: " + getToken()}</p>
                <p className="debug">{"sessionID: " + getSessionId()}</p>
            </div>
            <Router>
                <div>
                    <Switch>
                        <Route exact path="/"><Home send={send} ref={createGameChild}></Home></Route>
                        <Route path="/home"><Home send={send} ref={createGameChild}></Home></Route>
                        <Route path="/login"><Login send={send} ref={loginChild}></Login></Route>
                        <Route exact path="/game"><Game send={send} ref={getGameChild}></Game></Route>
                        <Route path="/game/:id"><Game send={send} ref={getGameChild}></Game></Route>
                    </Switch>
                </div>
            </Router>
        </div>
    );
}

export default Main

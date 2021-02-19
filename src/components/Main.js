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
    const socketUrl = 'ws://'+window.location.hostname+':3001';

    const refHome = createRef();
    const refLogin = createRef();
    const refGame = createRef();

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
        onError: e => {
            console.log('can not connect');
        },
        share: true,
        onMessage: e => {
            let msg = new SocketCommunication();
            msg.set(e.data);
            console.log(msg.data);
            if(msg.data==="403") {
                if(refHome.current!==undefined)
                    refHome.current.goLogin();
                else if(refGame.current!==undefined)
                    refGame.current.goLogin();
            } else {
                switch (msg.type) {
                    case 'sessionId':
                        setSessionId(msg.id);
                        console.log(getSessionId());
                        break;
                    case 'login':
                        console.log(msg.token);
                        addToken(msg.token);
                        refLogin.current.goHome();
                        break;
                    case 'creategame':
                        console.log("reseaved new game");
                        refHome.current.goGame(msg.data._id);
                        break;
                    case 'joingame':
                    case 'updategame':
                        console.log("getting game");
                        refGame.current.loadGame(msg.data);
                        break;
                    case 'updateplayerlist':
                        console.log('new player joined game');
                        if(refGame.current!==null)
                            refGame.current.updatePlayerList(msg.data);
                        break;
                    case 'getquestions':
                        refGame.current.getQuestions(msg.data);
                        break;
                    default:
                        console.log(msg);
                        break;
                }
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
        if(!getToken()) {
            if(!!refHome.current)
                refHome.current.goLogin();
            else if(!!refGame.current)
                refGame.current.goLogin();
        }
    }, []);


    return (
        <div>
            <Router>
                <div>
                    <Switch>
                        <Route exact path="/"><Home send={send} ref={refHome}></Home></Route>
                        <Route path="/home"><Home send={send} ref={refHome}></Home></Route>
                        <Route path="/login"><Login send={send} ref={refLogin}></Login></Route>
                        <Route exact path="/game"><Game send={send} ref={refGame}></Game></Route>
                        <Route path="/game/:id"><Game send={send} ref={refGame}></Game></Route>
                    </Switch>
                </div>
            </Router>
        </div>
    );
}

export default Main

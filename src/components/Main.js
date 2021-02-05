import { w3cwebsocket as W3CWebSocket } from "websocket";
import React, { Component } from 'react';

import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect,
    withRouter 
} from "react-router-dom";
import { addToken, getSessionId, ping, setSessionId } from '../tools/connection';
import Home from './Home';
import Login from './Login';
import { SocketCommunication } from "../std/SocketCommunication";

const client = new W3CWebSocket('ws://127.0.0.1:3001');

//const client = new W3CWebSocket('ws://127.0.0.1:3001');
/**
 * Hauptsächlich für das Routen zuständig
 */
export class Main extends Component {
    constructor(props) {
        super(props);
        this.state = {
            client: null
        }
    }


    componentDidMount() {
        client.onmessage = e => {
            let data = new SocketCommunication();
            data.set(e.data);
            switch (data.type) {
                case 'sessionId':
                    setSessionId(data.data);
                    break;
                case 'login':
                    console.log(data.token);
                    addToken(data.token);
                    console.log(this.props);
                    this.redirect('/home');
                    break;
                default:
                    console.log(data);
                    break;
            }
        }

        client.onopen = () => {
            console.log('WebSocket Client Connected');
        };
        this.setState({ client: client });
    }


    redirect = p => {
        console.log(this.props);
        //history.push(p);
    }


    render() {
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
                            <Route path="/login" render={props => <Login {...props} client={this.state.client} redirect={this.redirect}></Login>}></Route>
                        </Switch>
                    </div>
                </Router>
            </div>
        )
    }
}

export default Main

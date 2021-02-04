import React, { Component } from 'react';

import {
    BrowserRouter as Router,
    Switch,
    Route
  } from "react-router-dom";
import { getSessionId, ping, getNewSessionId, setSessionId } from '../tools/connection';
import Home from './Home';
import Login from './Login';


/**
 * Hauptsächlich für das Routen zuständig
 */
export class Main extends Component {
    constructor(props) {
        super(props);
}

componentDidMount() {
    this.pings();
}

pings = () => {
    //ping().then(data => {console.log(data)});
    getNewSessionId().then(data => setSessionId(data.data));
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
                        <Route path="/login" render={props => <Login {...props}></Login>}></Route>
                    </Switch>
                  </div>
                </Router>
            </div>
        )
    }
}

export default Main

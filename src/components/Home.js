import React, { Component } from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route
} from "react-router-dom";
import { getToken, login } from '../tools/connection';

/**
 * Hauptsächlich für das Routen zuständig
 */
export class Home extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        let t = getToken();
        if(t) {
            
        }
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

                        </Switch>
                    </div>
                </Router>
            </div>
        )
    }
}

export default Home

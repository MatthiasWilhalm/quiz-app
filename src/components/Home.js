import React, { Component, forwardRef, useImperativeHandle } from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    useHistory
} from "react-router-dom";
import { getUser } from '../tools/connection';


const Home = forwardRef((props, ref) => {
    const history = useHistory();

    const createGame = () => {
        props.send('creategame', null);
    }

    useImperativeHandle(ref, () => ({
        goGame (id) {
            history.push('/game/'+id);
        }
    }));

    return (
        <div>
            <div>
                <h1>Home</h1>
                <p className="debug">{"Name: " + getUser().name}</p>
                <p className="debug">{"ID: " + getUser().id}</p>
            </div>
            <button onClick={createGame}>New Game</button>
            <button>Join Game</button>
        </div>
    )
});

export default Home

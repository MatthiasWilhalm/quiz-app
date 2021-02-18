import React, { Component, forwardRef, useEffect, useImperativeHandle } from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    useHistory
} from "react-router-dom";
import { getUser, removeToken } from '../tools/connection';


const Home = forwardRef((props, ref) => {
    const history = useHistory();

    const createGame = () => {
        props.send('creategame', null);
    }

    const logout = () => {
        removeToken();
        history.push('/login');
    }

    useImperativeHandle(ref, () => ({
        goGame (id) {
            history.push('/game/'+id);
        },
        goLogin() {
            history.push('/login');
        }
    }));

    useEffect(() => {
        props.send('sec', null);
    }, [])

    return (
        <div>
            <div>
                <h1>Home</h1>
                <p className="debug">{"Name: " + getUser().name}</p>
                <p className="debug">{"ID: " + getUser().id}</p>
            </div>
            <button onClick={logout}>Logout</button>
            <button onClick={createGame}>New Game</button>
            <button>Join Game</button>
        </div>
    )
});

export default Home

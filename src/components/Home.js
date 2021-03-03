import React, { Component, forwardRef, useEffect, useState, useImperativeHandle } from 'react';
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

    const [viewGameList, setViewGameList] = useState(false);
    const [gameList, setGameList] = useState([]);

    const createGame = () => {
        props.send('creategame', null);
    }

    const logout = () => {
        removeToken();
        history.push('/login');
    }

    const toggleGameListView = () => {
        if(!viewGameList) getGameList();
        setViewGameList(!viewGameList);
    }

    const getGameList = () => {
        props.send('getopengames', null);
    }

    useImperativeHandle(ref, () => ({
        goGame(id) {
            history.push('/game/' + id);
        },
        goLogin() {
            history.push('/login');
        },
        setOpenGames(games) {
            setGameList(games);
        }
    }));

    // useEffect(() => {
    //     setTimeout(() => props.send('getopengames', null), 1000);
    // }, [])

    const renderGameList = () => {
        return (
            <div>
                <div className="formlist">
                    <button onClick={toggleGameListView}>Menu</button>
                </div>
                {gameList.length>0?
                    <ul className="gamelist"> 
                        {gameList.map(g => 
                            <li>
                                <Link to={g.state!=='lobby'?'':'/game/'+g._id}>
                                    <div>{'hosted by '+g.mod.name+' // '+g.state}</div>
                                </Link>
                            </li>
                        )}
                    </ul>
                :<div>no open games to join</div>}

            </div>
        );
    }

    const renderMenu = () => {
        return (
            <div className="formlist">
                <p>{"Logged in as " + getUser().name}</p>
                <button onClick={createGame}>New Game</button>
                <button onClick={toggleGameListView}>Join Game</button>
                <button onClick={logout}>Logout</button>
            </div>
        );
    }

    return (
        <div>
            <div>
                <h1>Home</h1>
            </div>
            {viewGameList?renderGameList():renderMenu()}
        </div>
    )
});

export default Home

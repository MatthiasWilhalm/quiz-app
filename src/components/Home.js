import React, { Component, forwardRef, useEffect, useState, useImperativeHandle } from 'react';
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    useHistory
} from "react-router-dom";
import { getUser, removeToken } from '../tools/connection';

import logo from '../assets/temp_logo.png';


const Home = forwardRef((props, ref) => {
    const history = useHistory();
    const VIEWS = ['menu', 'list', 'edit'];

    const [viewGameList, setViewGameList] = useState(false);
    const [viewMode, setViewMode] = useState(VIEWS[0]);
    const [gameList, setGameList] = useState([]);

    const [editUserName, setEditUserName] = useState(getUser().name);
    const [editUserPwd, setEditUserPwd] = useState('');

    const createGame = () => {
        props.send('creategame', null);
    }

    const logout = () => {
        removeToken();
        history.push('/login');
    }

    const toggleGameListView = () => {
        if(viewMode==='menu') getGameList();
        setViewMode(viewMode==='menu'?'list':'menu');
    }

    const getGameList = () => {
        props.send('getopengames', null);
    }

    const updateUser = () => {
        if(editUserName!=='') {
            props.send('updateuser', {name: editUserName, pwd: editUserPwd});
            setViewMode('menu');
        }
            
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
                                    <div>{'hosted by '+g.mod.name}</div>
                                    <div>{g.connected+' online'}</div>
                                    <div>{g.state}</div>
                                </Link>
                            </li>
                        )}
                    </ul>
                :<h1>no open games to join</h1>}

            </div>
        );
    }

    const renderUserEdit = () => {
        return (
            <div className="formlist">
                <label>Name</label>
                <input value={editUserName} onChange={e => setEditUserName(e.target.value)}></input>
                <label>Password</label>
                <input value={editUserPwd} onChange={e => setEditUserPwd(e.target.value)}></input>
                <button onClick={updateUser}>Update</button>
                <button onClick={() => setViewMode('menu')}>Cancel</button>
            </div>
        );
    }

    const renderMenu = () => {
        return (
            <div className="formlist">
                <button onClick={createGame}>New Game</button>
                <button onClick={toggleGameListView}>Join Game</button>
                <Link to="/question">
                    <button>Edit Questions</button>
                </Link>
                <button onClick={() => setViewMode('edit')}>Edit Userdata</button>
                <button onClick={logout}>Logout</button>
            </div>
        );
    }

    return (
        <div>
            <div className="navbar">
                <p>{"Logged in as " + getUser().name}</p>
                <img src={logo} alt="logo" className="logo"></img>
            </div>
            <div className="content">
                {viewMode==='list'?renderGameList():''}
                {viewMode==='menu'?renderMenu():''}
                {viewMode==='edit'?renderUserEdit():''}
            </div>
            
        </div>
    )
});

export default Home

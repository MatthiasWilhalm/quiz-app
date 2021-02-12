import React, { Component, useEffect, useState } from 'react'
import { checkAccess, login } from '../tools/connection';

const Login = ({send, redirect}) => {
    var [name, setName] = useState('');
    var [pwd, setPwd] = useState('');

    const update = e => {
        if(e.target.id==='name')
            setName(e.target.value);
        else if (e.target.id==='pwd')
            setPwd(e.target.value);
    }

    const commit = () => {
        send('login', JSON.stringify({name: name, pwd: pwd}));
        //login(send, name, pwd);
    }

    const check = () => {
        send('sec',"hi");
        //checkAccess(client.current);
    }

    return (
        <div>
            <input placeholder="Name" value={name} id="name" onChange={update}></input>
            <input placeholder="Password" value={pwd} id="pwd" onChange={update}></input>
            <button onClick={commit}>Send</button>
            <button onClick={check}>Check</button>
        </div>
    )
}

export default Login

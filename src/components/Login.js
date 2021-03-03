import React, { Component, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useHistory } from 'react-router-dom';
import { checkAccess, login } from '../tools/connection';

const Login = forwardRef ((props, ref) => {
    const history = useHistory();
    var [name, setName] = useState('');
    var [pwd, setPwd] = useState('');

    console.log(ref);

    const update = e => {
        if(e.target.id==='name')
            setName(e.target.value);
        else if (e.target.id==='pwd')
            setPwd(e.target.value);
    }

    useImperativeHandle(ref, () => ({
        goHome () {
            history.push('/home');
        }
    }));

    const commit = () => {
        props.send('login', {name: name, pwd: pwd});
        //login(send, name, pwd);
    }

    const check = () => {
        props.send('sec',"hi");
        //checkAccess(client.current);
    }

    return (
        <div className="formlist">
            <h1>Login</h1>
            <input placeholder="Name" value={name} id="name" onChange={update}></input>
            <input placeholder="Password" value={pwd} id="pwd" onChange={update} type="password"></input>
            <button onClick={commit}>Send</button>
            <button onClick={check}>Check</button>
        </div>
    )
});

export default Login

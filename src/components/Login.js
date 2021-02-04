import React, { Component } from 'react'
import { login } from '../tools/connection';

export class Login extends Component {
    constructor(props) {
        super(props);
        this.state = {
            name: '',
            pwd: ''
        }
    }

    update = e => {
        this.setState({[e.target.id]: e.target.value});
    }

    commit = () => {
        login(this.state.name, this.state.pwd);
    }

    render() {
        return (
            <div>
                <input placeholder="Name" value={this.state.name} id="name" onChange={this.update}></input>
                <input placeholder="Password" value={this.state.pwd} id="pwd" onChange={this.update}></input>
                <button onClick={this.commit}>Send</button>
            </div>
        )
    }
}

export default Login

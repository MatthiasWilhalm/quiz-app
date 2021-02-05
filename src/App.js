import './App.css';
import Main from './components/Main';
import React, { Component } from 'react';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }
  render() {
    console.log(this.props);
    return (
      <Main {...this.props}></Main>
    );
  }
}

export default App;

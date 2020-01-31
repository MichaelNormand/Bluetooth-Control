import React from 'react';
import logo from './logo.svg';
import './App.css';

function DefaultApp() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default class App extends React.Component{
  constructor() {
    super()
    this.state = {
      bluetoothDevices: []
    }
  }
  handleClick = (event) => {
    navigator.bluetooth.requestDevice({filters: [{ namePrefix: 'DOMOTYX' }]}).then(function(device) {
      console.log(device)
      if (device.gatt.connected) {
        this.state.bluetoothDevices.append(device)
        return
      }
      device.gatt.connect().then(function(connectedDevice) {
        console.log(connectedDevice)
      }).catch(function(error) {
        console.log(error)
      })
    }).catch(function(error) {
      console.log(error)
    })
  }
  render() {
    return (
      <button onClick={this.handleClick}>Hellooo!</button>
    )
  }
};

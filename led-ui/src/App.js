import React from 'react'
import Device from './device'
import WebSockets from 'socket.io-client'
import './App.css'

export default class App extends React.Component {
    constructor() {
        super()
        this.state = {
            devices: [],
            webSocket: undefined,
            endpoint: 'http://localhost:4000/'
        }
    }
    fetchDevices = (socket, apiUrl) => {
        
        fetch(apiUrl + 'list-devices')
            .then(response => {
                response
                    .json()
                    .then(devices => {
                        this.setState({ devices: devices, webSocket: socket })
                    })
                    .catch(error => {
                        console.log(error)
                        this.setState({ webSocket: socket })
                    })
            })
            .catch(error => {
                console.log(error)
                this.setState({ webSocket: socket })
            })
        if (socket !== undefined) {
            socket.on('devices-list', data => {
                let devices = JSON.parse(data)
                this.setState({devices: devices})
            })
            socket.on('device-online', data => {
                let device = JSON.parse(data)
                this.state.devices.push(device)
                this.setState({devices: this.state.devices.map(device => device)})
            })
            socket.on('device-offline', data => {
                let deviceRemoved = JSON.parse(data)
                this.setState({
                    devices: this.state.devices.filter(device => {
                        return device.key !== deviceRemoved.key
                    })
                })
            })
        }
    }
    render() {
        if (this.state.devices.length <= 0) {
            return (
                <div className="container">
                    <div className="loading">
                        <h1>En attente de dispositifs</h1>
                    </div>
                </div>
            )
        }
        return (
            <div className="container">
                {this.state.devices.map(device => {
                    return (
                        <Device
                            key={device.key}
                            id={device.key}
                            name={device.name}
                            status={device.status}
                            socket={this.state.webSocket}
                        />
                    )
                })}
            </div>
        )
    }
    componentDidMount() {
        if (this.state.webSocket === undefined) {
            let apiUrl = this.state.endpoint
            let socket = WebSockets(apiUrl)
            this.fetchDevices(socket, apiUrl)
        }
    }
}

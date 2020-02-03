import React from 'react'
import Device from './device'
import WebSockets from 'socket.io-client'
import './App.css'

// Classe permettant d'afficher l'application
export default class App extends React.Component {
    // Constructeur de la classe
    constructor() {
        super()
        // Instanciation des états de l'application
        this.state = {
            devices: [],
            webSocket: undefined,
            endpoint: 'http://localhost:4000/'
        }
    }
    // Méthode permettant de configurer le socket de connexion avec le serveur
    setUpSocket = socket => {
        // On s'assure que le socket n'est pas vide
        if (socket !== undefined) {
            // On crée une oreille permettant d'écouter lorsque le socket nous demande d'avoir la liste des appareils connectés
            socket.on('devices-list', data => {
                let devices
                try {
                    devices = JSON.parse(data)
                } catch (Exception) {
                    return
                }
                this.setState({ devices: devices })
            })
            // On crée une oreille permettant de savoir lorsqu'un nouvel appareil est en ligne
            socket.on('device-online', data => {
                let device
                try {
                    device = JSON.parse(data)
                }
                catch (Exception) {
                    return
                }
                this.state.devices.push(device)
                this.setState({
                    devices: this.state.devices.map(device => device)
                })
            })
            // On crée une oreille permettant de savoir lorsqu'un appareil est hors-ligne
            socket.on('device-offline', data => {
                let deviceRemoved
                try {
                    deviceRemoved = JSON.parse(data)
                }
                catch (Exception) {
                    return
                }
                this.setState({
                    devices: this.state.devices.filter(device => {
                        return device.key !== deviceRemoved.key
                    })
                })
            })
            this.setState({webSocket: socket})
        }
    }
    // Méthode permettant d'afficher l'application
    render() {
        // Si l'application ne comporte aucun appareil
        if (this.state.devices.length <= 0) {
            return (
                <div className="container">
                    <div className="loading">
                        <h1>En attente de dispositifs</h1>
                    </div>
                </div>
            )
        }
        // Si l'application comporte au moins un appareil
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
    // Méthode sachant quand la composante a été monté / affichée
    componentDidMount() {
        // On s'assure qu'on a un socket
        if (this.state.webSocket === undefined) {
            let socket = WebSockets(this.state.endpoint)
            this.setUpSocket(socket)
        }
    }
}

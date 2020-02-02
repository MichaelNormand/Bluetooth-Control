import React from 'react'
import './device.css'

// Classe permettant de gérer un appareil
export default class Device extends React.Component {
    // Constructeur de la classe
    constructor() {
        super()
        // Instanciation des états de l'appareil
        this.state = {
            status: undefined
        }
    }

    // Méthode permettant de détecter lorsqu'un clic de changement d'état a été déclenché
    handleStateChangeClick = event => {
        if (this.props.socket === undefined) {
            console.log('There is no socket available')
            return
        }
        this.props.socket.emit(
            'device-status-change-request',
            JSON.stringify({ key: this.props.id, status: !this.state.status })
        )
    }

    // Méthode permettant de détecter lorsqu'un clic de suppression d'appareil a été déclenché
    handleDestroyClick = event => {
        if (this.props.socket === undefined) {
            console.log('There is no socket available')
            return
        }
        this.props.socket.emit(
            'device-remove',
            JSON.stringify({ key: this.props.id })
        )
    }

    // Méthode permettant d'afficher l'appareil
    render() {
        return (
            <div className="device">
                <h1>{this.props.name}</h1>
                <h3
                    className={
                        this.state.status !== undefined && this.state.status
                            ? 'active'
                            : 'inactive'
                    }
                >
                    {this.state.status ? 'Actif' : 'Inactif'}
                </h3>
                <button
                    onClick={this.handleStateChangeClick}
                    className={
                        this.state.status !== undefined && this.state.status
                            ? 'inactive'
                            : 'active'
                    }
                >
                    {this.state.status !== undefined && this.state.status
                        ? 'Éteindre'
                        : 'Allumer'}
                </button>
                <button onClick={this.handleDestroyClick} className="inactive">
                    Supprimer
                </button>
            </div>
        )
    }

    // Méthode permettant de détecter lorsque l'appareil a été monté / affiché
    componentDidMount() {
        if (this.state.status === undefined) {
            this.setState({ status: this.props.status })
        }
        if (this.props.socket !== undefined) {
            this.props.socket.on('device-status-changed', data => {
                let deviceChanged = JSON.parse(data)
                if (deviceChanged.key === this.props.id) {
                    this.setState({ status: deviceChanged.status })
                }
            })
        }
    }
}

import React from 'react'
import './device.css'

export default class Device extends React.Component {
    constructor() {
        super()
        this.state = {
            status: undefined
        }
    }
    componentDidMount() {
        if (this.state.status === undefined) {
            this.setState({ status: this.props.status })
        }
        if (this.props.socket !== undefined) {
            this.props.socket.on('device-status-changed', data => {
                let deviceChanged = JSON.parse(data)
                if (deviceChanged.key === this.props.id) {
                    this.setState({status: deviceChanged.status})
                }
            })
        }
    }
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
}

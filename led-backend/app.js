require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
const http = require('http').createServer(app)
const net = require('net')
const shortid = require('shortid')
const webNet = require('socket.io')(http)

let sockets = []
let websockets = []
let netServer = net.createServer(socket => {
    let key = shortid.generate()
    console.log('New net socket connection!')
    socket.setEncoding('utf8')
    socket.write('REQUEST_NAME')
    socket.on('data', data => {
        console.log(data)
        let jdata = JSON.parse(data)
        if (jdata === undefined || jdata.request === undefined) {
            return
        }
        if (jdata.request === 'IDENTIFICATION') {
            let name =
                jdata.name === undefined ||
                jdata.name === '' ||
                jdata.toString().length <= 0
                    ? 'Appareil Inconnu'
                    : jdata.name.toString()
            let status =
                jdata.status === undefined ||
                jdata.name === '' ||
                jdata.toString().length <= 0
                    ? false
                    : jdata.status
            sockets.push({
                key: key,
                name: name,
                status: status,
                socket: socket
            })
            socket.write('KEY: ' + key)
            webNet.emit(
                'device-online',
                JSON.stringify({ key: key, name: name, status: status })
            )
            console.log(`Socket ${key} is now online with the name ${name}...`)
            return
        }
        if (jdata.request === 'STATUS_CHANGE_CONFIRMATION') {
            console.log('Got a confirmation')
            let key = jdata.key
            let status = jdata.status
            if (key === undefined || key === '' || status === undefined) {
                return
            }
            if (status !== true && status !== false) {
                return
            }
            let changedSocket = sockets.filter(socket => {
                return socket.key === key
            })
            if (changedSocket.length <= 0) {
                return
            }
            changedSocket[0].status = status
            webNet.emit(
                'device-status-changed',
                JSON.stringify({
                    key: changedSocket[0].key,
                    status: changedSocket[0].status
                })
            )
            console.log(
                `Socket ${key} has changed status for ${changedSocket[0].status}...`
            )
        }
    })
    socket.on('end', () => {
        sockets = sockets.filter(socket => {
            socket.key !== key
        })
        webNet.emit(
            'device-offline',
            JSON.stringify({ key: key })
        )
        console.log(`Socket ${key} is offline...`)
    })
    socket.on('error', () => {
        sockets = sockets.filter(socket => {
            socket.key !== key
        })
        webNet.emit(
            'device-offline',
            JSON.stringify({ key: key })
        )
        console.log(`Socket ${key} is offline...`)
    })
})

netServer.on('error', error => {
    console.log(
        `Net server has experienced an error. Here is the infos => ${error}`
    )
})

webNet.on('connection', connection => {
    console.log('New connection!')
    websockets.push(connection)
    connection.emit('devices-list', JSON.stringify(sockets))
    connection.on('device-status-change-request', data => {
        console.log('Status change request')
        let dataJson = JSON.parse(data)
        if (dataJson === undefined) {
            return
        }
        let device = sockets.filter(socket => {
            return socket.key === dataJson.key
        })
        if (device.length <= 0) {
            return
        }
        console.log(dataJson.status)
        if (dataJson.status === true) {
            console.log('Turning on')
            device[0].socket.write('ON')
        } else {
            console.log('Turning off')
            device[0].socket.write('OFF')
        }
    })
    connection.on('device-remove', data => {
        console.log('Device remove request')
        let dataJson = JSON.parse(data)
        if (dataJson === undefined) {
            return
        }
        let device = sockets.filter(socket => {
            return socket.key === dataJson.key
        })
        sockets = sockets.filter(socket => {
            return socket.key !== dataJson.key
        })
        if (device.length <= 0) {
            return
        }
        webNet.sockets.emit(
            'device-offline',
            JSON.stringify({ key: dataJson.key })
        )
        device[0].socket.destroy()
    })
})

app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) => {
    // TODO: faire la référence à l'app en React ici
    res.send('Hello World!')
})

app.get('/list-devices', (req, res) => {
    let devices = sockets.map(device => {
        return { key: device.key, name: device.name, status: device.status }
    })
    res.json(devices)
})

http.listen(process.env.WEB_PORT, () =>
    console.log(`Server running on port ${process.env.WEB_PORT}`)
)

netServer.listen(process.env.NET_PORT, () => {
    console.log(`Net server running on port ${process.env.NET_PORT}`)
})

// Import de la configuration du serveur
require('dotenv').config()

// Import des librairies de Node JS
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const app = express()
const http = require('http').createServer(app)
const net = require('net')
const shortid = require('shortid')
const webNet = require('socket.io')(http)
const path = require('path')

// Ajout d'une liste qui contiendra les appareils connectés
let sockets = []

// Création d'une instance sur le serveur qui attendra les appareils
let netServer = net.createServer(socket => {
    // Création d'un identifiant unique à l'appareil
    let key = shortid.generate()
    socket.setEncoding('utf8')

    // Envoi d'une demande d'identification à l'appareil
    socket.write('REQUEST_NAME')

    // Création d'une oreille qui écoute lorsque l'appareil envoiera de l'information au serveur
    socket.on('data', data => {
        // On va obtenir l'information que l'appareil envoie en JSON
        let jdata
        try {
            jdata = JSON.parse(data)
        } catch (Exception) {
            // Si c'est pas du JSON, on ne touche pas l'information
            return
        }

        // On s'assure que l'appareil nous donne un motif à sa communication et que l'information n'est pas vide
        if (jdata === undefined || jdata.request === undefined) {
            return
        }

        // Dans le cas où l'appareil désire s'identifier
        if (jdata.request === 'IDENTIFICATION') {
            // On va chercher le nom de l'appareil
            let name =
                jdata.name === undefined ||
                jdata.name === '' ||
                jdata.toString().length <= 0
                    ? 'Appareil Inconnu'
                    : jdata.name.toString()
            // On va chercher le status de l'appareil
            let status =
                jdata.status === undefined ||
                jdata.name === '' ||
                jdata.toString().length <= 0
                    ? false
                    : jdata.status
            // On ajoute l'appareil à la liste d'appareils connectés
            sockets.push({
                key: key,
                name: name,
                status: status,
                socket: socket
            })
            // On envoie à l'appareil sa clé d'identification
            socket.write('KEY: ' + key)

            // On avise tout le monde qu'un nouvel appareil est en ligne
            webNet.emit(
                'device-online',
                JSON.stringify({ key: key, name: name, status: status })
            )
            console.log(`Socket ${key} is now online with the name ${name}...`)
            return
        }

        // Dans le cas où l'appareil veut nous confirmer qu'il a changé d'état
        if (jdata.request === 'STATUS_CHANGE_CONFIRMATION') {
            // On va chercher la clé de l'appareil et son status
            let key = jdata.key
            let status = jdata.status

            // On s'assure que les informations que l'appareil nous a envoyé ne sont pas vide
            if (key === undefined || key === '' || status === undefined) {
                return
            }

            // On s'assure que l'appareil nous a envoyé un status qui correspond soit à vrai ou faux
            if (status !== true && status !== false) {
                return
            }

            // On va chercher l'appareil dans la liste des appareils connectés
            let changedSocket = sockets.filter(socket => {
                return socket.key === key
            })

            // On s'assure qu'on a trouvé l'appareil
            if (changedSocket.length <= 0) {
                return
            }

            // On change son status
            changedSocket[0].status = status

            // On avise tout le monde que l'appareil a changé
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

    // Création d'une oreille qui saura quand l'appareil se déconnecte
    socket.on('end', () => {
        // On enlève l'appareil de la liste des appareils connectés
        sockets = sockets.filter(socket => {
            socket.key !== key
        })

        // On avise tout le monde que l'appareil s'est déconnecté
        webNet.emit('device-offline', JSON.stringify({ key: key }))
        console.log(`Socket ${key} is offline...`)
    })

    // Création d'une oreille qui saura quand l'appareil rencontrera des erreurs
    socket.on('error', () => {
        // On enlève l'appareil de la liste des appareils connectés
        sockets = sockets.filter(socket => {
            socket.key !== key
        })

        // On avise tout le monde que l'appareil s'est déconnecté
        webNet.emit('device-offline', JSON.stringify({ key: key }))
        console.log(`Socket ${key} is offline...`)
    })
})

// Création d'une oreille qui saura quand le serveur rencontrera des erreurs
netServer.on('error', error => {
    console.log(
        `Net server has experienced an error. Here is the infos => ${error}`
    )
})

// Création d'une oreille qui saura quand un nouveau client se connecte à l'application
webNet.on('connection', connection => {
    console.log('New connection!')

    // On envoie la liste des appareils connectés au client
    connection.emit('devices-list', JSON.stringify(sockets))

    // Création d'une oreille qui saura quand un client demandera un changement sur un appareil
    connection.on('device-status-change-request', data => {
        console.log('Status change request')
        // On transforme les informations envoyés par le client en JSON et on s'assure que c'est du JSON
        let dataJson
        try {
            dataJson = JSON.parse(data)
        } catch (Exception) {
            return
        }
        // On s'assure que l'information n'est pas vide
        if (dataJson === undefined) {
            return
        }

        // On va chercher l'appareil concerné par la demande de changement
        let device = sockets.filter(socket => {
            return socket.key === dataJson.key
        })

        // On s'assure qu'on a trouvé l'appareil
        if (device.length <= 0) {
            return
        }
        console.log(dataJson.status)

        // On traite le changement et on envoie la requête à l'appareil
        if (dataJson.status === true) {
            console.log('Turning on')
            device[0].socket.write('ON')
        } else {
            console.log('Turning off')
            device[0].socket.write('OFF')
        }
    })

    // Création d'une oreille qui saura quand un client demandera de supprimer un appareil
    connection.on('device-remove', data => {
        console.log('Device remove request')
        // On va chercher l'information envoyée par le client, on la transforme en JSON et on s'assure que c'est du JSON
        let dataJson
        try {
            dataJson = JSON.parse(data)
        } catch (Exception) {
            return
        }

        // On s'assure que l'information n'est pas vide
        if (dataJson === undefined) {
            return
        }

        // On va chercher l'appareil concerné à la supression
        let device = sockets.filter(socket => {
            return socket.key === dataJson.key
        })

        // On enlève l'appareil que le client veut supprimer
        sockets = sockets.filter(socket => {
            return socket.key !== dataJson.key
        })

        // On s'assure qu'on a trouvé l'appareil à supprimer
        if (device.length <= 0) {
            return
        }

        // On avise tout le monde que l'appareil a été supprimé
        webNet.sockets.emit(
            'device-offline',
            JSON.stringify({ key: dataJson.key })
        )

        // On détruit la connexion avec l'appareil
        device[0].socket.destroy()
    })
})

// Configuration de l'API
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cors())
app.use(bodyParser.json())

app.get('/', (req, res) => {
    res.send('API de Domotyx')
})

app.get('/list-devices', (req, res) => {
    let devices = sockets.map(device => {
        return { key: device.key, name: device.name, status: device.status }
    })
    res.json(devices)
})

// Écoute de l'API pour les clients
http.listen(process.env.WEB_PORT, () =>
    console.log(`Server running on port ${process.env.WEB_PORT}`)
)

// Écoute de l'API pour les appareils
netServer.listen(process.env.NET_PORT, () => {
    console.log(`Net server running on port ${process.env.NET_PORT}`)
})

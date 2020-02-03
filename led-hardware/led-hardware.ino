// Définition de la pin contrôllant la lumière
#define TRANSISTOR_PIN 15

// Ajout de la librairie permettant d'établir des communications en WiFi.
#include <WiFi.h>

// Constantes contenant les informations du réseau auquel le module se connectera
const char* ssid = "CEGEPVICTO";
const char* password = "";

// Constantes contenant les informations du serveur où le module se connectera
const char* host = "connect.domotyx.org";
const int port = 80;

// Variable qui contiendera l'information reçu par le serveur
String incoming = "";

// Variable contenant l'état du module
String ledStatus = "false";

// Variable contenant le nom du module
String deviceName = "Light Switch";

// Variable qui contiendera la clé d'authentification au serveur
String key = "";

// Création d'un client WiFi, lié au serveur
WiFiClient client;

// Méthode exécutée à l'ouverture du module
void setup() {
  // Ouverture d'un connexion en Serial pour le déboguage
  Serial.begin(9600);

  // Configuration de la pin qui contrôle la lumière
  pinMode (TRANSISTOR_PIN, OUTPUT);

  // On met la lumière éteinte
  digitalWrite(TRANSISTOR_PIN, HIGH);

  // Exécution de la méthode permettant de se connecter au serveur
  connectToPlatform();
}

// Méthode exécutée en boucle une fois le module allumé
void loop() {
  // On réinitialise l'information reçu par le serveur
  incoming = "";

  // On va chercher l'information envoyée par le serveur
  while (client.available()) {
    incoming += (char)client.read();
  }

  // On s'assure que l'information reçu par le serveur n'est pas vide
  if (incoming != "") {
    // On affiche l'information dans le port série pour le déboguage
    Serial.println(incoming);
    // Si le serveur nous demande de s'identifier
    if (incoming.indexOf("REQUEST_NAME") != -1) {
      // On envoie les informations du module au serveur
      client.print("{\"request\":\"IDENTIFICATION\",\"name\":\"" + deviceName + "\",\"status\":" + ledStatus + "}");
    // Si le serveur veut allumer la lumière
    } else if (incoming.indexOf("ON") != -1) {
      // On allume la lumière
      digitalWrite(TRANSISTOR_PIN, LOW);

      // On exécute la méthode qui envoiera une confirmation de changement d'état au serveur
      switchLight(true);
    // Si le serveur veut fermer la lumière
    } else if (incoming.indexOf("OFF") != -1) {
      // On éteint la lumière
      digitalWrite(TRANSISTOR_PIN, HIGH);

      // On exécute la méthode qui envoiera une confirmation de changement d'état au serveur
      switchLight(false);
    // Si le serveur veut nous donner une clé d'authentification
    } else if (incoming.indexOf("KEY") != -1) {
      // On va chercher la clé d'authentification dans l'information reçu du serveur
      key = incoming.substring(incoming.indexOf("KEY") + 5, incoming.length());

      // On affiche la clé d'authentification dans le port série à des fins de déboguage
      Serial.println("Device key: " + key);
    }
  }
  // Si le client n'est pas connecté
  if (!client.connected()) {
    Serial.println("Client has been disconnected.");

    // Arrêt de la connexion actuelle avec le serveur
    client.stop();

    // Tentative de reconnexion avec le serveur
    connectToPlatform();
  }
  delay(20);
}

// Méthode permettant de se connecter au réseau spécifié dans les constantes
void connectToWifi() {
  // Tentative de connexion avec les informations du réseau
  WiFi.begin(ssid, password);
  Serial.print("Connecting to " + String(ssid));

  // Tant que le réseau n'est pas connecté, on attend
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(100);
  }

  // Affichage d'une confirmation de connexion et de l'adresse IP du module à des fins de déboguage
  Serial.print("\r\nConnected! Here is the IP address of the device: ");
  Serial.println(WiFi.localIP());
}

// Méthode permettant de se connecter au serveur
void connectToPlatform() {
  // Si le WiFi n'est pas connecté
  if (WiFi.status() != WL_CONNECTED) {
    // Exécution de la méthode permettant de se connecter au WiFi
    connectToWifi();
  }
  // Si on arrive à se connecter à la plateforme
  if (client.connect(host, port)) {
    // On affiche un message de confirmation de connexion à des fins de déboguage
    Serial.println("Connected!");
  }
}

// Méthode permettant d'envoyer un message de confirmation au serveur que le module a été soit éteint ou allumé
void switchLight(bool state) {
  // Changement de l'état du module selon le paramètre
  if (state == true) {
    ledStatus = "true";
  } else {
    ledStatus = "false";
  }
  // Si on n'a pas reçu de clé d'authentification
  if (key == "") {
    // On envoie un message de confirmation avec un clé vide
    client.print("{\"request\":\"STATUS_CHANGE_CONFIRMATION\",\"key\":undefined,\"status\":" + ledStatus + "}");
    return;
  }
  // On envoie un messag de confirmation avec la clé d'authentification
  client.print("{\"request\":\"STATUS_CHANGE_CONFIRMATION\",\"key\":\"" + key + "\",\"status\":" + ledStatus + "}");
}

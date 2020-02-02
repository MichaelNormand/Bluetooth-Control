#include "BluetoothSerial.h"
#define TRANSISTOR_PIN 15

#include <WiFi.h>

const char* ssid = "Tbin1tsitchum";
const char* password = "taptouche";
const char* host = "173.237.251.15";
const int port = 5000;

String incoming = "";
String ledStatus = "false";
String deviceName = "Light Switch";
String key = "";

WiFiClient client;

void setup() {
  Serial.begin(9600);

  pinMode (TRANSISTOR_PIN, OUTPUT);
  digitalWrite(TRANSISTOR_PIN, HIGH);
  connectToPlatform();
}

void loop() {
  incoming = "";
  while (client.available()) {
    incoming += (char)client.read();
  }
  if (incoming != "") {
    Serial.println(incoming);
    if (incoming.indexOf("REQUEST_NAME") != -1) {
      client.print("{\"request\":\"IDENTIFICATION\",\"name\":\"" + deviceName + "\",\"status\":" + ledStatus + "}");
    } else if (incoming.indexOf("ON") != -1) {
      digitalWrite(TRANSISTOR_PIN, LOW);
      switchLight(true);
    } else if (incoming.indexOf("OFF") != -1) {
      digitalWrite(TRANSISTOR_PIN, HIGH);
      switchLight(false);
    } else if (incoming.indexOf("KEY") != -1) {
      key = incoming.substring(incoming.indexOf("KEY") + 5, incoming.length());
      Serial.println("Device key: " + key);
    }
  }
  if (!client.connected()) {
    Serial.println("Client has been disconnected.");
    client.stop();
    connectToPlatform();
  }
  delay(20);
}
void connectToWifi() {
  WiFi.begin(ssid, password);
  Serial.print("Connecting to " + String(ssid));
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(100);
  }
  Serial.print("\r\nConnected! Here is the IP address of the device: ");
  Serial.println(WiFi.localIP());
}

void connectToPlatform() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWifi();
  }
  if (client.connect(host, port)) {
    Serial.println("Connected!");
  }
}

void switchLight(bool state) {
  if (state == true) {
    ledStatus = "true";
  } else {
    ledStatus = "false";
  }
  if (key == "") {
    Serial.println("Changing device state to " + ledStatus);
    client.print("{\"request\":\"STATUS_CHANGE_CONFIRMATION\",\"key\":undefined,\"status\":" + ledStatus + "}");
  }
  client.print("{\"request\":\"STATUS_CHANGE_CONFIRMATION\",\"key\":\"" + key + "\",\"status\":" + ledStatus + "}");
}

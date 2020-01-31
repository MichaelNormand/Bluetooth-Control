#include "BluetoothSerial.h"
#define TRANSISTOR_PIN 15

BluetoothSerial ESP_BT;

String incoming;
String ledStatus = "OFF";

void setup() {
  Serial.begin(9600);
  ESP_BT.begin("DOMOTYX_CABLE");
  Serial.println("Bluetooth Device is Ready to Pair");

  pinMode (TRANSISTOR_PIN, OUTPUT);
  digitalWrite(TRANSISTOR_PIN, HIGH);
}

void loop() {
  
  if (ESP_BT.available())
  {
    incoming = ESP_BT.readStringUntil('\r');

    if (incoming == "ON")
    {
      digitalWrite(TRANSISTOR_PIN, LOW);
      ESP_BT.println("{\"LED\": \"ON\"}");
      ledStatus = "ON";
    }
        
    else if (incoming == "OFF")
    {
      digitalWrite(TRANSISTOR_PIN, HIGH);
      ESP_BT.println("{\"LED\": \"OFF\"}");
      ledStatus = "OFF";
    }
    else if (incoming == "TEST") {
      ESP_BT.println("{\"LED\": \"COMPATIBLE\"}");
    }
    else if (incoming == "STATUS") {
      ESP_BT.println("{\"LED\": \"" + ledStatus + "\"}");
    }
  }
  delay(20);
}

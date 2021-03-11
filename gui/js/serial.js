/*
This code is copied from https://www.hackster.io/lemio/let-arduino-control-your-browser-ac76f4
*/

//Define the elements
let sendInput = document.getElementById("sendInput");
let sendButton = document.getElementById("sendButton");
let receiveText = document.getElementById("receiveText");
let connectButton = document.getElementById("connectButton");
let statusLabel = document.getElementById("statusLabel");

let nTubesInput = document.getElementById("nTubesInput");
let tubeSizeDropdown = document.getElementById("tubeSizeDropdown");
let flowrateInput = document.getElementById("flowrateInput");
let flowrateUnitsDropdown = document.getElementById("flowrateUnitsDropdown");
let totalTimeInput = document.getElementById("totalTimeInput");
let totalTimeUnitsDropdown = document.getElementById("totalTimeUnitsDropdown");
let volumePerFractionInput = document.getElementById("volumePerFractionInput");
let volumePerFractionUnitsDropdown = document.getElementById("volumePerFractionUnitsDropdown");
let totalVolumeInput = document.getElementById("totalVolumeInput");
let totalVolumeUnitsDropdown = document.getElementById("totalVolumeUnitsDropdown");
let nFractionsInput = document.getElementById("nFractionsInput");
let runButton = document.getElementById("runButton");
let pauseButton = document.getElementById("pauseButton");
let resumeButton = document.getElementById("resumeButton");
let stopButton = document.getElementById("stopButton");

//Couple the elements to the Events
connectButton.addEventListener("click", clickConnect);
sendButton.addEventListener("click", clickSend);

//When the connectButton is pressed
async function clickConnect() {
  if (port) {
    //if already connected, disconnect
    disconnect();
  } else {
    //otherwise connect
    await connect();
  }
}

//Define outputstream, inputstream and port so they can be used throughout the sketch
var outputStream, inputStream, port, encoder;
navigator.serial.addEventListener("connect", (e) => {
  statusLabel.innerText = `Connected to ${e.port}`;
  connectButton.innerText = "Disconnect";
});

navigator.serial.addEventListener("disconnect", (e) => {
  statusLabel.innerText = `Disconnected`;
  connectButton.innerText = "Connect";
});
//Connect to the Arduino
async function connect() {
  //Optional filter to only see relevant boards
  const filter = {
    usbVendorId: 0x2341, // Arduino SA
  };

  //Try to connect to the Serial port
  try {
    port = await navigator.serial.requestPort(/*{ filters: [filter] }*/);
    // Continue connecting to |port|.

    // - Wait for the port to open.
    await port.open({ baudRate: 115200 });

    statusLabel.innerText = "Connected";
    connectButton.innerText = "Disconnect";

    let decoder = new TextDecoderStream("utf-8");
    inputDone = port.readable.pipeTo(decoder.writable);
    inputStream = decoder.readable;

    const encoder = new TextEncoderStream();
    outputDone = encoder.readable.pipeTo(port.writable);
    outputStream = encoder.writable;

    reader = inputStream.getReader();
    readLoop();
  } catch (e) {
    //If the pipeTo error appears; clarify the problem by giving suggestions.
    if (e == "TypeError: Cannot read property 'pipeTo' of undefined") {
      e += "\n Use Google Chrome and enable-experimental-web-platform-features";
    }
    connectButton.innerText = "Connect";
    statusLabel.innerText = e;
  }
}
//Disconnect from the Serial port
async function disconnect() {
  if (reader) {
    await reader.cancel();
    await inputDone.catch(() => {});
    reader = null;
    inputDone = null;
  }
  if (outputStream) {
    await outputStream.getWriter().close();
    await outputDone;
    outputStream = null;
    outputDone = null;
  }
  statusLabel.innerText = "Disconnected";
  connectButton.innerText = "Connect";
  //Close the port.
  await port.close();
  port = null;
}

//Write to the Serial port
async function writeToStream(line) {
  const writer = outputStream.getWriter();

  // this is the key to getting the carriage return value to be sent
  var cmd = line + String.fromCharCode(10, 13);

  writer.write(cmd);
  writer.releaseLock();
}

//When the send button is pressed
function clickSend() {
  //send the message
  console.log("sent: ", sendInput.value);
  writeToStream(sendInput.value);
  //and clear the input field, so it's clear it has been sent
  sendInput.value = "";
}

//Read the incoming data
async function readLoop() {
  while (true) {
    const { value, done } = await reader.read();
    if (done === true) {
      break;
    }
    receiveText.value += value;
    // console.log("response: ", value, done);
    //When recieved something add it to the big textarea
  }
}

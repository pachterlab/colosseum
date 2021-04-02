import { BrowserSerial } from 'browser-serial';

import { sleep } from './utils';

// Options for the serial connection.
const serialOptions = {
  baudRate: 115200,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  bufferSize: 255,
  flowControl: 'none',
};
// Applying this filter will show only Arduinos in the serial device
// selection.
const serialFilters = { usbVendorId: 0x2341 };
const connectResponse = 'Arduino is ready';
const setupCommands = [
  '<SET_ACCEL,111,1000.0,1000.0,1000.0>',
  '<SET_SPEED,111,1000.0,1000.0,1000.0>'
]
const stopCommand = '<STOP,111,0.0,0.0,0.0>';
const makeCommand = angle => `<RUN,111,${angle},${angle},${angle}>`;
// Hardcoded angles for now.
// Note that each position i is the amount of movement needed to go from
// tube i to i+1.
const angles = [
  84, 78, 75, 70, 64, 61, 58, 56, 54, 52, 50, 48, 47, 46, 45, 44, 43, 42, 41, 40,
  39, 39, 38, 37, 36, 36, 35, 34, 34, 34, 33, 33, 32, 32, 31, 31, 31, 30, 30, 30,
  29, 29, 29, 28, 28, 28, 27, 27, 27, 26, 26, 26, 26, 26, 25, 25, 25, 25, 24, 24,
  24, 24, 24, 24, 23, 23, 23, 23, 23, 23, 22, 22, 22, 22, 22, 22, 22, 22, 21, 21,
  21, 21, 21, 21, 21, 20, 20
];

export class Colosseum {
  constructor(dry=false) {
    this.dry = dry;
    this.serial = new BrowserSerial(serialOptions, serialFilters);
    // Async generator for responses. Get *promises* to lines by using next().
    this.reader = this.serial.readLine();
    this.paused = false;

    this.position = 0;
    this.numberOfFractions = null;
    // All time is in seconds.
    this.interval = null;
    this.callback = null;
    this.errorCallback = null;
  }

  async connect() {
    if (this.dry) return connectResponse;
    await this.serial.connect();
    const response = await this.reader.next();
    if (response !== connectResponse) throw Error(`Unexpected response ${response}. Expected ${connectResponse}.`);
    return response;
  }

  // Send command without verifying response
  async send(command) {
    if (this.dry) return command;
    await this.serial.write(command);
    const response = await this.reader.next();
    return response;
  }

  // Send command and verify response
  async sendAndVerify(command) {
    const response = await this.send(command);
    if (response !== command) throw Error(`Unexpected response ${response}. Expected ${command}.`)
    return response;
  }

  disconnect = () => !this.dry && this.serial.disconnect();
  stop = () => this.send(stopCommand);

  // All times must be in milliseconds
  // Callback is a function that is called at the end of each fraction, before
  // the tube bed is rotated. It should take a single integer argument, indicating
  // the index of the tube that was just collected.
  // Run should only be called once per object.
  setup(numberOfFractions, interval, callback=() => null, errorCallback=() => null) {
    this.interval = interval;
    this.numberOfFractions = numberOfFractions;
    this.callback = callback;
    this.errorCallback = errorCallback;
  }

  async run() {
    if (this.position !== 0) throw Error(`position must be zero, not ${this.position}`);
    await this.resume();
  }

  pause() {
    this.paused = true;
  }

  async resume() {
    this.paused = false;
    while (!this.paused && this.position <= this.numberOfFractions) {
      this.sendAndVerify(makeCommand(angles[this.position]))
        .then(() => this.callback(this.position))
        .catch(error => this.errorCallback(this.position, error));

        await sleep(this.interval);
      this.position++;
    }
  }
}

import _ from 'lodash';

import { BrowserSerial } from 'browser-serial';

import { promiseTimeout, sleep } from './utils';

// Options for the serial connection.
const serialOptions = {
  baudRate: 2000000,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  bufferSize: 255,
  flowControl: 'none',
};
// Applying this filter will show only Arduinos in the serial device
// selection.
const serialFilters = { usbVendorId: 0x2341 };
// Throw an error if there is no serial response after waiting this much milliseconds.
const serialTimeout = 5000;
const connectResponse = '<Arduino is ready>';
const setupCommands = [
  '<SET_ACCEL,111,1000.0,1000.0,1000.0>',
  '<SET_SPEED,111,1000.0,1000.0,1000.0>'
];
const stopCommand = '<STOP,111,0.0,0.0,0.0>';
const makeCommand = angle => `<RUN,111,${angle},${angle},${angle}>`;
// Hardcoded angles for now.
// Note that each position i is the amount of movement needed to go from
// tube i to i+1.
const angles = [149.1592, 141.0626, 134.1748, 128.2197, 123.0028, 118.3822, 114.2515, 1
  10.5294, 107.1522, 104.0697, 101.2409, 98.6328, 96.218, 93.9736, 91.8803, 89.9219, 88.0845, 86.3559, 
  84.7259, 83.1854, 81.7264, 80.342, 79.0261, 77.7731, 76.5781, 75.4368, 74.3454, 73.3002, 72.298, 
  71.3361, 70.4117, 69.5225, 68.6663, 67.8411, 67.045, 66.2765, 65.5338, 64.8157, 64.1208, 63.4478, 
  62.7956, 62.1632, 61.5496, 60.9539, 60.3752, 59.8128, 59.2658, 58.7336, 58.2155, 57.7109, 57.2193, 
  56.74, 56.2726, 55.8167, 55.3716, 54.9371, 54.5126, 54.0979, 53.6925, 53.2961, 52.9084, 52.5291, 52.1578, 
  51.7943, 51.4383, 51.0896, 50.7479, 50.4129, 50.0845, 49.7625, 49.4466, 49.1367, 48.8325, 48.5339, 48.2408, 
  47.9529, 47.6701, 47.3923, 47.1193, 46.8509, 46.5871, 46.3277, 46.0726, 45.8217, 45.5748, 45.3319, 45.0928, 
  44.8575, 44.6259, 44.3978, 44.1731, 43.9519, 43.7339, 43.5192, 43.3076]
;

const commandRegex = /[^<>,]+/g;

// Utility function to validate responses.
// Simply checks whether the setting string is the same.
function responseIsValid(command, response) {
  const commandMatch = command.match(commandRegex)[0];
  const responseMatch = response.match(commandRegex)[0];
  return commandMatch === responseMatch;
}


export class Colosseum {
  constructor(dry=false) {
    this.dry = dry;
    this.serial = new BrowserSerial(serialOptions, serialFilters);
    // Async generator for responses. Get *promises* to lines by using next().
    this.reader = this.serial.readLineGenerator();
    this.connected = dry;
    this.ready = false;
    this.paused = false;
    this.stopped = false;
    this.done = false;
    this.error = false;
    this.startTime = null;

    this.position = 0;
    this.numberOfFractions = null;
    this.interval = null;
    this.callback = null;
    this.doneCallback = null;
    this.errorCallback = null;
  }

  async _connect() {
    if (this.dry) return connectResponse;
    await this.serial.connect();
    const response = await this.reader.next();
    const value = response.value.value;
    if (value !== connectResponse) throw Error(
      `Unexpected response ${value}. Expected ${connectResponse}.
      Is the Arduino flashed with the correct firmware?`
    );
    this.connected = true;
    return value;
  }
  connect = () => promiseTimeout(this._connect(), serialTimeout, 'Connection timed out.');

  async _disconnect() {
    if (this.dry) return;
    if (!this.connected) throw Error('No device connected.');
    await this.serial.disconnect();
    this.connected = false;
  }
  disconnect = () => promiseTimeout(this._disconnect(), serialTimeout, 'Disconnection timed out.');

  // Send command without verifying response
  async _send(command) {
    if (this.dry) return command;
    if (!this.connected) throw Error('No device connected.');
    await this.serial.write(command);
    const response = await this.reader.next();
    return response.value.value;
  }
  send = (command) => promiseTimeout(this._send(command), serialTimeout, `Command ${command} timed out.`);

  // Send command and verify response
  async sendAndVerify(command) {
    const value = await this.send(command);
    if (!responseIsValid(command, value)) throw Error(`Unexpected response ${value}. Expected ${command}.`)
    return value;
  }

  // All times must be in milliseconds
  // Callback is a function that is called at the end of each fraction, before
  // the tube bed is rotated. It should take a single integer argument, indicating
  // the index of the tube that was just collected.
  // Run should only be called once per object.
  async setup(
    numberOfFractions,
    interval,
    callback=() => null,
    errorCallback=() => null,
    doneCallback=() => null
  ) {
    if (!this.connected) throw Error('No device connected.');
    this.interval = interval;
    this.numberOfFractions = numberOfFractions;
    this.callback = callback;
    this.doneCallback = doneCallback;
    this.errorCallback = errorCallback;

    // Send setup commands
    for (const command of setupCommands) await this.sendAndVerify(command);

    this.ready = true;
  }

  async run() {
    if (!this.connected) throw Error('No device connected.');
    if (!this.ready) throw Error('Colosseum is not ready. setup() must be called.');
    if (this.position !== 0) throw Error(`position must be zero, not ${this.position}`);
    this.startTime = Date.now();
    await this.resume();
  }

  pause() {
    this.paused = true;
  }

  async resume() {
    if (!this.connected) throw Error('No device connected.');
    if (this.error) throw Error('There was an error while running.');
    if (_.isNil(this.startTime)) throw Error('Call run() instead of resume() at the start.');
    if (this.stopped) throw Error('Device was stopped.');

    this.paused = false;
    while (!this.paused && this.position < this.numberOfFractions && !this.error) {
      this.sendAndVerify(makeCommand(angles[this.position]))
        .then(() => this.callback(this.position))
        .catch(error => {
          this.error = true;
          this.errorCallback(this.position, error);
        });
      this.position++;

      await sleep(this.interval);
    }

    // Call doneCallback if we are done.
    if (this.position >= this.numberOfFractions) {
      this.done = true;
      this.doneCallback();
    }
  }

  async stop() {
    this.paused = true;
    this.stopped = true;
    await this.send(stopCommand);
  }
}

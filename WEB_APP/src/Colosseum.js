import _ from 'lodash';

import { BrowserSerial } from 'browser-serial';

import { promiseTimeout, sleep } from './utils';

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
const angles = [
  84, 78, 75, 70, 64, 61, 58, 56, 54, 52, 50, 48, 47, 46, 45, 44, 43, 42, 41, 40,
  39, 39, 38, 37, 36, 36, 35, 34, 34, 34, 33, 33, 32, 32, 31, 31, 31, 30, 30, 30,
  29, 29, 29, 28, 28, 28, 27, 27, 27, 26, 26, 26, 26, 26, 25, 25, 25, 25, 24, 24,
  24, 24, 24, 24, 23, 23, 23, 23, 23, 23, 22, 22, 22, 22, 22, 22, 22, 22, 21, 21,
  21, 21, 21, 21, 21, 20, 20
];
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

import { BrowserSerial } from 'browser-serial';

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

export class Colosseum {
  constructor() {
    this.serial = new BrowserSerial(serialOptions, serialFilters);
    // Async generator for responses. Get *promises* to lines by using next().
    this.reader = this.serial.readLine();
  }

  async connect() {
    await this.serial.connect();
    const response = await this.reader.next();
    if (response !== connectResponse) throw Error(`Unexpected response ${response}. Expected ${connectResponse}.`);
    return response;
  }

  // Send command without verifying response
  async send(command) {
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

  disconnect = () => this.serial.disconnect();
  stop = () => this.send(stopCommand);
}

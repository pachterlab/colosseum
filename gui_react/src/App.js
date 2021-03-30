import _ from 'lodash';
import React from 'react';
import {
  Badge,
  Button,
  Col,
  Container,
  Dropdown,
  Form,
  OverlayTrigger,
  Row,
} from 'react-bootstrap';
import './bootstrap.min.css';

import { BrowserSerial } from 'browser-serial';

import { StatusInput, UnitNumberInput, ConnectModal } from './components';
import { FlowRate, Time, Tube, Volume, UnitNumber } from './converters';

/*
 * These arrays define what units to *display* (not what unit conversions are
 * supported; this should be defined in each of the converters).
 * Make sure that the units listed here are defined (and conversions are defined).
 * Otherwise things will break.
 */
const tubeUnits = ['0.5 mL', '1.0 mL', '1.5 mL'];
const flowRateUnits = ['uL/sec', 'uL/min', 'uL/hr', 'mL/sec', 'mL/min', 'mL/hr'];
const totalTimeUnits = ['sec', 'min', 'hr'];
const volumePerFractionUnits = ['uL', 'mL'];
const totalVolumeUnits = ['uL', 'mL', 'L'];

const constructUnitNumberFactory = (converter, value, unit) => _.isNaN(value)
  ? null
  : new converter(value, unit);
const constructTube = (value, unit) => constructUnitNumberFactory(Tube, value, unit);
const constructFlowRate = (value, unit) => constructUnitNumberFactory(FlowRate, value, unit);
const constructTime = (value, unit) => constructUnitNumberFactory(Time, value, unit);
const constructVolume = (value, unit) => constructUnitNumberFactory(Volume, value, unit);
const constructUnitNumber = (value, unit) => constructUnitNumberFactory(UnitNumber, value, unit);

const integerValidator = value => Number.isInteger(value) ? null : 'Number must be an integer.';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numberOfTubes: null,
      tubeSize: null,
      flowRate: null,
      totalTime: null,
      totalVolume: null,
      volumePerFraction: null,
      numberOfFractions: null,
      serial: new BrowserSerial(),
      connectError: '',
      connecting: false,
    };
  }

  connect() {
    this.setState({connecting: true});
    this.state.serial.connect()
      .then(result => this.setState({connectError: ''}))
      .catch(error => this.setState({connectError: error.toString()}))
      .finally(() => this.setState({connecting: false}));
  }

  disconnect() {
    this.setState({connecting: true});
    this.state.serial.disconnect()
      .then(result => this.setState({connectError: ''}))
      .catch(error => this.setState({connectError: error.toString()}))
      .finally(() => this.setState({connecting: false}));
  }

  // Call this function in render() to display input container.
  renderInputs(isConnected) {
    return (
      <Container>
        <ConnectModal/>
        <Form.Group as={Row}>
          <UnitNumberInput
            label="Number of Tubes"
            placeholder="# tubes"
            units={tubeUnits}
            inputDisabled={false}
            validator={value => integerValidator(value)}
            onChange={(value, unit) => this.setState({numberOfTubes: constructTube(value, unit)})}
          />
        </Form.Group>

        <Form.Group as={Row}>
          <UnitNumberInput
            label="Flow rate"
            placeholder="Flow rate"
            units={flowRateUnits}
            inputDisabled={false}
            onChange={(value, unit) => this.setState({flowRate: constructFlowRate(value, unit)})}
          />
        </Form.Group>

        <hr />

        <Form.Group as={Row}>
          <UnitNumberInput
            label="Total time"
            placeholder="Total time"
            units={totalTimeUnits}
            inputDisabled={false}
            onChange={(value, unit) => this.setState({totalTime: constructTime(value, unit)})}
          />
        </Form.Group>

        <Form.Group as={Row}>
          <UnitNumberInput
            label="Total volume"
            placeholder="Total volume"
            units={totalVolumeUnits}
            inputDisabled={false}
            onChange={(value, unit) => this.setState({totalVolume: constructVolume(value, unit)})}
          />
        </Form.Group>

        <hr />

        <Form.Group as={Row}>
          <UnitNumberInput
            label="Volume per fraction"
            placeholder="Volume per fraction"
            units={volumePerFractionUnits}
            inputDisabled={false}
            onChange={(value, unit) => this.setState({volumePerFraction: constructVolume(value, unit)})}
          />
        </Form.Group>

        <Form.Group as={Row}>
          <UnitNumberInput
            label="Number of fractions"
            placeholder="Number of fractions"
            inputDisabled={false}
            onChange={(value, unit) => this.setState({numberOfFractions: constructUnitNumber(value, unit)})}
          />
        </Form.Group>

        <hr />

        <Row className = "p-2">
          <Col>
            <Button
              variant="primary"
              className="btn-block"
              size="sm"
              disabled={!isConnected}
            >Run</Button>
          </Col>
          <Col>
            <Button
              variant="primary"
              className="btn-block"
              size="sm"
              disabled={!isConnected}
            >Pause</Button>
          </Col>
          <Col>
            <Button
              variant="primary"
              className="btn-block"
              size="sm"
              disabled={!isConnected}
            >Resume</Button>
          </Col>
          <Col>
            <Button
              variant="primary"
              className="btn-block"
              size="sm"
              disabled={!isConnected}
            >Stop</Button>
          </Col>
        </Row>
      </Container>
    );
  }

  // Call this function in render() to display status container.
  renderStatus(isConnected) {
    return (
      <Container>
        <Row className="justify-content-center">
          <h4>Status</h4>
        </Row>
        <Row className="justify-content-center mb-4">
          <Badge variant={isConnected ? 'success' : 'danger'}>{isConnected ? 'Connected' : 'Disconnnected'}</Badge>
        </Row>
        <StatusInput label="Volume Dispensed" />
        <StatusInput label="Time Elapsed" />
        <StatusInput label="Tube Number" />
      </Container>
    );
  }

  render() {
    const isConnected = !_.isNil(this.state.serial.port) && this.state.connectError === '';
    return (
      <Container style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)'
      }} className="w-75">
        <Row className="mb-5">
          <Col className="col-3">
            <Button
              className="btn-block"
              variant="primary"
              onClick={() => isConnected ? this.disconnect() : this.connect()}
              disabled={this.state.connecting}
            >{this.state.connecting
                ? 'Connecting...'
                : isConnected
                  ? 'Disconnect'
                  : 'Connect'
              }</Button>
          </Col>
          <Col style={{color: 'red'}}>
            {this.state.connectError}
          </Col>
        </Row>
        <Row>
          <Col className="col-9 mr-4">
            <Row>{this.renderInputs(isConnected)}</Row>
          </Col>
          <Col>
            <Row>{this.renderStatus(isConnected)}</Row>
          </Col>
        </Row>

      </Container>
    );
  }
}
export default App;

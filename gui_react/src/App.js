import _ from 'lodash';
import React from 'react';
import {
  Alert,
  Badge,
  Button,
  Col,
  Container,
  Dropdown,
  Form,
  OverlayTrigger,
  Row,
  Spinner,
} from 'react-bootstrap';
import './bootstrap.min.css';

import { BrowserSerial } from 'browser-serial';
import queryString from 'query-string';

import { NotSupportedModal, StatusInput, UnitNumberInput } from './components';
import {
  FlowRate,
  Time,
  totalTimeNumberOfFractions,
  totalTimeVolumePerFraction,
  totalVolumeNumberOfFractions,
  totalVolumeVolumePerFraction,
  Tube,
  UnitNumber,
  Volume,
} from './converters';

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
const positiveValidator = value => value > 0 ? null : 'Number must be positive.';

// Some configurations. Should these be in a separate file?
const webSerialSupported = 'serial' in navigator;
const isDevelopment = _.has(queryString.parse(window.location.search), 'dev');
const statusTexts = {
  0: 'Not running',
  1: 'Running',
  2: 'Paused',
  3: 'Stopped',
  4: 'Done',
  5: 'Error',
};
const statusVariants = {
  0: 'danger',
  1: 'info',
  2: 'warning',
  3: 'danger',
  4: 'success',
  5: 'danger',
};
const selectionFunctions = {
  totalTime: {
    volumePerFraction: totalTimeVolumePerFraction,
    numberOfFractions: totalTimeNumberOfFractions,
  },
  totalVolume: {
    volumePerFraction: totalVolumeVolumePerFraction,
    numberOfFractions: totalVolumeNumberOfFractions,
  },
};
// "Other" (i.e. disabled input) is hardcoded for now.
const otherSelections = {
  totalTime: 'totalVolume',
  totalVolume: 'totalTime',
  volumePerFraction: 'numberOfFractions',
  numberOfFractions: 'volumePerFraction',
};

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // Input selection
      timeVolumeRadioSelection: '',
      volumeNumberRadioSelection: '',

      // Serial connection
      serial: new BrowserSerial(),
      connectError: '',
      connecting: false,

      // State depending on Colosseum status
      status: 0,

    };

    // Values will be UnitNumber instances representing each input
    this.unitNumbers = {
      numberOfTubes: null,
      flowRate: null,
      totalTime: null,
      totalVolume: null,
      volumePerFraction: null,
      numberOfFractions: null,
    };

    // Component references
    this.notSupportedModal = React.createRef();
    this.unitNumberInputs = {
      numberOfTubes: React.createRef(),
      flowRate: React.createRef(),
      totalTime: React.createRef(),
      totalVolume: React.createRef(),
      volumePerFraction: React.createRef(),
      numberOfFractions: React.createRef(),
    };

    // Bind functions
    // Binding is required to be able to use `this` in these functions
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.update = this.update.bind(this);
    this.validate = this.validate.bind(this);
    this.run = this.run.bind(this);
    this.pause = this.pause.bind(this);
    this.resume = this.resume.bind(this);
    this.stop = this.stop.bind(this);
    this.onChange = this.onChange.bind(this);
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

  update() {
    const selection1 = this.state.timeVolumeRadioSelection;
    const selection2 = this.state.volumeNumberRadioSelection;
    const otherSelection1 = otherSelections[selection1];
    const otherSelection2 = otherSelections[selection2];

    const flowRate = this.unitNumbers.flowRate;
    const unitNumber1 = this.unitNumbers[selection1];
    const unitNumber2 = this.unitNumbers[selection2];
    const targetUnit1 = this.unitNumberInputs[otherSelection1].current.unit;
    const targetUnit2 = this.unitNumberInputs[otherSelection2].current.unit;
    console.log(targetUnit1, targetUnit2);

    // Check that required values exist.
    if (_.isNil(flowRate) || _.isNil(unitNumber1) || _.isNil(unitNumber2)) return;

    const calculated = selectionFunctions[selection1][selection2](
      flowRate, unitNumber1, unitNumber2, targetUnit1, targetUnit2
    );
    _.forEach(calculated, (value, key) => {
      this.unitNumberInputs[key].current.setUnitNumber(value);
    });
  }

  validate() {
    const results = _.map(this.unitNumbers, (value, key) => {
      if (_.isNil(value)) {
        this.unitNumberInputs[key].current.setState({invalid: 'Input is invalid.'});
        return false;
      } else {
        return true;
      }
    });
    return _.every(results);
  }

  run() {
    this.validate();
  }

  pause() {

  }

  resume() {

  }

  stop() {

  }

  onChange(key, factory, value, unit, update=true) {
    this.unitNumbers[key] = factory(value, unit);
    update && this.update();
  }

  componentDidMount() {
    // Show alert modal if web serial is not supported.
    if (!webSerialSupported) {
      this.notSupportedModal.current.setState({show: true});
      this.setState({connectError: 'Web Serial API not found in current browser'});
    }

    // Select the first inputs by default
    this.setState({
      timeVolumeRadioSelection: 'totalTime',
      volumeNumberRadioSelection: 'volumePerFraction',
    });
  }

  // Call this function in render() to display input container.
  renderInputs(isConnected) {
    return (
      <Container>
        <Form.Group as={Row}>
          <UnitNumberInput
            ref={this.unitNumberInputs.numberOfTubes}
            label="Number of Tubes"
            placeholder="# tubes"
            units={tubeUnits}
            inputDisabled={false}
            validator={value => integerValidator(value) || positiveValidator(value)}
            onChange={(value, unit) => this.onChange('numberOfTubes', constructTube, value, unit, false)}
          />
        </Form.Group>

        <Form.Group as={Row}>
          <UnitNumberInput
            ref={this.unitNumberInputs.flowRate}
            label="Flow rate"
            placeholder="Flow rate"
            units={flowRateUnits}
            inputDisabled={false}
            validator={positiveValidator}
            onChange={(value, unit) => this.onChange('flowRate', constructFlowRate, value, unit)}
          />
        </Form.Group>

        <hr />

        <Form.Group as={Row}>
          <Form.Check
            type="radio"
            name="timeVolumeRadio"
            value="totalTime"
            checked={this.state.timeVolumeRadioSelection === 'totalTime'}
            onChange={event => this.setState({timeVolumeRadioSelection: event.target.value})}
          />
          <UnitNumberInput
            ref={this.unitNumberInputs.totalTime}
            label="Total time"
            placeholder="Total time"
            units={totalTimeUnits}
            inputDisabled={this.state.timeVolumeRadioSelection !== 'totalTime'}
            validator={positiveValidator}
            onChange={(value, unit) => this.onChange('totalTime', constructTime, value, unit)}
          />
        </Form.Group>

        <Form.Group as={Row}>
          <Form.Check
            type="radio"
            name="timeVolumeRadio"
            value="totalVolume"
            onChange={() => console.log("2")}
            checked={this.state.timeVolumeRadioSelection === 'totalVolume'}
            validator={positiveValidator}
            onChange={event => this.setState({timeVolumeRadioSelection: event.target.value})}
          />
          <UnitNumberInput
            ref={this.unitNumberInputs.totalVolume}
            label="Total volume"
            placeholder="Total volume"
            units={totalVolumeUnits}
            inputDisabled={this.state.timeVolumeRadioSelection !== 'totalVolume'}
            validator={positiveValidator}
            onChange={(value, unit) => this.onChange('totalVolume', constructVolume, value, unit)}
          />
        </Form.Group>

        <hr />

        <Form.Group as={Row}>
          <Form.Check
            type="radio"
            name="volumeNumberRadio"
            value="volumePerFraction"
            checked={this.state.volumeNumberRadioSelection === 'volumePerFraction'}
            validator={positiveValidator}
            onChange={event => this.setState({volumeNumberRadioSelection: event.target.value})}
          />
          <UnitNumberInput
            ref={this.unitNumberInputs.volumePerFraction}
            label="Volume per fraction"
            placeholder="Volume per fraction"
            units={volumePerFractionUnits}
            inputDisabled={this.state.volumeNumberRadioSelection !== 'volumePerFraction'}
            validator={positiveValidator}
            onChange={(value, unit) => this.onChange('volumePerFraction', constructVolume, value, unit)}
          />
        </Form.Group>

        <Form.Group as={Row}>
          <Form.Check
            type="radio"
            name="volumeNumberRadio"
            value="numberOfFractions"
            checked={this.state.volumeNumberRadioSelection === 'numberOfFractions'}
            validator={positiveValidator}
            onChange={event => this.setState({volumeNumberRadioSelection: event.target.value})}
          />
          <UnitNumberInput
            ref={this.unitNumberInputs.numberOfFractions}
            label="Number of fractions"
            placeholder="Number of fractions"
            inputDisabled={this.state.volumeNumberRadioSelection !== 'numberOfFractions'}
            validator={positiveValidator}
            onChange={(value, unit) => this.onChange('numberOfFractions', constructUnitNumber, value, unit)}
          />
        </Form.Group>

        <hr />

        <Row className = "p-2">
          <Col>
            <Button
              variant="primary"
              className="btn-block"
              size="sm"
              disabled={!isDevelopment && !isConnected}
              onClick={this.run}
            >Run</Button>
          </Col>
          <Col>
            <Button
              variant="primary"
              className="btn-block"
              size="sm"
              disabled={!isDevelopment && !isConnected}
            >Pause</Button>
          </Col>
          <Col>
            <Button
              variant="primary"
              className="btn-block"
              size="sm"
              disabled={!isDevelopment && !isConnected}
            >Resume</Button>
          </Col>
          <Col>
            <Button
              variant="primary"
              className="btn-block"
              size="sm"
              disabled={!isDevelopment && !isConnected}
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
        <Row className="justify-content-center mb-1">
          <Badge variant={isConnected ? 'success' : 'danger'}>
            {isConnected ? 'Connected' : 'Disconnnected'}
          </Badge>
        </Row>
        <Row className="justify-content-center mb-4">
          {this.state.status === 1 && (<Spinner animation="border" variant={statusVariants[this.state.status]} size="sm"/>)}
          <Badge variant={statusVariants[this.state.status]}>
            {statusTexts[this.state.status]}
          </Badge>
        </Row>
        <StatusInput label="Volume Dispensed" />
        <StatusInput label="Time Elapsed" />
        <StatusInput label="Tube Number" />
      </Container>
    );
  }

  // Render stuff that doesn't need to be placed anywhere, like modals.
  renderOther() {
    return (
      <>
        <NotSupportedModal ref={this.notSupportedModal} />
      </>
    )
  }

  render() {
    const isConnected = !_.isNil(this.state.serial.port) && this.state.connectError === '';
    return (
      <>
        <Container style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)'
        }} className="w-75">
          {isDevelopment && <Alert variant="warning">DEVELOPMENT MODE</Alert>}
          <Row className="mb-5">
            <Col className="col-3">
              <Button
                className="btn-block"
                variant="primary"
                onClick={isConnected ? this.disconnect : this.connect}
                disabled={!webSerialSupported || this.state.connecting}
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

        {this.renderOther()}
      </>
    );
  }
}
export default App;

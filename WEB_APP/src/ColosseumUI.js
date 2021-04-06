import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import {
  Alert,
  Badge,
  Button,
  Col,
  Container,
  Form,
  ProgressBar,
  Row,
} from 'react-bootstrap';

import { Colosseum } from './Colosseum';
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

const constructUnitNumberFactory = (converter, value, unit) =>
  _.isNaN(value) ? null : new converter(value, unit);
const constructTube = (value, unit) => constructUnitNumberFactory(Tube, value, unit);
const constructFlowRate = (value, unit) => constructUnitNumberFactory(FlowRate, value, unit);
const constructTime = (value, unit) => constructUnitNumberFactory(Time, value, unit);
const constructVolume = (value, unit) => constructUnitNumberFactory(Volume, value, unit);
const constructUnitNumber = (value, unit) => constructUnitNumberFactory(UnitNumber, value, unit);

const integerValidator = value => _.isInteger(value) ? null : 'Number must be an integer.';
const positiveValidator = value => value > 0 ? null : 'Number must be positive.';

// Some configurations. Should these be in a separate file?
const webSerialSupported = 'serial' in navigator;
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
const tubeSizes = {
  '0.5 mL': 0.5,
  '1.0 mL': 1.0,
  '1.5 mL': 1.5,
};

export class ColosseumUI extends React.Component {
  static propTypes = {
    development: PropTypes.bool,
    connected: PropTypes.bool,
  }
  static defaultProps = {
    development: false,
    connected: false,
  }

  constructor(props) {
    super(props);
    this.state = {
      // Input selection
      timeVolumeRadioSelection: '',
      volumeNumberRadioSelection: '',

      // Connection state
      connectError: '',
      connecting: false,
      connected: this.props.development && this.props.connected,

      // State depending on Colosseum status
      status: 0,
      statusError: '',
      progress: 0,

      // Dev states
      devCommand: '',
    };

    // Object that manages serial connection
    this.colosseum = new Colosseum(this.props.development && this.props.connected);
    this.monitorInterval = null;

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
    this.statusInputs = {
      volumeDispensed: React.createRef(),
      timeElapsed: React.createRef(),
      tubeNumber: React.createRef(),
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
    this.monitor = this.monitor.bind(this);
  }

  connect() {
    this.setState({connecting: true});
    this.colosseum.connect()
      .then(result => this.setState({connectError: '', connected: true}))
      .catch(error => this.setState({connectError: error.toString()}))
      .finally(() => this.setState({connecting: false}));
  }

  disconnect() {
    this.colosseum.disconnect()
      .then(result => this.setState({connectError: '', connected: false}))
      .catch(error => this.setState({connectError: error.toString()}))
  }

  send(command) {
    console.log(`send ${command}`);
    this.colosseum.send(command)
      .then(response => console.log(`receive ${command}`));
  }

  // Monitors the internal Colosseum variable and updates the volume dispensed and
  // time elapsed.
  monitor() {
    // Don't schedule any more if done or error.
    if (this.colosseum.done || this.colosseum.error || this.colosseum.stopped) {
      clearInterval(this.monitorInterval);
      return;
    }

    const timeElapsed = new Time(Date.now() - this.colosseum.startTime, 'ms').convert('sec');
    const timeUnit = this.unitNumbers.totalTime.unit;
    const volumeDispensed = new Volume(
      this.unitNumbers.flowRate.convert('uL/sec').value * timeElapsed.value, 'uL'
    );
    const volumeUnit = this.unitNumbers.totalVolume.unit;

    this.statusInputs.volumeDispensed.current.setState({
      value: volumeDispensed.convert(volumeUnit).toString(3)
    });
    this.statusInputs.timeElapsed.current.setState({
      value: timeElapsed.convert(timeUnit).toString(3)
    });
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

    // Check that required values exist.
    if (_.isNil(flowRate) || _.isNil(unitNumber1) || _.isNil(unitNumber2)) return;

    const calculated = selectionFunctions[selection1][selection2](
      flowRate, unitNumber1, unitNumber2, targetUnit1, targetUnit2
    );
    _.forEach(calculated, (value, key) => {
      this.unitNumbers[key] = _.isNaN(value.value) ? null : value;
      this.unitNumberInputs[key].current.setUnitNumber(value);
    });
  }

  validate() {
    const results = _.map(this.unitNumbers, (value, key) => {
      const unitNumberInput = this.unitNumberInputs[key].current;
      if (!_.isNil(unitNumberInput.invalid)) return false;
      if (_.isNil(value)) {
        unitNumberInput.setState({invalid: 'Input is invalid.'});
        return false;
      } else {
        return true;
      }
    });
    if (!_.every(results)) return false;

    const numberOfTubes = this.unitNumbers.numberOfTubes.value;
    const tubeSize = this.unitNumbers.numberOfTubes.unit;  // string
    const numberOfFractions = this.unitNumbers.numberOfFractions.value;
    const volumePerFraction = this.unitNumbers.volumePerFraction.convert('mL').value;

    // Check that number of tubes doesn't exceed maximum

    // Check that number of tubes doesn't exceed number of fractions
    if (numberOfFractions > numberOfTubes) {
      this.unitNumberInputs.numberOfTubes.current.setState({
        invalid: `Number of fractions (${numberOfFractions}) exceeds number of tubes.`
      });
      return false;
    }

    // Check that volume per fraction doesn't exceed tube size
    if (volumePerFraction > tubeSizes[tubeSize]) {
      this.unitNumberInputs.numberOfTubes.current.setState({
        invalid: `Volume per fraction (${volumePerFraction} mL) exceeds tube size.`
      });
      return false;
    }

    return true;
  }

  run() {
    if (this.validate()) {
      this.colosseum.setup(
        this.unitNumbers.numberOfFractions.value,
        1000,
        position => {
          this.statusInputs.tubeNumber.current.setState({value: position});
          this.setState({progress: (position / this.unitNumbers.numberOfFractions.value) * 100});
        },
        (position, error) => this.setState({
          statusError: `Error at position ${position}: ${error.toString()}`,
          status: 5,
        }),
        () => this.setState({status: 4})
      )
        .then(() => {
          this.colosseum.run();
          this.setState({status: 1});
          this.monitorInterval = setInterval(this.monitor, 100);
        })
        .catch(error => this.setState({statusError: `Error during setup: ${error.toString()}`}));
    }
  }

  pause() {
    this.colosseum.pause();
    this.setState({status: 2});
  }

  resume() {
    this.colosseum.resume();
    this.setState({status: 1});
  }

  // Stopping is the same as pausing, but without the option to restart.
  stop() {
    this.colosseum.stop();
    this.setState({status: 3});

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
    const disableInputs = this.state.status > 0;
    return (
      <Container>
        <Form.Group as={Row}>
          <UnitNumberInput
            ref={this.unitNumberInputs.numberOfTubes}
            label="Number of Tubes (excluding tube 0)"
            placeholder="# tubes"
            units={tubeUnits}
            disabled={disableInputs}
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
            disabled={disableInputs}
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
            disabled={this.state.status > 0}
            onChange={event => this.setState({timeVolumeRadioSelection: event.target.value})}
          />
          <UnitNumberInput
            ref={this.unitNumberInputs.totalTime}
            label="Total time"
            placeholder="Total time"
            units={totalTimeUnits}
            inputDisabled={this.state.timeVolumeRadioSelection !== 'totalTime'}
            disabled={disableInputs}
            validator={positiveValidator}
            onChange={(value, unit) => this.onChange('totalTime', constructTime, value, unit)}
          />
        </Form.Group>

        <Form.Group as={Row}>
          <Form.Check
            type="radio"
            name="timeVolumeRadio"
            value="totalVolume"
            checked={this.state.timeVolumeRadioSelection === 'totalVolume'}
            disabled={disableInputs}
            onChange={event => this.setState({timeVolumeRadioSelection: event.target.value})}
          />
          <UnitNumberInput
            ref={this.unitNumberInputs.totalVolume}
            label="Total volume"
            placeholder="Total volume"
            units={totalVolumeUnits}
            inputDisabled={this.state.timeVolumeRadioSelection !== 'totalVolume'}
            disabled={disableInputs}
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
            disabled={disableInputs}
            onChange={event => this.setState({volumeNumberRadioSelection: event.target.value})}
          />
          <UnitNumberInput
            ref={this.unitNumberInputs.volumePerFraction}
            label="Volume per fraction"
            placeholder="Volume per fraction"
            units={volumePerFractionUnits}
            inputDisabled={this.state.volumeNumberRadioSelection !== 'volumePerFraction'}
            disabled={disableInputs}
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
            disabled={disableInputs}
            onChange={event => this.setState({volumeNumberRadioSelection: event.target.value})}
          />
          <UnitNumberInput
            ref={this.unitNumberInputs.numberOfFractions}
            label="Number of fractions"
            placeholder="Number of fractions"
            inputDisabled={this.state.volumeNumberRadioSelection !== 'numberOfFractions'}
            disabled={disableInputs}
            validator={value => integerValidator(value) || positiveValidator(value)}
            onChange={(value, unit) => this.onChange('numberOfFractions', constructUnitNumber, value, unit)}
          />
        </Form.Group>

        <hr />

        <Alert variant="warning">
          Please ensure the dispenser arm is centered on the first tube by
          rotating the tube bed. Tube numbering starts at zero.
        </Alert>

        <Row className = "p-2">
          <Col>
            <Button
              variant="primary"
              className="btn-block"
              size="sm"
              disabled={!isConnected || !_.includes([0, 2], this.state.status)}
              onClick={this.run}
            >Run</Button>
          </Col>
          <Col>
            <Button
              variant="primary"
              className="btn-block"
              size="sm"
              disabled={this.state.status !== 1}
              onClick={this.pause}
            >Pause</Button>
          </Col>
          <Col>
            <Button
              variant="primary"
              className="btn-block"
              size="sm"
              disabled={this.state.status !== 2}
              onClick={this.resume}
            >Resume</Button>
          </Col>
          <Col>
            <Button
              variant="primary"
              className="btn-block"
              size="sm"
              disabled={!_.includes([1, 2], this.state.status)}
              onClick={this.stop}
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
        <Row className="justify-content-center mb-1">
          <Badge variant={statusVariants[this.state.status]}>
            {statusTexts[this.state.status]}
          </Badge>
        </Row>
        <ProgressBar
          className="mb-1"
          variant={statusVariants[this.state.status]}
          now={this.state.progress}
          animated={this.state.progress < 100}
          label={`${_.floor(this.state.progress)}%`}
        />
        <hr />
        <StatusInput ref={this.statusInputs.volumeDispensed} label="Volume Dispensed" />
        <StatusInput ref={this.statusInputs.timeElapsed} label="Time Elapsed" />
        <StatusInput ref={this.statusInputs.tubeNumber} label="Tube Number" />
        <Row>
          <Col style={{color: 'red'}}>{this.state.statusError}</Col>
        </Row>
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
    const isConnected = this.state.connected;
    return (
      <>
        <Container>
          {this.props.development && <Alert variant="warning">
            <p>DEVELOPMENT MODE</p>
          <Form.Group>
            <Row>
              <Col className="col-7">
                <Form.Control
                  value={this.state.devCommand}
                  onChange={event => this.setState({devCommand: event.target.value})}
                  placeholder="Command"
                />
              </Col>
              <Col>
                <Button
                  onClick={() => this.send(this.state.devCommand)}
                  disabled={!isConnected}
                >Send</Button>
              </Col>
            </Row>
          </Form.Group>
          </Alert>}
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

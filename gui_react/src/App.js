import _ from 'lodash';
import React from 'react';
import { Col, Container, Dropdown, Row, Form, Button } from 'react-bootstrap';
import './bootstrap.min.css';

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
    };
  }

  // Call this function in render() to display input container.
  renderInputs() {
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
             <Button variant="primary" className = "btn-block">Run</Button>
          </Col>
          <Col>
             <Button variant="primary" className = "btn-block">Pause</Button>
          </Col>
          <Col>
             <Button variant="primary" className = "btn-block">Resume</Button>
          </Col>
          <Col>
             <Button variant="primary" className = "btn-block">Stop</Button>
          </Col>
        </Row>
      </Container>
    );
  }

  // Call this function in render() to display status container.
  renderStatus = () => {
    return (
      <Container>
        <StatusInput label="Volume Dispensed"/>
        <StatusInput label="Time Elapsed" />
        <StatusInput label="Tube Number" />
      </Container>
    );
  }

  render() {
    return (
      <Container style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)'
      }} className="w-75">
        <Row>
          <Col className="col-9 mr-4">
            {this.renderInputs()}
          </Col>
          <Col>
            {this.renderStatus()}
          </Col>
        </Row>
      </Container>
    );
  }
}
export default App;

import React from 'react';
import { Col, Container, Dropdown, Row, Form, Button } from 'react-bootstrap';
import './bootstrap.min.css';

import { UnitNumberInput } from './components';

/*
 * These arrays define what units to *display* (not what unit conversions are
 * supported; this should be defined in each of the converters).
 * Make sure that the units listed here are defined (and conversions are defined).
 * Otherwise things will break.
 */
const flowRateUnits = ['uL/sec', 'uL/min', 'uL/hr', 'mL/sec', 'mL/min', 'mL/hr'];
const totalTimeUnits = ['sec', 'min', 'hr'];
const volumePerFractionUnits = ['uL', 'mL'];
const totalVolumeUnits = ['uL', 'mL', 'L'];


class App extends React.Component {
  constructor(props) {
    super(props);
  }

  // Call this function in render() to display input container.
  renderInputs() {
    return (
      <Container>
        <Form.Group as={Row} controlId="tubeInfo">
          <Col className="col-3">
            <Form.Label>Number of Tubes</Form.Label>
          </Col>
          <Col>
            <Form.Control placeholder="# tubes" type="number" step="1" min="1"/>
          </Col>
          <Col className="col-3">
            <Dropdown>
              <Dropdown.Toggle variant="outline-primary" className="w-100">
                Tube Size
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item key="0.5 mL" eventKey={0.5}>0.5 mL</Dropdown.Item>
                <Dropdown.Item key="1.0 mL" eventKey={1.0}>1.0 mL</Dropdown.Item>
                <Dropdown.Item key="1.5 mL" eventKey={1.5}>1.5 mL</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        </Form.Group>

        <UnitNumberInput
          label="Flow rate"
          placeholder="Flow rate"
          units={flowRateUnits}
          inputDisabled={false}
        />

        <UnitNumberInput
          label="Total time"
          placeholder="Total time"
          units={totalTimeUnits}
          inputDisabled={false}
        />

        <UnitNumberInput
          label="Volume per fraction"
          placeholder="Volume per fraction"
          units={volumePerFractionUnits}
          inputDisabled={false}
        />

        <UnitNumberInput
          label="Total volume"
          placeholder="Total volume"
          units={totalVolumeUnits}
          inputDisabled={false}
        />

        <UnitNumberInput
          label="Number of fractions"
          placeholder="Number of fractions"
          inputDisabled={false}
        />

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
        <Form.Group as={Row}>
          <Form.Label>Volume Dispensed</Form.Label>
          <Form.Control type="text" placeholder="Volume Dispensed" readOnly />
        </Form.Group>
        <Form.Group as={Row}>
          <Form.Label>Time Elapsed</Form.Label>
          <Form.Control type="text" placeholder="Time Elapsed" readOnly />
        </Form.Group>
        <Form.Group as={Row}>
          <Form.Label>Tube Number</Form.Label>
          <Form.Control type="text" placeholder="Tube Number" readOnly />
        </Form.Group>
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

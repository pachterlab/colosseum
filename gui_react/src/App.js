import React from 'react';
import { Col, Container, Dropdown, Row, Form, Button } from 'react-bootstrap';
import './bootstrap.min.css';

import logo from './logo.svg';
import './App.css';

class App extends React.Component {
  render() {
    return (
      <Container style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)'
      }} className="w-75">
        <Row>
          <Col className="col-9 mr-4">
            <Form.Group as={Row} controlId="formPlaintextEmail">
              <Col className="col-3">
                <Form.Label>
                  Number of Tubes
                </Form.Label>
              </Col>
              <Col>
                <Form.Control placeholder="# tubes" />
              </Col>
              <Col className="col-3">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" id="dropdown-basic" style={{width:'100%'}}>
                    Tube Size
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item href="#/action-1">0.5 mL</Dropdown.Item>
                    <Dropdown.Item href="#/action-2">1.5 mL</Dropdown.Item>
                    <Dropdown.Item href="#/action-3">2.0 mL</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="formPlaintextEmail">
              <Col className="col-3">
                <Form.Label>
                  Flow rate
                </Form.Label>
              </Col>
              <Col>
                <Form.Control placeholder="Flow rate" />
              </Col>
              <Col className="col-3">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" id="dropdown-basic" style={{width:'100%'}}>
                    Unit
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item href="#/action-1">uL/sec</Dropdown.Item>
                    <Dropdown.Item href="#/action-2">uL/min</Dropdown.Item>
                    <Dropdown.Item href="#/action-3">uL/hr</Dropdown.Item>
                    <Dropdown.Item href="#/action-4">mL/sec</Dropdown.Item>
                    <Dropdown.Item href="#/action-5">mL/min</Dropdown.Item>
                    <Dropdown.Item href="#/action-6">mL/hr</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="formPlaintextEmail">
              <Col className="col-3">
                <Form.Label>
                  Total Time
                </Form.Label>
              </Col>
              <Col>
                <Form.Control placeholder="Total time" />
              </Col>
              <Col className="col-3">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" id="dropdown-basic" style={{width:'100%'}}>
                    Unit
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item href="#/action-1">sec</Dropdown.Item>
                    <Dropdown.Item href="#/action-2">min</Dropdown.Item>
                    <Dropdown.Item href="#/action-3">hr</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="formPlaintextEmail">
              <Col className="col-3">
                <Form.Label>
                  Volume per fraction
                </Form.Label>
              </Col>
              <Col>
                <Form.Control placeholder="Volume per fraction" />
              </Col>
              <Col className="col-3">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" id="dropdown-basic" style={{width:'100%'}}>
                    Unit
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item href="#/action-1">uL</Dropdown.Item>
                    <Dropdown.Item href="#/action-2">mL</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="formPlaintextEmail">
              <Col className="col-3">
                <Form.Label>
                  Total Volume
                </Form.Label>
              </Col>
              <Col>
                <Form.Control placeholder="Total Volume" />
              </Col>
              <Col className="col-3">
                <Dropdown>
                  <Dropdown.Toggle variant="outline-primary" id="dropdown-basic" style={{width:'100%'}}>
                    Unit
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item href="#/action-1">uL</Dropdown.Item>
                    <Dropdown.Item href="#/action-2">mL</Dropdown.Item>
                    <Dropdown.Item href="#/action-3">L</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Form.Group>
            <Form.Group as={Row} controlId="formPlaintextEmail">
              <Col className="col-3">
                <Form.Label>
                  Number of Fractions
                </Form.Label>
              </Col>
              <Col>
                <Form.Control placeholder="Number of Fractions" />
              </Col>
            </Form.Group>
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
          </Col>
          <Col>
            <Form.Group controlId="exampleForm.ControlInput1" as={Row}>
              <Form.Label>Volume Dispensed</Form.Label>
              <Form.Control type="text" placeholder="Volume Dispensed" readOnly />
            </Form.Group>
            <Form.Group controlId="exampleForm.ControlInput1" as={Row}>
              <Form.Label>Time Elapsed</Form.Label>
              <Form.Control type="text" placeholder="Time Elapsed" readOnly />
            </Form.Group>
            <Form.Group controlId="exampleForm.ControlInput1" as={Row}>
              <Form.Label>Tube Number</Form.Label>
              <Form.Control type="text" placeholder="Tube Number" readOnly />
            </Form.Group>
          </Col>
        </Row>
      </Container>
    );
  }
}
export default App;

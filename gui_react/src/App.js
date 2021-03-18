import React from 'react';
import { Col, Container, Dropdown, Row, Form, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

import logo from './logo.svg';
import './App.css';

class App extends React.Component {
  render() {
    return (
      <Container style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: 'translate(-50%, -50%)'
      }} className = "w-75 p-3 bg-light text-dark">
        <Row>
          <Col xs={9}>
            <Row className = "p-2">
              <Col>
                <Form.Group as={Row} controlId="formPlaintextEmail">
                  <Col>
                    <Form.Label>
                      Number of Tubes
                    </Form.Label>
                  </Col>
                  <Col md="auto">
                    <Form.Control placeholder="# tubes" />
                  </Col>
                </Form.Group>
              </Col>
              <Col>
                <Dropdown>
                  <Dropdown.Toggle variant="success" id="dropdown-basic">
                    Tube Size
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item href="#/action-1">0.5 mL</Dropdown.Item>
                    <Dropdown.Item href="#/action-2">1.5 mL</Dropdown.Item>
                    <Dropdown.Item href="#/action-3">2.0 mL</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
            <Row className = "p-2">
              <Col>
                <Form.Group as={Row} controlId="formPlaintextEmail">
                  <Col>
                    <Form.Label>
                      Flow rate
                    </Form.Label>
                  </Col>
                  <Col md="auto">
                    <Form.Control placeholder="Flow rate" />
                  </Col>
                </Form.Group>
              </Col>
              <Col>
                <Dropdown>
                  <Dropdown.Toggle variant="success" id="dropdown-basic">
                    Tube Size
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
            </Row>
            <Row className = "p-2">
              <Col>
                <Form.Group as={Row} controlId="formPlaintextEmail">
                  <Col>
                    <Form.Label>
                      Total Time
                    </Form.Label>
                  </Col>
                  <Col md="auto">
                    <Form.Control placeholder="Total time" />
                  </Col>
                </Form.Group>
              </Col>
              <Col>
                <Dropdown>
                  <Dropdown.Toggle variant="success" id="dropdown-basic">
                    Total Time
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item href="#/action-1">sec</Dropdown.Item>
                    <Dropdown.Item href="#/action-2">min</Dropdown.Item>
                    <Dropdown.Item href="#/action-3">hr</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
            <Row className = "p-2">
              <Col>
                <Form.Group as={Row} controlId="formPlaintextEmail">
                <Col>
                  <Form.Label>
                    Volume per fraction
                  </Form.Label>
                </Col>
                  <Col md="auto">
                    <Form.Control placeholder="Volume per fraction" />
                  </Col>
                </Form.Group>
              </Col>
              <Col>
                <Dropdown>
                  <Dropdown.Toggle variant="success" id="dropdown-basic">
                    Volume per fraction
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item href="#/action-1">uL</Dropdown.Item>
                    <Dropdown.Item href="#/action-2">mL</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
            <Row className = "p-2">
              <Col>
                <Form.Group as={Row} controlId="formPlaintextEmail">
                  <Col>
                    <Form.Label>
                      Total Volume
                    </Form.Label>
                  </Col>
                  <Col md="auto">
                    <Form.Control placeholder="Total Volume" />
                  </Col>
                </Form.Group>
              </Col>
              <Col>
                <Dropdown>
                  <Dropdown.Toggle variant="success" id="dropdown-basic">
                    Volume per fraction
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item href="#/action-1">uL</Dropdown.Item>
                    <Dropdown.Item href="#/action-2">mL</Dropdown.Item>
                    <Dropdown.Item href="#/action-3">L</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            </Row>
            <Row className = "p-2">
              <Col>
                <Form.Group as={Row} controlId="formPlaintextEmail">
                  <Form.Label>
                    Number of fractions
                  </Form.Label>
                  <Col md="auto">
                    <Form.Control placeholder="Number of fractions" />
                  </Col>
                </Form.Group>
              </Col>
            </Row>
          </Col>
          <Col>
            <Row className = "p-2">
              Volume Dispensed
            </Row>
            <Row className = "p-2">
              Time Elapsed
            </Row>
            <Row className = "p-2">
              Tube Number
            </Row>
          </Col>
        </Row>
        <Row className = "p-2">
          <Col>
             <Button variant="success" className = "btn-block">Run</Button>
          </Col>
          <Col>
             <Button variant="success" className = "btn-block">Pause</Button>
          </Col>
          <Col>
             <Button variant="success" className = "btn-block">Resume</Button>
          </Col>
          <Col>
             <Button variant="success" className = "btn-block">Stop</Button>
          </Col>
        </Row>
        <Row className = "p-2">
          test function stuff goes here
        </Row>
      </Container>
    );
  }
}
export default App;

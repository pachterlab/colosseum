import React from 'react';
import { BrowserSerial } from "browser-serial";
import { Col, Row, Modal, Button } from 'react-bootstrap';

const serial = new BrowserSerial();

export class ConnectModal extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      showWindow: false
    }
  }

  componentDidMount() {
     this.setState({showWindow: true});
  }

  render() {
    return (
      <>
        <Modal show={this.state.showWindow}>
          <Modal.Header closeButton>
            <Modal.Title>hehe</Modal.Title>
          </Modal.Header>
          <Modal.Body>Woohoo</Modal.Body>
          <Modal.Footer>
            <Row>
              <Col>
                <Button variant="secondary"
                        onClick={ async() => {await serial.connect();
                                              serial.readLoop(console.log) }
                                }>
                  Connect
                </Button>
              </Col>
              <Col>
                <Button variant="secondary" onClick={ () => this.setState({showWindow: false}) }>
                  Close
                </Button>
              </Col>
            </Row>
          </Modal.Footer>
        </Modal>
        <header className="App-header">

        </header>
      </>
    );
  }
}

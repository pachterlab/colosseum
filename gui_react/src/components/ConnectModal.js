import React from 'react';
import { BrowserSerial } from "browser-serial";
import { Col, Row, Modal, Button } from 'react-bootstrap';

export class ConnectModal extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      showWindow: false
    };
  }

  render(){
    return (
      <>
        <Button variant="primary" onClick={ () => this.setState({showWindow: true}) }>
          Show
        </Button>
        <Modal show={this.state.showWindow}>
          <Modal.Header closeButton>
            <Modal.Title>hehe</Modal.Title>
          </Modal.Header>
          <Modal.Body>Woohoo</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={ () => this.setState({showWindow: false}) }>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
        <header className="App-header">

        </header>
      <>
    );
  };

import React from 'react';
import { Col, Row, Modal, Button } from 'react-bootstrap';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

export class NotSupportedModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      show: false
    }
  }

  render() {
    return (
      <Modal show={this.state.show} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <FontAwesomeIcon icon={faExclamationTriangle} />
            Web Serial API Not Found
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            This web browser does not support the Web Serial API, which is required
            to use this application. Please use a different browser, or update the
            current one to a version that supports the Web Serial API.
          </p>
          <p>
            A list of supported browsers and their versions can be
            found <a href="https://developer.mozilla.org/en-US/docs/Web/API/Serial#browser_compatibility">here</a>.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Row>
            <Col>
              <Button variant="secondary" onClick={() => this.setState({show: false})}>
                Close
              </Button>
            </Col>
          </Row>
        </Modal.Footer>
      </Modal>
    );
  }
}

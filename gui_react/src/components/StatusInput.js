import PropTypes from 'prop-types';
import React from 'react';
import { Form } from 'react-bootstrap';

export class StatusInput extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
  }

  constructor(props) {
    super(props);
    this.state = {
      value: ''
    }
  }

  render() {
    return (
      <Form.Group>
        <Form.Label>{this.props.label}</Form.Label>
        <Form.Control
          type="text"
          placeholder=""
          value={this.state.value}
          readOnly
        />
      </Form.Group>
    )
  }
}

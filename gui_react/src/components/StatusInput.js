import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Row, Form } from 'react-bootstrap';

export class StatusInput extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    inputDisabled: PropTypes.bool,
    onValueChange: PropTypes.func,
  }
  static defaultProps = {
    inputDisabled: true
  }

  constructor(props) {
    super(props);
    this.state = {
      value: ''
    }
  }

  // Called right after component is initialized.
  // Note that this.setState() may be called here (but not in the constructor).

  onValueChange(value) {
    this.setState({value: value});
    _.isFunction(this.props.onValueChange) && this.props.onValueChange(value);
  }

  render() {
    return(
      <Form.Group as={Row}>
        <Form.Label>
          {this.props.label}
        </Form.Label>
        <Form.Control
          type="text"
          placeholder={this.props.placeholder}
          onChange={event => this.onValueChange(event.target.value)}
          readOnly={this.props.inputDisabled}
        />
      </Form.Group>
    )
  }
}

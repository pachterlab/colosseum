import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Col, Dropdown, Row, Form } from 'react-bootstrap';

/*
 * A modular React component that renders a form group for number and unit input.
 * It provides onChange listeners for the value and unit (or either).
 */
export class UnitNumberInput extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    units: PropTypes.arrayOf(PropTypes.string).isRequired,
    inputDisabled: PropTypes.bool,
    dropdownDisabled: PropTypes.bool,
    onChange: PropTypes.func,
    onValueChange: PropTypes.func,
    onUnitChange: PropTypes.func,
  }
  static defaultProps = {
    inputDisabled: false,
    dropdownDisabled: false,
  }

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      unit: null,
    }
  }

  // Called right after component is initialized.
  // Note that this.setState() may be called here (but not in the constructor).
  // We set the unit to be the first unit in this.units for simplicity.
  componentDidMount() {
    !_.isNil(this.props.units) && this.setState({unit: this.props.units[0]});
  }

  onChange(value, unit) {
    _.isFunction(this.props.onChange) && this.props.onChange(value, unit);
  }

  onValueChange(value) {
    this.setState({value: value});
    _.isFunction(this.props.onValueChange) && this.props.onValueChange(value);
    this.onChange(value, this.state.unit);
  }

  onUnitChange(unit) {
    this.setState({unit: unit});
    _.isFunction(this.props.onUnitChange) && this.props.onUnitChange(unit);
    this.onChange(this.state.value, unit);
  }


  render() {
    return (
      <Form.Group as={Row}>
        <Col className="col-3">
          <Form.Label>
            {this.props.label}
          </Form.Label>
        </Col>
        <Col>
          <Form.Control
            placeholder={this.props.placeholder}
            type="number"
            onChange={event => this.onValueChange(event.target.value)}
            readOnly={this.props.inputDisabled}
          />
        </Col>
        {!_.isNil(this.props.units) &&
          <Col className="col-3">
            <Dropdown>
              <Dropdown.Toggle
                variant="outline-primary"
                className="w-100"
                disabled={this.props.dropdownDisabled}
              >
                {this.state.unit || 'Unit'}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {_.map(this.props.units, unit => (
                  <Dropdown.Item
                    key={unit}
                    eventKey={unit}
                    onSelect={(eventKey, event) => this.onUnitChange(eventKey)}
                  >{unit}</Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </Col>
        }
      </Form.Group>
    );
  }
}

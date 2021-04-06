import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Col, Dropdown, Form } from 'react-bootstrap';

const allowedChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '.'];
/*
 * A modular React component that renders a form group for number and unit input.
 * It provides onChange listeners for the value and unit (or either).
 */
export class UnitNumberInput extends React.Component {
  static propTypes = {
    label: PropTypes.string.isRequired,
    placeholder: PropTypes.string,
    units: PropTypes.arrayOf(PropTypes.string),
    disabled: PropTypes.bool,
    inputDisabled: PropTypes.bool,
    dropdownDisabled: PropTypes.bool,
    onChange: PropTypes.func,
    onValueChange: PropTypes.func,
    onUnitChange: PropTypes.func,
    validator: PropTypes.func,
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
      invalid: null,
    }

    // These are immediately updated, unlike this.state, which is updated
    // asynchronously.
    this.value = '';
    this.unit = null;
    this.invalid = null;
  }

  setUnitNumber(unitNumber) {
    if ((_.isNil(this.props.units) !== _.isNil(unitNumber.unit)) && !_.includes(this.props.units, unitNumber.unit))
      throw Error(`unit ${unitNumber.unit} not in ${this.props.units}`);
    const invalid = _.isFunction(this.props.validator) && !_.isNaN(unitNumber.value)
      ? this.props.validator(unitNumber.value)
      : null;
    this.value = unitNumber.value;
    this.unit = unitNumber.unit;
    this.invalid = invalid;
    this.setState({
      value: _.isNaN(unitNumber.value) ? '' : unitNumber.value.toString(),
      unit: unitNumber.unit,
      invalid: invalid,
    });
  }

  // Called right after component is initialized.
  // Note that this.setState() may be called here (but not in the constructor).
  // We set the unit to be the first unit in this.units for simplicity.
  componentDidMount() {
    if (!_.isNil(this.props.units)) {
      this.unit = this.props.units[0];
      this.setState({unit: this.props.units[0]});
    }
  }

  onChange(value, unit) {
    _.isFunction(this.props.onChange) && this.props.onChange(value, unit);
  }

  onValueChange(value) {
    const validChars = _.every(value, char => _.includes(allowedChars, char));
    const numPeriods = _.sumBy(value, char => char === '.');
    if (!validChars || numPeriods > 1) return;
    const floatValue = parseFloat(value);
    const invalid = _.isFunction(this.props.validator) && !_.isNaN(floatValue)
      ? this.props.validator(floatValue)
      : null;
    _.isFunction(this.props.onValueChange) && this.props.onValueChange(floatValue);
    this.value = value;
    this.invalid = invalid;
    this.setState({value: value, invalid: invalid});
    this.onChange(floatValue, this.state.unit);
  }

  onUnitChange(unit) {
    const floatValue = parseFloat(this.state.value);
    this.unit = unit;
    this.setState({unit: unit});
    _.isFunction(this.props.onUnitChange) && this.props.onUnitChange(floatValue);
    this.onChange(floatValue, unit);
  }

  render() {
    const inputDisabled = this.props.inputDisabled || this.props.disabled;
    const dropdownDisabled = this.props.dropdownDisabled || this.props.disabled;
    return (
      <>
        <Col className="col-3">
          <Form.Label
            className={inputDisabled && 'text-muted'}
          >
            {this.props.label}
          </Form.Label>
        </Col>
        <Col>
          <Form.Control
            placeholder={this.props.placeholder}
            value={this.state.value}
            onChange={event => this.onValueChange(event.target.value)}
            readOnly={inputDisabled}
            isInvalid={!_.isNil(this.state.invalid)}
          />
          <Form.Control.Feedback type="invalid">
            {this.state.invalid}
          </Form.Control.Feedback>
        </Col>
        {!_.isNil(this.props.units) &&
          <Col className="col-3">
            <Dropdown>
              <Dropdown.Toggle
                variant="outline-primary"
                className="w-100"
                disabled={dropdownDisabled}
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
      </>
    );
  }
}

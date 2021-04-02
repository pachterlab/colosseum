import _ from 'lodash';

/*
 * Class that is used to convert one number of a certain unit to another
 * number of another unit. Extend this class to implement custom
 * units and conversions.
 */
export class UnitNumber {
  // A value without a unit can be constructed by calling UnitNumber(n).
  // Omitting the second argument like this is fine.
  constructor(value, unit, units=[], conversionFactors={}) {
    // Check that all required conversion factors are defined.
    for (const unit1 of units) {
      for (const unit2 of units) {
        if (unit1 !== unit2 && !_.has(conversionFactors, [unit1, unit2])) {
          throw Error(`Missing required conversion factor ${unit1}->${unit2}`);
        }
      }
    }

    // Value must be a number
    if (!_.isNumber(value)) throw Error(`Value must be a number, but got ${value}`);

    // If this.units has units, then the provided unit must be one of those.
    if (!_.isEmpty(units) && !_.includes(units, unit)) {
      throw Error(`Unit must be one of ${_.toString(units)}, but got ${unit}`);
    }

    // If this.units is empty, then the provided unit must be null or undefined.
    if (_.isEmpty(units) && !_.isNil(unit)) {
      throw Error(`Unit must not be provided, but got ${unit}`);
    }

    this.units = units;
    this.conversionFactors = conversionFactors;
    this.value = value;
    this.unit = unit;
  }

  // Convert this number to the desired unit.
  convert(unit) {
    if ((_.isNil(this.unit) && _.isNil(this.unit)) || unit === this.unit) {
      return new this.constructor(this.value, this.unit);
    }

    if (!_.includes(this.units, unit)) {
      throw Error(`Unit must be one of ${_.toString(this.units)}, but got ${unit}`);
    }

    return new this.constructor(
      this.conversionFactors[this.unit][unit] * this.value, unit
    );
  }
  toString(places=null) {
    const value = _.isInteger(places) && places > 0 ? _.floor(this.value, places) : this.value;
    return _.isNil(this.unit) ? `${value}` : `${value} ${this.unit}`;
  }
}

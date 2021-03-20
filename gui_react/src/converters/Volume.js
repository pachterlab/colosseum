import UnitNumber from './UnitNumber';

const units = [];
const conversionFactors = [];

export class Volume extends UnitNumber {
  constructor(value, unit) {
    super(value, unit, units, conversionFactors);
  }
}

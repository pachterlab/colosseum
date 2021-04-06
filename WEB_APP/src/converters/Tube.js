import { UnitNumber } from './UnitNumber';

const units = ['0.5 mL', '1.0 mL', '1.5 mL'];
const conversionFactors = {
  '0.5 mL': {
    '1.0 mL': null,
    '1.5 mL' : null,
  },
  '1.0 mL': {
    '0.5 mL': null,
    '1.5 mL' : null,
  },
  '1.5 mL': {
    '0.5 mL': null,
    '1.0 mL': null,
  }
};

export class Tube extends UnitNumber {
  constructor(value, unit) {
    super(value, unit, units, conversionFactors);
  }
}

import UnitNumber from './UnitNumber';

const units = ['uL', 'mL', 'L'];
const conversionFactors = {
  'uL' : {
    'mL' : 0.001,
    'L'  : 0.000001
  },
  'mL' : {
    'uL' : 1000,
    'L'  : 0.001
  },
  'L' : {
    'uL' : 1000000,
    'mL' : 1000
  }
};

export class Volume extends UnitNumber {
  constructor(value, unit) {
    super(value, unit, units, conversionFactors);
  }
}

import UnitNumber from './UnitNumber';

const units = ['sec', 'min', 'hr'];
const conversionFactors = {
  'sec' : {
    'min' : 1/60,
    'hr'  : 1/3600
  },
  'min' : {
    'sec' : 60,
    'hr'  : 1/60
  },
  'hr' : {
    'sec' : 3600,
    'min' : 60
  }
};

export class Time extends UnitNumber {
  constructor(value, unit) {
    super(value, unit, units, conversionFactors);
  }
}

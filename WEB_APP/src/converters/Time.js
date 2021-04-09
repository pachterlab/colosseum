import { UnitNumber } from './UnitNumber';

const units = ['ms', 'sec', 'min', 'hr'];
const conversionFactors = {
  'ms' : {
    'sec': 1 / 1000,
    'min': 1 / (1000 * 60),
    'hr' : 1 / (1000 * 3600)
  },
  'sec' : {
    'ms'  : 1000,
    'min' : 1 / 60,
    'hr'  : 1 / 3600
  },
  'min' : {
    'ms'  : 60 * 1000,
    'sec' : 60,
    'hr'  : 1 / 60
  },
  'hr' : {
    'ms'  : 3600 * 1000,
    'sec' : 3600,
    'min' : 60
  }
};

export class Time extends UnitNumber {
  constructor(value, unit) {
    super(value, unit, units, conversionFactors);
  }
}

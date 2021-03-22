import { UnitNumber } from './UnitNumber';

const units = ['uL/sec', 'uL/min', 'uL/hr', 'mL/sec', 'mL/min', 'mL/hr'];
const conversionFactors = {
  'uL/sec': {
    'uL/min': 60,
    'uL/hr' : 3600,
    'mL/sec': 1 / 1000,
    'mL/min': 60 / 1000,
    'mL/hr' : 3600 / 1000
  },
  'uL/min': {
    'uL/sec': 1 / 60,
    'uL/hr' : 60,
    'mL/sec': 1 / (1000 * 60),
    'mL/min': 1 / 1000,
    'mL/hr' : 60 / 1000
  },
  'uL/hr': {
    'uL/sec': 1 / 3600,
    'uL/min': 1 / 60,
    'mL/sec': 1 / (1000 * 3600),
    'mL/min': 1 / (1000 * 60),
    'mL/hr' : 1 / 1000
  },
  'mL/sec': {
    'uL/sec': 1000,
    'uL/min': 1000 * 60,
    'uL/hr' : 1000 * 3600,
    'mL/min': 60,
    'mL/hr' : 3600
  },
  'mL/min': {
    'uL/sec': 1000 / 60,
    'uL/min': 1000,
    'uL/hr' : 1000 * 60,
    'mL/sec': 1 / 60,
    'mL/hr' : 60
  },
  'mL/hr': {
    'uL/sec': 1000 / 3600,
    'uL/min': 1000 / 60,
    'uL/hr' : 1000,
    'mL/sec': 1 / 3600,
    'mL/min': 1 / 60,
  }
};

export class FlowRate extends UnitNumber {
  constructor(value, unit) {
    super(value, unit, units, conversionFactors);
  }
}

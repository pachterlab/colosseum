import os
from collections import namedtuple

from .utils import (
    read_angles,
    make_commands,
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data')
UI_PATH = os.path.join(DATA_DIR, 'fractioncollector.ui')
ANGLES_PATH = os.path.join(DATA_DIR, 'angles.txt')

PORT = namedtuple('Port', ['description', 'device'])
TEST_PORT = PORT('test port', 'test device')

# params table mapping of setting to valid units
SETTING_TO_UNITS_MAPPING = {
    'Total time': ['sec', 'min', 'hr'],
    'Total volume': ['uL', 'mL', 'L'],
    'Volume per fraction': ['uL', 'mL'],
    'Number of fractions': [],
}

SETTINGS_LINK = {
    'Total time': 'Total volume',
    'Total volume': 'Total time',
    'Volume per fraction': 'Number of fractions',
    'Number of fractions': 'Volume per fraction',
}

FRUNIT_TO_UL_HR = {
    'uL/sec' : 3600,
    'uL/min' : 60,
    'uL/hr' : 1,
    'mL/sec' : 3600000,
    'mL/min' : 60000,
    'mL/hr' : 1000,
}

TIMEUNIT_TO_HR = {
    'sec' : 3600,
    'min' : 60,
    'hr' : 1,
}

VOLUNIT_TO_UL = {
    'uL' : 1,
    'mL' : 1000,
    'L' : 1000000,
}

FRACSIZE_TO_UL = {
    'uL' : 1,
    'mL' : 1000,
}

ANGLES = read_angles(ANGLES_PATH)
COMMANDS = make_commands(ANGLES)
SETUP_CMDS = [
    "<SET_ACCEL,111,1000.0,1000.0,1000.0>",
    "<SET_SPEED,111,1000.0,1000.0,1000.0>",
]
STOP_CMD = "<STOP,111,0.0,0.0,0.0>"

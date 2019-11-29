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

frunit_to_uL_hr = {
    'uL/sec' : 3600,
    'uL/min' : 60,
    'uL/hr' : 1,
    'mL/sec' : 3600000,
    'mL/min' : 60000,
    'mL/hr' : 1000,
}

timeunit_to_hr = {
    'sec' : 3600,
    'min' : 60,
    'hr' : 1,
}

volunit_to_uL = {
    'uL' : 1,
    'mL' : 1000,
    'L' : 1000000,
}

fracsize_to_uL = {
    'uL' : 1,
    'mL' : 1000,
}

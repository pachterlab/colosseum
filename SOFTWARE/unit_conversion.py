# Need to import constants table
from constants import frunit_to_uL_hr, timeunit_to_hr, volunit_to_uL, fracsize_to_uL
# from utils import is_float, make_row_dict

# calculating volume if the user inputs time
def vol_from_time(flowrate, row1, row3):
    frunit = flowrate['unit']
    fr = float(flowrate['value'])
    fr *= frunit_to_uL_hr[frunit]
    time = float(row1['value'])
    timeunit = row1['unit']
    time /= timeunit_to_hr[timeunit]
    vol = time * fr
    volunit = row3['unit']
    vol /= volunit_to_uL[volunit]
    return vol

# calcuating time if the user inputs volume
def time_from_vol(flowrate, row1, row3):
    frunit = flowrate['unit']
    fr = float(flowrate['value'])
    fr *= frunit_to_uL_hr[frunit]
    vol = float(row1['value'])
    volunit = row1['unit']
    vol *= volunit_to_uL[volunit]
    time = vol / fr
    timeunit = row3['unit']
    time *= timeunit_to_hr[timeunit]
    return time

# calculating number of fractions from volume per fraction
def get_numfrac(flowrate, row2, volrow):
    # get volume unit
    # convert into uL
    vol = float(volrow['value'])
    volunit = volrow['unit']
    vol *= volunit_to_uL[volunit]
    # get frac size unit
    # convert into uL
    fracsize = float(row2['value'])
    fsunit = row2['unit']
    fracsize *= fracsize_to_uL[fsunit]

    numfrac = vol / fracsize
    return numfrac

# calculating volume per fraction from number of fractions
def get_fracsize(flowrate, row2, volrow):
    # get volume unit
    # convert into uL
    vol = float(volrow['value'])
    volunit = volrow['unit']
    vol *= volunit_to_uL[volunit]
    numfrac = float(row2['value'])
    fracsize = vol / numfrac
    # get frac size unit
    # multiply scalar
    fsunit = row2['unit']
    fracsize *= fracsize_to_uL[fsunit]

    return fracsize

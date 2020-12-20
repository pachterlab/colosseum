# Need to import constants table
from .constants import FRUNIT_TO_UL_HR, TIMEUNIT_TO_HR, VOLUNIT_TO_UL, FRACSIZE_TO_UL
# from utils import is_float, make_row_dict

# calculating volume if the user inputs time
def vol_from_time(flowrate, row1, row3):
    frunit = flowrate['unit']
    fr = float(flowrate['value'])
    fr *= FRUNIT_TO_UL_HR[frunit]
    time = float(row1['value'])
    timeunit = row1['unit']
    time /= TIMEUNIT_TO_HR[timeunit]
    vol = time * fr
    volunit = row3['unit']
    vol /= VOLUNIT_TO_UL[volunit]
    return vol

# calcuating time if the user inputs volume
def time_from_vol(flowrate, row1, row3):
    frunit = flowrate['unit']
    fr = float(flowrate['value'])
    fr *= FRUNIT_TO_UL_HR[frunit]
    vol = float(row1['value'])
    volunit = row1['unit']
    vol *= VOLUNIT_TO_UL[volunit]
    time = vol / fr
    timeunit = row3['unit']
    time *= TIMEUNIT_TO_HR[timeunit]
    return time

# calculating number of fractions from volume per fraction
def get_numfrac(flowrate, row2, volrow):
    # get volume unit
    # convert into uL
    vol = float(volrow['value'])
    volunit = volrow['unit']
    vol *= VOLUNIT_TO_UL[volunit]
    # get frac size unit
    # convert into uL
    fracsize = float(row2['value'])
    fsunit = row2['unit']
    fracsize *= FRACSIZE_TO_UL[fsunit]

    numfrac = vol / fracsize
    return numfrac

# calculating volume per fraction from number of fractions
def get_fracsize(flowrate, row2, volrow, fsunit):
    # get volume unit
    # convert into uL
    vol = float(volrow['value'])
    volunit = volrow['unit']
    vol *= VOLUNIT_TO_UL[volunit]
    numfrac = float(row2['value'])
    fracsize = vol / numfrac
    # get frac size unit
    # multiply scalar
    #fsunit = row4['unit']
    fracsize /= FRACSIZE_TO_UL[fsunit]

    return fracsize

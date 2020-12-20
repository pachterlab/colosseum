#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""Serial Comm Utils

Provides many utilities to connect to and talk with device connected to a serial
port. The device is programmed to receive commands of the form:

"<mode,motorID,arg_m1,arg_m2,arg_m3>" # no spaces! the command is a string!

This file can also be imported as a module and contains the following
functions:

    * populate_ports - return a list of available serial ports
    * connect - returns a serial object with the computer connect to the object
    * write_to_serial - write a string to the serial port
    * listen - listen for information from the serial port
    * talk - send multiple commands to the serial port
    * cmd_valid - check if the command you are going to send is valid
"""

import glob
import sys
import time

import serial
import serial.tools.list_ports

from .constants import TEST_PORT

startMarker = 60 # <
endMarker = 62 # >
midMarker = 44 # ,

def populate_ports():
    """Gets and prints the serial ports available to connect to.

    Parameters
    ----------
    None

    Returns
    -------
    list
        A list of the serial ports available on the system
    """
    if sys.platform.startswith('win'):
        ports = ['COM%s' % (i + 1) for i in range(256)]
    elif sys.platform.startswith('linux') or sys.platform.startswith('cygwin'):
        # this excludes your current terminal "/dev/tty"
        ports = glob.glob('/dev/tty[A-Za-z]*')
    elif sys.platform.startswith('darwin'):
        ports = glob.glob('/dev/tty.*')
    else:
        raise EnvironmentError('Unsupported platform')

    result = []
    for port in ports:
        try:
            s = serial.Serial(port)
            s.close()
            result.append(port)
        except (OSError, serial.SerialException):
            pass
    return result[-1]

def get_arduino_ports(dry_run=False):
    """Detect which serial ports are connected to an Arduino.

    Parameters
    ----------
    None

    Returns
    -------
    list
        A list of serial ports connected to an Arduino
    """
    if dry_run:
        return [TEST_PORT]

    if sys.platform.startswith('win'):
        ports = ['COM%s' % (i + 1) for i in range(256)]
    elif sys.platform.startswith('linux') or sys.platform.startswith('cygwin'):
        # this excludes your current terminal "/dev/tty"
        ports = glob.glob('/dev/tty[A-Za-z]*')
    elif sys.platform.startswith('darwin'):
        ports = glob.glob('/dev/tty.*')
    else:
        raise EnvironmentError('Unsupported platform')

    return [
        port
        for port in serial.tools.list_ports.comports()
        if 'arduino' in port.description.lower()
    ]

def connect(port, baudrate=2000000, dry_run=False):
    """Connects to the specified serial port

    Parameters
    ----------
    baudrate : int (optional)
        The baud rate specifies how fast data is sent over a serial line.
        It's usually expressed in units of bits-per-second (bps). The possible
        baudrates for an Arduino Uno are 1,200, 2,400, 4,800, 19,200, 38,400,
        57,600, 115,200, and 2,000,000 (I've tested up to this speed). The
        default is 2000000.

    Returns
    -------
    Serial Object
        A serial object that you can interface with. Allows you to send and
        receive commands from the object interfacing with the serial port at
        location 'port'.
    """
    if dry_run:
        return serial.Serial()
    s = serial.Serial()
    s.port = port
    s.baudrate = baudrate
    s.parity = serial.PARITY_NONE
    s.stopbits = serial.STOPBITS_ONE
    s.bytesize = serial.EIGHTBITS
    s.timeout = 1
    s.open()
    return s

def write_to_serial(s, string, dry_run=False):
    """Write a string to the arduino connected to serial port 's'.

    Parameters
    ----------
    s : Serial
        The Serial object instance that your Arduino is interfacing.
    string : str
        The string that will be sent to the arduino.

    Returns
    -------
    """
    if dry_run:
        return

    s.write(string.encode())
    s.flushInput()
    return

def listen(s, dry_run=False):
    """Listen to strings being sent from the Serial Object at the port.

    Parameters
    ----------
    s : Serial
        The Serial object instance that your Arduino is interfacing.

    Returns
    -------
    msg: str
        The string that was sent from the Serial object to the computer.
    """
    if dry_run:
        return ""

    msg = ""
    x = "z" # any value that is not an end- or startMarker

    # wait for the start character
    while  True:
        x = s.read()
        try:
            if ord(x) == startMarker:
                break
        except:
            pass

    # save data until the end marker is found
    while ord(x) != endMarker:
        if ord(x) != startMarker:
            msg = msg + x.decode()

        x = s.read()

    return(msg)

def talk(s, commands, dry_run=False):
    """Send a list of commands to the Arduino connected at the Serial port.

    Parameters
    ----------
    s : Serial
        The Serial object instance that your Arduino is interfacing.
    commands : list
        A list of properly formatted string commands to send to the Arduino.
        Command is structured as "<mode, motorID, arg_m1, arg_m2, arg_m3>",
        where mode is one of [RUN, STOP, RESUME, PAUSE, SET_SPEED, SET_ACCEL],
        and motorID is [1, 1, 1] (can be combo of numbers i.e. 100 or 101 or
        001 (binary indicator), and arg_m* is any floating number.

    Returns
    -------
    """

    waitingForReply = False

    for teststr in commands: # could use a while loop + numloops iterator?
        if not cmd_valid(teststr):
            continue # returns to beginning of for loop and grabs next string
        if waitingForReply == False:
            write_to_serial(s, teststr, dry_run=dry_run)
            print("Sent from PC -- " + teststr) # Prints out what was sent to the Arduino
            waitingForReply = True

        if waitingForReply == True:
            while not dry_run and s.inWaiting() == 0:
                pass

            dataRecvd = listen(s, dry_run=dry_run)
            print("Reply Received -- " + dataRecvd) # Prints out what was received by the Arduino
            waitingForReply = False


        time.sleep(0.1)
        print("Send and receive complete")


def cmd_valid(cmd):
    """Checks to see if a given string command to be sent is valid in structure.
        Used in talk() prior to sending a command to the Arduino.

    Parameters
    ----------
    cmd : str
        The command string to be sent. Command is structured as
        "<mode, motorID, arg_m1, arg_m2, arg_m3>", where mode is one of
        [RUN, STOP, RESUME, PAUSE, SET_SPEED, SET_ACCEL],
        and motorID is [1, 1, 1] (can be combo of numbers i.e. 100 or 101 or 001
        (binary indicator), and arg_m* is any floating number.
    print_cols : bool, optional
        A flag used to print the columns to the console (default is False)

    Returns
    -------
    bool
        A boolean indicating whether the command is valid (True) or not (False).
    """

    cmds = ["RUN", "STOP", "RESUME", "PAUSE", "SET_SPEED", "SET_ACCEL"]
    inds = ["000", "100", "010", "001", "110", "101", "011", "111"]
    valid = False
    if "," in cmd and cmd[0] == '<' and cmd[-1]=='>':
        testcmd = cmd[1:].split(",")[0]
        ind = cmd[1:].split(",")[1]
        if testcmd in cmds and ind in inds:
            valid = True
            return valid
    return valid


## Set Accel to be blah
# <SET_ACCEL,111,9000.0,9000.0,9000.0>

## Set Speed to be blah
# <SET_SPEED,111,1000.0,1000.0,1000.0>

## Run at speed for 1 rotation
# <RUN,110,200,200,0>

## Run at speed for 10 rotations
# <RUN,010,0,10000,0>

## Stop
# <STOP,010,0,0,0>

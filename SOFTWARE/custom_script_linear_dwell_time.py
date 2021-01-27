#!/usr/bin/env python
# -*- coding: utf-8 -*-
import serial
import sys
import glob
import time

startMarker = 60 # <
endMarker = 62 # >
midMarker = 44 # ,

def populate_ports():
    """
        :raises EnvironmentError:
            On unsupported or unknown platforms
        :returns:
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

def connect(port):
    s = serial.Serial()
    s.port = port
    s.baudrate = 2000000
    s.parity = serial.PARITY_NONE
    s.stopbits = serial.STOPBITS_ONE
    s.bytesize = serial.EIGHTBITS
    s.timeout = 1
    s.open()
    return s

def write_to_Arduino(s, string):
    s.write(string.encode())
    s.flushInput()
    return

def listen(s):
    char = ""
    x = "z" # any value that is not an end- or startMarker

    # wait for the start character
    while  ord(x) != startMarker:
        x = s.read()

    # save data until the end marker is found
    while ord(x) != endMarker:
        if ord(x) != startMarker:
            char = char + x.decode()

        x = s.read()

    return(char)

def talk(s, commands):
    waitingForReply = False

    for teststr in commands: # could use a while loop + numloops iterator?
        if not cmd_valid(teststr):
            continue # returns to beginning of for loop and grabs next string
        if waitingForReply == False:
            write_to_Arduino(s, teststr)
            print("Sent from PC -- " + teststr)
            waitingForReply = True

            if waitingForReply == True:
                while s.inWaiting() == 0:
                    pass

                dataRecvd = listen(s)
            print("Reply Received -- " + dataRecvd)
            waitingForReply = False


        time.sleep(0.1)
        print("Send and receive complete")


# all this does is check if a command is formatted properly
# used in talk() prior to sending a command to the arduino
def cmd_valid(cmd):
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

if __name__ == "__main__":
    setup_cmds = [
    "<SET_ACCEL,111,1000.0,1000.0.0,1000.0>",
    "<SET_SPEED,111,1000.0,1000.0,1000.0>",
    ]

    run_cmds = [
    "<this should not work>",
    "<Neither should this>",
    "Or this",
    "Or even, this>",
    "<RUN, 123, 0.0, 0.0, 0.0>", # this shouldn't run either
    #"<RUN,111,5000.0,200.0,200.0>"
    ]

    stop_cmds = [
    "<STOP,111,0.0,0.0,0.0>"
    ]

    pause_cmds = [
    "<PAUSE,100,0.0,0.0,0.0>"
    ]

    resume_cmds = [
    "<RESUME,100,0.0,0.0,0.0>"
    ]


    tube_1 = ["<RUN,100,84,84,84>"]
    tube_2 = ["<RUN,100,78,78,78>"]
    tube_3 = ["<RUN,100,75,75,75>"]
    tube_4 = ["<RUN,100,70,70,70>"]
    tube_5 = ["<RUN,100,64,64,64>"]
    tube_6 = ["<RUN,100,61,61,61>"]
    tube_7 = ["<RUN,100,58,58,58>"]
    tube_8 = ["<RUN,100,56,56,56>"]
    tube_9 = ["<RUN,100,54,54,54>"]
    tube_10 = ["<RUN,100,52,52,52>"]
    tube_11 = ["<RUN,100,50,50,50>"]
    tube_12 = ["<RUN,100,48,48,48>"]
    tube_13 = ["<RUN,100,47,47,47>"]
    tube_14 = ["<RUN,100,46,46,46>"]
    tube_15 = ["<RUN,100,45,45,45>"]
    tube_16 = ["<RUN,100,44,44,44>"]
    tube_17 = ["<RUN,100,43,43,43>"]
    tube_18 = ["<RUN,100,42,42,42>"]
    tube_19 = ["<RUN,100,41,41,41>"]
    tube_20 = ["<RUN,100,40,40,40>"]
    tube_21 = ["<RUN,100,39,39,39>"]
    tube_22 = ["<RUN,100,39,39,39>"]

    port = populate_ports()
    print("\n[setup] Connecting to port: {}".format(port))
    s = connect(port)

    time.sleep(5) # wait for the arduino to initialize
    print(listen(s))

    print("\n[setup] Sending setup commands..")
    talk(s, setup_cmds)

    time.sleep(1)

    print("\n[action] Sending run commands..")
    talk(s, run_cmds)

    #longer so that we can initialize flow
    time.sleep(20)

    print("\n[action] Sending run commands..")
    talk(s, tube_1)
    time.sleep(12)

    print("\n[action] Sending run commands..")
    talk(s, tube_2)
    time.sleep(24)

    print("\n[action] Sending run commands..")
    talk(s, tube_3)
    time.sleep(36)

    print("\n[action] Sending run commands..")
    talk(s, tube_4)
    time.sleep(48)

    print("\n[action] Sending run commands..")
    talk(s, tube_5)
    time.sleep(60)

    print("\n[action] Sending run commands..")
    talk(s, tube_6)
    time.sleep(72)

    print("\n[action] Sending run commands..")
    talk(s, tube_7)
    time.sleep(84)

    print("\n[action] Sending run commands..")
    talk(s, tube_8)
    time.sleep(96)

    print("\n[action] Sending run commands..")
    talk(s, tube_9)
    time.sleep(108)

    print("\n[action] Sending run commands..")
    talk(s, tube_10)
    time.sleep(120)

    print("\n[action] Sending run commands..")
    talk(s, tube_11)
    time.sleep(132)

    print("\n[action] Sending run commands")
    talk(s, tube_12)
    time.sleep(144)

    print("\n[action] Sending run commands")
    talk(s, tube_13)
    time.sleep(156)

    print("\n[action] Sending run commands")
    talk(s, tube_14)
    time.sleep(168)

    print("\n[action] Sending run commands")
    talk(s, tube_15)
    time.sleep(180)

    print("\n[action] Sending run commands")
    talk(s, tube_16)
    time.sleep(192)

    print("\n[action] Sending run commands")
    talk(s, tube_17)
    time.sleep(204)

    print("\n[action] Sending run commands")
    talk(s, tube_18)
    time.sleep(216)

    print("\n[action] Sending run commands")
    talk(s, tube_19)
    time.sleep(228)

    print("\n[action] Sending run commands")
    talk(s, tube_20)
    time.sleep(240)

    print("\n[action] Sending run commands")
    talk(s, tube_21)
    time.sleep(20)

    print("\n[action] Sending run commands")
    talk(s, tube_22)
    time.sleep(200)

    print("\n[action] Sending stop commands..")
    talk(s, stop_cmds)

    print("\n[action] Closing port..")
    s.close()

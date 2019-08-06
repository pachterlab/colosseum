#!/usr/bin/env python
# -*- coding: utf-8 -*-
import serial
import sys
import glob
import time

startMarker = 60 # <
endMarker = 62   # >
midMarker = 44   # ,

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
	numLoops = len(commands)
	waitingForReply = False
	n = 0

	while n < numLoops:
		teststr = commands[n]

		if waitingForReply == False:
			write_to_Arduino(s, teststr)
			print("Sent from PC -- " + teststr)
			waitingForReply = True

		if waitingForReply == True:

			while s.inWaiting() == 0:
				pass

			dataRecvd = listen(s)
			print("Reply Received -- " + dataRecvd)
			n += 1
			waitingForReply = False


		time.sleep(0.1)
	print("Send and receive complete\n\n")



if __name__ == "__main__":
	test_strings = [
	"<this should not work>",
	"<SET_ACCEL,111,5000.0,5000.0,5000.0>",
	"<SET_SPEED,111,1000.0,1000.0,1000.0>",
	"<RUN,111,200,200,200>"
	]

	port = populate_ports()
	print("Connecting to port: ", port)
	s = connect(port)

	time.sleep(5) # wait for the arduino to initialize

	print(listen(s))

	talk(s, test_strings)
	s.close()


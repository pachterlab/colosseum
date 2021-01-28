# colosseum: open source fraction collector

<p>A modular, highly customizable, open source fraction collector.</p>

<p align="center">
  <img src="HARDWARE/colosseum_homeview.png">
</p>

## Tl;dr
We present colosseum, a low-cost, modular, and automated fluid sampling device for scalable microfluidic applications. The colosseum fraction collector can be built for less than $100 using off-the-shelf components, and can be assembled in less than an hour. It uses 3D printed parts and common components that can be easily purchased from many retailers. The device can be run from a Windows, Mac, Linux, or Raspberry Pi computer with an easy-to-use GUI.

<p align="center">
  <img src="HARDWARE/colosseum_movie.gif">
</p>

## Table of Contents
1. [What's included?](#whats-included)
2. [Getting Started](#getting-started)
3. [Setting up the hardware](#setting-up-the-hardware)
6. [Installing software](#installing-software)
7. [Startup checklist](#startup-checklist)
8. [Tips/Hints](#tipshints)


## What's included?
<ul>
  <li>Computer Aided Design (CAD) files of the 3D printed components.</li>
  <li>Controller software (Python) and a graphical user interface (GUI) to control the motor.</li>
  <li>Arduino firmware to send commands to the motors and receive commands from the GUI.</li>
  <li>Bill of materials for sourcing and purchasing materials.</li>
  <li>Detailed assembly instructions of hardware components.</li>
  <li>Single click executable files for Mac, Windows, Linux, and Raspberry Pi systems.</li>
</ul>

## Getting Started
__What do I need to buy?__
The bill of materials with prices and vendor links is available on a [Google Spreadsheet](https://docs.google.com/spreadsheets/d/1Z83jh0TSUGW6AqqXLzAsNthaGQMtfY0oZQ2VZEOLgi0/edit?usp=sharing).

__What do I need to make?__
The 3D printed components can be fabricated on any desktop fused filament fabrication (FFF) 3D printer. They were designed using Autodesk Fusion 360, a proprietary CAD software that offers free academic licenses. STL, STEP, IGES, Fusion 360 archive files, and bill of materials are available in the HARDWARE/ folder. They can be used with any slicing software to generate GCode for 3D printing. Here is a [Fusion 360 view](https://a360.co/36j9CPz) of colosseum:

## Setting up the hardware
We have four 3D printed parts for colosseum, which are:
<ul>
  <li> tube rack
  <li> base
  <li> base plate (support needed)
  <li> dispenser arm (support needed)
</ul>

The print parameter for these parts are as follows:
<ul>
  <li> 1.75 mm diameter PLA filament
  <li> nozzle temperature: 215°C
  <li> bed temperature of 60°C
  <li> 10% infill
  <li> 0.2 mm layer height for slicing
</ul>

### Building colosseum
[This video](https://youtu.be/yG7ECh5GO0o) will guide you through the building process of colosseum.

Here are the steps for building colosseum:
1. 3D print components.
2. Attach set screws to the tube bed.
3. Insert small ball bearings into base.
4. Attach rubber feet on base.
5. Insert rotary shaft into base and fix in place with ball bearing.
6. Screw the stepper motor onto the base (with washers on the hex screws) and attach motor couplings.
7. Screw base plate onto base.
8. Insert ball bearings into the slots on base plate.
9. Insert another rotary shaft into arm and fix with set screw.
10. Insert torsion spring into base plate and arm.
11. Slide the tube bed through the center rotary shaft and align with arm.
12. Tighten all set screws and run!

### Setting up the Arduino
We use the Arduino CNC shield to allow for up to three fraction collectors to be controlled from a computer.

The software is configured to run the stepper motors with 200 steps per revolution at 1/4 microstepping, which translates to 800 steps per rotation. To configure this, it is necessary to add a jumper between the M1 pin of the Arduino CNC shield. More information about microstepping can be found in the product page for the DRV8825 Stepper Motor Driver, which is used by the [CNC shield](http://www.zyltech.com/arduino-cnc-shield-instructions/).

The Arduino should be flashed with the motor_serial_com.ino sketch, available in the firmware/ folder.

Make sure to download and install the [AccelStepper library](https://www.airspayce.com/mikem/arduino/AccelStepper/). To install, unzip the zip file to the libraries sub-folder of your sketchbook.

The fraction collector is driven by an Arduino board that interprets commands sent via USB and sends the signals to control the stepper motor movement. For directions on how to flash an arduino please refer to the official guide: https://www.arduino.cc/en/Guide/HomePage

We recommend that you wrap wires in [cable wraps](https://www.amazon.com/dp/B07FW3GTXB/ref=cm_sw_r_tw_dp_fq83Fb2VRK9QQ?_x_encoding=UTF8&psc=1) and placing your Arduino+CNC shield in a case like [this](https://www.thingiverse.com/thing:3125495).

## Installing software
The graphical user interface (GUI) is located in the `SOFTWARE/` folder. This GUI is used to interface with a Python script that controls the Arduino via USB.

<p align="center">
  <img src="SOFTWARE/ui_screenshot.PNG">
</p>

The GUI is provided as a standalone Python package, installable with `pip`. To
install the latest official release, open up the terminal and type:
```
pip install colosseum-ui
```
The Colosseum GUI is now installed and can be started by typing `colosseum` in the termnal. Before you run the system, MAKE SURE YOU HAVE INSTALLED THE ARDUINO FIRMWARE!!

### Manual installation
You may also install the GUI manually by opening up the terminal inside the `SOFTWARE/` folder and typing:
```
pip install .
```

If you get the following error when trying to run `colosseum` on Linux,
```
qt.qpa.plugin: Could not load the Qt platform plugin "xcb" in "" even though it was found.
```
you need to install the appropriate `xcb` library for your Linux distribution.
For Ubuntu users, `xcb` can be installed with the following command:
```
sudo apt install libxcb-xinerama0
```

## Startup Checklist
Before starting the Python controller, make sure
<ul>
  <li> The Arduino has the firmware uploaded to it
  <li> The Arduino is connected via USB to the computer
  <li> You have appropriately placed jumpers on the CNC Shield to allow for microstepping and hardware enabling (discussed in build video).
  <li> The CNC shield is powered, and that all motors are plugged in to the CNC shield
  <li> The dispenser arm is above the center of the first tube.
</ul>

## Tips/Hints
Things that we have learned along the way that may help with your build.
<ul>
  <li> The first tube can be used as a drip tube to catch any drips before you actually start collecting fractions. It will be numbered 0 on the GUI.
  <li> If you hear a scratching noise while you rotate the tube rack, it means that the torsion spring on the arm is scratching the bottom of the tube rack so fold that end of the spring.
  <li> If the dispenser arm does not rotate with the tube rack, it means that the follower on the arm is not correctly touching the grooves of the tube rack.
  <li> Make sure to pull the motor away from the rotary shaft as much as possible so that the pulley belt is taut.
</ul>

## If you want to contribute to colosseum, feel free to write on the Discussions page on this repo!

import os
import logging
import sys
import time

from PyQt5 import QtCore, QtWidgets, uic
from PyQt5.QtCore import QEvent
from PyQt5.QtWidgets import QErrorMessage, QMainWindow, QMessageBox

from constants import SETTINGS_LINK, SETTING_TO_UNITS_MAPPING, frunit_to_uL_hr, timeunit_to_hr, volunit_to_uL, fracsize_to_uL
from utils import is_float, make_row_dict, read_angles, make_commands
from unit_conversion import vol_from_time, time_from_vol, get_numfrac, get_fracsize
from serial_comm import populate_ports, connect, talk, listen

logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
logger = logging.getLogger(__name__)

def set_units_of_combo(setting_combo, unit_combo):
    chosen = setting_combo.currentText()
    unit_combo.clear()
    units = SETTING_TO_UNITS_MAPPING[chosen]
    logger.info('{} selected, setting units to {}'.format(chosen, units))
    if units:
        unit_combo.setEnabled(True)
        unit_combo.addItems(units)
    else:
        unit_combo.setEnabled(False)

def set_child_combo(parent_combo, child_combo):
    chosen = parent_combo.currentText()
    index = child_combo.findText(SETTINGS_LINK[chosen])
    logger.info('{} selected, setting child combo index {}'.format(chosen, index))
    child_combo.setCurrentIndex(index)

ui_file = 'fractioncollector.ui'

class MainWindow(QtWidgets.QMainWindow):
    def __init__(self):
        super(MainWindow, self).__init__()
        uic.loadUi(ui_file, self)

        self.setup_hooks()
        self.setup_params_table()
        self.setup_buttons()
        self.setup_error_popup()
        self.show()
        populate_ports()

    def setup_error_popup(self):
        self.error_popup = QMessageBox(self)
        self.error_popup.setIcon(QMessageBox.Critical)
        self.error_popup.setWindowModality(QtCore.Qt.WindowModal)

    def show_error_popup(self, message, title='Error'):
        logger.error(message)
        self.error_popup.setWindowTitle(title)
        self.error_popup.setText(message)
        self.error_popup.exec_()


    def setup_hooks(self):
        """
        Function to set up hooks from the .ui file into this class.
        """
        self.setting1_combo = self.findChild(QtWidgets.QComboBox, 'setting1_combo')
        self.unit1_combo = self.findChild(QtWidgets.QComboBox, 'unit1_combo')
        self.setting2_combo = self.findChild(QtWidgets.QComboBox, 'setting2_combo')
        self.unit2_combo = self.findChild(QtWidgets.QComboBox, 'unit2_combo')
        self.setting3_combo = self.findChild(QtWidgets.QComboBox, 'setting3_combo')
        self.unit3_combo = self.findChild(QtWidgets.QComboBox, 'unit3_combo')
        self.setting4_combo = self.findChild(QtWidgets.QComboBox, 'setting4_combo')
        self.unit4_combo = self.findChild(QtWidgets.QComboBox, 'unit4_combo')
        self.run_button = self.findChild(QtWidgets.QPushButton, 'runButton')
        self.flowrate_line = self.findChild(QtWidgets.QLineEdit, 'flowrate_line')
        self.flowunit_combo = self.findChild(QtWidgets.QComboBox, 'flowunit_combo')
        self.value1_line = self.findChild(QtWidgets.QLineEdit, 'value1_line')
        self.value2_line = self.findChild(QtWidgets.QLineEdit, 'value2_line')
        self.value3_line = self.findChild(QtWidgets.QLineEdit, 'value3_line')
        self.value4_line = self.findChild(QtWidgets.QLineEdit, 'value4_line')

    def setup_params_table(self):
        self.rows = {
            1: make_row_dict(self.setting1_combo, self.value1_line, self.unit1_combo),
            2: make_row_dict(self.setting2_combo, self.value2_line, self.unit2_combo),
            3: make_row_dict(self.setting3_combo, self.value3_line, self.unit3_combo),
            4: make_row_dict(self.setting4_combo, self.value4_line, self.unit4_combo),
        }

        # Setup inter-row listeners.
        self.setup_linked_combo_listener(self.setting1_combo, self.setting3_combo)
        self.setup_linked_combo_listener(self.setting2_combo, self.setting4_combo)

        # Setting up automatic unit switching based on which setting is chosen.
        for row in list(self.rows.values()):
            self.setup_setting_to_units_listener(row['setting'], row['unit'])

        self.flowrate_line.textChanged.connect(self.update_row3)
        self.flowrate_line.textChanged.connect(self.update_row4)
        self.flowunit_combo.currentIndexChanged.connect(self.update_row3)
        self.flowunit_combo.currentIndexChanged.connect(self.update_row4)
        self.value1_line.textChanged.connect(self.update_row3)
        self.unit1_combo.currentIndexChanged.connect(self.update_row3)
        self.value1_line.textChanged.connect(self.update_row4)
        self.unit1_combo.currentIndexChanged.connect(self.update_row4)
        self.value2_line.textChanged.connect(self.update_row4)
        self.unit2_combo.currentIndexChanged.connect(self.update_row4)
        self.unit3_combo.currentIndexChanged.connect(self.update_row3)
        self.unit4_combo.currentIndexChanged.connect(self.update_row3)
        self.unit3_combo.currentIndexChanged.connect(self.update_row4)
        self.unit4_combo.currentIndexChanged.connect(self.update_row4)

    def update_row3(self, *args, **kwargs):
        logger.info('updating row 3')
        flowrate = self.get_flowrate_text()
        row1 = self.get_row_contents_text(self.rows[1])
        #row2 = self.get_row_contents_text(self.rows[2])

        # Check if flowrate and row1 values are valid.
        if not (is_float(flowrate['value']) and is_float(row1['value'])):
            self.rows[3]['value'].setText('')
            return

        # Otherwise, calculate value from flowrate and row1 values
        row3 = self.get_row_contents_text(self.rows[3])
        # Need to check what row 1 value is
        if row1['setting'] == 'Total time':
            row3value = vol_from_time(flowrate, row1, row3)
        else:
            row3value = time_from_vol(flowrate, row1, row3)

        self.rows[3]['value'].setText(str(row3value))

    def update_row4(self, *args, **kwargs):
        logger.info('updating row 4')
        flowrate = self.get_flowrate_text()
        row1 = self.get_row_contents_text(self.rows[1])
        row2 = self.get_row_contents_text(self.rows[2])
        row3 = self.get_row_contents_text(self.rows[3])

        # Check if flowrate and row1 values are valid.
        if not (is_float(flowrate['value']) and is_float(row2['value'])):
            self.rows[4]['value'].setText('')
            return

        # Otherwise, calculate value from flowrate and row1 values
        # self.rows[4]['value'].setText(str(row2['value']))

        # Need to check what row 2 value is
        if row2['setting'] == 'Volume per fraction':
            if row1['setting'] == 'Total volume':
                row4value = get_numfrac(flowrate, row2, row1)
            else: #row3 is volume
                row4value = get_numfrac(flowrate, row2, row3)
        else:
            fsunit = self.unit4_combo.currentText()
            if row1['setting'] == 'Total volume':#row1 is volume
                row4value = get_fracsize(flowrate, row2, row1, fsunit)
            else:
                row4value = get_fracsize(flowrate, row2, row3, fsunit)

        self.rows[4]['value'].setText(str(row4value))

    def get_flowrate_text(self):
        return {
            'value': self.flowrate_line.text(),
            'unit': self.flowunit_combo.currentText(),
        }

    def get_row_contents_text(self, row_dict):
        return {
            'setting': row_dict['setting'].currentText(),
            'value': row_dict['value'].text(),
            'unit': row_dict['unit'].currentText(),
        }

    def setup_linked_combo_listener(self, parent_combo, child_combo):
        parent_combo.currentIndexChanged.connect(lambda x: set_child_combo(parent_combo, child_combo))
        set_child_combo(parent_combo, child_combo)

    def setup_setting_to_units_listener(self, setting_combo, unit_combo):
        setting_combo.currentIndexChanged.connect(lambda x: set_units_of_combo(setting_combo, unit_combo))
        set_units_of_combo(setting_combo, unit_combo)

    def setup_buttons(self):
        self.run_button.clicked.connect(self.run_pressed)

    def calculate_collection_time(self):
        fr_dict = self.get_flowrate_text()
        frvalue = float(fr_dict['value'])
        frunit = fr_dict['unit']

        # Convert flow rate to common units.
        frvalue *= frunit_to_uL_hr[frunit]
        # Find volume per fraction value and unit
        for row in self.rows.values():
            if row['setting'].currentText() == 'Volume per fraction':
                value = float(row['value'].text())
                unit = row['unit'].currentText()

                # Convert volume per fraction to common units.
                value *= fracsize_to_uL[unit]
                # calculate collection time & return that.
                return value/frvalue*3600

        # If we get here, something went horribly wrong.
        raise Exception('Failed to find "Volume per fraction" setting.')

    def run_pressed(self):
        logging.info('run button pressed')
        input1 = self.value1_line.text()
        input2 = self.value2_line.text()
        input3 = self.flowrate_line.text()

        setting1 = self.setting1_combo.currentText()
        setting2 = self.setting2_combo.currentText()

        invalid = []
        if not is_float(input1):
            invalid.append('"{}" needs to be a number'.format(setting1))
        if not is_float(input2):
            invalid.append('"{}" needs to be a number'.format(setting2))
        if not is_float(input3):
            invalid.append('"Flowrate" needs to be a number')

        if invalid:
            error_messsage = '\n'.join(invalid)
            self.show_error_popup(error_messsage, title='Input error')
            return

        stoptime = self.calculate_collection_time()

        angles = read_angles(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'HARDWARE', 'angles.txt')
        )
        commands = make_commands(angles)
        setup_cmds = [
        "<SET_ACCEL,111,1000.0,1000.0,1000.0>",
        "<SET_SPEED,111,1000.0,1000.0,1000.0>",
        ]
        port = populate_ports()
        print("\n[setup] Connecting to port: {}".format(port))
        s = connect(port)
        time.sleep(5) #wait for the arduino to initialize
        print(listen(s))
        print("\n[setup] Sending setup commands..")
        talk(s, setup_cmds)
        time.sleep(1)
        print("\n[action] Sending run commands..")
        print(stoptime)
        #print(commands)

        numfrac = 0
        for row in self.rows.values():
            #print(row)
            #print(row['setting'].currentText())
            if row['setting'].currentText() == 'Number of fractions':
                numfrac = int(float((row['value'].text())))
                break

        for command in commands[:(numfrac-1)]:
            time.sleep(stoptime)
            print(command)
            talk(s, [command])
        talk(s, ["<RUN,111,84,84,84>"])

    def pause_resume_pressed(self):
        pass

    def stop_pressed(self):
        print("\n[action] Sending stop commands..")
        stop_cmd = "<STOP,111,0.0,0.0,0.0>"
        talk(s, [stop_cmd])
        print("\n[action] Closing port..")
        s.close()

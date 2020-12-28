import logging
import os
import sys
import time
import threading
from functools import partial

from PyQt5 import QtCore, QtWidgets, uic
from PyQt5.QtCore import pyqtSignal, QThread
from PyQt5.QtGui import QDoubleValidator, QIntValidator
from PyQt5.QtWidgets import (
    QDialog,
    QErrorMessage,
    QLabel,
    QListWidget,
    QMainWindow,
    QMessageBox,
)

from .colosseum import Colosseum
from .constants import (
    ANGLES,
    FRACSIZE_TO_UL,
    FRUNIT_TO_UL_HR,
    SETTINGS_LINK,
    SETTING_TO_UNITS_MAPPING,
    TEST_PORT,
    TIMEUNIT_TO_HR,
    UI_PATH,
    VOLUNIT_TO_UL,
)
from .utils import is_float, is_int, make_row_dict
from .unit_conversion import (
    get_fracsize,
    get_numfrac,
    time_from_vol,
    vol_from_time,
)
from .serial_comm import get_arduino_ports

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

class UiThread(QThread):
    success = pyqtSignal()
    error = pyqtSignal()

    def __init__(self, function, *args, **kwargs):
        super(QThread, self).__init__()

        self.function = function
        self.args = args
        self.kwargs = kwargs

    def run(self):
        try:
            self.function(*self.args, **self.kwargs)
            self.success.emit()
        except:
            self.error.emit()


class PortSelectionPopup(QDialog):
    def __init__(self, parent, ports, *args, **kwargs):
        super(PortSelectionPopup, self).__init__(*args, **kwargs)
        self.parent = parent
        self.ports = ports
        self.selected = False

        self.setWindowTitle('Select an Arduino to connect to')
        self.setModal(True)
        self.port_selection = QListWidget(self)
        self.port_selection.move(10, 10)
        for port in ports:
            self.port_selection.addItem(port.description)
        self.port_selection.adjustSize()
        description_to_port = {port.description: port.device for port in ports}

        # Double-click
        def port_selected(item):
            port = description_to_port[item.text()]
            self.accept()

            # Show connecting popup
            popup = QMessageBox(parent)
            popup.setWindowModality(QtCore.Qt.WindowModal)
            popup.setIcon(QMessageBox.Information)
            popup.setStandardButtons(QMessageBox.Abort)
            popup.setWindowTitle('Please wait')
            popup.setText(f'Connecting to Arduino at port:\n{port}')
            t = UiThread(parent.initialize, port)
            t.success.connect(partial(popup.done, 0))
            t.start()
            result = popup.exec_()
            if result == QMessageBox.Abort:
                if t.isRunning():
                    t.terminate()
                parent.show_error_popup('Connect canceled', exit=True)
        self.port_selection.itemDoubleClicked.connect(port_selected)
        self.rejected.connect(partial(
            parent.show_error_popup, 'No port selected', exit=True
        ))

class MainWindow(QtWidgets.QMainWindow):
    def __init__(self, testing=False):
        super(MainWindow, self).__init__()
        uic.loadUi(UI_PATH, self)

        self.testing = testing
        self.colosseum = None
        self.monitor_thread = None

        self.setup_hooks()
        self.setup_validators()
        self.setup_params_table()
        self.setup_buttons()
        self.show()

        # Display arduino selection popup
        self.show_port_selection_popup()

        self.volume_unit = 'mL'
        self.time_unit = 'sec'

    def show_port_selection_popup(self):
        # Note that these are port objects.
        ports = get_arduino_ports(dry_run=self.testing)

        # If there are no ports, display error message and exit.
        if not ports:
            self.show_error_popup('No Arduinos detected', exit=True)

        port_popup = PortSelectionPopup(self, ports)
        port_popup.exec_()

        return port_popup

    def initialize(self, port):
        self.colosseum = Colosseum(port, testing=self.testing)
        self.monitor_thread = threading.Thread(
            target=self.monitor, daemon=True
        )
        self.monitor_thread.start()

    def monitor(self):
        while True:
            self.tube_number.display(self.colosseum.position)
            if self.colosseum.start_time is not None and not self.colosseum.done:
                elapsed = time.time() - self.colosseum.start_time
                fr_dict = self.get_flowrate_text()
                flow_value = float(fr_dict['value']) * FRUNIT_TO_UL_HR[fr_dict['unit']] / 3600

                self.vol_dispensed_unit.setText(self.volume_unit)
                self.time_elapsed_unit.setText(self.time_unit)
                self.time_elapsed.display((elapsed * 3600) / TIMEUNIT_TO_HR[self.time_unit])
                self.vol_dispensed.display((elapsed * flow_value) / VOLUNIT_TO_UL[self.volume_unit])

            # Do some stuff if the run is finished.
            if self.colosseum.done:
                self.run_button.setEnabled(False)
                self.pause_button.setEnabled(False)
                self.resume_button.setEnabled(False)
                self.stop_button.setEnabled(False)
                return
            time.sleep(0.2)

    def show_message_popup(self, title, message, icon=QMessageBox.Information, buttons=QMessageBox.Ok):
        popup = QMessageBox(self)
        popup.setWindowModality(QtCore.Qt.WindowModal)
        popup.setIcon(icon)
        popup.setStandardButtons(buttons)
        popup.setWindowTitle(title)
        popup.setText(message)
        return popup.exec_()

    def show_error_popup(self, message, title='Error', exit=False):
        result = self.show_message_popup(title, message, icon=QMessageBox.Critical)
        if exit:
            sys.exit(1)
        return result

    def setup_hooks(self):
        """
        Function to set up hooks from the .ui file into this class.
        """
        # Tube count
        self.tube_count_label = self.findChild(QtWidgets.QLabel, 'tube_count_label')
        self.tube_count_line = self.findChild(QtWidgets.QLineEdit, 'tube_count_line')

        # Flowrate
        self.flowrate_label = self.findChild(QtWidgets.QLabel, 'flowrate_label')
        self.flowrate_line = self.findChild(QtWidgets.QLineEdit, 'flowrate_line')
        self.flowunit_combo = self.findChild(QtWidgets.QComboBox, 'flowunit_combo')
        self.tubeunit_combo = self.findChild(QtWidgets.QComboBox, 'tubeunit_combo')

        # Settings
        self.setting1_combo = self.findChild(QtWidgets.QComboBox, 'setting1_combo')
        self.unit1_combo = self.findChild(QtWidgets.QComboBox, 'unit1_combo')
        self.setting2_combo = self.findChild(QtWidgets.QComboBox, 'setting2_combo')
        self.unit2_combo = self.findChild(QtWidgets.QComboBox, 'unit2_combo')
        self.setting3_combo = self.findChild(QtWidgets.QComboBox, 'setting3_combo')
        self.unit3_combo = self.findChild(QtWidgets.QComboBox, 'unit3_combo')
        self.setting4_combo = self.findChild(QtWidgets.QComboBox, 'setting4_combo')
        self.unit4_combo = self.findChild(QtWidgets.QComboBox, 'unit4_combo')
        self.value1_line = self.findChild(QtWidgets.QLineEdit, 'value1_line')
        self.value2_line = self.findChild(QtWidgets.QLineEdit, 'value2_line')
        self.value3_line = self.findChild(QtWidgets.QLineEdit, 'value3_line')
        self.value4_line = self.findChild(QtWidgets.QLineEdit, 'value4_line')

        # Buttons
        self.run_button = self.findChild(QtWidgets.QPushButton, 'runButton')
        self.pause_button = self.findChild(QtWidgets.QPushButton, 'pauseButton')
        self.resume_button = self.findChild(QtWidgets.QPushButton, 'resumeButton')
        self.stop_button = self.findChild(QtWidgets.QPushButton, 'stopButton')

        # Status
        self.status_label = self.findChild(QtWidgets.QLabel, 'status_label')
        self.vol_dispensed = self.findChild(QtWidgets.QLCDNumber, 'voldispensed_disp')
        self.tube_number = self.findChild(QtWidgets.QLCDNumber, 'tubeIteration_disp')
        self.time_elapsed = self.findChild(QtWidgets.QLCDNumber, 'timeElapsed_disp')
        self.vol_dispensed_unit = self.findChild(QtWidgets.QLabel, 'voldispensed_unit')
        self.time_elapsed_unit = self.findChild(QtWidgets.QLabel, 'timeElapsed_unit')

    def setup_validators(self):
        int_validator = QIntValidator()
        int_validator.setBottom(0)
        double_validator = QDoubleValidator()
        double_validator.setBottom(0.)
        self.tube_count_line.setValidator(int_validator)
        self.flowrate_line.setValidator(double_validator)
        self.value1_line.setValidator(double_validator)
        self.value2_line.setValidator(double_validator)

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

        # Disable setting dropdown if there is a value present
        def disable(target, text, *args, **kwargs):
            if text:
                target.setEnabled(False)
            else:
                target.setEnabled(True)
        self.value1_line.textChanged.connect(partial(disable, self.setting1_combo))
        self.value2_line.textChanged.connect(partial(disable, self.setting2_combo))

    def disable_inputs(self):
        inputs = [
            self.tube_count_line,
            self.flowrate_line,
            self.flowunit_combo,
            self.tubeunit_combo,
            self.setting1_combo,
            self.unit1_combo,
            self.setting2_combo,
            self.unit2_combo,
            self.unit3_combo,
            self.unit4_combo,
            self.value1_line,
            self.value2_line,
        ]

        for input in inputs:
            input.setEnabled(False)

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
        if not (is_float(flowrate['value']) and is_float(row1['value']) and is_float(row2['value'])):
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
        self.pause_button.clicked.connect(self.pause_pressed)
        self.resume_button.clicked.connect(self.resume_pressed)
        self.stop_button.clicked.connect(self.stop_pressed)

        self.pause_button.setEnabled(False)
        self.resume_button.setEnabled(False)
        self.stop_button.setEnabled(False)

    def run_pressed(self):
        logging.info('run button pressed')
        tube_count = self.tube_count_line.text()
        input1 = self.value1_line.text()
        input2 = self.value2_line.text()
        input3 = self.flowrate_line.text()

        # Check for any invalid inputs
        invalid = []
        if not is_int(tube_count):
            invalid.append(f'"{self.tube_count_label.text()}" needs to be a number')
        if not is_float(input3):
            invalid.append(f'"{self.flowrate_label.text()}" needs to be a number')
        if not is_float(input1):
            invalid.append(f'"{self.setting1_combo.currentText()}" needs to be a number')
        if not is_float(input2):
            invalid.append(f'"{self.setting2_combo.currentText()}" needs to be a number')

        if invalid:
            error_messsage = '\n'.join(invalid)
            self.show_error_popup(error_messsage, title='Input error')
            return

        fr_dict = self.get_flowrate_text()
        frvalue = float(fr_dict['value'])
        frunit = fr_dict['unit']

        n_fractions = None
        for row in self.rows.values():
            # Find volume per fraction value and unit
            if row['setting'].currentText() == 'Volume per fraction':
                value = float(row['value'].text())
                unit = row['unit'].currentText()
            # Find volume per fraction value and unit
            elif row['setting'].currentText() == 'Number of fractions':
                n_fractions = float((row['value'].text()))
            # Find volume unit
            elif row['setting'].currentText() == 'Total volume':
                self.volume_unit = row['unit'].currentText()
            elif row['setting'].currentText() == 'Total time':
                self.time_unit = row['unit'].currentText()

        if n_fractions != int(n_fractions):
            result = self.show_message_popup(
                'Warning',
                (
                    f'Number of fractions ({n_fractions}) is not an integer. '
                    f'The floor ({int(n_fractions)}) will be taken. '
                ),
                icon=QMessageBox.Warning,
                buttons=QMessageBox.Ok | QMessageBox.Cancel
            )
            if result != QMessageBox.Cancel:
                return
        n_fractions = int(n_fractions)
        if n_fractions > len(ANGLES) or n_fractions < 1:
            self.show_error_popup(
                f'Number of fractions ({n_fractions}) is not within the allowed range [1, {len(ANGLES)}].',
                title='Input error'
            )
            return

        tube_size_text = self.tubeunit_combo.currentText()
        tube_size = tube_size_text[:-2]
        tube_unit = tube_size_text[-2:]
        if value * VOLUNIT_TO_UL[unit] > float(tube_size) * VOLUNIT_TO_UL[tube_unit]:
            self.show_error_popup(
                f'Volume per fraction exceeds tube size',
                title='Input error'
            )
            return

        # Check number of tubes and display warning if tube count < num fractions
        n_tubes = int(tube_count)
        if n_tubes < n_fractions:
            result = self.show_message_popup(
                'Warning',
                (
                    f'Number of fractions ({n_fractions}) is greater than '
                    f'number of tubes ({n_tubes}). Continuing may cause fractions to '
                    f'be dispensed into the collector and damage the internals. '
                    'Continue?'
                ),
                icon=QMessageBox.Warning,
                buttons=QMessageBox.Yes | QMessageBox.No
            )
            if result != QMessageBox.Yes:
                return

        self.disable_inputs()
        t = threading.Thread(
            target=self.colosseum.run,
            args=(value, unit, frvalue, frunit, n_fractions),
            daemon=True, # terminate thread if UI is terminated
        )
        t.start()
        self.run_button.setEnabled(False)
        self.pause_button.setEnabled(True)
        self.stop_button.setEnabled(True)
        self.status_label.setText('Running')

    def pause_pressed(self):
        self.colosseum.pause()
        self.resume_button.setEnabled(True)
        self.pause_button.setEnabled(False)
        self.stop_button.setEnabled(True)
        self.status_label.setText('Paused')

    def resume_pressed(self):
        t = threading.Thread(
            target=self.colosseum.resume,
            daemon=True, # terminate thread if UI is terminated
        )
        t.start()
        self.pause_button.setEnabled(True)
        self.stop_button.setEnabled(True)
        self.resume_button.setEnabled(False)
        self.status_label.setText('Running')

    def stop_pressed(self):
        self.colosseum.stop()
        self.stop_button.setEnabled(False)
        self.pause_button.setEnabled(False)
        self.resume_button.setEnabled(False)
        self.status_label.setText('Stopped')

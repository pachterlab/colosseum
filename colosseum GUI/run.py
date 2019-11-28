import sys

from PyQt5.QtWidgets import QApplication

from ui import MainWindow

app = QApplication(sys.argv)
main_window = MainWindow()
sys.exit(app.exec_())

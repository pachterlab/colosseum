import argparse
import sys

from PyQt5.QtWidgets import QApplication

from .ui import MainWindow

def run():
    parser = argparse.ArgumentParser()
    parser.add_argument('--testing', action='store_true')
    args = parser.parse_args()

    app = QApplication(sys.argv)
    main_window = MainWindow(testing=args.testing)
    sys.exit(app.exec_())

if __name__ == "__main__":
    run()

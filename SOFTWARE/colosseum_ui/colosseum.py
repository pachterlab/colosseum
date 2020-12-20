import logging
import time

from .constants import (
    COMMANDS,
    FRACSIZE_TO_UL,
    FRUNIT_TO_UL_HR,
    SETUP_CMDS,
    STOP_CMD,
)
from .serial_comm import (
    populate_ports,
    connect,
    listen,
    talk,
)

logger = logging.getLogger(__name__)

class Colosseum:
    def __init__(self, port, testing=False):
        logger.info(f'[setup] initializing Arduino connection at port {port}')
        self.testing = testing
        self.port = port
        self.running = False
        self.done = False
        self.position = 0
        self.initialize()

        # We need to cache these values to be able to resume
        self.run_cache = None

        self.start_time = None

    def initialize(self):
        logger.debug(f'[setup] Connecting to port: {self.port}')
        self.serial = connect(self.port, dry_run=self.testing)
        if not self.testing:
            time.sleep(5) # wait for arduino init
        logger.debug(f'[setup] response was {listen(self.serial, dry_run=self.testing)}')

        # Send setup commands.
        logger.debug(f'[setup] sending setup commands')
        talk(self.serial, SETUP_CMDS, dry_run=self.testing)
        time.sleep(1)

    @classmethod
    def calculate_collection_time(
        cls, size_value, size_unit, flow_value, flow_unit
    ):
        flow_value *= FRUNIT_TO_UL_HR[flow_unit]
        size_value *= FRACSIZE_TO_UL[size_unit]
        stoptime = size_value/flow_value*3600
        return stoptime

    def run(
        self, size_value, size_unit, flow_value, flow_unit, n_fractions
    ):
        if self.done:
            raise Exception('run already completed')
        self.run_cache = locals().copy()
        del self.run_cache['self']
        self.running = True
        stop_time = self.calculate_collection_time(
            size_value,
            size_unit,
            flow_value,
            flow_unit,
        )
        if self.start_time is None:
            self.start_time = time.time()
        # Note: we assume the run starts at the 0th tube
        for i in range(self.position, n_fractions+1):
            command = COMMANDS[i]
            # TODO: add priming time instead of stoptime
            time.sleep(stop_time)
            logger.debug(f'[run] sending command {command}')
            talk(self.serial, [command], dry_run=self.testing)
            self.position = i + 1

            if not self.running:
                logger.info(f'[run] pausing')
                return

        logger.info('[run] done')
        self.stop()

    def pause(self):
        logger.info(f'[pause] pausing run at position {self.position}')
        self.running = False

    def resume(self):
        if self.run_cache is None:
            raise Exception('run was never started')
        logger.info(f'[resume] resuming run at position {self.position}')
        self.run(**self.run_cache)

    def stop(self):
        logger.debug('[stop] stopping')
        self.running = False
        self.done = True
        logger.debug('[stop] sending stop command')
        talk(self.serial, [STOP_CMD], dry_run=self.testing)
        logger.debug(f'[stop] closing serial port {self.port}')
        self.serial.close()

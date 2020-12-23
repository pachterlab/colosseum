#include <AccelStepper.h>
// <RUN,110,1.1,2.4,0.0> test script
// First we create the constants that we will use throughout our code
#define MOTOR_STEPS 200
#define MICROSTEPS 32
#define TOTAL_STEPS 6400

#define X_SPEED 1000 // X steps per second
#define Y_SPEED 1000 // Y
#define Z_SPEED 1000 // Z
float speeds[3] = {X_SPEED, Y_SPEED, Z_SPEED};

#define X_ACCEL 5000.0 // X steps per second per second
#define Y_ACCEL 5000.0 // Y
#define Z_ACCEL 5000.0 // Z
float accels[3] = {X_ACCEL, Y_ACCEL, Z_ACCEL};


#define EN        8       // stepper motor enable, low level effective (note put jumper so automatic)

#define X_DIR     5       // X axis, direction pin
#define Y_DIR     6       // Y
#define Z_DIR     7       // Z

int dir_pins[3] = {X_DIR, Y_DIR, Z_DIR};

#define X_STP     2       // X axis, step pin
#define Y_STP     3       // Y
#define Z_STP     4       // Z

int stp_pins[3] = {X_STP, Y_STP, Z_STP};

#define BAUD_RATE 2000000  // the rate at which data is read

// WRITE COMMAND: <RUN,123,0.0,0.0,0.0>
// <mode, motorID, arg_m1, arg_m2, arg_m3>

// Where mode is ["RUN", "STOP", "RESUME", "PAUSE", "SET_SPEED", "SET_ACCEL"]
// motorID is int [1, 1, 1] (can be combo if numbers ie 100 or 101 or 001 (binary indicator)
// arg_m1 is [any floating number]
// arg_m2 is [any floating number]
// aeg_m3 is [any floating number]


// AccelStepper is the class we use to run all of the motors in a parallel fashion
// Documentation can be found here: http://www.airspayce.com/mikem/arduino/AccelStepper/
AccelStepper stepper1(AccelStepper::DRIVER, X_STP, X_DIR);
AccelStepper stepper2(AccelStepper::DRIVER, Y_STP, Y_DIR);
AccelStepper stepper3(AccelStepper::DRIVER, Z_STP, Z_DIR);
AccelStepper steppers[3] = {stepper1, stepper2, stepper3};

// Now we declare variables we will use throughout our code (That could change!)
const int ledPin = 13;
// The buffer allows us to store bytes as they are read from the python program (64 bytes in size)
const byte buffSize = 64;
char inputBuffer[buffSize];
// We create inputs to this program by <...> where <> represent the startread and endread markers
const char startMarker = '<';
const char endMarker = '>';

byte bytesRecvd = 0;
boolean readInProgress = false;
boolean newDataFromPC = false;
boolean executeCommand = false;

char messageFromPC[buffSize] = {0};
char mode[buffSize] = {0};
int motors[3] = {0, 0, 0};

float value = 0.0;
char dir[buffSize] = {0};
float optional = 0.0;


float arg_m1 = 0.0;
float arg_m2 = 0.0;
float arg_m3 = 0.0;
float args[3] = {arg_m1, arg_m2, arg_m3};

float remainder[3] = {0.0, 0.0, 0.0};

unsigned long curMillis;


typedef void (* FreeFunction )(); // this is a pointer to a function

// Setting up dictionary for easy command execution
typedef struct {
  int mode_idx;
  char* mode;
  FreeFunction function; // now in our FunctionMap type, we can reference a function by its name
} FunctionMap;

int array_sum(int * array, int len) {
  int arraySum;

  arraySum = 0;
  for (int index = 0; index < len; index++)
  {
    arraySum += array[index];
  }
  return arraySum;
}

// All of the functions we would want to run
void _run() {
  for (int i = 0; i < 3; i += 1) {
    if (motors[i] == 1) {
      steppers[i].move(args[i]);
    }
  }

  int stepperStatus[3] = {0, 0, 0};

  // Enable the steppers when in motion
  digitalWrite(EN, LOW);
  while (array_sum(stepperStatus, 3) != array_sum(motors, 3)) {
    // We iterate over the 3 possible steppers
    for (int i = 0; i < 3; i += 1) {
      // If this stepper is selected
      if (motors[i] == 1) {
        // Ask the stepper to move to position at constant speed.
        if (stepperStatus[i] == 0 ) {
          steppers[i].run();
        }
        // Check if it reached it's position
        if (steppers[i].distanceToGo() == 0) {
          // If yes then store that value in the stepperStatus array.
          stepperStatus[i] = 1;
        }
      }
    }
    getDataFromPC();
    if (newDataFromPC) {
      replyToPC(); 
      break;
    }
  }
  // Disable the steppers when not in motion
  digitalWrite(EN, HIGH);
}

void _stop() {
  for (int i = 0; i < 3; i += 1) {
    steppers[i].stop();
  }
}

void _pause() {
  for (int i = 0; i < 3; i += 1) {
    remainder[i] = steppers[i].distanceToGo();
  }

  _stop();
}

void _resume() {
  for (int i = 0; i < 3; i += 1) {
    args[i] = remainder[i];
  }
  _run();
}


void _set_speed() {
  for (int i = 0; i < 3; i += 1) {
    if (motors[i] == 1) {
      steppers[i].setCurrentPosition(0.0);
      steppers[i].setMaxSpeed(args[i]);
      steppers[i].setSpeed(args[i]);
    }
  }
}

void _set_accel() {
  for (int i = 0; i < 3; i += 1) {
    if (motors[i] == 1) {
      steppers[i].setAcceleration(args[i]);
    }
  }
}

const int function_count = 6;
const FunctionMap functions[function_count] {
  {0, "RUN", _run},
  {1, "STOP", _stop},
  {2, "RESUME", _resume},
  {3, "PAUSE", _pause},
  {4, "SET_SPEED", _set_speed},
  {5, "SET_ACCEL", _set_accel}
};


void setup() {
  Serial.begin(BAUD_RATE);

  pinMode(EN, OUTPUT);
  digitalWrite(EN, HIGH);

  // flash LEDs so we know we are alive
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, HIGH);
  delay(500); // delay() is OK in setup as it only happens once
  digitalWrite(ledPin, LOW);
  delay(500);

  // We will initialize all motors once.
  for (int i = 0; i < 3; i += 1) {
    steppers[i].setMaxSpeed(speeds[i]);
    steppers[i].setSpeed(speeds[i]);
    steppers[i].setAcceleration(accels[i]);
    steppers[i].setCurrentPosition(0.0);

  }

  // tell the PC we are ready
  Serial.println("<Arduino is ready>");
}

void loop() {
  // put your main code here, to run repeatedly:
  curMillis = millis();

  getDataFromPC();
  replyToPC();

  execute();


}

//=============
// Here we get data from the serial port, read it one byte at a time, store each subsequent byte in the buffer (list)
// then read it and declare the values to variables in this code
void getDataFromPC() {

  // If there is data from the serial port
  if (Serial.available() > 0) {
    // turn on the LED to indicate we are receiving
    digitalWrite(ledPin, HIGH);
    // read the a single character
    char x = Serial.read();

    // the order of these IF clauses is significant
    if (x == endMarker) {
      readInProgress = false;
      newDataFromPC = true;
      // clear the buffer
      inputBuffer[bytesRecvd] = 0;
      // and parse the data
      return parseData();
    }

    if (readInProgress) {
      // add the character to the buffer
      inputBuffer[bytesRecvd] = x;
      bytesRecvd ++;
      if (bytesRecvd == buffSize) {
        bytesRecvd = buffSize - 1;
      }
    }

    if (x == startMarker) {
      bytesRecvd = 0;
      readInProgress = true;
    }
    digitalWrite(ledPin, LOW);
  }
}

// Here is where we take the string <...> that we have read from the serial port and parse it
void parseData() {

  // split the data into its parts
  // strtok scans the string inputBuffer until it reaches a "," or a ">"
  // Then we declare the variable associated with that part of the inputBuffer
  // each strtok contiues where the previous call left off

  char * strtokIndx; // this is used by strtok() as an index

  strtokIndx = strtok(inputBuffer, ",");     // get the first part - the mode string
  strcpy(mode, strtokIndx);                  // copy it to messageFromPC

  strtokIndx = strtok(NULL, ",");            // get the third part - the motor ID int
  String motorstr(strtokIndx);

  motors[0] = motorstr[0] - '0'; // This is a hack to turn a char '1' into a int 1
  motors[1] = motorstr[1] - '0';
  motors[2] = motorstr[2] - '0';

  strtokIndx = strtok(NULL, ",");
  arg_m1 = atof(strtokIndx);
  strtokIndx = strtok(NULL, ",");
  arg_m2 = atof(strtokIndx);
  strtokIndx = strtok(NULL, ",");
  arg_m3 = atof(strtokIndx);

  args[0] = arg_m1;
  args[1] = arg_m2;
  args[2] = arg_m3;

  newDataFromPC = true;
}

// Here is where we reply to the PC if we find that we have new data from the PC
// This is executed on everyloop if we detect that we have new data from the pc

void replyToPC() {
  if (newDataFromPC) {

    newDataFromPC = false;
    Serial.print("<");
    Serial.print(mode);
    Serial.print(",");
    Serial.print(String(motors[0])); Serial.print(String(motors[1])); Serial.print(String(motors[2]));
    Serial.print(",");
    Serial.print(args[0]);
    Serial.print(",");
    Serial.print(args[1]);
    Serial.print(",");
    Serial.print(args[2]);
    Serial.println(">");

    executeCommand = true;
  }
}

void execute() {
  if (executeCommand) {
    executeCommand = false;
    for (int i = 0; i < function_count; i++) {
      if (strcmp(mode, functions[i].mode) == 0) {
        return (functions[i].function)(); // this just executes one function but it needs to iterate over all of them
      }
    }
    return;
  }
}

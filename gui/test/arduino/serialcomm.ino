void setup()
{
    // put your setup code here, to run once:
    pinMode(13, OUTPUT);
    Serial.begin(115200);
}

void loop()
{
    // fill the buffer
    readData();

    // when data is available, write data to serial port
    parseData();
}

const byte buffSize = 64;
char inputBuffer[buffSize];

const char startMarker = '<';
const char endMarker = '>';

bool readInProgress = false;
bool dataAvailable = false;
int bytesReceived = 0;

void readData()
{

    if (Serial.available() > 0)
    {
        char x = Serial.read();
        if (x == endMarker)
        {
            readInProgress = false;
            dataAvailable = true;
            return;
        }
        if (readInProgress)
        {
            inputBuffer[bytesReceived] = x;
            bytesReceived++;
        }
        if (x == startMarker)
        {
            bytesReceived = 0;
            readInProgress = true;
        }
    }
}

void parseData()
{
    if (dataAvailable)
    {
        dataAvailable = false;
        for (int i = 0; i < bytesReceived; i++)
        {
            Serial.write(inputBuffer[i]);
        }
    }
}
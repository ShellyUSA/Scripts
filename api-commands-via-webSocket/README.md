# ws-examples

Examples of shelly APIs using Web Sockets 

## Description
Using the API via web sockets (WS) will allow the asynchronous JS coding and not having to use the script interface of the device.
This will allow a local server running node to execute the commands and never requiring internet connection. Also allow development and testing of new scripts if needed.

## Installation
npm or yarn install 
node .\switch.getstatus.js

## Usage
Status: 
Command: Switch.Getstatus
               A get request that will return a JSON with the following result according to the script:

Got switch status of: {
  id: 2,
  src: 'shellyplugus-083af2017af8',
  dst: 'wsclient',
  result: {
    id: 0,
    source: 'WS_in',
    output: false,
    apower: 0,
    voltage: 118.7,
    current: 0,
    aenergy: { total: 207.726, by_minute: [Array], minute_ts: 1665070147 },
    temperature: { tC: 36.3, tF: 97.4 }
  }
}

On/off:
               Command: Switch.set
A post request that will change the status of the relay. Although it returns a JSON with a previous status 
This command requires at least one parameter. In our example  'on': true to change the current state of the device. 

We can get the new status by running the GetStatus command again. According to the script the result is:

Turned switch on, `output` should be true now: {
  id: 4,
  src: 'shellyplugus-083af2017af8',
  dst: 'wsclient',
  result: {
    id: 0,
    source: 'WS_in',
    output: true,
    apower: 0,
    voltage: 118.7,
    current: 0,
    aenergy: { total: 207.726, by_minute: [Array], minute_ts: 1665070147 },
    temperature: { tC: 36.3, tF: 97.4 }
  }
}

               The same command with parameter 'on': false changes the state again and the result JSON will show after a GetStatus command 

                         output: false,

Toggle:
               Command: Switch.Toggle
               It has the same result as using the command Switch.set to invert the status. With this command, if the output was true, it becomes false. If it was false, it becomes true. No parameters are needed to set the output.
               This is usually used as a trigger for other scripts and webhooks.
               
Toggled switch, `output` should be the opposite of the one before: {
  id: 8,
  src: 'shellyplugus-083af2017af8',
  dst: 'wsclient',
  result: {
    id: 0,
    source: 'WS_in',
        output: true,
    apower: 6.9,
    voltage: 118.6,
    current: 0.097,
    aenergy: { total: 208.39, by_minute: [Array], minute_ts: 1665072023 },
    temperature: { tC: 33.5, tF: 92.3 }
  }
}


upload cert
OTA (from offline/self hosted location)
               Command: shelly.update
               A post request with file transfer. The effect is instantaneous. The result will show the new firmware. To show the previous version, it is necessary to cascade the commands inside functions because the way console.debug works (before any await).

Previously

Device ID: 083AF201C63C
Firmware version: plugusprod2
Firmware build ID: 20220211-132652/plugusprod2_app-gcb4621f
Web build ID: 1.5.5-c01b44e


{
  id: 4,
  src: 'shellyplugus-083af201c63c',
  dst: 'wsclient',
  result: {
    name: null,
    id: 'shellyplugus-083af201c63c',
    mac: '083AF201C63C',
    model: 'SNPL-00116US',
    gen: 2,
    fw_id: '20220211-132652/plugusprod2_app-gcb4621f',
    ver: 'plugusprod2',
    app: 'PlugUS',
    auth_en: false,
    auth_domain: null
  }
}

After running the script

Device ID: 083AF201C63C
Firmware version: 0.11.2
Firmware build ID: 20221004-112948/0.11.2-g2ea2af3
Web build ID: 1.5.5-a039e9d

{
  id: 4,
  src: 'shellyplugus-083af201c63c',
  dst: 'wsclient',
  result: {
    name: null,
    id: 'shellyplugus-083af201c63c',
    mac: '083AF201C63C',
    model: 'SNPL-00116US',
    gen: 2,
    fw_id: '20221004-112948/0.11.2-g2ea2af3',
    ver: '0.11.2',
    app: 'PlugUS',
    auth_en: false,
    auth_domain: null
  }
}


## Support
Rodrigo Henriques: rodrigo.henriques@shellyusa.com

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
Doug Roberson: doug.roberson@shellyusa.com
Michael Salerno: michael.salerno@shellyusa.com

## Authors and acknowledgment
AUT: Rodrigo Henriques: rodrigo.henriques@shellyusa.com
AKN: Lyubomir Petrov: lyubomir.petrov@shellyusa.com

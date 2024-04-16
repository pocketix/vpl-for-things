import { Device } from './language';

export const exampleDevices: Device[] = [
  {
    deviceName: 'DistanceSensor-1',
    attributes: ['waterLevel'],
    functions: [],
  },
  {
    deviceName: 'LT22222-Relay-1',
    attributes: ['relayState'], // "opened", "closed"
    functions: [
      {
        type: 'unit_with_args',
        args: [
          {
            type: 'str_opt',
            options: [
              { id: 'open', label: 'Open' },
              { id: 'close', label: 'Close' },
            ],
          },
        ],
        backgroundColor: '#ec4899',
        foregroundColor: '#ffffff',
        label: 'setRelay',
        icon: 'lightningChargeFill',
        group: 'iot',
      },
    ],
  },
  {
    deviceName: 'Doorbell-1',
    attributes: ['motionSensor'], // "active", "inactive"
    functions: [
      {
        type: 'unit',
        label: 'takePicture',
        icon: 'camera',
        group: 'iot',
        backgroundColor: '#f97316',
        foregroundColor: '#ffffff',
      },
    ],
  },
  {
    deviceName: 'TemperatureDevice-1',
    attributes: ['temperatureLevel'], // "high", "ideal", "low", "critical_low"
    functions: [
      {
        type: 'unit_with_args',
        args: [
          {
            type: 'str_opt',
            options: [
              { id: 'high', label: 'High' },
              { id: 'ideal', label: 'Ideal' },
              { id: 'low', label: 'Low' },
              { id: 'critical', label: 'Critical' },
            ],
          },
        ],
        backgroundColor: '#eab308',
        foregroundColor: '#ffffff',
        label: 'setTemperature',
        icon: 'thermometerHalf',
        group: 'iot',
      },
    ],
  },
  {
    deviceName: 'LED-1',
    attributes: ['currentLedColor'], // 'blue', 'orange', 'red'
    functions: [
      {
        type: 'unit_with_args',
        args: [
          {
            type: 'str_opt',
            options: [
              { id: 'blue', label: 'Blue' },
              { id: 'green', label: 'Green' },
              { id: 'orange', label: 'Orange' },
              { id: 'red', label: 'Red' },
            ],
          },
        ],
        backgroundColor: '#06b6d4',
        foregroundColor: '#ffffff',
        label: 'setLedColor',
        icon: 'lightbulb',
        group: 'iot',
      },
    ],
  },
  {
    deviceName: 'Buzzer-1',
    attributes: [],
    functions: [
      {
        type: 'unit',
        backgroundColor: '#6366f1',
        foregroundColor: '#ffffff',
        label: 'beep',
        icon: 'volumeUp',
        group: 'iot',
      },
    ],
  },
];

// Example data, clearly labelled as examples in the app. Coordinates are illustrative.
export const EXAMPLE_TRAVERSE = {
  type: 'closed', method: 'bowditch', precision: '10000',
  station: { name: 'CP-01', E: '228450.312', N: '441203.845' },
  backsight: { name: 'CP-02', E: '228912.640', N: '441655.118' },
  points: [
    { name: 'TP-01', E: '228610.458', N: '441118.300', remark: 'Steel pin' },
    { name: 'TP-02', E: '228795.123', N: '441090.770', remark: 'Steel pin' },
    { name: 'TP-03', E: '228968.548', N: '441162.410', remark: 'Steel pin' },
    { name: 'TP-04', E: '229120.243', N: '441281.652', remark: 'Steel pin' },
  ],
  closing: { name: 'CP-03', E: '229265.871', N: '441392.006', measE: '229265.883', measN: '441391.997' },
};

export const EXAMPLE_LEVEL = {
  type: 'closed', method: 'rise', allow: '',
  startName: 'BM-01', startRL: '4.215', closeName: 'BM-01', closeRL: '4.215',
  rows: [
    { station: 'BM-01', bs: '1.512', is: '', fs: '', remark: 'Benchmark' },
    { station: 'TP-1', bs: '1.388', is: '', fs: '0.866', remark: 'Change point' },
    { station: 'IP-1', bs: '', is: '2.034', fs: '', remark: 'Kerb top' },
    { station: 'TP-2', bs: '1.604', is: '', fs: '0.801', remark: 'Change point' },
    { station: 'BM-01', bs: '', is: '', fs: '2.839', remark: 'Close on benchmark' },
  ],
};

// The same site as an instrument records it: angles turned from the backsight and distances,
// with two side shots and levels (the Excel to KML sample loop on CP-01, closing back onto CP-02).
export const EXAMPLE_FIELDBOOK = {
  type: 'closed', method: 'bowditch', precision: '20000', input: 'fieldbook',
  station: { name: 'CP-01', E: '228450.312', N: '441203.845' },
  backsight: { name: 'CP-02', E: '228912.640', N: '441655.118' },
  closing: { name: 'CP-01', E: '228450.312', N: '441203.845', measE: '', measN: '' },
  points: [{ name: '', E: '', N: '', remark: '' }],
  grid: { sys: 'qng', sf: 'auto', scale: '1', meanH: '' },
  fb: {
    angleMode: 'angle', fmt: 'dms', dir: 'cw', angK: '5', useH: true, startH: '4.215', closeH: '', hC: '8',
    closeAngle: '23.1021', ref: { name: '', E: '', N: '' }, sigma: { ang: '2', dA: '1', dB: '1.5' },
    rows: [
      { side: 'point', angle: '81.3127', dist: '316.630', dh: '0.646', name: 'TS-01', remark: 'Nail in kerb' },
      { side: 'side', angle: '312.4500', dist: '42.315', dh: '-0.212', name: 'MH-01', remark: 'Manhole cover' },
      { side: 'point', angle: '124.3129', dist: '308.240', dh: '0.584', name: 'TS-02', remark: '' },
      { side: 'point', angle: '125.5354', dist: '308.364', dh: '0.566', name: 'TS-03', remark: '' },
      { side: 'side', angle: '201.1530', dist: '27.904', dh: '0.118', name: 'LP-01', remark: 'Lamp post' },
      { side: 'point', angle: '104.5917', dist: '293.903', dh: '-0.802', name: 'TS-04', remark: '' },
      { side: 'point', angle: '129.2554', dist: '294.528', dh: '-0.478', name: 'TS-05', remark: '' },
    ],
    close: { angle: '130.2740', dist: '288.697', dh: '-0.523' },
  },
};

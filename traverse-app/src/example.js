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

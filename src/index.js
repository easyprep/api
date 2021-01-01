const fs = require('fs');
let dt = new Date();
let currDir = 'dist/' + dt.toJSON().split('T')[0];
fs.mkdirSync(currDir, { recursive: true });
fs.writeFileSync(
  currDir + '/index-' + dt.getTime() + '.json',
  JSON.stringify({ ts: new Date().toJSON(), n: Math.random() }, null, 4)
);

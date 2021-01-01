const fs = require('fs');
fs.mkdirSync("dist");
fs.writeFileSync("dist/index.json", JSON.stringify({ ts: new Date().toJSON() }, null, 4));
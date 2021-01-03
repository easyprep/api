const fs = require('fs');
function indexDir(path) {
  let indexData = {};
  fs.readdirSync(path).forEach(function (file) {
    let newPath = path + '/' + file;
    let stats = fs.statSync(newPath);
    if (stats.isDirectory() && newPath != 'docs/quizzes/current-affairs') {
      indexData[file] = stats.mtimeMs;
      indexDir(newPath);
    } else {
      if (file.indexOf('index.') == -1) {
        indexData[file] = `${stats.mtimeMs}`;
      }
    }
  });
  if (JSON.stringify(indexData) !== '{}') {
    fs.writeFileSync(path + '/index.json', JSON.stringify(indexData));
    console.log({ path, indexData });
  }
}

indexDir('docs/quizzes');
console.time();
let qdir = 'docs/questions/';
var qIndex = fs
  .readdirSync(qdir)
  .map(function (v) {
    return { name: v, time: fs.statSync(qdir + v).mtimeMs };
  })
  .sort(function (a, b) {
    return a.time - b.time;
  })
  .map(function (v) {
    return v.name.split('.')[0];
  });
console.timeLog();
fs.mkdirSync('docs/qi/', { recursive: true });
let chunk = 1000;
for (let i = 0; i < Math.ceil(qIndex.length / chunk); i++) {
  fs.writeFileSync(
    `docs/qi/${i + 1}.json`,
    JSON.stringify(qIndex.slice(i * chunk, (i + 1) * chunk), null, 2)
  );
}
console.timeEnd();

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
let qIndex = [];
fs.readdirSync('docs/questions').forEach(function (file) {
  qIndex.push({
    id: file.split('.')[0],
    ts: fs.statSync('docs/questions/' + file).mtimeMs,
  });
});
console.timeLog();
fs.writeFileSync('docs/questions/index2.json', JSON.stringify(qIndex, null, 2));
console.timeEnd();

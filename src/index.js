require('dotenv').config();
const path = require('path');
const fs = require('fs');
const qs = require('qs');
const axios = require('axios').default;

const ts = new Date().getTime();

let currDir = 'docs';
let quesDir = path.join(currDir + '/questions');
fs.mkdirSync(quesDir, { recursive: true });

const apiUrl = process.env.api_url;
const apiKey = process.env.api_key;

let status = {
  lastDate: '2021-01-01',
  limit: 1000,
};

let statusFilePath = path.join(currDir, '/status.json');

try {
  status = require('../' + statusFilePath);
} catch (e) {
  // console.log(e);
}

let q = {
  apiKey,
  startDate: status.lastDate,
  startId: status.lastId,
  excludeFirst: false,
  limit: status.limit,
};

console.log(q);

console.time();

axios
  .post(apiUrl, qs.stringify(q))
  .then(function ({ data }) {
    console.log(data.data.length - 1);

    if (data.err) {
      console.error(data.msg);
    } else {
      let indexData = {};
      let keys = data.data[0];
      data.data.forEach((qArr, i) => {
        if (i) {
          let qJson = {};
          qArr.forEach((a, j) => (qJson[keys[j]] = a));

          console.log(qJson.source);

          delete qJson.source;

          let qPath = path.join(
            quesDir,
            qJson.id
              .substr(0, 6)
              .split('')
              .map((a, i) => (i % 2 == 0 ? '/' + a : a))
              .join(''),
            qJson.id.substr(6, 30)
          );

          fs.mkdirSync(qPath, { recursive: true });

          fs.writeFileSync(
            path.join(qPath, '/index.json'),
            JSON.stringify(qJson, null, 2)
          );

          indexData[qJson.id] = {
            updated_at: qJson.updated_at,
            labels: qJson.labels,
          };

          status.lastDate = qJson.updated_at;
          status.lastId = qJson.id;
        }
      });

      fs.writeFileSync(statusFilePath, JSON.stringify(status, null, 4));

      if (Object.keys(indexData).length) {
        indexer(indexData);
      }
    }

    fs.writeFileSync(
      path.join(currDir, 'index.json'),
      JSON.stringify({ err: data.err, msg: data.msg }, null, 2)
    );
    console.timeEnd();
  })
  .catch((e) => {
    console.log(e);
    fs.writeFileSync(
      path.join(currDir, 'index.json'),
      JSON.stringify({ err: true, msg: 'Network Error' }, null, 2)
    );
    console.timeEnd();
  });

function indexer(indexData) {
  let indexFilesPath = path.join(currDir, '/index');
  fs.mkdirSync(indexFilesPath, { recursive: true });
  let dataFilePath = path.join(indexFilesPath, '/data.json');
  let init = !fs.existsSync(dataFilePath);

  let mainIndexFilePath = path.join(indexFilesPath, '/index.json');
  let mainIndexData;
  try {
    mainIndexData = require('../' + mainIndexFilePath);
  } catch (e) {
    mainIndexData = ['data.json'];
  }

  if (init) {
    fs.writeFileSync(dataFilePath, JSON.stringify({ indexData }, null, 2));
  } else {
    let ctimeMs = fs.statSync(dataFilePath).ctimeMs.toFixed(0);
    let newDataFileName = `data-${ctimeMs}.json`;
    fs.renameSync(dataFilePath, path.join(indexFilesPath, newDataFileName));
    fs.writeFileSync(
      dataFilePath,
      JSON.stringify({ indexData, prev: newDataFileName }, null, 2)
    );
    mainIndexData.splice(1, 0, newDataFileName);
  }
  fs.writeFileSync(mainIndexFilePath, JSON.stringify(mainIndexData, null, 2));
}

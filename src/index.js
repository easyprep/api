require('dotenv').config();
const path = require('path');
const fs = require('fs');
const qs = require('qs');
const axios = require('axios').default;
const uuid = require('uuid').v5;
const ts = new Date().getTime();

let currDir = 'docs';
let quesDir = path.join(currDir + '/questions');
fs.mkdirSync(quesDir, { recursive: true });

const url = process.env.api_url;
const payload = JSON.parse(process.env.api_payload);
const map = JSON.parse(process.env.data_map);
const name_scape = process.env.my_name_scape;

let status = {
  fetchCount: 10,
  lastIdFetched: 0,
};
let statusFilePath = path.join(currDir, '/status.json');
console.log(statusFilePath);
try {
  status = require('../' + statusFilePath);
} catch (e) {
  console.log(e);
}
console.log(status);

let ids = [];
while (ids.length < status.fetchCount) {
  ids.push(++status.lastIdFetched);
}
payload.quesids = ids.join();

axios.post(url, qs.stringify(payload)).then(function ({ data }) {
  fs.writeFileSync(statusFilePath, JSON.stringify(status, null, 2));
  let baseUrl = url.split('/')[2];
  let indexData = {};
  data.questions.forEach(function (q) {
    let nq = {
      id: uuid(`${baseUrl}.${q.id}`, name_scape),
    };
    console.log(q.id, nq.id);
    for (let key in map) {
      nq[key] = q[map[key]] || '';
    }
    nq.labels = ['Current Affairs', nq.created_at.split(' ')[0]];
    let indexPath = nq.labels
      .map((a) => a.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-'))
      .join('/');
    if (!indexData[indexPath]) indexData[indexPath] = {};
    indexData[indexPath][nq.id] = new Date(nq.created_at).getTime();
    fs.writeFileSync(
      path.join(quesDir, nq.id + '.json'),
      JSON.stringify(nq, null, 2)
    );
  });
  for (let key in indexData) {
    let indexFileDir = path.join(currDir, '/quizzes/', key);
    let indexFilePath = path.join(indexFileDir + '/index.json');
    let indexFileData = {};

    try {
      indexFileData = require('../' + indexFilePath);
    } catch (e) {}

    if (indexData[key]) {
      indexFileData = { ...indexFileData, ...indexData[key] };
      fs.mkdirSync(indexFileDir, { recursive: true });
      fs.writeFileSync(indexFilePath, JSON.stringify(indexFileData, null, 2));
    }
  }
});

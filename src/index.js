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
    lastDate: "2017-01-01",
    limit: 10,
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
    excludeFirst: true,
    limit: status.limit
}

axios.post(apiUrl, qs.stringify(q)).then(function ({ data }) {

    console.log(data.data.length - 1);

    if (data.err) {
        console.error(data.msg);
    } else {
        let keys = data.data[0];
        data.data.forEach((qArr, i) => {
            if (i) {

                let qJson = {};
                qArr.forEach((a, j) => (qJson[keys[j]] = a));
                delete qJson.source;

                let qPath = path.join(quesDir, qJson.id);
                fs.mkdirSync(qPath, { recursive: true });

                fs.writeFileSync(
                    path.join(qPath, "/index.json"),
                    JSON.stringify(qJson, null, 2)
                );

                status.lastDate = qJson.updated_at;
                status.lastId = qJson.id;

            }
        });

        fs.writeFileSync(statusFilePath, JSON.stringify(status, null, 4));
    }

    console.timeEnd();

})
    .catch(e => console.log(e));

// let baseUrl = url.split('/')[2];
// let indexData = {};
// if (!data.questions) {
//     console.log('New Questions: 0');
//     return;
// }
// console.log('New Questions: ' + data.questions.length);

// data.questions.forEach(function (q) {
//     status.lastIdFetched = parseInt(q.id);
//     let nq = {
//         id: uuid(`${baseUrl}.${q.id}`, name_scape),
//     };
//     for (let key in map) {
//         nq[key] = q[map[key]] || '';
//     }
//     nq.labels = ['Current Affairs', nq.created_at.split(' ')[0]];
//     let indexPath = nq.labels
//         .map((a) => a.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '-'))
//         .join('/');
//     if (!indexData[indexPath]) indexData[indexPath] = {};
//     indexData[indexPath][nq.id] = new Date(nq.created_at).getTime();
//     fs.writeFileSync(
//         path.join(quesDir, nq.id + '.json'),
//         JSON.stringify(nq, null, 2)
//     );
// });
// status.fetchCount = data.questions.length < 100 ? 100 : 1000;
// status.lastFetchCount = data.questions.length;
// status.lastUpdatedAt = new Date().toJSON();
// fs.writeFileSync(statusFilePath, JSON.stringify(status, null, 2));

// let qIndex = [];
// fs.readdirSync(quesDir).forEach(function (file) {
//     qIndex.push(file.split('.')[0]);
// });
// fs.writeFileSync(path.join(quesDir, '/index.json'), JSON.stringify(qIndex));

// for (let key in indexData) {
//     let indexFileDir = path.join(currDir, '/quizzes/', key);
//     let indexFilePath = path.join(indexFileDir + '/index.json');
//     let indexFileData = {};

//     try {
//         indexFileData = require('../' + indexFilePath);
//     } catch (e) { }

//     if (indexData[key]) {
//         indexFileData = { ...indexFileData, ...indexData[key] };
//         fs.mkdirSync(indexFileDir, { recursive: true });
//         fs.writeFileSync(indexFilePath, JSON.stringify(indexFileData, null, 2));
//     }
// }
// });

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const qs = require('qs');
const axios = require('axios').default;

const ts = new Date().getTime();

//Folder Structure - ** Must match with .github/workflows/main.yml **
let currDir = 'docs';

let indexJsonPath = path.join(currDir, 'index.json');

let configDir = path.join(currDir, '_config');
fs.mkdirSync(configDir, { recursive: true });

let quesDir = path.join(currDir, 'questions');
fs.mkdirSync(quesDir, { recursive: true });

let indexFilesPath = path.join(currDir, 'indexfiles');
fs.mkdirSync(indexFilesPath, { recursive: true });


// Env variables
const apiUrl = process.env.api_url;
const apiKey = process.env.api_key;

// For init
let status = {
    fetch: {
        excludeFirst: true,
        startDate: '2016-01-01',
        limit: 1000
    },
    index: {
        limit: 1000
    }
};

// Main Logic
let statusFilePath = path.join(configDir, 'status.json');

if (fs.existsSync(statusFilePath)) {
    status = require('../' + statusFilePath);
}

let q = {
    apiKey,
    ...status.fetch
};

console.log(q);

console.time('Run Time');

axios
    .post(apiUrl, qs.stringify(q))
    .then(function ({ data }) {

        if (data.err) {
            console.error(data.msg);
        } else {

            let indexData = {};

            let keys = data.data[0];

            data.data.forEach((qArr, i) => {

                if (i) {

                    let qJson = {};
                    qArr.forEach((a, j) => (qJson[keys[j]] = a));

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
                        path.join(qPath, 'index.json'),
                        JSON.stringify(qJson, null, 2)
                    );

                    indexData[qJson.id] = {
                        updated_at: qJson.updated_at,
                        labels: qJson.labels,
                    };

                    status.fetch.startDate = qJson.updated_at;
                    status.fetch.startId = qJson.id;
                }

            });

            fs.writeFileSync(statusFilePath, JSON.stringify(status, null, 4));

            if (Object.keys(indexData).length) {
                indexer(indexData);
            }
        }

        fs.writeFileSync(
            indexJsonPath,
            JSON.stringify({ err: data.err, msg: (data.err ? data.msg : 'OK'), ts }, null, 2)
        );

        console.timeEnd('Run Time');
    })
    .catch((e) => {

        console.log(e);

        fs.writeFileSync(
            indexJsonPath,
            JSON.stringify({ err: true, msg: 'Network Error', ts }, null, 2)
        );

        console.timeEnd('Run Time');

    });

function indexer(indexData) {

    indexData = Object.keys(indexData).map(id => ({ id, ...indexData[id] }));

    let dataFilePath = path.join(indexFilesPath, 'data.json');

    let mainIndexFilePath = path.join(indexFilesPath, 'index.json');
    let mainIndexData;

    if (fs.existsSync(mainIndexFilePath)) {
        mainIndexData = require('../' + mainIndexFilePath);
    } else {
        mainIndexData = ['data.json'];
    }

    if (!fs.existsSync(dataFilePath)) {

        fs.writeFileSync(dataFilePath, JSON.stringify({ indexData }, null, 2));
        console.log(`data.json created with ${indexData.length} items`);

    } else {

        let data = require('../' + dataFilePath);

        let newDataFileName;
        let overflowCount;
        let maxItems = status.index.limit;

        if (data.indexData.length == maxItems) {

            overflowCount = indexData.length;
            newDataFileName = makeNewDataFile(indexFilesPath, dataFilePath, indexData);
            console.log(`data.json had ${maxItems}, renamed to ${newDataFileName}, new data.json created with ${indexData.length} items`);

        } else if (data.indexData.length < maxItems) {

            overflowCount = data.indexData.length + indexData.length - maxItems;
            console.log(`${data.indexData.length} + ${indexData.length} - ${maxItems} = ${overflowCount}`);

            if (overflowCount > 0) {

                let indexData1 = indexData.slice(0, indexData.length - overflowCount);
                let indexData2 = indexData.slice(indexData.length - overflowCount, indexData.length);

                data.indexData = [...data.indexData, ...indexData1];
                fs.writeFileSync(dataFilePath, JSON.stringify({ indexData: data.indexData }, null, 2));

                newDataFileName = makeNewDataFile(indexFilesPath, dataFilePath, indexData2);
                console.log(`data.json had ${data.indexData.length - indexData1.length}, ${indexData1.length} items added, renamed to ${newDataFileName}, new data.json created with ${indexData2.length} items`);

            } else {

                data.indexData = [...data.indexData, ...indexData];
                fs.writeFileSync(dataFilePath, JSON.stringify({ indexData: data.indexData }, null, 2));
                console.log(`data.json had ${data.indexData.length - indexData.length}, ${indexData.length} items added.`);

            }
        }

        if (newDataFileName) {
            mainIndexData.splice(1, 0, newDataFileName);
        }

    }

    fs.writeFileSync(mainIndexFilePath, JSON.stringify(mainIndexData, null, 2));
}

function makeNewDataFile(indexFilesPath, dataFilePath, indexData) {

    let ctimeMs = fs.statSync(dataFilePath).ctimeMs.toFixed(0);
    let newDataFileName = `data-${ctimeMs}.json`;
    fs.renameSync(dataFilePath, path.join(indexFilesPath, newDataFileName));

    fs.writeFileSync(
        dataFilePath,
        JSON.stringify({ indexData, prev: newDataFileName }, null, 2)
    );

    return newDataFileName;
}
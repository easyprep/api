const path = require('path');
const fs = require('fs');

let currDir = "docs";

let labelsDir = path.join(currDir, 'labels');
fs.mkdirSync(labelsDir, { recursive: true });

const getLastItem = thePath => thePath.substring(thePath.lastIndexOf('/') + 1);

module.exports = function (arr, limit) {
    let indexData = {};

    arr.forEach(q => {
        if (!indexData[q.labels]) {
            indexData[q.labels] = [];
        }
        indexData[q.labels].push({ id: q.id, updated_at: q.updated_at });
    });

    createFolderIndex(labelsDir, Object.keys(indexData));

    Object.keys(indexData).forEach(key => {
        let labels = key.split(',');
        let cai = labels.indexOf('current-affairs');
        if (cai > -1) {
            labels.splice(cai + 1, 1, ...labels[cai + 1].split('-'));
        }

        let folder = path.join(labelsDir, ...labels);

        fs.mkdirSync(folder, { recursive: true });

        let json = {
            type: "_file",
            prev: null,
            data: []
        };

        if (fs.existsSync(folder + '/index.json')) {
            json = JSON.parse(fs.readFileSync(folder + '/index.json'));
        }

        json.data = [...json.data, ...indexData[key]];

        createIndexFile(folder, json, limit);

    });
}

function createFolderIndex(labelsDir, arr) {
    //console.log(arr);
    let indexData = {};

    arr.forEach(labels => {
        //console.log(labels);
        labels = ',' + labels;
        labels = labels.split(',');
        let cai = labels.indexOf('current-affairs');
        if (cai > -1) {
            labels.splice(cai + 1, 1, ...labels[cai + 1].split('-'));
        }
        //console.log(labels);
        labels.forEach((label, i) => {
            if (i) {
                let p = labels.slice(0, i).join('/') + '/';
                if (!indexData[p]) {
                    indexData[p] = [];
                }
                if (indexData[p].indexOf(label) == -1) {
                    indexData[p].push(label);
                }
            }
        });
    });

    console.log(indexData);

    for (let key in indexData) {

        let filePath = path.join(labelsDir, key);
        fs.mkdirSync(filePath, { recursive: true });
        filePath = path.join(filePath, 'index.json');

        let json = {
            type: '_folder',
            data: []
        };

        if (fs.existsSync(filePath)) {
            json = JSON.parse(fs.readFileSync(filePath));
        }

        indexData[key].forEach(label => {
            if (json.data.indexOf(label) == -1) {
                json.data.push(label);
            }
        });

        fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
    }
}

function createIndexFile(folder, json, limit) {

    if (json.data.length <= limit) {

        fs.writeFileSync(folder + '/index.json', JSON.stringify(json, null, 2));

    } else {
        let data = json.data.slice(limit, json.data.length);
        let prev = 'index-' + new Date().getTime() + '.json';

        json.data = json.data.slice(0, limit);
        fs.writeFileSync(folder + '/' + prev, JSON.stringify(json, null, 2));
        syncWait(1);
        // setTimeout(function () {
        createIndexFile(folder, { type: "_file", prev, data }, limit);
        // }, 1);
    }
}

function syncWait(ms) {
    const end = Date.now() + ms
    while (Date.now() < end) continue
}

function getMicSecTime() {
    var hrTime = process.hrtime();
    return (hrTime[1] / 1000000).toFixed(3).split('.')[1];
}

// function createIndexFile(filePath, arr, prev, limit) {

//     if (fs.existsSync(filePath)) {

//         let json = JSON.parse(fs.readFileSync(filePath));
//         let room = limit - json.data.length;

//         let arr1 = arr.slice(0, room);
//         let arr2 = arr.slice(room, arr.length);

//         if (room) {
//             json.data = [...json.data, ...arr1];
//             fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
//             console.log('updated: ', filePath);
//         }

//         let prevFileName = filePath.split('.json')[0] + "." + fs.statSync(filePath).ctimeMs.toFixed(3) + '.json'
//         fs.renameSync(filePath, prevFileName);

//         createIndexFile(filePath, arr2, getLastItem(prevFileName), limit);
//         return;

//     } else {
//         console.log('created: ', filePath);
//         fs.writeFileSync(filePath, JSON.stringify({ data: arr.slice(0, limit), prev }, null, 2));
//         if (arr.length > limit) {
//             createIndexFile(filePath, arr.slice(limit, arr.length), null, limit);
//             return;
//         }

//     }
// }
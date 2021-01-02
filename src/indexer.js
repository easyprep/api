const fs = require('fs');
function indexDir(path) {
    let indexData = {};
    fs.readdirSync(path).forEach(function (file) {
        let newPath = path + "/" + file;
        let stats = fs.statSync(newPath);
        if (stats.isDirectory()) {
            indexData[file] = stats.mtimeMs;
            indexDir(newPath);
        } else {
            if (file.indexOf("index.") == -1) {
                indexData[file] = `${stats.mtimeMs}`;
            }
        }
    });
    if (JSON.stringify(indexData) !== "{}") {
        fs.writeFileSync(path + "/index.json", JSON.stringify(indexData));
        console.log({ path, indexData });
    }
}

indexDir("docs/quizzes");
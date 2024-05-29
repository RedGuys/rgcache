//get all js files inside dir and run it
const fs = require('fs');
const path = require('path');

(async () => {
    const dir = path.join(__dirname);
    let files = fs.readdirSync(dir);
    files = files.filter(file => file.endsWith('.js')).filter(file => file !== 'all.js');
    for (let file of files) {
        console.log(`Testing ${file}`);
        require(path.join(dir, file));
        //wait for 1 second
        await new Promise(r => setTimeout(r, 1));
    }
})();
const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (f === '.terraform' || f === '.git') return;
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

walk('terraform', function(filePath) {
    if (filePath.endsWith('.tf')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('visaflow')) {
            let newContent = content.replace(/visaflow/g, 'mudar')
                                    .replace(/VisaFlow/g, 'Mudar');
            if (content !== newContent) fs.writeFileSync(filePath, newContent, 'utf8');
        }
    }
});

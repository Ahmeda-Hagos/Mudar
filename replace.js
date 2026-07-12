const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (f === 'node_modules' || f === '.next' || f === 'dist' || f === '.git') return;
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
    });
}

// 1. Fix missing TS imports from task-5763 failure
walk('.', function(filePath) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('@visaflow/')) {
            let newContent = content.replace(/@visaflow\/constants/g, '@mudar/constants')
                                    .replace(/@visaflow\/types/g, '@mudar/types');
            if (content !== newContent) fs.writeFileSync(filePath, newContent, 'utf8');
        }
    }
});

// 2. Fix Frontend texts from failure
walk('apps/web/src', function(filePath) {
    if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('VisaFlow')) {
            let newContent = content.replace(/VisaFlow AI/g, 'Mudar | مُـــدَار')
                                    .replace(/VisaFlow/g, 'Mudar');
            if (content !== newContent) fs.writeFileSync(filePath, newContent, 'utf8');
        }
    }
});

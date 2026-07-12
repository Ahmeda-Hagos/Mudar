const fs = require('fs');

let filePath = '.github/workflows/deploy.yml';
let content = fs.readFileSync(filePath, 'utf8');
if (content.includes('visaflow')) {
    let newContent = content.replace(/visaflow/g, 'mudar')
                            .replace(/VisaFlow/g, 'Mudar');
    fs.writeFileSync(filePath, newContent, 'utf8');
}

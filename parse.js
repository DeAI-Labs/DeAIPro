const fs = require('fs');

const content = fs.readFileSync('/home/ciarrai/Documents/DeAI/dashboard-new.html', 'utf8');

const styleStart = content.indexOf('<style>');
const styleEnd = content.indexOf('</style>', styleStart);
if (styleStart !== -1 && styleEnd !== -1) {
    const styleContent = content.substring(styleStart + 7, styleEnd);
    console.log(`Style length: ${styleContent.length}`);
    fs.writeFileSync('dashboard_style.css', styleContent);
}

const bodyStart = content.indexOf('<body>');
let scriptStart = content.indexOf('<script>', bodyStart);
let bodyContent = '';
if (scriptStart !== -1) {
    bodyContent = content.substring(bodyStart + 6, scriptStart).trim();
} else {
    bodyContent = content.substring(bodyStart + 6, content.indexOf('</body>')).trim();
}

console.log(`Body length: ${bodyContent.length}`);
fs.writeFileSync('dashboard_body.html', bodyContent);

let scripts = [];
let idx = 0;
while (true) {
    idx = content.indexOf('<script', idx);
    if (idx === -1) break;
    let endTag = content.indexOf('</script>', idx);
    if (endTag !== -1) {
        scripts.push(content.substring(idx, endTag + 9));
        idx = endTag + 9;
    } else {
        break;
    }
}

console.log(`Total scripts found: ${scripts.length}`);
scripts.forEach((s, i) => {
    console.log(`Script ${i} length: ${s.length}`);
    if (!s.includes('src=')) {
        let startIdx = s.indexOf('>') + 1;
        fs.writeFileSync(`dashboard_script_${i}.js`, s.substring(startIdx, s.length - 9));
    }
});

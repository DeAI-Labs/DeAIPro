const fs = require('fs');

const rawHtml = fs.readFileSync('../dashboard-new.html', 'utf8');

const styleStart = rawHtml.indexOf('<style>') + 7;
const styleEnd = rawHtml.indexOf('</style>');
const cssContent = rawHtml.slice(styleStart, styleEnd);
fs.writeFileSync('app/(dashboard)/dashboard.css', cssContent.trim());

const bodyStart = rawHtml.indexOf('<body>') + 6;
const jsStartRaw = rawHtml.lastIndexOf('<script');
const lastScriptTag = rawHtml.indexOf('>', jsStartRaw) + 1;
const bodyContent = rawHtml.slice(bodyStart, jsStartRaw);
fs.writeFileSync('app/(dashboard)/dashboard-content.html', bodyContent.trim());

const jsEndRaw = rawHtml.lastIndexOf('</script>');
const jsContent = rawHtml.slice(lastScriptTag, jsEndRaw);
fs.writeFileSync('public/dashboard-script.js', jsContent.trim());

console.log("Successfully parsed dashboard files.");

const fs = require('fs');
const path = require('path');

try {
  // dashboard-new.html is in the root DeAI folder, one level up from frontend
  const srcPath = path.join(__dirname, '../../dashboard-new.html');
  console.log('Extracting dashboard components from:', srcPath);
  
  if (!fs.existsSync(srcPath)) {
    console.warn(`Source file not found at ${srcPath}. Skipping extraction.`);
    process.exit(0);
  }

  const raw = fs.readFileSync(srcPath, 'utf8');

  // Extract CSS
  const styleStart = raw.indexOf('<style>') + 7;
  const styleEnd = raw.indexOf('</style>');
  const css = raw.slice(styleStart, styleEnd);
  fs.writeFileSync(path.join(__dirname, '../app/(dashboard)/dashboard.css'), css);
  console.log('✅ Generated dashboard.css');

  // Extract HTML body
  const bodyStart = raw.indexOf('<body>') + 6;
  const jsStartRaw = raw.lastIndexOf('<script');
  const body = raw.slice(bodyStart, jsStartRaw);
  
  // Export the HTML as a JS string to avoid runtime fs.readFileSync reading issues on Vercel
  const htmlContent = `export const dashboardHtml = ${JSON.stringify(body)};\n`;
  fs.writeFileSync(path.join(__dirname, '../app/(dashboard)/dashboard-html.ts'), htmlContent);
  console.log('✅ Generated dashboard-html.ts');

  // Extract JS
  const lastScriptTag = raw.indexOf('>', jsStartRaw) + 1;
  const jsEndRaw = raw.lastIndexOf('</script>');
  let js = raw.slice(lastScriptTag, jsEndRaw);
  js = js.replace("document.addEventListener('DOMContentLoaded',()=>{", "function initDashboard() {");
  js = js.replace("} catch(e) { console.error('Init error:', e); }\n});", "} catch(e) { console.error('Init error:', e); }\n}\nsetTimeout(() => { if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initDashboard); } else { initDashboard(); } }, 50);");
  fs.writeFileSync(path.join(__dirname, '../public/dashboard-script.js'), js);
  console.log('✅ Generated dashboard-script.js');

  console.log('Dashboard extraction completed successfully!');
} catch (error) {
  console.error('Failed to extract dashboard components:', error);
  process.exit(1);
}

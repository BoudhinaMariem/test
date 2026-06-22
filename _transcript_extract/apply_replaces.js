const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '_str_replaces.json'), 'utf8'));

const tsRel = 'frontend/src/app/modules/admin/triweb/planification/planification.component.ts';
const htmlRel = 'frontend/src/app/modules/admin/triweb/planification/planification.component.html';
const tsPath = 'c:/Users/marie/Downloads/triweb1/triweb/frontend/src/app/modules/admin/triweb/planification/planification.component.ts';
const htmlPath = 'c:/Users/marie/Downloads/triweb1/triweb/frontend/src/app/modules/admin/triweb/planification/planification.component.html';

let ts = fs.readFileSync(path.join(root, tsRel), 'utf8');
let html = fs.readFileSync(path.join(root, htmlRel), 'utf8');

let appliedTs = 0;
let appliedHtml = 0;
let skipped = [];

for (const r of data) {
    if (r.path === tsPath) {
        if (ts.includes(r.old)) {
            ts = ts.replace(r.old, r.new);
            appliedTs++;
        } else {
            skipped.push({ file: 'ts', preview: r.old.slice(0, 80) });
        }
    } else if (r.path === htmlPath) {
        if (html.includes(r.old)) {
            html = html.replace(r.old, r.new);
            appliedHtml++;
        } else {
            skipped.push({ file: 'html', preview: r.old.slice(0, 80) });
        }
    }
}

fs.writeFileSync(path.join(__dirname, 'planification_final.ts'), ts);
fs.writeFileSync(path.join(__dirname, 'planification_final.html'), html);

console.log('Applied TS:', appliedTs, 'HTML:', appliedHtml);
console.log('Skipped:', skipped.length);
skipped.slice(0, 10).forEach((s) => console.log(s.file, s.preview.replace(/\n/g, '\\n')));

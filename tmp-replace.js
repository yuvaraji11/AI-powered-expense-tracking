const fs = require('fs');
const path = require('path');

function replaceInFile(file, replacements) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    replacements.forEach(([regex, replacement]) => {
        content = content.replace(regex, replacement);
    });
    if(content !== original) {
        fs.writeFileSync(file, content);
        console.log("Updated", file);
    }
}

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory() && !file.includes('node_modules') && !file.includes('.git') && !file.includes('.next')) {
            results = results.concat(walk(file));
        } else if (stat && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./app').concat(walk('./components'));
const replacements = [
    [/bg-(slate|neutral|zinc)-950/g, 'bg-background'],
    [/bg-(slate|neutral|zinc)-900/g, 'bg-card'],
    [/bg-(slate|neutral|zinc)-800\/50/g, 'bg-muted\/50'],
    [/bg-(slate|neutral|zinc)-800/g, 'bg-muted'],
    [/text-(slate|neutral|zinc)-100/g, 'text-foreground'],
    [/text-(slate|neutral|zinc)-200/g, 'text-foreground'],
    [/text-(slate|neutral|zinc)-300/g, 'text-muted-foreground'],
    [/text-(slate|neutral|zinc)-400/g, 'text-muted-foreground'],
    [/text-(slate|neutral|zinc)-500/g, 'text-muted-foreground'],
    [/border-(slate|neutral|zinc)-800\/50/g, 'border-border'],
    [/border-(slate|neutral|zinc)-800/g, 'border-border'],
    [/border-(slate|neutral|zinc)-700/g, 'border-border'],
];

files.forEach(file => replaceInFile(file, replacements));

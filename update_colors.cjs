const fs = require('fs');
const path = require('path');

const dir = 'd:/KV/game_lounge_customer/src';

const colorReplacements = [
  // Backgrounds
  { old: '#080810', new: 'bg-primary' },
  { old: '#010214', new: 'bg-primary' },
  { old: '#01031B', new: 'bg-secondary' },
  { old: '#11111E', new: 'bg-card' },
  { old: '#020B2E', new: 'bg-card' },
  { old: '#181828', new: 'bg-card-soft' },
  { old: '#0B2350', new: 'bg-card-soft' },
  
  // Borders
  { old: '#252540', new: 'border-blue' },
  { old: '#063271', new: 'border-blue' },

  // Blues
  { old: '#0282DE', new: 'primary-blue' },
  { old: '#0393E3', new: 'button-blue' },
  { old: '#0160A8', new: 'primary-blue' },
  
  // Cyans
  { old: '#19B9EE', new: 'cyan-accent' },
  { old: '#00B8FF', new: 'cyan-glow' },
  { old: '#7DEBFF', new: 'ice-blue' },

  // Texts
  { old: '#FFFFFF', new: 'text-primary' },
  { old: '#F5F7FA', new: 'text-primary' },
  { old: '#9CA3AF', new: 'text-secondary' },
  { old: '#C9D4E2', new: 'text-secondary' },
  { old: '#6B7280', new: 'text-secondary' },
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let original = content;
  
  for (const { old, new: cssVar } of colorReplacements) {
    // Replace text-[#HEX] -> text-cssVar
    let regexText = new RegExp(`text-\\[(?i)${old}\\]`, 'g');
    content = content.replace(regexText, `text-${cssVar}`);
    
    // Replace bg-[#HEX] -> bg-cssVar
    let regexBg = new RegExp(`bg-\\[(?i)${old}\\]`, 'g');
    content = content.replace(regexBg, `bg-${cssVar}`);
    
    // Replace border-[#HEX] -> border-cssVar
    let regexBorder = new RegExp(`border-\\[(?i)${old}\\]`, 'g');
    content = content.replace(regexBorder, `border-${cssVar}`);

    // Replace raw hex codes (case insensitive) outside of classes, e.g. in linear-gradient or style tags
    // Careful with this, let's only do it if it's not preceded by #[a-zA-Z0-9] to avoid partial matches
    let rawRegex = new RegExp(`(?i)${old}`, 'g');
    // For linear gradient or style objects, maybe just replace raw hex with the new hex from the client's palette?
    // Wait, let's just replace raw hex with the client's exact hex for that var.
  }

  // Raw hex replacements for CSS blocks or style="" bindings
  const rawColorMap = {
    '#080810': '#010214',
    '#11111E': '#020B2E',
    '#181828': '#0B2350',
    '#252540': '#063271',
    '#0160A8': '#0282DE',
    '#9CA3AF': '#C9D4E2',
    '#6B7280': '#C9D4E2',
  };

  for (const [oldHex, newHex] of Object.entries(rawColorMap)) {
    let regexRaw = new RegExp(`(?i)${oldHex}`, 'g');
    content = content.replace(regexRaw, newHex);
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated:', filePath);
  }
}

function walk(dirPath) {
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.vue')) {
      processFile(fullPath);
    }
  }
}

walk(dir);

const fs = require('fs');
const files = ['c:/Users/Lopez/Desktop/mi proyecto/index.html', 'c:/Users/Lopez/Desktop/mi proyecto/admin.html'];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let content = fs.readFileSync(file, 'utf8');
    
    // Add credentials: "include" to fetch
    content = content.replace(/fetch\(([^,]+),\s*\{/g, 'fetch($1, { credentials: \"include\", ');
    
    // Remove localStorage saving
    content = content.replace(/localStorage\.setItem\([\'\"]token[\'\"],\s*token\);/g, '');
    
    // Replace localStorage removeItem with a fetch to logout
    content = content.replace(/localStorage\.removeItem\([\'\"]token[\'\"]\);/g, 'fetch(API + \"/api/auth/logout\", { method: \"POST\", credentials: \"include\" });');
    
    // Remove assignment token = data.token
    content = content.replace(/token = data\.token;/g, '');
    
    // Fallback the initial token variable so standard JS syntax is okay
    content = content.replace(/let token = localStorage\.getItem\([\'\"]token[\'\"]\);/g, 'let token = \"cookie_mode\";');
    
    // Hardcode API just in case for admin page if it's not defined
    content = content.replace(/fetch\(API \+ \"\/api\/auth\/logout\"/g, 'fetch(\"/api/auth/logout\"');
    
    fs.writeFileSync(file, content, 'utf8');
}
console.log('Patch complete!');

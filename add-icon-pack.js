#!/usr/bin/env node

/**
 * Script to help add new icon packs to the Excaliaws extension
 * 
 * Usage:
 *   node add-icon-pack.js <pack-name> <pack-file.json>
 * 
 * Example:
 *   node add-icon-pack.js azure azure-icons.json
 */

const fs = require('fs');
const path = require('path');

function addIconPack(packName, packFile) {
    try {
        const configPath = path.join(__dirname, 'icon-packs-config.json');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        
        // Check if pack already exists
        const existingPack = config.packs.find(pack => pack.id === packName);
        if (existingPack) {
            console.log(`⚠️ Icon pack "${packName}" already exists`);
            return;
        }
        
        // Validate the icon pack file exists and has correct format
        const packPath = path.join(__dirname, packFile);
        if (!fs.existsSync(packPath)) {
            console.error(`❌ Icon pack file not found: ${packFile}`);
            process.exit(1);
        }
        
        const packData = JSON.parse(fs.readFileSync(packPath, 'utf8'));
        if (!packData.type || !packData.type.includes('iconpack')) {
            console.error(`❌ Invalid icon pack format in ${packFile}`);
            console.error('Expected type field containing "iconpack"');
            process.exit(1);
        }
        
        if (!packData.icons || typeof packData.icons !== 'object') {
            console.error(`❌ Invalid icon pack format in ${packFile}`);
            console.error('Expected "icons" object');
            process.exit(1);
        }
        
        // Add the new pack
        const newPack = {
            id: packName,
            name: packData.name || packName,
            description: packData.description || `${packName} icons`,
            file: packFile,
            enabled: true,
            priority: config.packs.length + 1
        };
        
        config.packs.push(newPack);
        
        // Write updated config
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        
        console.log(`✅ Added icon pack: ${newPack.name}`);
        console.log(`📊 Total icons: ${Object.keys(packData.icons).length}`);
        console.log(`📝 File: ${packFile}`);
        console.log(`🎯 Pack ID: ${packName}`);
        
        // Update manifest.json to include the new file
        const manifestPath = path.join(__dirname, 'manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        
        const resources = manifest.web_accessible_resources[0].resources;
        if (!resources.includes(packFile)) {
            resources.push(packFile);
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4));
            console.log(`✅ Updated manifest.json to include ${packFile}`);
        }
        
    } catch (error) {
        console.error('❌ Error adding icon pack:', error.message);
        process.exit(1);
    }
}

function createTemplateIconPack(packName) {
    const template = {
        type: "excaliaws-iconpack",
        version: "1.0",
        name: `${packName} Icons`,
        description: `${packName} architecture icons for Excalidraw`,
        author: "Community",
        source: `https://example.com/${packName}-icons`,
        icons: {
            "example-icon": {
                name: "Example Icon",
                keywords: ["example", "sample", "template"],
                category: "Examples",
                description: `Sample ${packName} icon`,
                clipboardData: {
                    type: "excalidraw/clipboard",
                    elements: [
                        {
                            type: "rectangle",
                            x: 0,
                            y: 0,
                            width: 100,
                            height: 100,
                            strokeColor: "#000000",
                            backgroundColor: "transparent",
                            fillStyle: "hachure",
                            strokeWidth: 2,
                            strokeStyle: "solid",
                            roughness: 1,
                            opacity: 100
                        }
                    ],
                    files: {}
                }
            }
        }
    };
    
    const fileName = `${packName}-icons.json`;
    fs.writeFileSync(fileName, JSON.stringify(template, null, 2));
    console.log(`✅ Created template icon pack: ${fileName}`);
    console.log('📝 Edit this file to add your icons');
    console.log(`🚀 Then run: node add-icon-pack.js ${packName} ${fileName}`);
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Excaliaws Icon Pack Manager');
        console.log('');
        console.log('Usage:');
        console.log('  node add-icon-pack.js <pack-name> <pack-file.json>  # Add existing pack');
        console.log('  node add-icon-pack.js create <pack-name>             # Create template');
        console.log('');
        console.log('Examples:');
        console.log('  node add-icon-pack.js azure azure-icons.json');
        console.log('  node add-icon-pack.js create gcp');
        process.exit(0);
    }
    
    if (args[0] === 'create' && args[1]) {
        createTemplateIconPack(args[1]);
    } else if (args.length === 2) {
        addIconPack(args[0], args[1]);
    } else {
        console.error('❌ Invalid arguments');
        console.log('Usage: node add-icon-pack.js <pack-name> <pack-file.json>');
        console.log('   or: node add-icon-pack.js create <pack-name>');
        process.exit(1);
    }
}

module.exports = { addIconPack, createTemplateIconPack };
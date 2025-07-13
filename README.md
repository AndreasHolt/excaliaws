# Excaliaws - AWS Icon Search for Excalidraw

A Chrome extension that adds fast, searchable AWS architecture icons to Excalidraw with support for multiple icon packs.

## ✨ Features

- **🔍 Fast Search**: Search AWS icons by name, keywords, or category
- **⚙️ Configurable Search**: Toggle keyword/category search in settings
- **📦 Multiple Icon Packs**: Support for AWS, Azure, GCP, and custom packs
- **🎯 Smart Filtering**: Enable/disable specific icon packs
- **📋 One-Click Insert**: Icons copy directly to your Excalidraw canvas
- **⌨️ Keyboard Shortcuts**: `Cmd/Ctrl+K` to open search

## 🚀 Usage

1. **Open Excalidraw** (excalidraw.com or app.excalidraw.com)
2. **Press `Cmd/Ctrl+K`** or click the extension button
3. **Search for icons**: Type "EC2", "compute", "storage", etc.
4. **Click to insert** or use arrow keys + Enter
5. **Configure settings** via the cogwheel button

### Search Examples

With default settings (keywords ON, categories OFF):
- `"EC"` → Shows EC2, ECS, ECR (name matches)
- `"compute"` → Shows Lambda, EC2, ECS (keyword matches)
- `"database"` → Shows RDS, DynamoDB (keyword matches)

## ⚙️ Settings

Click the cogwheel (⚙️) in the search interface to access:

### Search Options
- **Search in keywords**: Find icons by service keywords (default: ON)
- **Search in categories**: Include AWS service categories in search (default: OFF)

### Icon Pack Management
- **Toggle icon packs**: Enable/disable AWS, Azure, GCP, etc.
- **Pack priorities**: Control which packs show first

## 📦 Adding Icon Packs

### Quick Start
```bash
# Create a new icon pack template
node add-icon-pack.js create azure

# Edit azure-icons.json with your icons
# Then add it to the extension:
node add-icon-pack.js azure azure-icons.json
```

### Icon Pack Format
```json
{
  "type": "excaliaws-iconpack",
  "version": "1.0",
  "name": "Azure Architecture Icons",
  "description": "Microsoft Azure icons for Excalidraw",
  "icons": {
    "vm": {
      "name": "Virtual Machine",
      "keywords": ["vm", "virtual machine", "compute"],
      "category": "Compute",
      "description": "Azure Virtual Machine",
      "clipboardData": {
        "type": "excalidraw/clipboard",
        "elements": [/* Excalidraw elements */],
        "files": {}
      }
    }
  }
}
```

### Popular Icon Pack Ideas
- **Azure**: Virtual Machines, App Service, Cosmos DB
- **Google Cloud**: Compute Engine, Cloud Storage, BigQuery  
- **Kubernetes**: Pods, Services, Deployments
- **Docker**: Containers, Images, Volumes
- **DevOps**: Jenkins, GitLab, Terraform

## 🛠 Development

### Project Structure
```
excaliaws/
├── manifest.json              # Extension manifest
├── inject.js                  # Main extension logic
├── background.js              # Service worker
├── icon-packs-config.json     # Icon pack configuration
├── aws-icons-integrated.json  # AWS icons (integrated format)
├── add-icon-pack.js           # Tool for adding new packs
└── CONTRIBUTING.md            # Contribution guide
```

### Key Improvements in v2.0
- **🔗 Integrated Format**: Combined index + icon data (no more fragile arrays!)
- **📊 Rich Metadata**: Keywords, categories, descriptions
- **🔍 Better Search**: Configurable keyword/category search
- **📦 Multi-Pack Support**: Easy to add Azure, GCP, custom packs
- **⚙️ Settings UI**: In-extension configuration
- **🛠 Contributor Tools**: Scripts and guides for adding packs

### Architecture Benefits
- **Maintainable**: Self-contained icon packs with metadata
- **Debuggable**: Named icons (not index-based correlation)
- **Extensible**: Configuration-driven multi-pack system
- **Open Source Ready**: Easy contribution workflow

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for:
- Adding new icon packs (Azure, GCP, etc.)
- Icon quality guidelines  
- Submission process
- Development setup

### Quick Contribution
1. Fork the repo
2. Run `node add-icon-pack.js create your-pack-name`
3. Add your icons to the generated template
4. Test with the extension
5. Submit a pull request

## 📄 License

MIT License - Feel free to use, modify, and distribute.

## 🙏 Acknowledgments

- **AWS** for the architecture icons
- **Excalidraw** for the amazing diagramming tool
- **Contributors** who help expand icon pack support

---

**Made your diagramming workflow faster?** ⭐ Star the repo and share with your team!
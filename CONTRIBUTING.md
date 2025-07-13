# Contributing to Excaliaws

## Adding New Icon Packs

The Excaliaws extension now supports multiple icon packs! You can contribute new icon sets for different cloud providers or services.

### Quick Start

1. **Create a new icon pack template:**
   ```bash
   node add-icon-pack.js create azure
   ```

2. **Edit the generated file** (`azure-icons.json`) to add your icons

3. **Add the pack to the extension:**
   ```bash
   node add-icon-pack.js azure azure-icons.json
   ```

### Icon Pack Format

Icon packs use the `excaliaws-iconpack` format:

```json
{
  "type": "excaliaws-iconpack",
  "version": "1.0",
  "name": "Azure Architecture Icons",
  "description": "Microsoft Azure architecture icons",
  "author": "Microsoft",
  "source": "https://docs.microsoft.com/azure/architecture/",
  "icons": {
    "vm": {
      "name": "Virtual Machine",
      "keywords": ["vm", "virtual machine", "compute", "server"],
      "category": "Compute",
      "description": "Azure Virtual Machine",
      "clipboardData": {
        "type": "excalidraw/clipboard",
        "elements": [
          // Excalidraw drawing elements here
        ],
        "files": {}
      }
    }
  }
}
```

### Icon Properties

Each icon must have:

- **`name`**: Display name (e.g., "Virtual Machine")
- **`keywords`**: Array of search terms (e.g., ["vm", "compute", "server"])
- **`category`**: Service category (e.g., "Compute", "Storage", "Networking")
- **`description`**: Brief description for tooltips
- **`clipboardData`**: Standard Excalidraw clipboard format

### Categories

Use consistent categories across icon packs:

**AWS Categories:**
- Compute
- Storage
- Database
- Networking & Content Delivery
- Security, Identity & Compliance
- Application Integration
- Global Infrastructure
- Business Applications

**Azure Categories:**
- Compute
- Storage
- Databases
- Networking
- Security
- Integration
- Management & Governance
- Web

**GCP Categories:**
- Compute
- Storage
- Databases
- Networking
- Security & Identity
- Data Analytics
- AI & Machine Learning
- Management Tools

### Creating Icons

1. **Design your icon in Excalidraw:**
   - Keep it simple and recognizable
   - Use consistent styling with existing icons
   - Recommended size: ~64x64 pixels

2. **Copy the icon to clipboard** (Ctrl+C in Excalidraw)

3. **Extract the clipboard data:**
   ```javascript
   // In browser console:
   navigator.clipboard.readText().then(text => {
     const data = JSON.parse(text);
     console.log(JSON.stringify(data, null, 2));
   });
   ```

4. **Add to your icon pack** using the extracted elements

### Testing Your Icon Pack

1. **Validate the format:**
   ```bash
   node add-icon-pack.js validate your-pack.json
   ```

2. **Load the extension** in Chrome developer mode

3. **Test on Excalidraw** - search for your icons and verify they work

### Submission Guidelines

1. **Icon Quality:**
   - Vector-based (no raster images)
   - Clean, professional appearance
   - Consistent with official brand guidelines

2. **Metadata Quality:**
   - Accurate, descriptive names
   - Comprehensive keywords for search
   - Proper categorization
   - Meaningful descriptions

3. **File Organization:**
   - One icon pack per cloud provider/service
   - Clear, consistent naming
   - Include source attribution

### Example Contributions

We welcome icon packs for:

- **Cloud Providers:** Azure, GCP, Oracle Cloud, IBM Cloud
- **Services:** Kubernetes, Docker, Terraform, Ansible
- **Databases:** MongoDB, Redis, Elasticsearch
- **Monitoring:** Prometheus, Grafana, Datadog
- **CI/CD:** Jenkins, GitHub Actions, GitLab CI

### Pull Request Process

1. Fork the repository
2. Create your icon pack using the tools provided
3. Test thoroughly with the extension
4. Submit a pull request with:
   - Clear description of the icon pack
   - Screenshots of the icons in use
   - Verification that all icons work correctly

### License

By contributing, you agree that your contributions will be licensed under the same license as this project. Ensure you have rights to use any icons you contribute.

### Getting Help

- Open an issue for questions
- Check existing icon packs for examples
- Join our Discord community for support

---

Thank you for helping make Excaliaws better for everyone! 🎨
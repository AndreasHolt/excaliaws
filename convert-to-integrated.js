#!/usr/bin/env node

/**
 * Convert existing aws-index.json + aws-icon-pack.excalidrawlib 
 * into new integrated format
 */

const fs = require('fs');
const path = require('path');

// AWS Service Categories (for better organization)
const AWS_CATEGORIES = {
  'VPC': 'Networking & Content Delivery',
  'Region': 'Global Infrastructure', 
  'IAM': 'Security, Identity & Compliance',
  'Route53': 'Networking & Content Delivery',
  'EventBridge': 'Application Integration',
  'SNS': 'Application Integration',
  'SQS': 'Application Integration', 
  'SES': 'Business Applications',
  'VPN Gateway': 'Networking & Content Delivery',
  'Internet Gateway': 'Networking & Content Delivery',
  'NAT Gateway': 'Networking & Content Delivery',
  'Lambda': 'Compute',
  'EC2': 'Compute',
  'Permissions': 'Security, Identity & Compliance',
  'Roles': 'Security, Identity & Compliance',
  'NACL': 'Networking & Content Delivery',
  'API Gateway': 'Networking & Content Delivery',
  'Route Table': 'Networking & Content Delivery', 
  'Peering Connection': 'Networking & Content Delivery',
  'ECS': 'Compute',
  'ECR': 'Compute',
  'EKS': 'Compute',
  'S3': 'Storage',
  'EBS': 'Storage',
  'EFS': 'Storage',
  'Event': 'Application Integration',
  'DynamoDB': 'Database',
  'RDS': 'Database',
  'Public Subnet': 'Networking & Content Delivery',
  'Private Subnet': 'Networking & Content Delivery', 
  'CloudFront': 'Networking & Content Delivery',
  'VPN Connection': 'Networking & Content Delivery',
  'Container': 'Compute',
  'Instance': 'Compute',
  'Instances': 'Compute',
  'Spot Instances': 'Compute',
  'Aurora': 'Database',
  'Fargate': 'Compute',
  'Task': 'Compute'
};

// Keywords for better search
const KEYWORDS = {
  'VPC': ['vpc', 'virtual private cloud', 'network', 'isolation'],
  'Region': ['region', 'availability zone', 'geographic'],
  'IAM': ['iam', 'identity', 'access', 'permissions', 'users', 'roles'],
  'Route53': ['route53', 'dns', 'domain', 'routing'],
  'EventBridge': ['eventbridge', 'events', 'serverless', 'integration'],
  'SNS': ['sns', 'notifications', 'messaging', 'push'],
  'SQS': ['sqs', 'queue', 'messaging', 'decouple'],
  'SES': ['ses', 'email', 'smtp', 'sending'],
  'VPN Gateway': ['vpn', 'gateway', 'connection', 'site-to-site'],
  'Internet Gateway': ['igw', 'internet', 'gateway', 'public'],
  'NAT Gateway': ['nat', 'gateway', 'outbound', 'private'],
  'Lambda': ['lambda', 'serverless', 'function', 'compute'],
  'EC2': ['ec2', 'instance', 'virtual machine', 'compute', 'server'],
  'Permissions': ['permissions', 'policy', 'access', 'security'],
  'Roles': ['roles', 'iam', 'assume', 'cross-account'],
  'NACL': ['nacl', 'network acl', 'security', 'subnet'],
  'API Gateway': ['api gateway', 'rest', 'http', 'serverless'],
  'Route Table': ['route table', 'routing', 'subnet', 'traffic'],
  'Peering Connection': ['peering', 'vpc peering', 'connection'],
  'ECS': ['ecs', 'container', 'docker', 'orchestration'],
  'ECR': ['ecr', 'container registry', 'docker images'],
  'EKS': ['eks', 'kubernetes', 'k8s', 'container orchestration'],
  'S3': ['s3', 'storage', 'bucket', 'object storage'],
  'EBS': ['ebs', 'block storage', 'volume', 'disk'],
  'EFS': ['efs', 'file system', 'nfs', 'shared storage'],
  'Event': ['event', 'trigger', 'notification'],
  'DynamoDB': ['dynamodb', 'nosql', 'database', 'key-value'],
  'RDS': ['rds', 'relational database', 'mysql', 'postgres'],
  'Public Subnet': ['public subnet', 'internet accessible', 'igw'],
  'Private Subnet': ['private subnet', 'isolated', 'nat gateway'],
  'CloudFront': ['cloudfront', 'cdn', 'edge locations', 'distribution'],
  'VPN Connection': ['vpn connection', 'site-to-site', 'hybrid'],
  'Container': ['container', 'docker', 'microservices'],
  'Instance': ['instance', 'virtual machine', 'server'],
  'Instances': ['instances', 'multiple servers', 'fleet'],
  'Spot Instances': ['spot instances', 'cost optimization', 'interruption'],
  'Aurora': ['aurora', 'mysql', 'postgres', 'serverless database'],
  'Fargate': ['fargate', 'serverless containers', 'ecs', 'eks'],
  'Task': ['task', 'container task', 'workload']
};

function createIconKey(name) {
  // Convert "API Gateway" to "api-gateway", "VPC" to "vpc", etc.
  return name.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

function convertToIntegratedFormat() {
  try {
    // Read existing files
    const indexPath = path.join(__dirname, 'aws-index.json');
    const libPath = path.join(__dirname, 'aws-icon-pack.excalidrawlib');
    
    console.log('Reading existing files...');
    const names = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const library = JSON.parse(fs.readFileSync(libPath, 'utf8'));
    
    console.log(`Found ${names.length} names and ${library.libraryItems.length} icons`);
    
    if (names.length !== library.libraryItems.length) {
      throw new Error(`Mismatch: ${names.length} names vs ${library.libraryItems.length} icons`);
    }
    
    // Create new integrated format
    const integrated = {
      type: "excaliaws-iconpack",
      version: "1.0",
      name: "AWS Architecture Icons",
      description: "Official AWS architecture icons for Excalidraw diagrams",
      author: "AWS",
      source: "https://aws.amazon.com/architecture/icons/",
      icons: {}
    };
    
    // Convert each icon
    console.log('Converting icons...');
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      const iconData = library.libraryItems[i];
      const key = createIconKey(name);
      
      integrated.icons[key] = {
        name: name,
        keywords: KEYWORDS[name] || [name.toLowerCase()],
        category: AWS_CATEGORIES[name] || 'Other',
        description: `AWS ${name} icon for architecture diagrams`,
        clipboardData: iconData
      };
      
      console.log(`✓ Converted: ${name} -> ${key}`);
    }
    
    // Write new integrated file
    const outputPath = path.join(__dirname, 'aws-icons-integrated.json');
    fs.writeFileSync(outputPath, JSON.stringify(integrated, null, 2));
    
    console.log(`\n✅ Created integrated icon pack: ${outputPath}`);
    console.log(`📊 Total icons: ${Object.keys(integrated.icons).length}`);
    console.log(`📝 Categories: ${new Set(Object.values(integrated.icons).map(icon => icon.category)).size}`);
    
    // Generate summary
    const categories = {};
    Object.values(integrated.icons).forEach(icon => {
      categories[icon.category] = (categories[icon.category] || 0) + 1;
    });
    
    console.log('\n📋 Icon distribution by category:');
    Object.entries(categories)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`   ${category}: ${count} icons`);
      });
    
    return integrated;
    
  } catch (error) {
    console.error('❌ Error converting files:', error.message);
    process.exit(1);
  }
}

// Run conversion if called directly
if (require.main === module) {
  convertToIntegratedFormat();
}

module.exports = { convertToIntegratedFormat };
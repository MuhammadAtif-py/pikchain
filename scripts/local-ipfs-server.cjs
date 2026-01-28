/**
 * Local IPFS Mock Server
 * Replaces Pinata API for local development - NO API KEYS NEEDED!
 * 
 * This stores files locally and returns fake CIDs based on file hash.
 * Run with: node scripts/local-ipfs-server.cjs
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 3001;
const UPLOAD_DIR = path.join(__dirname, '../.local-ipfs');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Simple multipart form parser
function parseMultipart(buffer, boundary) {
  const parts = [];
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let start = buffer.indexOf(boundaryBuffer) + boundaryBuffer.length;
  
  while (start < buffer.length) {
    const end = buffer.indexOf(boundaryBuffer, start);
    if (end === -1) break;
    
    const part = buffer.slice(start, end);
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd !== -1) {
      const headers = part.slice(0, headerEnd).toString();
      let content = part.slice(headerEnd + 4);
      
      // Remove trailing \r\n
      if (content.length >= 2 && content[content.length - 2] === 0x0d && content[content.length - 1] === 0x0a) {
        content = content.slice(0, -2);
      }
      
      const filenameMatch = headers.match(/filename="([^"]+)"/);
      if (filenameMatch) {
        parts.push({
          filename: filenameMatch[1],
          content: content
        });
      }
    }
    start = end + boundaryBuffer.length;
  }
  return parts;
}

// Generate fake IPFS CID from content hash
function generateCID(content) {
  const hash = crypto.createHash('sha256').update(content).digest('hex');
  // Return a fake but consistent CID (Qm prefix like real IPFS v0)
  return 'Qm' + hash.substring(0, 44);
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, pinata_api_key, pinata_secret_api_key');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Handle file upload (mimics Pinata API)
  if (req.method === 'POST' && req.url === '/pinning/pinFileToIPFS') {
    const chunks = [];
    
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const contentType = req.headers['content-type'] || '';
        const boundaryMatch = contentType.match(/boundary=([^;]+)/);
        
        if (!boundaryMatch) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing boundary in content-type' }));
          return;
        }
        
        const parts = parseMultipart(buffer, boundaryMatch[1]);
        
        if (parts.length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'No file found in request' }));
          return;
        }
        
        const file = parts[0];
        const cid = generateCID(file.content);
        const filePath = path.join(UPLOAD_DIR, cid);
        
        // Save file locally
        fs.writeFileSync(filePath, file.content);
        
        // Also save metadata
        const metaPath = path.join(UPLOAD_DIR, `${cid}.meta.json`);
        fs.writeFileSync(metaPath, JSON.stringify({
          filename: file.filename,
          size: file.content.length,
          timestamp: new Date().toISOString()
        }, null, 2));
        
        console.log(`📁 Stored: ${file.filename} -> ${cid} (${file.content.length} bytes)`);
        
        // Return Pinata-compatible response
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          IpfsHash: cid,
          PinSize: file.content.length,
          Timestamp: new Date().toISOString()
        }));
        
      } catch (error) {
        console.error('Upload error:', error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
    return;
  }
  
  // Serve files by CID (like IPFS gateway)
  if (req.method === 'GET' && req.url.startsWith('/ipfs/')) {
    const cid = req.url.replace('/ipfs/', '');
    const filePath = path.join(UPLOAD_DIR, cid);
    
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      
      // Try to detect content type from metadata
      const metaPath = path.join(UPLOAD_DIR, `${cid}.meta.json`);
      let contentType = 'application/octet-stream';
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        const ext = path.extname(meta.filename).toLowerCase();
        const types = {
          '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
          '.png': 'image/png', '.gif': 'image/gif',
          '.webp': 'image/webp', '.svg': 'image/svg+xml'
        };
        contentType = types[ext] || contentType;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      return;
    }
    
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'File not found' }));
    return;
  }
  
  // Health check
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      service: 'Local IPFS Mock (Pinata-compatible)',
      uploadEndpoint: '/pinning/pinFileToIPFS',
      gatewayEndpoint: '/ipfs/:cid'
    }));
    return;
  }
  
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log('');
  console.log('🌐 ════════════════════════════════════════════════════════');
  console.log('   LOCAL IPFS SERVER RUNNING');
  console.log('   ────────────────────────────────────────────────────────');
  console.log(`   📤 Upload API:  http://localhost:${PORT}/pinning/pinFileToIPFS`);
  console.log(`   📥 Gateway:     http://localhost:${PORT}/ipfs/<CID>`);
  console.log(`   📁 Storage:     ${UPLOAD_DIR}`);
  console.log('   ────────────────────────────────────────────────────────');
  console.log('   No API keys required! Files stored locally.');
  console.log('🌐 ════════════════════════════════════════════════════════');
  console.log('');
});

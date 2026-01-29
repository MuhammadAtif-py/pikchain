// Vercel serverless function to proxy IPFS requests
// This bypasses client-side ISP blocking

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { cid } = req.query;
  
  if (!cid) {
    return res.status(400).json({ error: 'CID parameter required' });
  }

  // Try multiple gateways server-side
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://dweb.link/ipfs/${cid}`,
    `https://cf-ipfs.com/ipfs/${cid}`,
  ];

  const errors = [];

  for (const url of gateways) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      errors.push({ url, status: response.status, ok: response.ok });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await response.arrayBuffer();
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        
        return res.send(Buffer.from(arrayBuffer));
      }
    } catch (error) {
      errors.push({ url, error: error.message });
      continue;
    }
  }

  return res.status(404).json({ 
    error: 'Failed to fetch from all gateways', 
    cid,
    attempts: errors 
  });
}

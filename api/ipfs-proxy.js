// Vercel serverless function to proxy IPFS requests
// This bypasses client-side ISP blocking

export default async function handler(req, res) {
  const { cid } = req.query;
  
  if (!cid) {
    return res.status(400).json({ error: 'CID parameter required' });
  }

  // Try multiple gateways server-side
  const gateways = [
    `https://gateway.pinata.cloud/ipfs/${cid}`,
    `https://ipfs.io/ipfs/${cid}`,
    `https://cloudflare-ipfs.com/ipfs/${cid}`,
  ];

  for (const url of gateways) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
        },
        timeout: 5000,
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const buffer = await response.arrayBuffer();
        
        res.setHeader('Content-Type', contentType || 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Access-Control-Allow-Origin', '*');
        
        return res.send(Buffer.from(buffer));
      }
    } catch (error) {
      console.error(`Gateway ${url} failed:`, error.message);
      continue;
    }
  }

  return res.status(404).json({ error: 'Failed to fetch from all gateways' });
}

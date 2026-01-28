// Custom buffer shim to satisfy libraries expecting require('buffer').Buffer
import { Buffer as NodeBuffer } from 'buffer';

if (!globalThis.Buffer) {
  globalThis.Buffer = NodeBuffer;
}

// Provide both named and default export shapes similar to Node's buffer module
export const Buffer = NodeBuffer;
export default { Buffer: NodeBuffer };

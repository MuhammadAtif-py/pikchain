const ENABLED = import.meta.env.VITE_ENABLE_DEBUG === 'true';
const LEVEL = (import.meta.env.VITE_LOG_LEVEL || 'info').toLowerCase();
const ORDER = ['error','warn','info','debug'];
const threshold = ORDER.indexOf(LEVEL);

function emit(level, args){
  if(!ENABLED) return;
  if(ORDER.indexOf(level) > threshold) return;
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level]('[pikchain]', ts, level.toUpperCase()+':', ...args);
}

export default {
  error: (...a)=>emit('error', a),
  warn: (...a)=>emit('warn', a),
  info: (...a)=>emit('info', a),
  debug: (...a)=>emit('debug', a),
};

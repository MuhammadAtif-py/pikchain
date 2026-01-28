import { useEffect, useMemo, useState } from 'react';
import { useAccount, useNetwork } from 'wagmi';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { AMOY_CHAIN_ID } from '../utils/provider';
import { loadTxHistory } from '../utils/txHistory';

function last7Days() {
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { weekday: 'short' });
    days.push({ key, label, uploads: 0 });
  }
  return days;
}

export default function AnalyticsPage() {
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const chainId = chain?.id || AMOY_CHAIN_ID;

  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!address) {
      setRows([]);
      return;
    }
    setRows(loadTxHistory(chainId, address));
  }, [chainId, address]);

  const stats = useMemo(() => {
    const uploads = rows.filter((r) => r?.action === 'addCID');
    const totalUploads = uploads.length;

    const todayKey = new Date().toISOString().slice(0, 10);
    const todayUploads = uploads.filter((r) => {
      const ts = r.blockTimestamp || r.createdAt;
      if (!ts) return false;
      return new Date(ts).toISOString().slice(0, 10) === todayKey;
    }).length;

    const totalGas = uploads.reduce((acc, r) => {
      const n = Number(r.gasUsed);
      return acc + (Number.isFinite(n) ? n : 0);
    }, 0);

    const chart = last7Days();
    const byKey = new Map(chart.map((d) => [d.key, d]));
    for (const r of uploads) {
      const ts = r.blockTimestamp || r.createdAt;
      if (!ts) continue;
      const key = new Date(ts).toISOString().slice(0, 10);
      const slot = byKey.get(key);
      if (slot) slot.uploads += 1;
    }

    return { totalUploads, todayUploads, totalGas, chart };
  }, [rows]);

  if (!isConnected) {
    return (
      <div className="w-full p-5">
        <div className="p-4 rounded-xl bg-white/10">Connect wallet to see analytics.</div>
      </div>
    );
  }

  return (
    <div className="w-full p-5">
      <h1 className="text-2xl font-extrabold text-transparent bg-gradient-to-t from-teal-500 to-fuchsia-500 bg-clip-text">
        Analytics
      </h1>

      <div className="grid grid-cols-1 gap-4 mt-4 md:grid-cols-3">
        <div className="p-4 rounded-xl bg-white/10">
          <div className="text-xs text-slate-300">Total uploads</div>
          <div className="mt-1 text-3xl font-extrabold">{stats.totalUploads}</div>
        </div>
        <div className="p-4 rounded-xl bg-white/10">
          <div className="text-xs text-slate-300">Today uploads</div>
          <div className="mt-1 text-3xl font-extrabold">{stats.todayUploads}</div>
        </div>
        <div className="p-4 rounded-xl bg-white/10">
          <div className="text-xs text-slate-300">Total gas used</div>
          <div className="mt-1 text-3xl font-extrabold">{stats.totalGas.toLocaleString()}</div>
        </div>
      </div>

      <div className="p-4 mt-4 rounded-xl bg-white/10">
        <div className="text-sm font-semibold">Uploads (last 7 days)</div>
        <div className="h-[280px] mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats.chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.7)" />
              <YAxis allowDecimals={false} stroke="rgba(255,255,255,0.7)" />
              <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)' }} />
              <Line type="monotone" dataKey="uploads" stroke="#14b8a6" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-xs text-slate-400">Based on your locally tracked transactions.</div>
      </div>
    </div>
  );
}

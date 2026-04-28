import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Echo from '@/lib/echo';
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('@/components/ui/chart'), { ssr: false });

export default function MatchPage() {
  const router = useRouter();
  const { id } = router.query;
  const [history, setHistory] = useState([]);
  const [aggregate, setAggregate] = useState(null);
  const [tips, setTips] = useState({selection: 'home', odd: '', stake: ''});

  useEffect(() => {
    if (!id) return;
    fetch(`/api/fixtures/${id}/odds/history?market=1X2`).then(r => r.json()).then(d => setHistory(d.history || []));
    fetch(`/api/fixtures/${id}/odds`).then(r => r.json()).then(d => setAggregate(d.aggregates || null));

    const channel = Echo.channel('match.' + id);
    channel.listen('OddsAggregateUpdated', (e) => {
      setAggregate(prev => ({...prev, [e.market]: e.aggregate}));
    });

    return () => {
      if (channel && channel.stopListening) channel.stopListening('OddsAggregateUpdated');
    };
  }, [id]);

  const submitTip = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/tips', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({fixture_id: id, market: '1X2', selection: tips.selection, odd_posted: tips.odd, stake: tips.stake})});
    if (res.ok) alert('Tip created');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Match {id}</h1>
      <div className="mb-6">
        <h3 className="font-semibold">Odds Movement (1X2)</h3>
        <Chart data={history} />
      </div>
      <div className="mb-6">
        <h3 className="font-semibold">Aggregates</h3>
        <pre>{JSON.stringify(aggregate, null, 2)}</pre>
      </div>

      <form onSubmit={submitTip} className="space-y-3">
        <div>
          <label className="block">Selection</label>
          <select value={tips.selection} onChange={e => setTips(p => ({...p, selection: e.target.value}))}>
            <option value="home">Home</option>
            <option value="draw">Draw</option>
            <option value="away">Away</option>
          </select>
        </div>
        <div>
          <label className="block">Odd</label>
          <input value={tips.odd} onChange={e => setTips(p => ({...p, odd: e.target.value}))} />
        </div>
        <div>
          <label className="block">Stake</label>
          <input value={tips.stake} onChange={e => setTips(p => ({...p, stake: e.target.value}))} />
        </div>
        <button className="btn">Create Tip</button>
      </form>
    </div>
  );
}

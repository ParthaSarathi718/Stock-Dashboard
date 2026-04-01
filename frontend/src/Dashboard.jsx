import React, { useState, useEffect } from 'react';
import { 
  fetchCompanies, fetchStockData, fetchSummary, 
  getWatchlist, addToWatchlist, removeFromWatchlist 
} from './api';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { DollarSign, Activity, TrendingUp, LogOut, Star } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ margin: '4px 0 0', color: entry.color }}>
            {entry.name}: {entry.name.includes('Return') || entry.name.includes('%') 
              ? `${entry.value}%` 
              : `$${entry.value.toFixed(2)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard({ user, onLogout }) {
  const [companies, setCompanies] = useState([]);
  const [selectedStock, setSelectedStock] = useState('AAPL');
  
  const [stockData, setStockData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies().then(setCompanies).catch(console.error);
    getWatchlist().then(setWatchlist).catch(console.error);
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [data, sumReq] = await Promise.all([
          fetchStockData(selectedStock),
          fetchSummary(selectedStock)
        ]);
        
        if (!isMounted) return;
        setStockData(data);
        setSummary(sumReq);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadDashboardData();
    return () => { isMounted = false; };
  }, [selectedStock]);

  const handleToggleWatchlist = async () => {
    const isSaved = watchlist.some(w => w.symbol === selectedStock);
    try {
      if (isSaved) {
        await removeFromWatchlist(selectedStock);
        setWatchlist(watchlist.filter(w => w.symbol !== selectedStock));
      } else {
        const newItem = await addToWatchlist(selectedStock);
        setWatchlist([...watchlist, newItem]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const isCurrentSaved = watchlist.some(w => w.symbol === selectedStock);

  if (loading || !summary) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Analyzing Market Data...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="header animated-entry">
        <div>
          <h1>Stock Data Intelligence</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Welcome back, <strong>{user.username}</strong></p>
        </div>
        
        <div className="selector-wrapper">
          <select 
            value={selectedStock} 
            onChange={(e) => setSelectedStock(e.target.value)}
          >
            {companies.map(c => (
              <option key={c.symbol} value={c.symbol}>
                {c.symbol} - {c.name}
              </option>
            ))}
          </select>

          <button 
            className={`watchlist-btn ${isCurrentSaved ? 'saved' : ''}`}
            onClick={handleToggleWatchlist}
          >
            <Star size={18} fill={isCurrentSaved ? 'currentColor' : 'none'} />
            {isCurrentSaved ? 'Saved' : 'Save'}
          </button>

          <button className="logout-btn" onClick={onLogout}>
            <LogOut size={16} style={{display: 'inline', verticalAlign: 'middle', marginRight: '4px'}}/>
            Logout
          </button>
        </div>
      </div>

      <div className="summary-grid animated-entry" style={{ animationDelay: '0.1s' }}>
        <div className="glass-panel summary-card">
          <div className="summary-label">
            <DollarSign size={16} color="var(--accent-color)"/> Latest Price
          </div>
          <div className="summary-value">${summary.latest_price}</div>
        </div>

        <div className="glass-panel summary-card">
          <div className="summary-label">
            <TrendingUp size={16} color={summary.trend.includes('Up') ? 'var(--success-color)' : 'var(--danger-color)'}/> Trend
          </div>
          <div className={`summary-value ${summary.trend.includes('Up') ? 'value-green' : 'value-red'}`}>
            {summary.trend}
          </div>
        </div>

        <div className="glass-panel summary-card">
          <div className="summary-label">
            <Activity size={16} color="var(--accent-color)"/> Volatility
          </div>
          <div className="summary-value">
            {summary.volatility.status} 
            <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginLeft: '8px' }}>
              ({summary.volatility.score})
            </span>
          </div>
        </div>
      </div>

      <div className="charts-grid animated-entry" style={{ animationDelay: '0.2s' }}>
        <div className="glass-panel" style={{ gridColumn: '1 / -1' }}>
          <h2>30-Day Price Action & Moving Averages</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stockData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--glass-border)" vertical={false} />
                <XAxis dataKey="Date" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                <YAxis domain={['auto', 'auto']} stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
                <Line type="monotone" dataKey="Close" stroke="#58a6ff" strokeWidth={3} dot={false} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="MA_7" name="7-Day MA" stroke="#3fb950" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="MA_30" name="30-Day MA" stroke="#f85149" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel">
          <h2>Tomorrow's AI Forecast (Random Forest)</h2>
          <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '3rem', margin: '1rem 0', color: summary.ai_prediction.direction.includes('UP') ? 'var(--success-color)' : 'var(--danger-color)' }}>
              {summary.ai_prediction.direction}
            </h3>
            <p style={{ color: 'var(--text-secondary)' }}>
              Model Confidence: <strong style={{ color: 'var(--text-primary)'}}>{summary.ai_prediction.probability_percent}%</strong>
            </p>
            <div style={{ marginTop: '1.5rem', height: '8px', background: 'var(--glass-border)', borderRadius: '4px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  width: `${summary.ai_prediction.probability_percent}%`, 
                  height: '100%', 
                  background: summary.ai_prediction.direction.includes('UP') ? 'var(--success-color)' : 'var(--danger-color)',
                  transition: 'width 1s ease-out'
                }} 
              />
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Forecast generated using a Random Forest Classifier trained on Moving Averages and Volume momentum.
            </p>
          </div>
        </div>

        <div className="glass-panel">
          <h2>Your Watchlist</h2>
          {watchlist.length === 0 ? (
            <div style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)'}}>
              No stocks saved yet.<br/>Click "Save" at the top to track assets.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
              {watchlist.map(item => (
                <div 
                  key={item.symbol} 
                  style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px',
                    border: '1px solid var(--glass-border)', cursor: 'pointer', transition: 'border 0.2s'
                  }}
                  onClick={() => setSelectedStock(item.symbol)}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-color)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                >
                  <strong style={{ fontSize: '1.1rem' }}>{item.symbol}</strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)'}}>Analyze ➔</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

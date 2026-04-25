import React from 'react';

interface HeaderProps {
  lastUpdated: Date | null;
}

const pulseKeyframes = `
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
`;

const Header: React.FC<HeaderProps> = ({ lastUpdated }) => {
  const formattedTime = lastUpdated
    ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
    : 'Never';

  return (
    <>
      <style>{pulseKeyframes}</style>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 24px',
          backgroundColor: '#1a1a2e',
          borderBottom: '1px solid #2d2d4e',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '0.5px' }}>
            Acme Logistics
          </span>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#0d2b1a',
              border: '1px solid #1a5c35',
              borderRadius: '12px',
              padding: '3px 10px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#22c55e',
                display: 'inline-block',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#22c55e' }}>
              Live
            </span>
          </div>
        </div>
        <span style={{ fontSize: '13px', color: '#9ca3af' }}>{formattedTime}</span>
      </header>
    </>
  );
};

export default Header;

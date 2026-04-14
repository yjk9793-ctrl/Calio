'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <>
      <style>{`
        .splash-wrap {
          width: 100%;
          height: 100dvh;
          background: #0F0E0D;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: 60px 28px max(40px, env(safe-area-inset-bottom, 40px));
          overflow: hidden;
        }
        .splash-btn {
          width: 100%;
          padding: 18px;
          border-radius: 16px;
          background: #D85A30;
          color: #fff;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 17px;
          font-weight: 700;
          border: none;
          cursor: pointer;
          letter-spacing: 0.01em;
          margin-bottom: 14px;
          -webkit-tap-highlight-color: transparent;
        }
        .splash-login {
          text-align: center;
          font-size: 14px;
          color: rgba(255,255,255,0.25);
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 300;
          padding-bottom: max(8px, env(safe-area-inset-bottom, 8px));
        }
        .splash-tagline {
          font-size: 16px;
          color: rgba(255,255,255,0.5);
          text-align: center;
          line-height: 1.65;
          font-style: italic;
          font-weight: 300;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
      `}</style>

      <div className="splash-wrap">

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 56, fontWeight: 800, color: '#fff',
              letterSpacing: '-2px', lineHeight: 1,
            }}>cali</span>
            <svg width="40" height="56" viewBox="0 0 40 56" style={{ overflow: 'visible' }}>
              <circle cx="20" cy="33" r="14" fill="none" stroke="rgba(216,90,48,0.22)" strokeWidth="9"/>
              <circle cx="20" cy="33" r="14" fill="none" stroke="#D85A30" strokeWidth="9"
                strokeDasharray="74 15" strokeLinecap="butt" transform="rotate(-90 20 33)"/>
              <circle cx="20" cy="19" r="4.5" fill="#D85A30"/>
            </svg>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.22em', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 300 }}>
            EAT · LIVE · BURN
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <svg width="210" height="210" viewBox="0 0 210 210">
            <circle cx="105" cy="105" r="84" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="30"/>
            <circle cx="105" cy="105" r="84" fill="none" stroke="#D85A30" strokeWidth="30"
              strokeDasharray="528" strokeDashoffset="150" strokeLinecap="butt"
              transform="rotate(-90 105 105)" opacity="0.9"/>
            <circle cx="105" cy="105" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="17"/>
            <circle cx="105" cy="105" r="52" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="17"
              strokeDasharray="327" strokeDashoffset="130" strokeLinecap="butt"
              transform="rotate(-90 105 105)"/>
            <text x="105" y="93" textAnchor="middle"
              style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 14, fontWeight: 700, fill: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>TODAY</text>
            <text x="105" y="120" textAnchor="middle"
              style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 34, fontWeight: 800, fill: '#fff' }}>−512</text>
            <text x="105" y="137" textAnchor="middle"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, fontWeight: 300, fill: 'rgba(255,255,255,0.35)' }}>kcal remaining</text>
          </svg>
          <div className="splash-tagline">오늘 뭐 먹었어?,<br/>칼리오에게 물어봐.</div>
        </div>

        <div style={{ width: '100%' }}>
          <button className="splash-btn" onClick={() => router.push('/intro')}>시작하기</button>
          <div className="splash-login" onClick={() => router.push('/auth')}>이미 계정이 있어요</div>
        </div>

      </div>
    </>
  )
}
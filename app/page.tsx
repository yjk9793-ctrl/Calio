'use client'

import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0F0E0D',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '60px 32px calc(56px + env(safe-area-inset-bottom))',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>

      {/* 상단 로고 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 0 }}>
          <span style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 52,
            fontWeight: 800,
            color: '#fff',
            letterSpacing: '-2px',
            lineHeight: 1,
          }}>cali</span>
          <svg width="38" height="52" viewBox="0 0 38 52" style={{ overflow: 'visible' }}>
            <circle cx="19" cy="31" r="13.5" fill="none" stroke="rgba(216,90,48,0.22)" strokeWidth="8.5"/>
            <circle cx="19" cy="31" r="13.5" fill="none" stroke="#D85A30" strokeWidth="8.5"
              strokeDasharray="71 14" strokeLinecap="butt"
              transform="rotate(-90 19 31)"/>
            <circle cx="19" cy="17.5" r="4.25" fill="#D85A30"/>
          </svg>
        </div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.22em', fontWeight: 300 }}>
          EAT · LIVE · BURN
        </div>
      </div>

      {/* 중앙 링 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
        <svg width="200" height="200" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="28"/>
          <circle cx="100" cy="100" r="80" fill="none" stroke="#D85A30" strokeWidth="28"
            strokeDasharray="503" strokeDashoffset="144" strokeLinecap="butt"
            transform="rotate(-90 100 100)" opacity="0.9"/>
          <circle cx="100" cy="100" r="50" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="16"/>
          <circle cx="100" cy="100" r="50" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="16"
            strokeDasharray="314" strokeDashoffset="125" strokeLinecap="butt"
            transform="rotate(-90 100 100)"/>
          <text x="100" y="90" textAnchor="middle"
            style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 13, fontWeight: 700, fill: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em' }}>
            TODAY
          </text>
          <text x="100" y="116" textAnchor="middle"
            style={{ fontFamily: 'Bricolage Grotesque, sans-serif', fontSize: 32, fontWeight: 800, fill: '#fff' }}>
            −512
          </text>
          <text x="100" y="132" textAnchor="middle"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 11, fontWeight: 300, fill: 'rgba(255,255,255,0.35)' }}>
            kcal remaining
          </text>
        </svg>

        <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 1.65, fontStyle: 'italic', fontWeight: 300 }}>
          먹은 만큼 살고,<br/>사는 만큼 태운다.
        </div>
      </div>

      {/* 하단 버튼 */}
      <div style={{ width: '100%', maxWidth: 400 }}>
        <button
          onClick={() => router.push('/auth')}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 14,
            background: '#D85A30',
            color: '#fff',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: 16,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.01em',
            marginBottom: 12,
          }}>
          시작하기
        </button>
        <div style={{ textAlign: 'center' }}>
          <span
            onClick={() => router.push('/auth')}
            style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', cursor: 'pointer', fontWeight: 300 }}>
            이미 계정이 있어요
          </span>
        </div>
      </div>

    
    </div>
  )
}
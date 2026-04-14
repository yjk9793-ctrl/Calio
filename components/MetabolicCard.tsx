'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Props {
  recordDays?: number
  kcalGoal?: number
}

export default function MetabolicCard({ recordDays = 0, kcalGoal = 2000 }: Props) {
  const router = useRouter()
  const [pulse, setPulse] = useState(false)

  // 3초마다 펄스 애니메이션
  useEffect(() => {
    const t = setInterval(() => {
      setPulse(true)
      setTimeout(() => setPulse(false), 800)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  const progress = Math.min((recordDays / 90) * 100, 100)

  return (
    <>
      <style>{`
        .mc-wrap {
          margin: 0 16px 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }

        .mc-card {
          background: #F7EDE8;
          border-radius: 22px;
          padding: 20px;
          border: 1px solid rgba(216,90,48,0.15);
          transition: transform 0.18s ease;
          position: relative;
          overflow: hidden;
        }
        .mc-card:active { transform: scale(0.97); }

        /* 배경 원형 장식 */
        .mc-deco1 {
          position: absolute;
          top: -30px; right: -30px;
          width: 130px; height: 130px;
          border-radius: 50%;
          background: rgba(216,90,48,0.08);
          pointer-events: none;
        }
        .mc-deco2 {
          position: absolute;
          bottom: -20px; right: 30px;
          width: 80px; height: 80px;
          border-radius: 50%;
          background: rgba(216,90,48,0.05);
          pointer-events: none;
        }

        /* 상단 행 */
        .mc-top {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 16px;
        }

        /* DNA 아이콘 */
        .mc-icon-wrap {
          width: 54px; height: 54px;
          border-radius: 16px;
          background: #fff;
          border: 1px solid rgba(216,90,48,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.4s ease;
        }
        .mc-icon-wrap.pulse {
          transform: scale(1.12);
        }

        .mc-text { flex: 1; }
        .mc-label {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #D85A30;
          margin-bottom: 5px;
        }
        .mc-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 19px;
          font-weight: 800;
          color: #1A1916;
          letter-spacing: -0.3px;
          line-height: 1.2;
          margin-bottom: 5px;
        }
        .mc-sub {
          font-size: 13px;
          color: #7A6A62;
          font-weight: 300;
          line-height: 1.5;
        }
        .mc-sub em {
          color: #D85A30;
          font-style: normal;
          font-weight: 500;
        }

        /* 진행 바 */
        .mc-progress { margin-bottom: 14px; }
        .mc-progress-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 7px;
        }
        .mc-progress-lbl {
          font-size: 12px;
          color: #A08070;
          font-weight: 300;
        }
        .mc-progress-pct {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 12px;
          font-weight: 800;
          color: #D85A30;
        }
        .mc-progress-bg {
          height: 6px;
          background: rgba(216,90,48,0.12);
          border-radius: 3px;
          overflow: hidden;
        }
        .mc-progress-fill {
          height: 100%;
          border-radius: 3px;
          background: linear-gradient(90deg, #D85A30, #FF8A60);
          transition: width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* 하단 CTA 행 */
        .mc-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .mc-cta {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #D85A30;
          border-radius: 22px;
          padding: 8px 16px;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          transition: transform 0.15s;
        }
        .mc-cta-arrow {
          display: inline-block;
          transition: transform 0.3s ease;
        }
        .mc-card:hover .mc-cta-arrow { transform: translateX(3px); }

        .mc-days-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          background: rgba(216,90,48,0.12);
          border-radius: 20px;
          padding: 6px 12px;
        }
        .mc-days-dot {
          width: 6px; height: 6px;
          border-radius: 3px;
          background: #D85A30;
        }
        .mc-days-txt {
          font-size: 12px;
          font-weight: 500;
          color: #993C1D;
        }

        @keyframes mcBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .mc-days-dot-anim {
          animation: mcBlink 2s ease-in-out infinite;
        }
      `}</style>

      <div className="mc-wrap" onClick={() => router.push('/metabolic')}>
        <div className="mc-card">
          <div className="mc-deco1"/>
          <div className="mc-deco2"/>

          {/* 상단 */}
          <div className="mc-top">
            {/* DNA SVG 아이콘 */}
            <div className={`mc-icon-wrap${pulse ? ' pulse' : ''}`}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M9 4C9 4 10.5 7 14 7C17.5 7 19 4 19 4" stroke="#D85A30" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M9 24C9 24 10.5 21 14 21C17.5 21 19 24 19 24" stroke="#D85A30" strokeWidth="1.8" strokeLinecap="round"/>
                <line x1="14" y1="4" x2="14" y2="24" stroke="rgba(216,90,48,0.25)" strokeWidth="1.2" strokeDasharray="2 2"/>
                <path d="M9 10C9 10 10.5 13 14 13C17.5 13 19 10 19 10" stroke="#993C1D" strokeWidth="1.8" strokeLinecap="round"/>
                <path d="M9 18C9 18 10.5 15 14 15C17.5 15 19 18 19 18" stroke="#993C1D" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="9" cy="4"  r="2" fill="#FAECE7" stroke="#D85A30" strokeWidth="1.2"/>
                <circle cx="19" cy="4" r="2" fill="#FAECE7" stroke="#D85A30" strokeWidth="1.2"/>
                <circle cx="9" cy="10"  r="2" fill="#FAECE7" stroke="#993C1D" strokeWidth="1.2"/>
                <circle cx="19" cy="10" r="2" fill="#FAECE7" stroke="#993C1D" strokeWidth="1.2"/>
                <circle cx="9" cy="18"  r="2" fill="#FAECE7" stroke="#993C1D" strokeWidth="1.2"/>
                <circle cx="19" cy="18" r="2" fill="#FAECE7" stroke="#993C1D" strokeWidth="1.2"/>
                <circle cx="9" cy="24"  r="2" fill="#FAECE7" stroke="#D85A30" strokeWidth="1.2"/>
                <circle cx="19" cy="24" r="2" fill="#FAECE7" stroke="#D85A30" strokeWidth="1.2"/>
              </svg>
            </div>

            <div className="mc-text">
              <div className="mc-label">AI 개인화</div>
              <div className="mc-title">내 몸 대사 모델</div>
              <div className="mc-sub">
                <em>AI로 맞춤화된 식단</em>을<br/>관리받으세요.
              </div>
            </div>
          </div>

          {/* 진행 바 */}
          <div className="mc-progress">
            <div className="mc-progress-row">
              <span className="mc-progress-lbl">
                {recordDays < 90 ? `${recordDays}일 기록 중 · 90일이면 완성` : '내 몸 모델 완성!'}
              </span>
              <span className="mc-progress-pct">{Math.round(progress)}%</span>
            </div>
            <div className="mc-progress-bg">
              <div className="mc-progress-fill" style={{ width:`${progress}%` }}/>
            </div>
          </div>

          {/* 하단 */}
          <div className="mc-bottom">
            <div className="mc-days-badge">
              <div className={`mc-days-dot${recordDays > 0 ? ' mc-days-dot-anim' : ''}`}/>
              <span className="mc-days-txt">
                {recordDays > 0 ? `${recordDays}일째 학습 중` : '기록을 시작해보세요'}
              </span>
            </div>
            <div className="mc-cta">
              자세히 보기
              <span className="mc-cta-arrow">→</span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

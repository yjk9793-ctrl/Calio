'use client'

import { useRouter } from 'next/navigation'

interface Props {
  recordDays?: number
  kcalGoal?: number
}

export default function MetabolicCard({ recordDays = 0, kcalGoal = 2000 }: Props) {
  const router = useRouter()

  return (
    <>
      <style>{`
        .mc-banner {
          margin: 0 16px 12px;
          background: #0F0E0D;
          border-radius: 18px;
          padding: 16px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          cursor: pointer;
          transition: transform 0.15s;
          position: relative;
          overflow: hidden;
        }
        .mc-banner:active { transform: scale(0.98); }

        .mc-banner-glow {
          position: absolute;
          top: -20px; right: -20px;
          width: 100px; height: 100px;
          border-radius: 50%;
          background: rgba(216,90,48,0.12);
          pointer-events: none;
        }

        .mc-banner-ic {
          width: 46px; height: 46px;
          border-radius: 14px;
          background: rgba(216,90,48,0.15);
          border: 1px solid rgba(216,90,48,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0;
        }

        .mc-banner-body { flex: 1; }

        .mc-banner-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 15px; font-weight: 800;
          color: #fff; margin-bottom: 4px;
        }

        .mc-banner-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          font-weight: 300;
          line-height: 1.5;
        }

        .mc-banner-sub strong {
          color: #D85A30;
          font-weight: 600;
        }

        .mc-banner-arr {
          width: 28px; height: 28px;
          border-radius: 14px;
          background: rgba(255,255,255,0.08);
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; color: rgba(255,255,255,0.4);
          flex-shrink: 0;
        }

        .mc-banner-days {
          position: absolute;
          top: 12px; right: 50px;
          background: rgba(29,158,117,0.2);
          border: 1px solid rgba(29,158,117,0.3);
          border-radius: 20px;
          padding: 3px 8px;
          font-size: 10px; font-weight: 600;
          color: #1D9E75;
        }
      `}</style>

      <div className="mc-banner" onClick={() => router.push('/metabolic')}>
        <div className="mc-banner-glow"/>

        <div className="mc-banner-ic">🧬</div>

        <div className="mc-banner-body">
          <div className="mc-banner-title">내 몸 대사 모델</div>
          <div className="mc-banner-sub">
            <strong>AI로 맞춤화된 식단</strong>을 관리받으세요.
          </div>
        </div>

        {recordDays > 0 && (
          <div className="mc-banner-days">{recordDays}일</div>
        )}

        <div className="mc-banner-arr">›</div>
      </div>
    </>
  )
}

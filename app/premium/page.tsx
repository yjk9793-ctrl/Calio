'use client'

import { useRouter } from 'next/navigation'

export default function PremiumPage() {
  const router = useRouter()

  return (
    <>
      <style>{`
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        .pw {
          min-height:100dvh;
          background:#0F0E0D;
          font-family:'Plus Jakarta Sans',sans-serif;
          max-width:430px;
          margin:0 auto;
          display:flex;
          flex-direction:column;
          align-items:center;
          justify-content:space-between;
          padding:52px 28px max(40px, env(safe-area-inset-bottom,40px));
        }
        .back-btn {
          align-self:flex-start;
          background:none; border:none;
          font-size:24px; color:rgba(255,255,255,0.4);
          cursor:pointer; padding:0;
        }
        .center {
          display:flex; flex-direction:column;
          align-items:center; text-align:center;
          gap:0; flex:1; justify-content:center;
        }
        .badge {
          display:inline-flex; align-items:center; gap:6px;
          background:rgba(216,90,48,0.15);
          border:1px solid rgba(216,90,48,0.3);
          border-radius:20px; padding:6px 16px;
          font-size:12px; font-weight:700;
          color:#D85A30; letter-spacing:0.08em;
          margin-bottom:24px;
        }
        .icon-wrap {
          width:96px; height:96px; border-radius:28px;
          background:rgba(216,90,48,0.12);
          border:1px solid rgba(216,90,48,0.2);
          display:flex; align-items:center; justify-content:center;
          font-size:44px; margin-bottom:28px;
        }
        .title {
          font-family:'Bricolage Grotesque',sans-serif;
          font-size:32px; font-weight:800; color:#fff;
          letter-spacing:-0.5px; line-height:1.15;
          margin-bottom:14px;
        }
        .desc {
          font-size:15px; color:rgba(255,255,255,0.4);
          font-weight:300; line-height:1.7;
          margin-bottom:36px;
        }
        .feature-list {
          display:flex; flex-direction:column; gap:10px;
          width:100%; margin-bottom:40px;
        }
        .feature-item {
          display:flex; align-items:center; gap:12px;
          background:rgba(255,255,255,0.04);
          border-radius:14px; padding:14px 16px;
        }
        .feature-ic {
          width:36px; height:36px; border-radius:10px;
          background:rgba(216,90,48,0.12);
          display:flex; align-items:center; justify-content:center;
          font-size:16px; flex-shrink:0;
        }
        .feature-txt {
          font-size:14px; font-weight:500; color:rgba(255,255,255,0.7);
        }
        .feature-sub {
          font-size:12px; color:rgba(255,255,255,0.3); font-weight:300; margin-top:2px;
        }
        .bottom { width:100%; display:flex; flex-direction:column; gap:10px; }
        .notify-btn {
          width:100%; padding:17px;
          border-radius:16px; background:#D85A30;
          color:#fff; font-family:'Bricolage Grotesque',sans-serif;
          font-size:16px; font-weight:700; border:none; cursor:pointer;
        }
        .back-home {
          width:100%; padding:14px;
          border-radius:16px; background:rgba(255,255,255,0.06);
          color:rgba(255,255,255,0.4);
          font-family:'Plus Jakarta Sans',sans-serif;
          font-size:14px; font-weight:400; border:none; cursor:pointer;
        }
        .toast {
          position:fixed; bottom:40px; left:50%; transform:translateX(-50%);
          background:#1D9E75; color:#fff;
          font-family:'Bricolage Grotesque',sans-serif;
          font-size:14px; font-weight:700;
          padding:13px 24px; border-radius:22px;
          white-space:nowrap;
          animation:toastIn 0.3s ease;
          z-index:100;
        }
        @keyframes toastIn {
          from { opacity:0; transform:translateX(-50%) translateY(10px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>

      <div className="pw">
        <button className="back-btn" onClick={() => router.back()}>←</button>

        <div className="center">
          <div className="badge">✦ COMING SOON</div>
          <div className="icon-wrap">👑</div>
          <div className="title">calio 프리미엄<br/>곧 오픈돼요!</div>
          <div className="desc">
            더 많은 AI 분석과 상세한 건강 리포트를<br/>
            준비하고 있어요. 조금만 기다려주세요.
          </div>

          <div className="feature-list">
            {[
              { icon:'📸', name:'AI 분석 무제한', sub:'하루 3회 제한 없이 마음껏' },
              { icon:'📊', name:'상세 건강 리포트', sub:'주간·월간 영양소 분석' },
              { icon:'🔔', name:'맞춤 알림', sub:'목표 달성 푸시 알림' },
              { icon:'🏆', name:'뱃지 & 챌린지', sub:'갓생 달성 보상 시스템' },
            ].map((f, i) => (
              <div key={i} className="feature-item">
                <div className="feature-ic">{f.icon}</div>
                <div>
                  <div className="feature-txt">{f.name}</div>
                  <div className="feature-sub">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bottom">
          <div style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.2)', fontWeight:300, marginBottom:4 }}>
            월 3,900원 · 연 29,900원 예정
          </div>
          <button className="back-home" onClick={() => router.push('/home')}>
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </>
  )
}

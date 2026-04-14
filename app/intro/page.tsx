'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const slides = [
  {
    id: 0,
    bg: '#0F0E0D',
    accent: '#D85A30',
    tag: 'WELCOME TO CALIO',
    title: '먹은 만큼 살고,\n사는 만큼 태운다.',
    desc: 'AI가 음식 사진 하나로\n칼로리를 바로 계산해줘요.',
    visual: 'brand',
  },
  {
    id: 1,
    bg: '#0A1410',
    accent: '#1D9E75',
    tag: 'AI FOOD SCAN',
    title: '찍으면 끝.\n분석은 AI가 해요.',
    desc: '사진 한 장으로 칼로리·탄수화물·단백질·지방까지\n10초 안에 정확하게 분석해요.',
    visual: 'scan',
  },
  {
    id: 2,
    bg: '#0A0E1A',
    accent: '#378ADD',
    tag: 'DAILY ACTIVITY',
    title: '운동만이\n전부가 아니에요.',
    desc: '독서, 대화, 명상, 악기 연주…\n일상의 모든 활동이 칼로리를 태워요.',
    visual: 'activity',
  },
  {
    id: 3,
    bg: '#130A05',
    accent: '#D85A30',
    tag: 'START TODAY',
    title: '오늘부터\n갓생 시작.',
    desc: '목표를 설정하고 calio와 함께\n건강한 일상을 기록해봐요.',
    visual: 'start',
  },
]

export default function IntroPage() {
  const router = useRouter()
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  const slide = slides[current]
  const isLast = current === slides.length - 1

  const goNext = () => {
    if (animating) return
    if (isLast) {
      router.push('/auth')
      return
    }
    setAnimating(true)
    setTimeout(() => {
      setCurrent(c => c + 1)
      setAnimating(false)
    }, 200)
  }

  const goPrev = () => {
    if (current === 0 || animating) return
    setAnimating(true)
    setTimeout(() => {
      setCurrent(c => c - 1)
      setAnimating(false)
    }, 200)
  }

  return (
    <>
      <style>{`
        * { box-sizing:border-box; margin:0; padding:0; -webkit-tap-highlight-color:transparent; }
        .intro-wrap {
          width:100%;
          height:100dvh;
          display:flex;
          flex-direction:column;
          font-family:'Plus Jakarta Sans',sans-serif;
          overflow:hidden;
          transition:background 0.5s ease;
          position:relative;
        }

        /* 상단 */
        .intro-top {
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:52px 24px 0;
          flex-shrink:0;
        }

        .logo-row { display:flex; align-items:baseline; }
        .logo-txt {
          font-family:'Bricolage Grotesque',sans-serif;
          font-size:22px; font-weight:800; color:#fff;
          letter-spacing:-0.03em; line-height:1;
        }

        .skip-btn {
          font-size:14px; color:rgba(255,255,255,0.35);
          font-weight:300; background:none; border:none;
          cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif;
        }

        /* 진행 도트 */
        .dots {
          display:flex; gap:6px;
          justify-content:center;
          padding:20px 0 0;
          flex-shrink:0;
        }
        .dot {
          height:3px; border-radius:2px;
          transition:all 0.3s ease;
        }

        /* 비주얼 영역 */
        .visual-wrap {
          flex:1;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:20px 24px;
          opacity:1;
          transition:opacity 0.2s ease;
        }
        .visual-wrap.fade { opacity:0; }

        /* 하단 텍스트 */
        .text-area {
          flex-shrink:0;
          padding:0 28px 0;
          opacity:1;
          transition:opacity 0.2s ease;
        }
        .text-area.fade { opacity:0; }

        .slide-tag {
          font-size:11px; font-weight:700;
          letter-spacing:0.15em;
          margin-bottom:10px;
        }
        .slide-title {
          font-family:'Bricolage Grotesque',sans-serif;
          font-size:34px; font-weight:800; color:#fff;
          letter-spacing:-0.5px; line-height:1.15;
          margin-bottom:14px;
          white-space:pre-line;
        }
        .slide-desc {
          font-size:15px; color:rgba(255,255,255,0.45);
          font-weight:300; line-height:1.7;
          white-space:pre-line;
        }

        /* 버튼 영역 */
        .btn-area {
          flex-shrink:0;
          padding:24px 24px max(32px, env(safe-area-inset-bottom, 32px));
          display:flex;
          flex-direction:column;
          gap:10px;
        }

        .next-btn {
          width:100%; padding:18px;
          border-radius:16px;
          font-family:'Bricolage Grotesque',sans-serif;
          font-size:17px; font-weight:700;
          border:none; cursor:pointer;
          color:#fff;
          transition:opacity 0.15s;
        }
        .next-btn:active { opacity:0.85; }

        .back-btn-txt {
          text-align:center;
          font-size:14px; color:rgba(255,255,255,0.25);
          font-weight:300; background:none; border:none;
          cursor:pointer; font-family:'Plus Jakarta Sans',sans-serif;
          padding:4px;
        }

        /* 비주얼 SVG들 */
        .vis-brand { display:flex; flex-direction:column; align-items:center; gap:16px; }
        .vis-ring-wrap { position:relative; }

        .vis-scan { display:flex; flex-direction:column; align-items:center; gap:12px; width:100%; }
        .scan-frame {
          width:220px; height:180px;
          border-radius:20px; background:rgba(255,255,255,0.04);
          border:1.5px solid rgba(255,255,255,0.08);
          display:flex; align-items:center; justify-content:center;
          position:relative; overflow:hidden;
        }
        .scan-corner { position:absolute; width:20px; height:20px; border-color:rgba(29,158,117,0.8); border-style:solid; }
        .scan-corner.tl { top:12px; left:12px; border-width:2px 0 0 2px; border-radius:4px 0 0 0; }
        .scan-corner.tr { top:12px; right:12px; border-width:2px 2px 0 0; border-radius:0 4px 0 0; }
        .scan-corner.bl { bottom:12px; left:12px; border-width:0 0 2px 2px; border-radius:0 0 0 4px; }
        .scan-corner.br { bottom:12px; right:12px; border-width:0 2px 2px 0; border-radius:0 0 4px 0; }
        @keyframes scanLine {
          0%,100% { top:10%; }
          50% { top:80%; }
        }
        .scan-line {
          position:absolute; left:12px; right:12px; height:1.5px;
          background:rgba(29,158,117,0.6);
          animation:scanLine 2s ease-in-out infinite;
        }
        .scan-food { font-size:52px; }

        .scan-result {
          background:rgba(255,255,255,0.06); border-radius:14px;
          padding:12px 16px; width:220px;
          display:flex; justify-content:space-between; align-items:center;
        }
        .scan-result-nm { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:#fff; }
        .scan-result-kcal { font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; color:#1D9E75; }

        .vis-activity { display:flex; flex-direction:column; gap:10px; width:100%; max-width:280px; }
        .act-item {
          display:flex; align-items:center; gap:12px;
          background:rgba(255,255,255,0.05); border-radius:14px;
          padding:12px 14px;
        }
        .act-item-ic { font-size:24px; }
        .act-item-info { flex:1; }
        .act-item-nm { font-family:'Bricolage Grotesque',sans-serif; font-size:13px; font-weight:700; color:#fff; margin-bottom:4px; }
        .act-item-bar { height:3px; border-radius:2px; overflow:hidden; background:rgba(255,255,255,0.08); }
        .act-item-fill { height:100%; border-radius:2px; background:#378ADD; }
        .act-item-cal { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:#378ADD; }

        .vis-start { display:flex; flex-direction:column; align-items:center; gap:16px; }
        .start-badges { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }
        .start-badge {
          background:rgba(255,255,255,0.07); border-radius:14px;
          padding:12px 16px; text-align:center; min-width:80px;
        }
        .start-badge-ic { font-size:26px; margin-bottom:6px; }
        .start-badge-nm { font-size:11px; color:rgba(255,255,255,0.5); font-weight:300; }

        @keyframes float {
          0%,100% { transform:translateY(0); }
          50% { transform:translateY(-8px); }
        }
        .float { animation:float 3s ease-in-out infinite; }
        .float2 { animation:float 3s ease-in-out infinite 0.5s; }
        .float3 { animation:float 3s ease-in-out infinite 1s; }
      `}</style>

      <div className="intro-wrap" style={{ background: slide.bg }}>

        {/* 상단 */}
        <div className="intro-top">
          <div className="logo-row">
            <span className="logo-txt">cali</span>
            <svg width="16" height="22" viewBox="0 0 16 22" style={{ overflow:'visible' }}>
              <circle cx="8" cy="13" r="5.8" fill="none" stroke="rgba(216,90,48,0.25)" strokeWidth="4"/>
              <circle cx="8" cy="13" r="5.8" fill="none" stroke="#D85A30" strokeWidth="4"
                strokeDasharray="30 6" strokeLinecap="butt" transform="rotate(-90 8 13)"/>
              <circle cx="8" cy="7.2" r="2" fill="#D85A30"/>
            </svg>
          </div>
          <button className="skip-btn" onClick={() => router.push('/auth')}>건너뛰기</button>
        </div>

        {/* 진행 도트 */}
        <div className="dots">
          {slides.map((_, i) => (
            <div key={i} className="dot" style={{
              width: i === current ? 24 : 6,
              background: i === current ? slide.accent : 'rgba(255,255,255,0.15)',
            }}/>
          ))}
        </div>

        {/* 비주얼 */}
        <div className={`visual-wrap${animating ? ' fade' : ''}`}>

          {slide.visual === 'brand' && (
            <div className="vis-brand">
              <div className="vis-ring-wrap float">
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="82" fill="none" stroke="rgba(216,90,48,0.1)" strokeWidth="18"/>
                  <circle cx="100" cy="100" r="82" fill="none" stroke="#D85A30" strokeWidth="18"
                    strokeDasharray="430" strokeDashoffset="120" strokeLinecap="round" transform="rotate(-90 100 100)"/>
                  <circle cx="100" cy="100" r="58" fill="none" stroke="rgba(29,158,117,0.1)" strokeWidth="13"/>
                  <circle cx="100" cy="100" r="58" fill="none" stroke="#1D9E75" strokeWidth="13"
                    strokeDasharray="300" strokeDashoffset="180" strokeLinecap="round" transform="rotate(-90 100 100)"/>
                  <text x="100" y="88" textAnchor="middle"
                    style={{ fontFamily:'Bricolage Grotesque,sans-serif', fontSize:13, fontWeight:700, fill:'rgba(255,255,255,0.4)', letterSpacing:'0.1em' }}>TODAY</text>
                  <text x="100" y="118" textAnchor="middle"
                    style={{ fontFamily:'Bricolage Grotesque,sans-serif', fontSize:40, fontWeight:800, fill:'#fff' }}>512</text>
                  <text x="100" y="136" textAnchor="middle"
                    style={{ fontFamily:'Plus Jakarta Sans,sans-serif', fontSize:12, fontWeight:300, fill:'rgba(255,255,255,0.35)' }}>남은 kcal</text>
                </svg>
              </div>
            </div>
          )}

          {slide.visual === 'scan' && (
            <div className="vis-scan">
              <div className="scan-frame">
                <div className="scan-corner tl"/>
                <div className="scan-corner tr"/>
                <div className="scan-corner bl"/>
                <div className="scan-corner br"/>
                <div className="scan-line"/>
                <div className="scan-food float">🍱</div>
              </div>
              <div className="scan-result">
                <div>
                  <div className="scan-result-nm">비빔밥</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:300, marginTop:2 }}>AI 분석 완료 · 신뢰도 92%</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div className="scan-result-kcal">520</div>
                  <div style={{ fontSize:11, color:'rgba(29,158,117,0.6)' }}>kcal</div>
                </div>
              </div>
            </div>
          )}

          {slide.visual === 'activity' && (
            <div className="vis-activity">
              {[
                { icon:'📖', name:'독서 60분', cal:'−88', pct:60, delay:'float' },
                { icon:'💬', name:'팀 미팅 45분', cal:'−50', pct:35, delay:'float2' },
                { icon:'🧘', name:'명상 30분', cal:'−35', pct:25, delay:'float3' },
              ].map((a, i) => (
                <div key={i} className={`act-item ${a.delay}`}>
                  <div className="act-item-ic">{a.icon}</div>
                  <div className="act-item-info">
                    <div className="act-item-nm">{a.name}</div>
                    <div className="act-item-bar">
                      <div className="act-item-fill" style={{ width:`${a.pct}%` }}/>
                    </div>
                  </div>
                  <div className="act-item-cal">{a.cal}</div>
                </div>
              ))}
            </div>
          )}

          {slide.visual === 'start' && (
            <div className="vis-start">
              <div style={{ font:'800 52px Bricolage Grotesque', color:'#D85A30', letterSpacing:'-2px', lineHeight:1 }} className="float">
                calio
              </div>
              <div className="start-badges">
                {[
                  { icon:'🏆', name:'갓생 달성' },
                  { icon:'🔥', name:'12일 연속' },
                  { icon:'📊', name:'목표 94%' },
                  { icon:'🥗', name:'균형 식단' },
                ].map((b, i) => (
                  <div key={i} className={`start-badge ${i%2===0?'float':'float2'}`}>
                    <div className="start-badge-ic">{b.icon}</div>
                    <div className="start-badge-nm">{b.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 텍스트 */}
        <div className={`text-area${animating ? ' fade' : ''}`}>
          <div className="slide-tag" style={{ color: slide.accent }}>{slide.tag}</div>
          <div className="slide-title">{slide.title}</div>
          <div className="slide-desc">{slide.desc}</div>
        </div>

        {/* 버튼 */}
        <div className="btn-area">
          <button
            className="next-btn"
            style={{ background: slide.accent }}
            onClick={goNext}>
            {isLast ? 'calio 시작하기' : '다음'}
          </button>
          {current > 0 && (
            <button className="back-btn-txt" onClick={goPrev}>← 이전</button>
          )}
          {current === 0 && (
            <button className="back-btn-txt" onClick={() => router.push('/auth')}>이미 계정이 있어요</button>
          )}
        </div>

      </div>
    </>
  )
}

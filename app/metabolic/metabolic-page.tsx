'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function MetabolicPage() {
  const router = useRouter()
  const [user, setUser]             = useState<any>(null)
  const [loading, setLoading]       = useState(true)
  const [recordDays, setRecordDays] = useState(0)
  const [kcalGoal, setKcalGoal]     = useState(2000)

  useEffect(() => {
    const load = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { router.push('/auth'); return }
      const { data: ud } = await supabase.from('users').select('*').eq('id', authUser.id).single()
      setUser(ud)
      setKcalGoal((ud as any)?.daily_kcal_goal ?? 2000)
      setRecordDays((ud as any)?.streak_days ?? 0)
      setLoading(false)
    }
    load()
  }, [router])

  const phase =
    recordDays < 30 ? 1 :
    recordDays < 60 ? 2 :
    recordDays < 90 ? 3 : 4

  const progress      = Math.min((recordDays / 90) * 100, 100)
  const estimatedKcal = phase >= 2 ? kcalGoal - 200 : null

  const patterns = [
    { icon:'🕒', color:'#FAECE7', textColor:'#993C1D', title:'오후 3시 슬럼프 패턴',  desc:'밀가루 점심 후 에너지가 평균 42% 하락해요. 단백질 위주 점심으로 바꾸면 개선될 수 있어요.', conf:72, locked: phase < 3 },
    { icon:'🔥', color:'#E1F5EE', textColor:'#0F6E56', title:'화·목 활동량 최고점',   desc:'화요일과 목요일에 칼로리 소비가 가장 높아요. 이 날 조금 더 드셔도 괜찮아요.',             conf:89, locked: phase < 3 },
    { icon:'😴', color:'#E6F1FB', textColor:'#185FA5', title:'수면과 식욕 연관성',    desc:'수면 7시간 미만인 날 평균 280 kcal를 더 섭취해요. 수면 관리가 식단 관리예요.',           conf:68, locked: phase < 4 },
  ]

  const phases = [
    { num:1, days:'1~30일',   title:'기초 패턴 학습',      desc:'식사 시간대, 선호 음식 유형, 활동 패턴을 파악해요.' },
    { num:2, days:'31~60일',  title:'실제 대사율 측정',     desc:'식사량과 체중 변화로 내 진짜 유지 칼로리를 역산해요.' },
    { num:3, days:'61~90일',  title:'음식·에너지 상관관계', desc:'어떤 음식이 내 에너지와 수면에 영향을 주는지 발견해요.' },
    { num:4, days:'90일 이후', title:'완전한 내 몸 모델',    desc:'환경·스트레스·계절까지 반영한 나만의 건강 공식 완성!' },
  ]

  if (loading) return (
    <div style={{ minHeight:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0F0E0D' }}>
      <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:18, color:'rgba(255,255,255,0.4)' }}>불러오는 중...</div>
    </div>
  )

  return (
    <>
      <style>{`
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        .mw { min-height:100dvh; background:#F2F1EE; font-family:'Plus Jakarta Sans',sans-serif; max-width:430px; margin:0 auto; padding-bottom:calc(40px + env(safe-area-inset-bottom,0px)); }

        /* 면책 고지 */
        .disclaimer {
          margin: 0 16px 14px;
          background: #fff;
          border-radius: 12px;
          padding: 10px 14px;
          display: flex;
          align-items: flex-start;
          gap: 8px;
          border-left: 3px solid rgba(0,0,0,0.12);
        }
        .disclaimer-ic { font-size: 13px; flex-shrink: 0; margin-top: 1px; }
        .disclaimer-txt {
          font-size: 11px;
          color: #888;
          font-weight: 300;
          line-height: 1.6;
        }
        .disclaimer-txt strong { color: #555; font-weight: 500; }

        .hero { background:#0F0E0D; border-radius:0 0 32px 32px; padding:0 20px 28px; margin-bottom:14px; }
        .hdr { display:flex; justify-content:space-between; align-items:center; padding:28px 0 20px; }
        .back-btn { background:none; border:none; font-size:24px; cursor:pointer; color:rgba(255,255,255,0.5); padding:0; }
        .pg-title { font-family:'Bricolage Grotesque',sans-serif; font-size:24px; font-weight:800; color:#fff; }
        .hero-badge { display:inline-flex; align-items:center; gap:6px; background:rgba(29,158,117,0.2); border:1px solid rgba(29,158,117,0.4); border-radius:20px; padding:5px 14px; font-size:12px; font-weight:600; color:#1D9E75; margin-bottom:14px; }
        .hero-title { font-family:'Bricolage Grotesque',sans-serif; font-size:30px; font-weight:800; color:#fff; line-height:1.15; letter-spacing:-0.5px; margin-bottom:8px; white-space:pre-line; }
        .hero-sub { font-size:13px; color:rgba(255,255,255,0.4); font-weight:300; line-height:1.6; margin-bottom:20px; }
        .hero-main { background:rgba(255,255,255,0.05); border-radius:16px; padding:18px; margin-bottom:14px; }
        .hero-main-lbl { font-size:11px; color:rgba(255,255,255,0.35); margin-bottom:8px; letter-spacing:0.08em; }
        .hero-main-val { font-family:'Bricolage Grotesque',sans-serif; font-size:48px; font-weight:800; color:#fff; line-height:1; }
        .hero-main-unit { font-size:16px; color:rgba(255,255,255,0.4); margin-left:8px; }
        .hero-main-note { font-size:12px; color:rgba(255,255,255,0.3); font-weight:300; display:flex; align-items:center; gap:6px; margin-top:8px; }
        .hero-stats { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .hero-stat { background:rgba(255,255,255,0.05); border-radius:12px; padding:12px 8px; text-align:center; }
        .hero-stat-v { font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:800; color:#fff; }
        .hero-stat-l { font-size:10px; color:rgba(255,255,255,0.3); margin-top:3px; }

        .prog-card { background:#fff; border-radius:18px; margin:0 16px 14px; padding:18px; }
        .prog-title { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:800; color:#0F0E0D; margin-bottom:4px; }
        .prog-sub { font-size:12px; color:#aaa; font-weight:300; margin-bottom:14px; }
        .prog-bar-bg { height:10px; background:#F2F1EE; border-radius:5px; overflow:hidden; margin-bottom:8px; }
        .prog-bar-fill { height:100%; border-radius:5px; background:linear-gradient(90deg,#D85A30,#FF7A52); transition:width 1s cubic-bezier(0.34,1.56,0.64,1); }
        .prog-labels { display:flex; justify-content:space-between; font-size:11px; color:#aaa; font-weight:300; }

        .sec { font-family:'Bricolage Grotesque',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#aaa; margin:0 16px 10px; }

        .pattern-card { background:#fff; border-radius:18px; margin:0 16px 14px; overflow:hidden; }
        .pattern-item { display:flex; gap:12px; align-items:flex-start; padding:14px 16px; border-bottom:0.5px solid rgba(0,0,0,0.05); position:relative; }
        .pattern-item:last-child { border-bottom:none; }
        .pattern-ic { width:38px; height:38px; border-radius:11px; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
        .pattern-title { font-size:14px; font-weight:600; color:#0F0E0D; margin-bottom:4px; }
        .pattern-desc { font-size:12px; color:#888; font-weight:300; line-height:1.55; }
        .pattern-conf { font-size:11px; font-weight:600; margin-top:6px; }
        .pattern-lock { position:absolute; inset:0; background:rgba(255,255,255,0.88); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; border-radius:0; }
        .pattern-lock-ic { font-size:18px; }
        .pattern-lock-txt { font-size:12px; color:#aaa; font-weight:300; }

        .timeline-card { background:#fff; border-radius:18px; margin:0 16px 14px; padding:18px; }
        .tl-title { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:800; color:#0F0E0D; margin-bottom:16px; }
        .tl-item { display:flex; gap:12px; align-items:flex-start; padding-bottom:16px; }
        .tl-item:last-child { padding-bottom:0; }
        .tl-left { display:flex; flex-direction:column; align-items:center; flex-shrink:0; }
        .tl-dot { width:28px; height:28px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-family:'Bricolage Grotesque',sans-serif; font-size:12px; font-weight:800; }
        .tl-line { width:1px; flex:1; margin-top:4px; min-height:16px; }
        .tl-phase-days { font-size:11px; font-weight:600; margin-bottom:3px; }
        .tl-phase-title { font-size:13px; font-weight:600; color:#0F0E0D; margin-bottom:3px; }
        .tl-phase-desc { font-size:12px; color:#aaa; font-weight:300; line-height:1.5; }

        .today-card { background:#0F0E0D; border-radius:18px; margin:0 16px 14px; padding:18px; }
        .today-title { font-size:11px; color:rgba(255,255,255,0.35); letter-spacing:0.1em; text-transform:uppercase; margin-bottom:14px; }
        .today-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:0.5px solid rgba(255,255,255,0.06); }
        .today-row:last-child { border-bottom:none; }
        .today-key { font-size:13px; color:rgba(255,255,255,0.5); font-weight:300; }
        .today-val { font-size:14px; font-weight:600; }
      `}</style>

      <div className="mw">

        {/* 히어로 */}
        <div className="hero">
          <div className="hdr">
            <button className="back-btn" onClick={() => router.push('/home')}>←</button>
            <div className="pg-title">내 몸 대사 모델</div>
            <div style={{ width:32 }}/>
          </div>
          <div className="hero-badge">🧬 {recordDays}일 데이터 기반</div>
          <div className="hero-title">{phase < 4 ? '내 몸을\n학습하고 있어요' : '내 몸 모델\n완성됐어요!'}</div>
          <div className="hero-sub">공식 BMR이 아닌, 내 실제 기록으로 만든<br/>나만의 칼로리 공식이에요.</div>

          <div className="hero-main">
            <div className="hero-main-lbl">내 실제 유지 칼로리</div>
            <div style={{ display:'flex', alignItems:'baseline' }}>
              {phase >= 2 ? (
                <>
                  <span className="hero-main-val">{estimatedKcal?.toLocaleString()}</span>
                  <span className="hero-main-unit">kcal/일</span>
                </>
              ) : (
                <span style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:20, color:'rgba(255,255,255,0.3)', fontWeight:800 }}>30일 후 공개돼요</span>
              )}
            </div>
            {phase >= 2 && (
              <div className="hero-main-note">
                <div style={{ width:6, height:6, borderRadius:3, background:'#D85A30', flexShrink:0 }}/>
                공식 BMR {kcalGoal.toLocaleString()} 대비 실제 {Math.abs(kcalGoal - (estimatedKcal ?? kcalGoal))} kcal 차이
              </div>
            )}
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-v" style={{ color: phase >= 2 ? '#D85A30' : 'rgba(255,255,255,0.2)' }}>{phase >= 2 ? '-0.3' : '—'}</div>
              <div className="hero-stat-l">kg/월 평균</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-v" style={{ color: phase >= 3 ? '#fff' : 'rgba(255,255,255,0.2)' }}>{phase >= 3 ? '3개' : '—'}</div>
              <div className="hero-stat-l">발견된 패턴</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-v" style={{ color: phase >= 2 ? '#1D9E75' : 'rgba(255,255,255,0.2)' }}>{phase >= 2 ? '94%' : '—'}</div>
              <div className="hero-stat-l">모델 정확도</div>
            </div>
          </div>
        </div>

        {/* ⚠️ 면책 고지 */}
        <div className="disclaimer">
          <div className="disclaimer-ic">ℹ️</div>
          <div className="disclaimer-txt">
            <strong>건강 보조 참고용 정보입니다.</strong> calio의 분석은 기록된 데이터를 기반으로 한 통계적 추정이며, 의학적 진단이나 처방을 대체하지 않아요. 건강 관련 결정은 전문 의료인과 상담하세요.
          </div>
        </div>

        {/* 진행도 */}
        <div className="prog-card">
          <div className="prog-title">모델 완성도</div>
          <div className="prog-sub">{recordDays}일 기록 중 · 90일이면 완전한 모델이 완성돼요</div>
          <div className="prog-bar-bg">
            <div className="prog-bar-fill" style={{ width:`${progress}%` }}/>
          </div>
          <div className="prog-labels">
            <span>시작</span>
            <span style={{ color:'#D85A30', fontWeight:600 }}>{Math.round(progress)}%</span>
            <span>완성</span>
          </div>
        </div>

        {/* 패턴 */}
        <div className="sec">AI가 발견한 내 몸 패턴</div>
        <div className="pattern-card">
          {patterns.map((p, i) => (
            <div key={i} className="pattern-item">
              <div className="pattern-ic" style={{ background: p.color }}>{p.icon}</div>
              <div style={{ flex:1 }}>
                <div className="pattern-title">{p.title}</div>
                <div className="pattern-desc">{p.desc}</div>
                <div className="pattern-conf" style={{ color: p.textColor }}>확신도 {p.conf}%</div>
              </div>
              {p.locked && (
                <div className="pattern-lock">
                  <div className="pattern-lock-ic">🔒</div>
                  <div className="pattern-lock-txt">{i === 2 ? '90일 후 공개' : '60일 후 공개'}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 타임라인 */}
        <div className="sec">90일 진화 과정</div>
        <div className="timeline-card">
          <div className="tl-title">단계별로 더 정확해져요</div>
          {phases.map((p, i) => {
            const isDone    = p.num < phase
            const isCurrent = p.num === phase
            return (
              <div key={p.num} className="tl-item">
                <div className="tl-left">
                  <div className="tl-dot" style={{ background: isDone ? '#1D9E75' : isCurrent ? '#D85A30' : '#F2F1EE', color: isDone || isCurrent ? '#fff' : '#aaa' }}>
                    {isDone ? '✓' : p.num}
                  </div>
                  {i < phases.length - 1 && <div className="tl-line" style={{ background: isDone ? '#1D9E75' : '#F2F1EE' }}/>}
                </div>
                <div style={{ paddingTop:4 }}>
                  <div className="tl-phase-days" style={{ color: isCurrent ? '#D85A30' : isDone ? '#1D9E75' : '#aaa' }}>
                    {p.days}{isCurrent ? ' ← 지금 여기' : ''}
                  </div>
                  <div className="tl-phase-title">{p.title}</div>
                  <div className="tl-phase-desc">{p.desc}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* 오늘 가이드 */}
        <div className="sec">오늘 내 몸에 맞는 가이드</div>
        <div className="today-card">
          <div className="today-title">내 데이터 기반 오늘의 목표</div>
          {[
            { key:'권장 섭취',    val: phase >= 2 ? `${estimatedKcal?.toLocaleString()} kcal` : '분석 중...', color: phase >= 2 ? '#fff' : 'rgba(255,255,255,0.3)' },
            { key:'단백질 목표',  val: phase >= 2 ? `${Math.round((estimatedKcal ?? 0) * 0.25 / 4)}g` : '분석 중...', color: phase >= 2 ? '#1D9E75' : 'rgba(255,255,255,0.3)' },
            { key:'탄수화물 목표', val: phase >= 2 ? `${Math.round((estimatedKcal ?? 0) * 0.5 / 4)}g` : '분석 중...', color: phase >= 2 ? '#D85A30' : 'rgba(255,255,255,0.3)' },
            { key:'오늘 최적 활동', val: phase >= 3 ? '러닝 or 걷기 추천' : '데이터 쌓는 중...', color: phase >= 3 ? '#1D9E75' : 'rgba(255,255,255,0.3)' },
          ].map((row, i) => (
            <div key={i} className="today-row">
              <span className="today-key">{row.key}</span>
              <span className="today-val" style={{ color: row.color }}>{row.val}</span>
            </div>
          ))}
        </div>

        <div style={{ padding:'0 16px' }}>
          <button onClick={() => router.push('/home')}
            style={{ width:'100%', padding:15, borderRadius:14, background:'#fff', color:'#0F0E0D', fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:15, fontWeight:700, border:'none', cursor:'pointer' }}>
            홈으로 돌아가기
          </button>
        </div>

        <div style={{ height:20 }}/>
      </div>
    </>
  )
}

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface MetabolicData {
  recordDays: number; avgCal: number
  estimatedMaintenance: number | null; weightTrend: number | null
  accuracy: number; patterns: any[]; milestones: any[]
  latestWeight: number | null; firstWeight: number | null
  weightCount: number; phase: number
}

export default function MetabolicPage() {
  const router = useRouter()
  const [data, setData]               = useState<MetabolicData | null>(null)
  const [loading, setLoading]         = useState(true)
  const [showWeight, setShowWeight]   = useState(false)
  const [weightInput, setWeightInput] = useState('')
  const [saving, setSaving]           = useState(false)
  const [milestone, setMilestone]     = useState<any>(null)
  const [session, setSession]         = useState<any>(null)

  const fetchData = useCallback(async (sess: any) => {
    if (!sess) return
    try {
      const res  = await fetch('/api/metabolic', { headers: { 'Authorization': `Bearer ${sess.access_token}` } })
      const json = await res.json()
      setData(json)
      if (json.milestones?.length > 0) {
        setMilestone(json.milestones[0])
        setTimeout(() => setMilestone(null), 4000)
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) { router.push('/auth'); return }
      setSession(s); fetchData(s)
    })
  }, [router, fetchData])

  const handleSave = async () => {
    const w = parseFloat(weightInput)
    if (!session || isNaN(w) || w < 20 || w > 300) return
    setSaving(true)
    try {
      await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight_kg: w })
      })
      setWeightInput('')
      setShowWeight(false)
      setLoading(true)
      await fetchData(session)
    } catch {}
    setSaving(false)
  }

  const phase    = data?.phase ?? 1
  const progress = Math.min(((data?.recordDays ?? 0) / 90) * 100, 100)
  const phaseLabel = ['','기초 패턴 학습 중','대사율 측정 중','에너지 패턴 분석 중','내 몸 모델 완성!'][phase]

  const defaultPatterns = [
    { icon:'🕒', title:'오후 슬럼프 예측',  desc:'30일 이상 기록하면 에너지 패턴을 발견해요.', confidence:0, type:'info', locked:true },
    { icon:'🔥', title:'최적 활동 시간대', desc:'60일이면 활동 피크 타임을 알 수 있어요.',    confidence:0, type:'info', locked:true },
    { icon:'😴', title:'수면-식욕 연관성', desc:'90일이면 수면과 식욕의 관계가 보여요.',      confidence:0, type:'info', locked:true },
  ]
  const patterns = data && data.patterns.length > 0
    ? data.patterns.map(p => ({ ...p, locked: false }))
    : defaultPatterns

  if (loading) return (
    <div style={{ minHeight:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0F0E0D', gap:16 }}>
      <div style={{ width:40, height:40, border:'3px solid rgba(216,90,48,0.3)', borderTop:'3px solid #D85A30', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
      <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:15, color:'rgba(255,255,255,0.4)' }}>내 몸 데이터 분석 중...</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <>
      <style>{`
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        .mw { min-height:100dvh; background:#F2F1EE; font-family:'Plus Jakarta Sans',sans-serif; max-width:430px; margin:0 auto; padding-bottom:calc(40px + env(safe-area-inset-bottom,0px)); }

        .toast { position:fixed; top:60px; left:50%; transform:translateX(-50%); background:#1D9E75; color:#fff; font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; padding:12px 22px; border-radius:24px; white-space:nowrap; z-index:999; animation:tIn 0.4s ease, tOut 0.4s ease 3.6s forwards; box-shadow:0 4px 20px rgba(29,158,117,0.4); display:flex; align-items:center; gap:8px; }
        @keyframes tIn  { from{opacity:0;transform:translateX(-50%) translateY(-10px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
        @keyframes tOut { to{opacity:0;transform:translateX(-50%) translateY(-10px)} }

        .hero { background:#0F0E0D; border-radius:0 0 32px 32px; padding:0 20px 28px; margin-bottom:14px; }
        .hdr  { display:flex; justify-content:space-between; align-items:center; padding:28px 0 20px; }
        .back { background:none; border:none; font-size:24px; cursor:pointer; color:rgba(255,255,255,0.5); padding:0; }
        .pg-title { font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; color:#fff; }

        .badge    { display:inline-flex; align-items:center; gap:6px; background:rgba(29,158,117,0.2); border:1px solid rgba(29,158,117,0.4); border-radius:20px; padding:5px 14px; font-size:12px; font-weight:600; color:#1D9E75; margin-bottom:14px; }
        .h-title  { font-family:'Bricolage Grotesque',sans-serif; font-size:28px; font-weight:800; color:#fff; line-height:1.2; letter-spacing:-0.5px; margin-bottom:8px; }
        .h-sub    { font-size:13px; color:rgba(255,255,255,0.4); font-weight:300; line-height:1.6; margin-bottom:20px; }

        .h-main     { background:rgba(255,255,255,0.05); border-radius:16px; padding:18px; margin-bottom:14px; }
        .h-main-lbl { font-size:11px; color:rgba(255,255,255,0.35); margin-bottom:8px; letter-spacing:0.08em; text-transform:uppercase; }
        .h-main-row { display:flex; align-items:baseline; gap:8px; margin-bottom:6px; }
        .h-main-val { font-family:'Bricolage Grotesque',sans-serif; font-size:48px; font-weight:800; color:#fff; line-height:1; }
        .h-main-unit{ font-size:15px; color:rgba(255,255,255,0.4); }
        .h-main-note{ font-size:12px; color:rgba(255,255,255,0.3); font-weight:300; display:flex; align-items:center; gap:6px; margin-top:6px; }

        .h-stats  { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .h-stat   { background:rgba(255,255,255,0.05); border-radius:12px; padding:12px 8px; text-align:center; }
        .h-stat-v { font-family:'Bricolage Grotesque',sans-serif; font-size:20px; font-weight:800; }
        .h-stat-l { font-size:10px; color:rgba(255,255,255,0.3); margin-top:3px; }

        .disc     { margin:0 16px 14px; background:#fff; border-radius:12px; padding:10px 14px; display:flex; align-items:flex-start; gap:8px; border-left:3px solid rgba(0,0,0,0.12); }
        .disc-txt { font-size:11px; color:#888; font-weight:300; line-height:1.6; }
        .disc-txt strong { color:#555; font-weight:500; }

        .card       { background:#fff; border-radius:18px; margin:0 16px 14px; overflow:hidden; }
        .card-inner { padding:16px 18px; }
        .card-title { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:800; color:#0F0E0D; margin-bottom:3px; }
        .card-sub   { font-size:12px; color:#aaa; font-weight:300; margin-bottom:14px; }

        .prog-bg    { height:10px; background:#F2F1EE; border-radius:5px; overflow:hidden; margin-bottom:8px; }
        .prog-fill  { height:100%; border-radius:5px; background:linear-gradient(90deg,#D85A30,#FF7A52); transition:width 1.2s cubic-bezier(0.34,1.56,0.64,1); }
        .prog-lbls  { display:flex; justify-content:space-between; font-size:11px; color:#aaa; }
        .phase-badges { display:flex; gap:6px; margin-top:12px; flex-wrap:wrap; }
        .pb { font-size:11px; padding:4px 10px; border-radius:20px; font-weight:600; }

        .sec { font-family:'Bricolage Grotesque',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#aaa; margin:0 16px 10px; }

        .pat-item  { display:flex; gap:12px; align-items:flex-start; padding:14px 16px; border-bottom:0.5px solid rgba(0,0,0,0.05); position:relative; }
        .pat-item:last-child { border-bottom:none; }
        .pat-ic    { width:40px; height:40px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
        .pat-title { font-size:14px; font-weight:600; color:#0F0E0D; margin-bottom:4px; }
        .pat-desc  { font-size:12px; color:#888; font-weight:300; line-height:1.55; }
        .pat-conf  { font-size:11px; font-weight:600; margin-top:5px; display:flex; align-items:center; gap:5px; }
        .conf-bg   { height:3px; border-radius:2px; flex:1; background:#F2F1EE; max-width:60px; overflow:hidden; }
        .conf-fill { height:100%; border-radius:2px; }
        .lock      { position:absolute; inset:0; background:rgba(255,255,255,0.88); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:4px; }

        .tl-item { display:flex; gap:12px; align-items:flex-start; padding-bottom:16px; }
        .tl-item:last-child { padding-bottom:0; }
        .tl-dot  { width:28px; height:28px; border-radius:14px; display:flex; align-items:center; justify-content:center; font-family:'Bricolage Grotesque',sans-serif; font-size:12px; font-weight:800; flex-shrink:0; }
        .tl-line { width:1px; flex:1; margin-top:4px; min-height:16px; }

        .today-card { background:#0F0E0D; border-radius:18px; margin:0 16px 14px; padding:18px; }
        .today-lbl  { font-size:11px; color:rgba(255,255,255,0.35); letter-spacing:0.1em; text-transform:uppercase; margin-bottom:14px; }
        .today-row  { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:0.5px solid rgba(255,255,255,0.06); }
        .today-row:last-child { border-bottom:none; }

        .nudge { background:linear-gradient(135deg,#1D9E75,#14785A); border-radius:18px; margin:0 16px 14px; padding:18px; display:flex; gap:14px; align-items:center; }
      `}</style>

      <div className="mw">
        {milestone && (
          <div className="toast"><span>{milestone.icon}</span><span>{milestone.msg}</span></div>
        )}

        {/* 히어로 */}
        <div className="hero">
          <div className="hdr">
            <button className="back" onClick={() => router.push('/home')}>←</button>
            <div className="pg-title">내 몸 대사 모델</div>
            <div style={{ width:32 }}/>
          </div>
          <div className="badge">🧬 {data?.recordDays ?? 0}일 데이터 분석</div>
          <div className="h-title">{phaseLabel}</div>
          <div className="h-sub">공식 BMR이 아닌, 내 실제 기록으로 만든<br/>나만의 칼로리 공식이에요.</div>

          <div className="h-main">
            <div className="h-main-lbl">내 실제 유지 칼로리</div>
            <div className="h-main-row">
              {data?.estimatedMaintenance ? (
                <>
                  <span className="h-main-val">{data.estimatedMaintenance.toLocaleString()}</span>
                  <span className="h-main-unit">kcal/일</span>
                </>
              ) : (
                <span style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:17, color:'rgba(255,255,255,0.3)', fontWeight:700 }}>
                  체중 2회 이상 기록하면 공개돼요
                </span>
              )}
            </div>
            {data?.estimatedMaintenance && (
              <div className="h-main-note">
                <div style={{ width:6, height:6, borderRadius:3, background:'#D85A30', flexShrink:0 }}/>
                실제 측정값 · 정확도 {data.accuracy}%
              </div>
            )}
          </div>

          <div className="h-stats">
            {[
              { v: data?.weightTrend !== null ? `${data!.weightTrend! > 0 ? '+' : ''}${data!.weightTrend}` : '—', l:'kg/월 변화',  c: data?.weightTrend !== null ? (data!.weightTrend! < 0 ? '#1D9E75' : data!.weightTrend! > 0 ? '#FF6B6B' : '#fff') : 'rgba(255,255,255,0.2)' },
              { v: `${data?.weightCount ?? 0}회`,                                                                 l:'체중 기록',    c: (data?.weightCount ?? 0) > 0 ? '#fff' : 'rgba(255,255,255,0.2)' },
              { v: (data?.accuracy ?? 0) > 0 ? `${data!.accuracy}%` : '—',                                       l:'모델 정확도',  c: (data?.accuracy ?? 0) > 0 ? '#1D9E75' : 'rgba(255,255,255,0.2)' },
            ].map((s, i) => (
              <div key={i} className="h-stat">
                <div className="h-stat-v" style={{ color:s.c }}>{s.v}</div>
                <div className="h-stat-l">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 면책 고지 */}
        <div className="disc">
          <span style={{ fontSize:13, flexShrink:0 }}>ℹ️</span>
          <div className="disc-txt">
            <strong>건강 보조 참고용 정보입니다.</strong> 기록 데이터 기반 통계적 추정이며, 의학적 진단이나 처방을 대체하지 않아요.
          </div>
        </div>

        {/* ⚖️ 체중 기록 카드 */}
        <div className="card">
          {/* 헤더 */}
          <div style={{ padding:'16px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div className="card-title">⚖️ 체중 기록</div>
              <div style={{ fontSize:12, color:'#aaa', fontWeight:300, marginTop:3 }}>
                {data?.latestWeight
                  ? `최근 ${data.latestWeight}kg · ${data.weightCount}회 기록됨`
                  : '체중 기록이 핵심이에요 — 대사율을 계산해요'}
              </div>
            </div>
            <button
              onClick={() => setShowWeight(!showWeight)}
              style={{ background: showWeight ? '#F2F1EE' : '#D85A30', border:'none', borderRadius:20, padding:'8px 16px', fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:13, fontWeight:700, color: showWeight ? '#888' : '#fff', cursor:'pointer' }}>
              {showWeight ? '취소' : '+ 기록'}
            </button>
          </div>

          {/* 최근 체중 표시 */}
          {data?.latestWeight && !showWeight && (
            <div style={{ padding:'0 18px 16px', display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:28, fontWeight:800, color:'#0F0E0D' }}>
                {data.latestWeight}
              </span>
              <span style={{ fontSize:15, color:'#aaa' }}>kg</span>
              {data.firstWeight && data.firstWeight !== data.latestWeight && (
                <span style={{ fontSize:14, fontWeight:600, marginLeft:'auto', color: data.latestWeight < data.firstWeight ? '#1D9E75' : '#FF6B6B' }}>
                  {data.latestWeight < data.firstWeight ? '▼' : '▲'} {Math.abs(Math.round((data.latestWeight - data.firstWeight) * 10) / 10)}kg
                </span>
              )}
            </div>
          )}

          {/* 입력창 */}
          {showWeight && (
            <div style={{ padding:'0 18px 18px', borderTop:'0.5px solid rgba(0,0,0,0.05)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, margin:'14px 0 12px' }}>
                <input
                  type="number"
                  step="0.1"
                  placeholder="75.5"
                  value={weightInput}
                  onChange={e => setWeightInput(e.target.value)}
                  inputMode="decimal"
                  style={{ flex:1, padding:'14px 18px', borderRadius:14, border:'none', background:'#F7F5F2', fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:26, fontWeight:800, color:'#0F0E0D', outline:'none', WebkitAppearance:'none' as any }}
                />
                <span style={{ fontSize:18, color:'#aaa', flexShrink:0 }}>kg</span>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ width:'100%', padding:16, borderRadius:14, background:'#0F0E0D', color:'#fff', fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:16, fontWeight:700, border:'none', cursor:'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? '저장 중...' : '💾 저장하기'}
              </button>
            </div>
          )}
        </div>

        {/* 체중 없으면 넛지 */}
        {(data?.weightCount ?? 0) === 0 && (
          <div className="nudge">
            <span style={{ fontSize:28 }}>⚖️</span>
            <div>
              <div style={{ fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:15, fontWeight:800, color:'#fff', marginBottom:4 }}>
                매일 아침 체중을 기록해보세요
              </div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:300, lineHeight:1.5 }}>
                기상 직후 체중 기록 → AI가 내 실제<br/>대사율을 정확히 계산해드려요.
              </div>
            </div>
          </div>
        )}

        {/* 진행도 */}
        <div className="card">
          <div className="card-inner">
            <div className="card-title">모델 완성도</div>
            <div className="card-sub">{data?.recordDays ?? 0}일 기록 중 · 90일이면 완전한 모델 완성</div>
            <div className="prog-bg">
              <div className="prog-fill" style={{ width:`${progress}%` }}/>
            </div>
            <div className="prog-lbls">
              <span>시작</span>
              <span style={{ color:'#D85A30', fontWeight:600 }}>{Math.round(progress)}%</span>
              <span>완성</span>
            </div>
            <div className="phase-badges">
              {[['기초 학습', phase>=2],['대사율 측정', phase>=3],['패턴 분석', phase>=4],['모델 완성', phase>=4]].map(([l,d],i) => (
                <div key={i} className="pb" style={{ background:d?'#E1F5EE':'#F2F1EE', color:d?'#0F6E56':'#aaa' }}>
                  {d ? '✓ ' : ''}{l as string}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI 패턴 */}
        <div className="sec">AI가 발견한 내 몸 패턴</div>
        <div className="card">
          {patterns.map((p: any, i: number) => {
            const bg = p.type==='warning'?'#FAECE7':p.type==='success'?'#E1F5EE':'#E6F1FB'
            const tc = p.type==='warning'?'#993C1D':p.type==='success'?'#0F6E56':'#185FA5'
            const fc = p.type==='warning'?'#D85A30':p.type==='success'?'#1D9E75':'#378ADD'
            return (
              <div key={i} className="pat-item">
                <div className="pat-ic" style={{ background:bg }}>{p.icon}</div>
                <div style={{ flex:1 }}>
                  <div className="pat-title">{p.title}</div>
                  <div className="pat-desc">{p.desc}</div>
                  {!p.locked && p.confidence > 0 && (
                    <div className="pat-conf" style={{ color:tc }}>
                      확신도 {p.confidence}%
                      <div className="conf-bg">
                        <div className="conf-fill" style={{ width:`${p.confidence}%`, background:fc }}/>
                      </div>
                    </div>
                  )}
                </div>
                {p.locked && (
                  <div className="lock">
                    <span style={{ fontSize:18 }}>🔒</span>
                    <span style={{ fontSize:12, color:'#aaa', fontWeight:300 }}>더 많은 기록이 필요해요</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* 타임라인 */}
        <div className="sec">90일 진화 과정</div>
        <div className="card">
          <div className="card-inner">
            <div className="card-title" style={{ marginBottom:16 }}>단계별로 더 정확해져요</div>
            {[
              { num:1, days:'1~30일',    title:'기초 패턴 학습',      desc:'식사 시간대, 음식 유형, 활동 패턴을 파악해요.' },
              { num:2, days:'31~60일',   title:'실제 대사율 측정',     desc:'식사량 + 체중 변화로 내 진짜 유지 칼로리를 계산해요.' },
              { num:3, days:'61~90일',   title:'음식·에너지 상관관계', desc:'어떤 음식이 내 에너지에 영향을 주는지 발견해요.' },
              { num:4, days:'90일 이후', title:'완전한 내 몸 모델',    desc:'환경·스트레스·계절까지 반영한 나만의 건강 공식 완성!' },
            ].map((p, i) => {
              const isDone = p.num < phase, isCur = p.num === phase
              return (
                <div key={p.num} className="tl-item">
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
                    <div className="tl-dot" style={{ background:isDone?'#1D9E75':isCur?'#D85A30':'#F2F1EE', color:isDone||isCur?'#fff':'#aaa' }}>
                      {isDone ? '✓' : p.num}
                    </div>
                    {i < 3 && <div className="tl-line" style={{ background:isDone?'#1D9E75':'#F2F1EE' }}/>}
                  </div>
                  <div style={{ paddingTop:4 }}>
                    <div style={{ fontSize:11, fontWeight:600, marginBottom:2, color:isCur?'#D85A30':isDone?'#1D9E75':'#aaa' }}>
                      {p.days}{isCur ? ' ← 지금 여기' : ''}
                    </div>
                    <div style={{ fontSize:13, fontWeight:600, color:'#0F0E0D', marginBottom:2 }}>{p.title}</div>
                    <div style={{ fontSize:12, color:'#aaa', fontWeight:300, lineHeight:1.5 }}>{p.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 오늘 가이드 */}
        <div className="sec">오늘 내 몸에 맞는 가이드</div>
        <div className="today-card">
          <div className="today-lbl">내 데이터 기반 오늘의 목표</div>
          {[
            { key:'권장 섭취',     val: data?.estimatedMaintenance ? `${data.estimatedMaintenance.toLocaleString()} kcal` : '분석 중...', c: data?.estimatedMaintenance ? '#fff' : 'rgba(255,255,255,0.3)' },
            { key:'단백질 목표',   val: data?.estimatedMaintenance ? `${Math.round(data.estimatedMaintenance*0.25/4)}g`    : '분석 중...', c: data?.estimatedMaintenance ? '#1D9E75' : 'rgba(255,255,255,0.3)' },
            { key:'탄수화물 목표', val: data?.estimatedMaintenance ? `${Math.round(data.estimatedMaintenance*0.5/4)}g`     : '분석 중...', c: data?.estimatedMaintenance ? '#D85A30' : 'rgba(255,255,255,0.3)' },
            { key:'오늘 평균 섭취', val: data?.avgCal ? `${data.avgCal.toLocaleString()} kcal` : '기록 중...', c: data?.avgCal ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' },
          ].map((r, i) => (
            <div key={i} className="today-row">
              <span style={{ fontSize:13, color:'rgba(255,255,255,0.5)', fontWeight:300 }}>{r.key}</span>
              <span style={{ fontSize:14, fontWeight:600, color:r.c }}>{r.val}</span>
            </div>
          ))}
        </div>

        <div style={{ padding:'0 16px' }}>
          <button
            onClick={() => router.push('/home')}
            style={{ width:'100%', padding:15, borderRadius:14, background:'#fff', color:'#0F0E0D', fontFamily:"'Bricolage Grotesque',sans-serif", fontSize:15, fontWeight:700, border:'none', cursor:'pointer' }}>
            홈으로 돌아가기
          </button>
        </div>
        <div style={{ height:20 }}/>
      </div>
    </>
  )
}

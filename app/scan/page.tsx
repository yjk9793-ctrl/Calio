'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Analysis {
  foodName: string
  description: string
  calories: number
  calorieRange: string
  serving: string
  carbs: string
  protein: string
  fat: string
  sodium: string
  confidence: number
  confidenceLabel: string
}

export default function ScanPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview]     = useState<string | null>(null)
  const [base64, setBase64]       = useState<string | null>(null)
  const [analysis, setAnalysis]   = useState<Analysis | null>(null)
  const [loading, setLoading]     = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError]         = useState('')
  const [saved, setSaved]         = useState(false)
  const [mealType, setMealType]   = useState('snack')

  const loadingSteps = [
    '사진 업로드 중...',
    '음식 인식하는 중...',
    '칼로리 계산하는 중...',
    '영양소 분석하는 중...',
    '결과 정리하는 중...',
  ]

  const handleFile = (file: File) => {
    setAnalysis(null)
    setSaved(false)
    setError('')

    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      const MAX = 1200
      let w = img.width, h = img.height
      if (w > MAX || h > MAX) {
        if (w > h) { h = Math.round(h * MAX / w); w = MAX }
        else { w = Math.round(w * MAX / h); h = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = w; canvas.height = h
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, w, h)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      setPreview(dataUrl)
      setBase64(dataUrl.split(',')[1])
      URL.revokeObjectURL(objectUrl)
    }
    img.src = objectUrl
  }

  const handleAnalyze = async () => {
    if (!base64) return
    setLoading(true)
    setLoadingStep(0)
    setError('')

    // 로딩 스텝 애니메이션
    const stepInterval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev >= loadingSteps.length - 1) { clearInterval(stepInterval); return prev }
        return prev + 1
      })
    }, 1200)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ base64Image: base64, mediaType: 'image/jpeg', mealType }),
      })

      clearInterval(stepInterval)
      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'FREE_LIMIT') {
          setError('오늘 무료 분석 3회를 모두 사용했어요. 프리미엄으로 업그레이드하면 무제한으로 사용할 수 있어요.')
        } else {
          setError(data.error || '분석에 실패했어요.')
        }
        return
      }

      setAnalysis(data.analysis)
      setSaved(true)
    } catch (e: any) {
      setError(e.message || '오류가 발생했어요.')
    } finally {
      clearInterval(stepInterval)
      setLoading(false)
    }
  }

  const mealTypes = [
    { key: 'breakfast', label: '아침' },
    { key: 'lunch',     label: '점심' },
    { key: 'dinner',    label: '저녁' },
    { key: 'snack',     label: '간식' },
  ]

  // 로딩 진행도 계산
  const loadingPct = Math.round(((loadingStep + 1) / loadingSteps.length) * 100)

  return (
    <>
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        .scan-wrap { min-height:100dvh; background:#fff; font-family:'Plus Jakarta Sans',sans-serif; max-width:430px; margin:0 auto; padding-bottom:40px; }
        .scan-hdr { display:flex; justify-content:space-between; align-items:center; padding:52px 20px 16px; }
        .back-btn { background:none; border:none; font-size:24px; cursor:pointer; color:#888; padding:0; }
        .hdr-title { font-family:'Bricolage Grotesque',sans-serif; font-size:17px; font-weight:700; color:#0F0E0D; }

        .meal-row { display:flex; gap:8px; padding:0 16px 16px; }
        .meal-btn { flex:1; padding:10px 0; border-radius:22px; border:1.5px solid rgba(0,0,0,0.1); background:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:500; color:#888; cursor:pointer; transition:all 0.15s; }
        .meal-btn.on { background:#D85A30; border-color:#D85A30; color:#fff; font-weight:700; }

        .img-box { margin:0 16px 16px; border-radius:22px; overflow:hidden; min-height:240px; background:#F7F5F2; border:2px dashed rgba(216,90,48,0.25); display:flex; align-items:center; justify-content:center; cursor:pointer; position:relative; }
        .img-box.has-img { border-style:solid; border-color:rgba(216,90,48,0.3); }
        .img-box img { width:100%; max-height:340px; object-fit:cover; display:block; }
        .placeholder { display:flex; flex-direction:column; align-items:center; gap:10px; padding:40px 24px; text-align:center; }
        .placeholder-ic { width:72px; height:72px; border-radius:22px; background:#FAECE7; display:flex; align-items:center; justify-content:center; font-size:32px; }
        .placeholder-txt { font-family:'Bricolage Grotesque',sans-serif; font-size:17px; font-weight:700; color:#0F0E0D; }
        .placeholder-sub { font-size:13px; color:#aaa; font-weight:300; }
        .change-btn { position:absolute; bottom:12px; right:12px; background:rgba(0,0,0,0.5); color:#fff; border:none; border-radius:20px; padding:6px 14px; font-size:13px; cursor:pointer; backdrop-filter:blur(4px); }

        /* 분석 버튼 */
        .analyze-btn { display:flex; align-items:center; justify-content:center; gap:10px; width:calc(100% - 32px); margin:0 16px 16px; padding:17px; border-radius:16px; background:#0F0E0D; color:#fff; font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:700; border:none; cursor:pointer; }
        .analyze-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .analyze-btn-ic { width:28px; height:28px; border-radius:8px; background:rgba(216,90,48,0.2); display:flex; align-items:center; justify-content:center; font-size:16px; }

        /* 로딩 */
        .loading-box { margin:0 16px 16px; background:#0F0E0D; border-radius:22px; padding:24px 20px; }
        .loading-top { display:flex; align-items:center; gap:14px; margin-bottom:20px; }
        .loading-ring { flex-shrink:0; }
        .loading-txt-wrap { flex:1; }
        .loading-title { font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:700; color:#fff; margin-bottom:4px; }
        .loading-sub { font-size:13px; color:rgba(255,255,255,0.4); font-weight:300; }

        /* 진행 바 */
        .prog-wrap { margin-bottom:16px; }
        .prog-label { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .prog-step-txt { font-size:13px; color:rgba(255,255,255,0.6); font-weight:400; }
        .prog-pct { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:#D85A30; }
        .prog-bar-bg { height:6px; background:rgba(255,255,255,0.1); border-radius:3px; overflow:hidden; }
        .prog-bar-fill { height:100%; border-radius:3px; background:#D85A30; transition:width 0.4s ease; }

        /* 스텝 목록 */
        .step-list { display:flex; flex-direction:column; gap:8px; }
        .step-item { display:flex; align-items:center; gap:10px; font-size:13px; }
        .step-dot { width:20px; height:20px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-size:11px; }
        .step-dot.done { background:#1D9E75; }
        .step-dot.active { background:#D85A30; }
        .step-dot.pending { background:rgba(255,255,255,0.08); }
        .step-txt.done { color:rgba(255,255,255,0.5); }
        .step-txt.active { color:#fff; font-weight:600; }
        .step-txt.pending { color:rgba(255,255,255,0.25); }

        @keyframes spin { to { transform:rotate(360deg); } }
        .spin { animation:spin 1s linear infinite; }

        /* 결과 */
        .result-card { margin:0 16px; background:#F7F5F2; border-radius:22px; overflow:hidden; }
        .result-hero { background:#0F0E0D; padding:22px 20px 20px; }
        .result-nm { font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; color:#fff; margin-bottom:4px; }
        .result-desc { font-size:13px; color:rgba(255,255,255,0.45); font-weight:300; line-height:1.5; margin-bottom:16px; }
        .kcal-row { display:flex; align-items:baseline; gap:6px; }
        .kcal-num { font-family:'Bricolage Grotesque',sans-serif; font-size:52px; font-weight:800; color:#D85A30; line-height:1; }
        .kcal-unit { font-size:16px; color:rgba(216,90,48,0.7); font-weight:500; }
        .kcal-range { font-size:12px; color:rgba(255,255,255,0.3); margin-top:4px; }

        .macros { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; padding:16px 20px; }
        .macro { background:#fff; border-radius:14px; padding:12px 8px; text-align:center; }
        .macro-v { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; color:#0F0E0D; }
        .macro-l { font-size:11px; color:#aaa; margin-top:2px; }

        .conf-row { display:flex; align-items:center; gap:10px; padding:0 20px 16px; }
        .conf-lbl { font-size:12px; color:#aaa; white-space:nowrap; }
        .conf-bg { flex:1; height:5px; background:rgba(0,0,0,0.08); border-radius:3px; overflow:hidden; }
        .conf-fill { height:100%; border-radius:3px; background:#1D9E75; }
        .conf-pct { font-family:'Bricolage Grotesque',sans-serif; font-size:13px; font-weight:700; color:#1D9E75; white-space:nowrap; }

        .saved-banner { margin:0 20px 14px; padding:13px 16px; background:#E1F5EE; border-radius:12px; font-size:14px; font-weight:600; color:#085041; }

        .home-btn { width:calc(100% - 40px); margin:0 20px 10px; padding:15px; border-radius:14px; background:#0F0E0D; color:#fff; font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; border:none; cursor:pointer; }
        .retry-btn { width:calc(100% - 40px); margin:0 20px 20px; padding:12px; border-radius:14px; background:transparent; color:#aaa; font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; border:none; cursor:pointer; }

        .error-box { margin:0 16px 16px; padding:14px 16px; border-radius:14px; background:#FFF0F0; font-size:14px; color:#8B0000; line-height:1.6; }
      `}</style>

      <div className="scan-wrap">

        {/* 헤더 */}
        <div className="scan-hdr">
          <button className="back-btn" onClick={() => router.push('/home')}>←</button>
          <div className="hdr-title">음식 스캔</div>
          <div style={{ width:32 }}/>
        </div>

        {/* 식사 유형 */}
        <div className="meal-row">
          {mealTypes.map(t => (
            <button key={t.key} className={`meal-btn${mealType === t.key ? ' on' : ''}`}
              onClick={() => setMealType(t.key)}>{t.label}</button>
          ))}
        </div>

        {/* 이미지 */}
        <div className={`img-box${preview ? ' has-img' : ''}`}
          onClick={() => !preview && fileRef.current?.click()}>
          {preview ? (
            <>
              <img src={preview} alt="음식"/>
              <button className="change-btn"
                onClick={e => { e.stopPropagation(); fileRef.current?.click() }}>
                사진 변경
              </button>
            </>
          ) : (
            <div className="placeholder">
              <div className="placeholder-ic">📷</div>
              <div className="placeholder-txt">음식 사진을 올려주세요</div>
              <div className="placeholder-sub">탭해서 갤러리에서 선택</div>
            </div>
          )}
        </div>

        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }}
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}/>

        {/* 분석 버튼 */}
        {preview && !analysis && !loading && (
          <button className="analyze-btn" onClick={handleAnalyze}>
            <div className="analyze-btn-ic">✦</div>
            AI로 칼로리 분석하기
          </button>
        )}

        {/* 로딩 */}
        {loading && (
          <div className="loading-box">
            <div className="loading-top">
              <div className="loading-ring">
                <svg width="48" height="48" viewBox="0 0 48 48" className="spin">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(216,90,48,0.15)" strokeWidth="5"/>
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#D85A30" strokeWidth="5"
                    strokeDasharray="80 46" strokeLinecap="round" transform="rotate(-90 24 24)"/>
                </svg>
              </div>
              <div className="loading-txt-wrap">
                <div className="loading-title">AI가 분석하고 있어요</div>
                <div className="loading-sub">잠깐만 기다려주세요...</div>
              </div>
            </div>

            {/* 진행 바 */}
            <div className="prog-wrap">
              <div className="prog-label">
                <span className="prog-step-txt">{loadingSteps[loadingStep]}</span>
                <span className="prog-pct">{loadingPct}%</span>
              </div>
              <div className="prog-bar-bg">
                <div className="prog-bar-fill" style={{ width: `${loadingPct}%` }}/>
              </div>
            </div>

            {/* 스텝 목록 */}
            <div className="step-list">
              {loadingSteps.map((step, i) => {
                const state = i < loadingStep ? 'done' : i === loadingStep ? 'active' : 'pending'
                return (
                  <div key={i} className="step-item">
                    <div className={`step-dot ${state}`}>
                      {state === 'done' ? '✓' : state === 'active' ? '·' : ''}
                    </div>
                    <span className={`step-txt ${state}`}>{step}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 에러 */}
        {error && <div className="error-box">{error}</div>}

        {/* 결과 */}
        {analysis && (
          <div className="result-card">
            <div className="result-hero">
              <div className="result-nm">{analysis.foodName}</div>
              <div className="result-desc">{analysis.description}</div>
              <div className="kcal-row">
                <span className="kcal-num">{analysis.calories}</span>
                <span className="kcal-unit">kcal</span>
              </div>
              <div className="kcal-range">예상 범위: {analysis.calorieRange}</div>
            </div>

            <div className="macros">
              <div className="macro"><div className="macro-v">{analysis.carbs}</div><div className="macro-l">탄수화물</div></div>
              <div className="macro"><div className="macro-v">{analysis.protein}</div><div className="macro-l">단백질</div></div>
              <div className="macro"><div className="macro-v">{analysis.fat}</div><div className="macro-l">지방</div></div>
            </div>

            <div className="conf-row">
              <span className="conf-lbl">AI 신뢰도</span>
              <div className="conf-bg"><div className="conf-fill" style={{ width:`${analysis.confidence}%` }}/></div>
              <span className="conf-pct">{analysis.confidence}%</span>
            </div>

            {saved && <div className="saved-banner">✓ 오늘 기록에 저장됐어요</div>}

            <button className="home-btn" onClick={() => router.push('/home')}>홈으로 돌아가기</button>
            <button className="retry-btn"
              onClick={() => { setPreview(null); setBase64(null); setAnalysis(null); setSaved(false) }}>
              다른 음식 분석하기
            </button>
          </div>
        )}

        <div style={{ height:20 }}/>
      </div>
    </>
  )
}
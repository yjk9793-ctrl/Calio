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
  const [preview, setPreview] = useState<string | null>(null)
  const [base64, setBase64] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState('image/jpeg')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [mealType, setMealType] = useState('snack')

  const handleFile = (file: File) => {
    setMediaType(file.type || 'image/jpeg')
    setAnalysis(null)
    setSaved(false)
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      setPreview(dataUrl)
      setBase64(dataUrl.split(',')[1])
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!base64) return
    setLoading(true)
    setError('')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.push('/auth'); return }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ base64Image: base64, mediaType, mealType }),
      })

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
    }
    setLoading(false)
  }

  const mealTypes = [
    { key: 'breakfast', label: '아침' },
    { key: 'lunch',     label: '점심' },
    { key: 'dinner',    label: '저녁' },
    { key: 'snack',     label: '간식' },
  ]

  const s = styles

  return (
    <div style={s.wrap}>

      {/* 헤더 */}
      <div style={s.header}>
        <button onClick={() => router.push('/home')} style={s.backBtn}>←</button>
        <div style={s.headerTitle}>음식 스캔</div>
        <div style={{ width: 32 }}/>
      </div>

      {/* 식사 유형 선택 */}
      <div style={s.mealTypeRow}>
        {mealTypes.map(t => (
          <button key={t.key}
            onClick={() => setMealType(t.key)}
            style={{
              ...s.mealTypeBtn,
              background: mealType === t.key ? '#D85A30' : '#fff',
              color: mealType === t.key ? '#fff' : '#7A7570',
              borderColor: mealType === t.key ? '#D85A30' : 'rgba(0,0,0,0.1)',
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* 이미지 영역 */}
      <div
        style={s.imageBox}
        onClick={() => !preview && fileRef.current?.click()}>
        {preview ? (
          <img src={preview} alt="음식 사진" style={s.previewImg}/>
        ) : (
          <div style={s.placeholder}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>📸</div>
            <div style={s.placeholderText}>음식 사진을 올려주세요</div>
            <div style={s.placeholderSub}>탭해서 사진 선택</div>
          </div>
        )}
        {preview && (
          <button
            onClick={(e) => { e.stopPropagation(); fileRef.current?.click() }}
            style={s.changeBtn}>
            사진 변경
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      {/* 분석 버튼 */}
      {preview && !analysis && (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          style={s.analyzeBtn}>
          {loading ? '🤖 AI가 분석하고 있어요...' : '📸 칼로리 분석하기'}
        </button>
      )}

      {/* 에러 */}
      {error && (
        <div style={s.errorBox}>{error}</div>
      )}

      {/* 분석 결과 */}
      {analysis && (
        <div style={s.resultCard}>
          <div style={s.resultHero}>
            <div style={{ flex: 1 }}>
              <div style={s.foodName}>{analysis.foodName}</div>
              <div style={s.foodDesc}>{analysis.description}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={s.kcalNum}>{analysis.calories}</div>
              <div style={s.kcalUnit}>kcal</div>
            </div>
          </div>

          {/* 범위 */}
          <div style={s.rangeText}>예상 범위: {analysis.calorieRange}</div>

          {/* 영양소 */}
          <div style={s.macroRow}>
            {[
              { label: '탄수화물', value: analysis.carbs },
              { label: '단백질',   value: analysis.protein },
              { label: '지방',     value: analysis.fat },
            ].map(m => (
              <div key={m.label} style={s.macroBox}>
                <div style={s.macroVal}>{m.value}</div>
                <div style={s.macroLabel}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* 신뢰도 */}
          <div style={s.confRow}>
            <span style={s.confLabel}>AI 신뢰도</span>
            <div style={s.confBarBg}>
              <div style={{ ...s.confBarFill, width: `${analysis.confidence}%` }}/>
            </div>
            <span style={s.confPct}>{analysis.confidence}%</span>
          </div>

          {/* 저장 완료 */}
          {saved && (
            <div style={s.savedBanner}>
              ✓ 오늘 기록에 저장됐어요
            </div>
          )}

          {/* 홈으로 */}
          <button onClick={() => router.push('/home')} style={s.homeBtn}>
            홈으로 돌아가기
          </button>

          {/* 또 찍기 */}
          <button
            onClick={() => { setPreview(null); setBase64(null); setAnalysis(null); setSaved(false) }}
            style={s.retryBtn}>
            다른 음식 분석하기
          </button>
        </div>
      )}

      <div style={{ height: 40 }}/>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    background: '#F7F5F2',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    maxWidth: 430,
    margin: '0 auto',
    paddingBottom: 40,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '52px 20px 16px',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    fontSize: 22,
    cursor: 'pointer',
    color: '#7A7570',
    padding: 0,
  },
  headerTitle: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: '#0F0E0D',
  },
  mealTypeRow: {
    display: 'flex',
    gap: 8,
    padding: '0 16px 16px',
  },
  mealTypeBtn: {
    flex: 1,
    padding: '9px 0',
    borderRadius: 20,
    border: '1px solid',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  imageBox: {
    margin: '0 16px 16px',
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 220,
    background: '#fff',
    border: '2px dashed rgba(216,90,48,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative' as const,
  },
  previewImg: {
    width: '100%',
    maxHeight: 320,
    objectFit: 'cover' as const,
    display: 'block',
  },
  placeholder: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: 32,
  },
  placeholderText: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 16,
    fontWeight: 700,
    color: '#0F0E0D',
    marginBottom: 4,
  },
  placeholderSub: {
    fontSize: 12,
    color: '#7A7570',
    fontWeight: 300,
  },
  changeBtn: {
    position: 'absolute' as const,
    bottom: 12,
    right: 12,
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    border: 'none',
    borderRadius: 20,
    padding: '5px 12px',
    fontSize: 12,
    cursor: 'pointer',
  },
  analyzeBtn: {
    width: 'calc(100% - 32px)',
    margin: '0 16px 16px',
    padding: 15,
    borderRadius: 14,
    background: '#D85A30',
    color: '#fff',
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 15,
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
  errorBox: {
    margin: '0 16px 16px',
    padding: '14px 16px',
    borderRadius: 12,
    background: '#FFF0F0',
    border: '1px solid #FFCCCC',
    color: '#8B0000',
    fontSize: 13,
    lineHeight: 1.6,
  },
  resultCard: {
    margin: '0 16px',
    background: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  resultHero: {
    background: '#FAECE7',
    padding: '20px 18px 16px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
  },
  foodName: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 20,
    fontWeight: 800,
    color: '#0F0E0D',
    marginBottom: 4,
    letterSpacing: '-0.3px',
  },
  foodDesc: {
    fontSize: 12,
    color: '#7A7570',
    fontWeight: 300,
    lineHeight: 1.5,
  },
  kcalNum: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 36,
    fontWeight: 800,
    color: '#D85A30',
    lineHeight: 1,
  },
  kcalUnit: {
    fontSize: 12,
    color: '#993C1D',
    fontWeight: 500,
    textAlign: 'right' as const,
  },
  rangeText: {
    fontSize: 11,
    color: '#7A7570',
    padding: '8px 18px 0',
    fontWeight: 300,
  },
  macroRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 8,
    padding: '12px 18px',
  },
  macroBox: {
    background: '#F7F5F2',
    borderRadius: 10,
    padding: '10px 8px',
    textAlign: 'center' as const,
  },
  macroVal: {
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 16,
    fontWeight: 800,
    color: '#0F0E0D',
  },
  macroLabel: {
    fontSize: 10,
    color: '#7A7570',
    fontWeight: 300,
    marginTop: 2,
  },
  confRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '0 18px 16px',
  },
  confLabel: {
    fontSize: 11,
    color: '#7A7570',
    fontWeight: 300,
    whiteSpace: 'nowrap' as const,
  },
  confBarBg: {
    flex: 1,
    height: 4,
    background: 'rgba(0,0,0,0.08)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confBarFill: {
    height: '100%',
    borderRadius: 2,
    background: '#1D9E75',
  },
  confPct: {
    fontSize: 11,
    color: '#1D9E75',
    fontWeight: 600,
    whiteSpace: 'nowrap' as const,
  },
  savedBanner: {
    margin: '0 18px 12px',
    padding: '12px 14px',
    background: '#E1F5EE',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
    color: '#085041',
  },
  homeBtn: {
    width: 'calc(100% - 36px)',
    margin: '0 18px 8px',
    padding: 14,
    borderRadius: 13,
    background: '#D85A30',
    color: '#fff',
    fontFamily: "'Bricolage Grotesque', sans-serif",
    fontSize: 14,
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
  retryBtn: {
    width: 'calc(100% - 36px)',
    margin: '0 18px 18px',
    padding: 12,
    borderRadius: 13,
    background: 'transparent',
    color: '#7A7570',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: 13,
    border: 'none',
    cursor: 'pointer',
  },
}

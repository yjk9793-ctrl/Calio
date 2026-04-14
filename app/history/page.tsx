'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Meal {
  id: string
  meal_name: string
  meal_type: string
  calories: number
  carbs_g: number
  protein_g: number
  fat_g: number
  image_url?: string
  logged_at: string
}

interface DayGroup {
  date: string
  label: string
  isToday: boolean
  meals: Meal[]
  totalKcal: number
}

export default function HistoryPage() {
  const router = useRouter()
  const [groups, setGroups]     = useState<DayGroup[]>([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState<Meal | null>(null)

  const mealLabel: Record<string,string> = {
    breakfast:'아침', lunch:'점심', dinner:'저녁', snack:'간식'
  }
  const mealColors: Record<string,string> = {
    breakfast:'#FAEEDA', lunch:'#FAECE7', dinner:'#E6F1FB', snack:'#E1F5EE'
  }

  useEffect(() => { loadHistory() }, [])

  const loadHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/auth'); return }

    const result: DayGroup[] = []
    const today = new Date()

    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]

      const dayNames = ['일','월','화','수','목','금','토']
      const isToday = i === 0
      const isYesterday = i === 1
      const label = isToday ? '오늘' : isYesterday ? '어제' :
        `${d.getMonth()+1}월 ${d.getDate()}일 (${dayNames[d.getDay()]})`

      const { data: meals } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .gte('logged_at', dateStr + 'T00:00:00')
        .lte('logged_at', dateStr + 'T23:59:59')
        .order('logged_at', { ascending: true })

      const mealData = (meals ?? []) as Meal[]
      const totalKcal = mealData.reduce((s, m) => s + m.calories, 0)
      result.push({ date: dateStr, label, isToday, meals: mealData, totalKcal })
    }

    setGroups(result)
    setLoading(false)
  }

  return (
    <>
      <style>{`
        * { box-sizing:border-box; -webkit-tap-highlight-color:transparent; }
        .hw { min-height:100dvh; background:#F2F1EE; font-family:'Plus Jakarta Sans',sans-serif; max-width:430px; margin:0 auto; padding-bottom:calc(80px + env(safe-area-inset-bottom,0px)); }

        .hero { background:#0F0E0D; border-radius:0 0 32px 32px; padding:0 20px 24px; margin-bottom:20px; }
        .hdr { display:flex; justify-content:space-between; align-items:center; padding:28px 0 16px; }
        .back-btn { background:none; border:none; font-size:24px; cursor:pointer; color:rgba(255,255,255,0.5); padding:0; }
        .pg-title { font-family:'Bricolage Grotesque',sans-serif; font-size:24px; font-weight:800; color:#fff; }

        .week-summary { display:flex; gap:8px; overflow-x:auto; padding-bottom:4px; }
        .week-summary::-webkit-scrollbar { display:none; }
        .day-chip { flex-shrink:0; background:rgba(255,255,255,0.06); border-radius:12px; padding:10px 14px; text-align:center; min-width:52px; }
        .day-chip.today { background:rgba(216,90,48,0.2); border:1px solid rgba(216,90,48,0.3); }
        .day-chip.has-data { opacity:1; }
        .day-chip.no-data { opacity:0.35; }
        .day-chip-lbl { font-size:11px; color:rgba(255,255,255,0.5); margin-bottom:4px; }
        .day-chip-kcal { font-family:'Bricolage Grotesque',sans-serif; font-size:13px; font-weight:700; color:#fff; }
        .day-chip-dot { width:5px; height:5px; border-radius:3px; background:#D85A30; margin:4px auto 0; }

        .sec { font-family:'Bricolage Grotesque',sans-serif; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#aaa; margin:0 16px 10px; }

        .day-group { margin:0 16px 16px; }
        .day-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
        .day-lbl { font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:800; color:#0F0E0D; }
        .day-lbl.today { color:#D85A30; }
        .day-total { font-family:'Bricolage Grotesque',sans-serif; font-size:14px; font-weight:700; color:#D85A30; }
        .day-total.zero { color:#ccc; }

        .meal-card { background:#fff; border-radius:16px; overflow:hidden; }
        .meal-row { display:flex; align-items:center; gap:12px; padding:13px 16px; border-bottom:0.5px solid rgba(0,0,0,0.05); cursor:pointer; }
        .meal-row:last-child { border-bottom:none; }
        .meal-ic { width:44px; height:44px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:20px; flex-shrink:0; }
        .meal-info { flex:1; }
        .meal-nm { font-size:15px; font-weight:500; color:#0F0E0D; }
        .meal-meta { font-size:12px; color:#aaa; margin-top:2px; }
        .meal-kcal { font-family:'Bricolage Grotesque',sans-serif; font-size:16px; font-weight:800; color:#D85A30; }

        .empty-day { background:#fff; border-radius:16px; padding:20px; text-align:center; }
        .empty-day-txt { font-size:13px; color:#ccc; font-weight:300; }

        /* 상세 모달 */
        .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); z-index:200; display:flex; align-items:flex-end; justify-content:center; }
        .modal-sheet { background:#fff; border-radius:24px 24px 0 0; width:100%; max-width:430px; padding:24px 20px max(28px, env(safe-area-inset-bottom,28px)); }
        .modal-handle { width:36px; height:4px; border-radius:2px; background:rgba(0,0,0,0.1); margin:0 auto 20px; }
        .modal-food-nm { font-family:'Bricolage Grotesque',sans-serif; font-size:22px; font-weight:800; color:#0F0E0D; margin-bottom:4px; }
        .modal-meta { font-size:13px; color:#aaa; font-weight:300; margin-bottom:16px; }
        .modal-kcal { font-family:'Bricolage Grotesque',sans-serif; font-size:48px; font-weight:800; color:#D85A30; line-height:1; margin-bottom:4px; }
        .modal-kcal-unit { font-size:14px; color:#993C1D; font-weight:500; }
        .modal-macros { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-top:16px; }
        .modal-macro { background:#F7F5F2; border-radius:12px; padding:12px 8px; text-align:center; }
        .modal-macro-v { font-family:'Bricolage Grotesque',sans-serif; font-size:17px; font-weight:800; color:#0F0E0D; }
        .modal-macro-l { font-size:11px; color:#aaa; margin-top:2px; }
        .modal-close { width:100%; padding:14px; border-radius:13px; background:#F7F5F2; color:#0F0E0D; font-family:'Bricolage Grotesque',sans-serif; font-size:15px; font-weight:700; border:none; cursor:pointer; margin-top:16px; }

        .no-record { background:#fff; border-radius:18px; margin:0 16px; padding:40px 24px; display:flex; flex-direction:column; align-items:center; text-align:center; }
        .no-record-ttl { font-family:'Bricolage Grotesque',sans-serif; font-size:18px; font-weight:800; color:#0F0E0D; margin-bottom:6px; margin-top:12px; }
        .no-record-sub { font-size:14px; color:#aaa; font-weight:300; line-height:1.5; }
      `}</style>

      <div className="hw">

        {/* 다크 히어로 */}
        <div className="hero">
          <div className="hdr">
            <button className="back-btn" onClick={() => router.push('/home')}>←</button>
            <div className="pg-title">식단 히스토리</div>
            <div style={{ width:32 }}/>
          </div>

          {/* 주간 요약 칩 */}
          {!loading && (
            <div className="week-summary">
              {[...groups].reverse().map((g, i) => (
                <div key={g.date} className={`day-chip${g.isToday?' today':''} ${g.totalKcal>0?'has-data':'no-data'}`}>
                  <div className="day-chip-lbl">{g.isToday ? '오늘' : g.label.slice(0,2)}</div>
                  <div className="day-chip-kcal">{g.totalKcal > 0 ? g.totalKcal.toLocaleString() : '−'}</div>
                  {g.totalKcal > 0 && <div className="day-chip-dot"/>}
                </div>
              ))}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign:'center', padding:'40px', color:'#aaa', fontSize:14 }}>불러오는 중...</div>
        ) : groups.every(g => g.meals.length === 0) ? (
          <div className="no-record">
            <div style={{ fontSize:40 }}>🍽️</div>
            <div className="no-record-ttl">아직 식단 기록이 없어요</div>
            <div className="no-record-sub">음식을 찍으면 여기에<br/>기록이 쌓여요</div>
          </div>
        ) : (
          groups.map(g => (
            <div key={g.date} className="day-group">
              <div className="day-header">
                <div className={`day-lbl${g.isToday?' today':''}`}>{g.label}</div>
                {g.totalKcal > 0 && (
                  <div className="day-total">{g.totalKcal.toLocaleString()} kcal</div>
                )}
              </div>

              {g.meals.length === 0 ? (
                <div className="empty-day">
                  <div className="empty-day-txt">기록 없음</div>
                </div>
              ) : (
                <div className="meal-card">
                  {g.meals.map(m => (
                    <div key={m.id} className="meal-row" onClick={() => setSelected(m)}>
                      <div className="meal-ic" style={{ background: mealColors[m.meal_type] ?? '#F1EFE8' }}>
                        🍽️
                      </div>
                      <div className="meal-info">
                        <div className="meal-nm">{m.meal_name}</div>
                        <div className="meal-meta">
                          {mealLabel[m.meal_type] ?? '간식'} · {new Date(m.logged_at).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })}
                        </div>
                      </div>
                      <div className="meal-kcal">+{m.calories}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}

        <div style={{ height:20 }}/>
      </div>

      {/* 상세 모달 */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle"/>
            <div className="modal-food-nm">{selected.meal_name}</div>
            <div className="modal-meta">
              {mealLabel[selected.meal_type] ?? '간식'} · {new Date(selected.logged_at).toLocaleDateString('ko-KR', { month:'long', day:'numeric' })} {new Date(selected.logged_at).toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })}
            </div>
            <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
              <div className="modal-kcal">{selected.calories}</div>
              <div className="modal-kcal-unit">kcal</div>
            </div>
            <div className="modal-macros">
              <div className="modal-macro">
                <div className="modal-macro-v">{selected.carbs_g ?? '−'}g</div>
                <div className="modal-macro-l">탄수화물</div>
              </div>
              <div className="modal-macro">
                <div className="modal-macro-v">{selected.protein_g ?? '−'}g</div>
                <div className="modal-macro-l">단백질</div>
              </div>
              <div className="modal-macro">
                <div className="modal-macro-v">{selected.fat_g ?? '−'}g</div>
                <div className="modal-macro-l">지방</div>
              </div>
            </div>
            <button className="modal-close" onClick={() => setSelected(null)}>닫기</button>
          </div>
        </div>
      )}
    </>
  )
}

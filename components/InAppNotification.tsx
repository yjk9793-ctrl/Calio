'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface Notification {
  id: string
  type: 'goal' | 'streak' | 'reminder' | 'congrats' | 'premium'
  icon: string
  title: string
  desc: string
  action?: string
  actionLabel?: string
  color: string
}

export default function InAppNotification() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [dismissed, setDismissed] = useState<string[]>([])

  useEffect(() => {
    checkNotifications()
  }, [])

  const checkNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: ud } = await supabase.from('users').select('*').eq('id', user.id).single()
    if (!ud) return

    const userData = ud as any
    const notes: Notification[] = []
    const today = new Date().toISOString().split('T')[0]
    const hour = new Date().getHours()

    // 1. 목표 미설정 (닉네임 없거나 daily_kcal_goal 기본값)
    if (!userData.nickname || !userData.height_cm || !userData.weight_kg) {
      notes.push({
        id: 'goal-setup',
        type: 'goal',
        icon: '🎯',
        title: '목표를 설정해주세요',
        desc: '신체 정보와 목표를 입력하면 정확한 칼로리를 계산해드려요.',
        action: '/mypage',
        actionLabel: '목표 설정하기',
        color: '#FAECE7',
      })
    }

    // 2. 오늘 기록 없을 때 (오전 11시 이후)
    const { data: todayMeals } = await supabase
      .from('meals').select('id').eq('user_id', user.id)
      .gte('logged_at', today + 'T00:00:00').limit(1)

    if ((!todayMeals || todayMeals.length === 0) && hour >= 11) {
      notes.push({
        id: 'meal-reminder',
        type: 'reminder',
        icon: '🍽️',
        title: '오늘 첫 기록을 해볼까요?',
        desc: hour < 14 ? '점심 뭐 드셨어요? 사진 찍고 칼로리 확인해봐요!' :
              hour < 18 ? '오늘 먹은 것들 기록해봐요. 습관이 건강을 만들어요.' :
              '저녁 식사 기록하고 오늘 하루 마무리해봐요.',
        action: '/scan',
        actionLabel: '음식 기록하기',
        color: '#E1F5EE',
      })
    }

    // 3. 연속 기록 칭찬 (3일, 7일, 30일)
    const streak = userData.streak_days ?? 0
    if ([3, 7, 14, 30].includes(streak)) {
      notes.push({
        id: `streak-${streak}`,
        type: 'congrats',
        icon: '🔥',
        title: `${streak}일 연속 기록 달성!`,
        desc: `대단해요! ${streak}일 동안 꾸준히 기록했어요. 이 페이스 유지해봐요!`,
        color: '#FAECE7',
      })
    }

    // 4. 무료 3회 다 썼을 때 프리미엄 유도
    const { count } = await supabase.from('meals').select('*', { count:'exact', head:true })
      .eq('user_id', user.id).gte('logged_at', today + 'T00:00:00')

    if ((count ?? 0) >= 3 && !userData.is_premium) {
      notes.push({
        id: 'premium-nudge',
        type: 'premium',
        icon: '✦',
        title: '오늘 무료 분석 3회를 다 썼어요',
        desc: '프리미엄으로 업그레이드하면 무제한으로 분석할 수 있어요.',
        action: '/premium',
        actionLabel: '프리미엄 시작하기',
        color: '#EEEDFE',
      })
    }

    // 이미 닫은 알림 제외 (세션 기준)
    const stored = sessionStorage.getItem('dismissed_notes')
    const storedList = stored ? JSON.parse(stored) : []
    setDismissed(storedList)
    setNotifications(notes.filter(n => !storedList.includes(n.id)))
  }

  const dismiss = (id: string) => {
    const updated = [...dismissed, id]
    setDismissed(updated)
    sessionStorage.setItem('dismissed_notes', JSON.stringify(updated))
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  if (notifications.length === 0) return null

  return (
    <>
      <style>{`
        .notif-stack {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 0 16px 14px;
        }
        .notif-card {
          border-radius: 16px;
          padding: 14px 16px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          position: relative;
          animation: slideDown 0.3s ease;
        }
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .notif-ic {
          width: 38px; height: 38px;
          border-radius: 11px;
          background: rgba(0,0,0,0.08);
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .notif-body { flex: 1; }
        .notif-title {
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 14px; font-weight: 800; color: #0F0E0D;
          margin-bottom: 3px; line-height: 1.2;
        }
        .notif-desc {
          font-size: 12px; color: #666;
          font-weight: 300; line-height: 1.5;
        }
        .notif-action {
          margin-top: 8px;
          display: inline-block;
          font-family: 'Bricolage Grotesque', sans-serif;
          font-size: 12px; font-weight: 700;
          color: #D85A30; cursor: pointer;
          background: none; border: none; padding: 0;
        }
        .notif-close {
          position: absolute; top: 10px; right: 12px;
          background: none; border: none;
          font-size: 16px; color: rgba(0,0,0,0.25);
          cursor: pointer; padding: 0; line-height: 1;
        }
      `}</style>

      <div className="notif-stack">
        {notifications.map(n => (
          <div key={n.id} className="notif-card" style={{ background: n.color }}>
            <div className="notif-ic">{n.icon}</div>
            <div className="notif-body">
              <div className="notif-title">{n.title}</div>
              <div className="notif-desc">{n.desc}</div>
              {n.action && (
                <button className="notif-action" onClick={() => { dismiss(n.id); router.push(n.action!) }}>
                  {n.actionLabel} →
                </button>
              )}
            </div>
            <button className="notif-close" onClick={() => dismiss(n.id)}>✕</button>
          </div>
        ))}
      </div>
    </>
  )
}

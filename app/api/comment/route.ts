import { NextRequest, NextResponse } from 'next/server'
import { generatePositiveComment } from '@/lib/claude'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: '인증 실패' }, { status: 401 })

    // 오늘 기록 조회
    const today = new Date().toISOString().split('T')[0]

    const [{ data: meals }, { data: activities }, { data: userData }] = await Promise.all([
      supabase.from('meals').select('meal_name, calories').eq('user_id', user.id).gte('logged_at', today + 'T00:00:00'),
      supabase.from('activities').select('activity_type, calories_burned').eq('user_id', user.id).gte('logged_at', today + 'T00:00:00'),
      supabase.from('users').select('daily_kcal_goal, streak_days').eq('id', user.id).single()
    ])

    const totalIn  = meals?.reduce((s, m) => s + m.calories, 0) ?? 0
    const totalOut = activities?.reduce((s, a) => s + a.calories_burned, 0) ?? 0

    const comment = await generatePositiveComment({
      totalCaloriesIn:  totalIn,
      totalCaloriesOut: totalOut,
      goalCalories:     userData?.daily_kcal_goal ?? 2000,
      activities:       activities?.map(a => a.activity_type) ?? [],
      meals:            meals?.map(m => m.meal_name) ?? [],
      streakDays:       userData?.streak_days ?? 0,
    })

    return NextResponse.json({ comment })

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

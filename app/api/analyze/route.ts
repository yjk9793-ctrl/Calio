import { NextRequest, NextResponse } from 'next/server'
import { analyzeMealImage } from '@/lib/claude'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// 무료 유저 하루 3회 제한 체크
async function checkFreeLimit(userId: string): Promise<{ allowed: boolean; count: number }> {
  const today = new Date().toISOString().split('T')[0]
  const { count } = await supabase
    .from('meals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('logged_at', today + 'T00:00:00')

  const { data: user } = await supabase
    .from('users')
    .select('is_premium')
    .eq('id', userId)
    .single()

  const dailyCount = count ?? 0
  const isPremium = user?.is_premium ?? false

  return {
    allowed: isPremium || dailyCount < 3,
    count: dailyCount
  }
}

export async function POST(req: NextRequest) {
  try {
    // 인증 확인
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 })
    }

    // 무료 제한 체크
    const { allowed, count } = await checkFreeLimit(user.id)
    if (!allowed) {
      return NextResponse.json({
        error: 'FREE_LIMIT',
        message: `오늘 무료 분석 3회를 모두 사용했어요. (${count}/3)`,
        usedCount: count
      }, { status: 403 })
    }

    // 이미지 분석
    const { base64Image, mediaType, mealType } = await req.json()
    if (!base64Image) {
      return NextResponse.json({ error: '이미지가 없어요' }, { status: 400 })
    }

    const analysis = await analyzeMealImage(base64Image, mediaType || 'image/jpeg')

    // DB 저장
    const { data: meal, error: insertError } = await supabase
      .from('meals')
      .insert({
        user_id:        user.id,
        meal_name:      analysis.foodName,
        meal_type:      mealType || 'snack',
        calories:       analysis.calories,
        carbs_g:        parseFloat(analysis.carbs),
        protein_g:      parseFloat(analysis.protein),
        fat_g:          parseFloat(analysis.fat),
        sodium_mg:      parseInt(analysis.sodium),
        sugar_g:        parseFloat(analysis.sugar),
        fiber_g:        parseFloat(analysis.fiber),
        ai_confidence:  analysis.confidence,
        logged_at:      new Date().toISOString(),
      })
      .select()
      .single()

    if (insertError) throw insertError

    // 연속 기록 업데이트
    await supabase.rpc('update_streak', { p_user_id: user.id })

    return NextResponse.json({ meal, analysis, usedCount: count + 1 })

  } catch (err: any) {
    console.error('analyze error:', err)
    return NextResponse.json({ error: err.message || '분석에 실패했어요' }, { status: 500 })
  }
}

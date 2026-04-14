import { NextRequest, NextResponse } from 'next/server'
import { analyzeMealImage } from '@/lib/claude'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
  const isPremium = (user as any)?.is_premium ?? false
  return { allowed: isPremium || dailyCount < 3, count: dailyCount }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: '로그인이 필요해요' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: '인증 실패' }, { status: 401 })
    }

    const { allowed, count } = await checkFreeLimit(user.id)
    if (!allowed) {
      return NextResponse.json({
        error: 'FREE_LIMIT',
        message: `오늘 무료 분석 3회를 모두 사용했어요. (${count}/3)`,
        usedCount: count
      }, { status: 403 })
    }

    const { base64Image, mediaType, mealType } = await req.json()
    if (!base64Image) {
      return NextResponse.json({ error: '이미지가 없어요' }, { status: 400 })
    }

    let analysis
    try {
      analysis = await analyzeMealImage(base64Image, mediaType || 'image/jpeg')
    } catch (parseErr) {
      console.error('parse error:', parseErr)
      return NextResponse.json({ error: '음식을 인식하지 못했어요. 다시 시도해주세요.' }, { status: 422 })
    }

    const { data: savedMeal, error: insertError } = await supabase
      .from('meals')
      .insert({
        user_id:       user.id,
        meal_name:     analysis.foodName,
        meal_type:     mealType || 'snack',
        calories:      analysis.calories,
        carbs_g:       parseFloat(analysis.carbs) || 0,
        protein_g:     parseFloat(analysis.protein) || 0,
        fat_g:         parseFloat(analysis.fat) || 0,
        sodium_mg:     parseInt(analysis.sodium) || 0,
        sugar_g:       parseFloat(analysis.sugar) || 0,
        fiber_g:       parseFloat(analysis.fiber) || 0,
        ai_confidence: analysis.confidence,
        logged_at:     new Date().toISOString(),
      } as any)
      .select()
      .single()

    if (insertError) throw insertError

    return NextResponse.json({ meal: savedMeal, analysis, usedCount: count + 1 })

  } catch (err: any) {
    console.error('analyze error:', err)
    return NextResponse.json({ error: err.message || '분석에 실패했어요' }, { status: 500 })
  }
}
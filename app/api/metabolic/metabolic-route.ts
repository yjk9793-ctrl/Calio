import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: '인증 실패' }, { status: 401 })

    const days90ago = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

    const [{ data: meals }, { data: weights }, { data: userData }] = await Promise.all([
      supabase.from('meals').select('calories, logged_at').eq('user_id', user.id).gte('logged_at', days90ago).order('logged_at'),
      supabase.from('weight_logs').select('weight_kg, logged_at').eq('user_id', user.id).gte('logged_at', days90ago).order('logged_at'),
      supabase.from('users').select('daily_kcal_goal, streak_days, gender, weight_kg, height_cm').eq('id', user.id).single(),
    ])

    const mealList   = meals   ?? []
    const weightList = weights ?? []
    const recordDays = (userData as any)?.streak_days ?? 0

    // 일별 칼로리 합산
    const dailyCalMap: Record<string, number> = {}
    for (const m of mealList) {
      const day = m.logged_at.split('T')[0]
      dailyCalMap[day] = (dailyCalMap[day] ?? 0) + m.calories
    }
    const dailyCals = Object.values(dailyCalMap)
    const avgCal = dailyCals.length > 0
      ? Math.round(dailyCals.reduce((a, b) => a + b, 0) / dailyCals.length)
      : (userData as any)?.daily_kcal_goal ?? 2000

    // 실제 유지 칼로리 역산
    let estimatedMaintenance: number | null = null
    let weightTrend: number | null = null
    let accuracy = 0

    if (weightList.length >= 2) {
      const firstW  = weightList[0].weight_kg
      const lastW   = weightList[weightList.length - 1].weight_kg
      const daysDiff = Math.max(1,
        (new Date(weightList[weightList.length-1].logged_at).getTime() - new Date(weightList[0].logged_at).getTime())
        / (1000 * 60 * 60 * 24)
      )
      weightTrend = Math.round(((lastW - firstW) / daysDiff) * 30 * 10) / 10
      const dailyWeightKcal = ((lastW - firstW) / daysDiff) * 7700
      estimatedMaintenance = Math.round(avgCal - dailyWeightKcal)
      accuracy = Math.min(95, 50 + weightList.length * 3 + Math.min(recordDays, 30))
    }

    // AI 패턴 분석
    let patterns: any[] = []
    if (mealList.length >= 14 && weightList.length >= 2) {
      try {
        const res = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `다음 데이터를 분석해서 JSON으로만 응답하세요. 마크다운 없이 JSON만.

평균 일일 섭취: ${avgCal} kcal
기록 일수: ${recordDays}일
체중 변화: ${weightTrend !== null ? `${weightTrend > 0 ? '+' : ''}${weightTrend}kg/월` : '없음'}
추정 유지 칼로리: ${estimatedMaintenance ?? '계산 중'}

{
  "patterns": [
    {
      "icon": "이모지1개",
      "title": "패턴 제목 10자이내",
      "desc": "구체적 설명과 조언 40자이내",
      "confidence": 60,
      "type": "warning"
    }
  ]
}

패턴 2-3개. type은 warning/success/info 중 하나.`
          }]
        })
        const txt = res.content.map((b: any) => b.type === 'text' ? b.text : '').join('')
        const match = txt.match(/\{[\s\S]*\}/)
        if (match) patterns = JSON.parse(match[0]).patterns ?? []
      } catch { patterns = [] }
    }

    // 마일스톤
    const milestones = []
    if (recordDays === 7)          milestones.push({ icon:'🎉', msg:'7일 연속 달성! 습관이 만들어지고 있어요.' })
    if (recordDays === 30)         milestones.push({ icon:'🏆', msg:'30일 달성! 내 몸 패턴이 보이기 시작해요.' })
    if (recordDays === 60)         milestones.push({ icon:'💎', msg:'60일! 실제 대사율이 측정됐어요.' })
    if (recordDays === 90)         milestones.push({ icon:'🌟', msg:'90일 완성! 내 몸 모델이 완성됐어요!' })
    if (weightList.length === 1)   milestones.push({ icon:'⚖️', msg:'첫 체중 기록! 데이터가 쌓이기 시작했어요.' })
    if (weightList.length === 7)   milestones.push({ icon:'📈', msg:'체중 7회 기록! 정확도가 높아졌어요.' })

    return NextResponse.json({
      recordDays, avgCal, estimatedMaintenance, weightTrend, accuracy,
      patterns, milestones,
      latestWeight: weightList.length > 0 ? weightList[weightList.length-1].weight_kg : null,
      firstWeight:  weightList.length > 0 ? weightList[0].weight_kg : null,
      weightCount:  weightList.length,
      phase: recordDays < 30 ? 1 : recordDays < 60 ? 2 : recordDays < 90 ? 3 : 4,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

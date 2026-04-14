import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ── 음식 이미지 → 칼로리 분석 ──
export interface MealAnalysis {
  foodName: string
  description: string
  calories: number
  calorieRange: string
  serving: string
  carbs: string
  protein: string
  fat: string
  sodium: string
  sugar: string
  fiber: string
  confidence: number
  confidenceLabel: string
}

export async function analyzeMealImage(base64Image: string, mediaType: string): Promise<MealAnalysis> {
  const prompt = `이 이미지에 있는 음식을 분석해주세요. 반드시 JSON 형식으로만 응답하세요 (마크다운 없이).

{
  "foodName": "음식 이름 (한국어)",
  "description": "음식 설명 (2문장 이내, 한국어)",
  "calories": 숫자,
  "calorieRange": "예: 450~550 kcal",
  "serving": "예: 1인분 (약 350g)",
  "carbs": "숫자g",
  "protein": "숫자g",
  "fat": "숫자g",
  "sodium": "숫자mg",
  "sugar": "숫자g",
  "fiber": "숫자g",
  "confidence": 0~100 숫자,
  "confidenceLabel": "높음 또는 보통 또는 낮음"
}

한국 음식이면 한국식 표준 레시피 기준으로 계산해주세요.
음식이 여러 개라면 전체 합산 칼로리로 계산하세요.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: { type: 'base64', media_type: mediaType as any, data: base64Image }
        },
        { type: 'text', text: prompt }
      ]
    }]
  })

const text = response.content
  .map((b: any) => b.type === 'text' ? b.text : '')
  .join('')

// JSON 블록만 추출
const jsonMatch = text.match(/\{[\s\S]*\}/)
if (!jsonMatch) throw new Error('JSON을 찾을 수 없어요')

const clean = jsonMatch[0]
  .replace(/```json|```/g, '')
  .trim()

return JSON.parse(clean)
}

// ── AI 긍정 코멘트 생성 ──
export interface DailySummary {
  totalCaloriesIn: number
  totalCaloriesOut: number
  goalCalories: number
  activities: string[]
  meals: string[]
  streakDays: number
}

export async function generatePositiveComment(summary: DailySummary): Promise<string> {
  const net = summary.totalCaloriesIn - summary.totalCaloriesOut
  const remaining = summary.goalCalories - summary.totalCaloriesIn

  const prompt = `오늘의 건강 기록을 보고 따뜻하고 긍정적인 코멘트를 한국어로 2~3문장 작성해주세요.
죄책감을 주지 말고, 작은 성취도 칭찬해주세요.

오늘 기록:
- 섭취: ${summary.totalCaloriesIn} kcal (목표: ${summary.goalCalories} kcal)
- 소비: ${summary.totalCaloriesOut} kcal
- 순 칼로리: ${net} kcal
- 남은 칼로리: ${remaining > 0 ? remaining + ' kcal 여유' : Math.abs(remaining) + ' kcal 초과'}
- 오늘 활동: ${summary.activities.join(', ') || '없음'}
- 연속 기록: ${summary.streakDays}일째

이모지를 1~2개 사용하고, 내일을 위한 짧은 조언으로 마무리해주세요.
오직 코멘트 텍스트만 반환하세요.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    messages: [{ role: 'user', content: prompt }]
  })

  return response.content.map(b => b.type === 'text' ? b.text : '').join('').trim()
}

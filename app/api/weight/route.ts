import { NextRequest, NextResponse } from 'next/server'
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

    const { weight_kg } = await req.json()
    if (!weight_kg || weight_kg < 20 || weight_kg > 300)
      return NextResponse.json({ error: '올바른 체중을 입력해주세요' }, { status: 400 })

    const { data, error } = await supabase.from('weight_logs').insert({
      user_id: user.id,
      weight_kg: parseFloat(weight_kg),
    }).select().single()

    if (error) throw error

    await supabase.from('users').update({ weight_kg: parseFloat(weight_kg) } as any).eq('id', user.id)

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (!authHeader) return NextResponse.json({ error: '로그인 필요' }, { status: 401 })
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return NextResponse.json({ error: '인증 실패' }, { status: 401 })

    const { data } = await supabase
      .from('weight_logs').select('*')
      .eq('user_id', user.id)
      .order('logged_at', { ascending: false })
      .limit(30)

    return NextResponse.json({ data: data ?? [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase.from('companies').select('id')
    .eq('supabase_user_id', user.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { data: report, error } = await supabase.from('reports').select('*')
    .eq('id', id)
    .eq('company_id', company.id)
    .single()

  if (error || !report) return NextResponse.json({ error: 'Report not found' }, { status: 404 })

  return NextResponse.json(report)
}

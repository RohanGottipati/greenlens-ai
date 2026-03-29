import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  // OAuth provider returned an error (e.g. user denied consent, misconfigured Azure app)
  const oauthError = searchParams.get('error')
  const oauthErrorDescription = searchParams.get('error_description')
  if (oauthError) {
    const detail = oauthErrorDescription ? encodeURIComponent(oauthErrorDescription) : oauthError
    return NextResponse.redirect(`${origin}/login?error=auth_failed&detail=${detail}`)
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const provider = data.session?.user?.app_metadata?.provider ?? ''
      const providerParam = ['azure', 'google'].includes(provider) ? `?login_via=${provider}` : ''
      return NextResponse.redirect(`${origin}${next}${providerParam}`)
    }
    const detail = encodeURIComponent(error.message)
    return NextResponse.redirect(`${origin}/login?error=auth_failed&detail=${detail}`)
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

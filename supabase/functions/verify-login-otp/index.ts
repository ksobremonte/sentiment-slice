const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { logToSystem, levelFromStatus } from '../_shared/systemLog.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const endpoint = '/verify-login-otp'
  let status = 200

  try {
    const { userId, code } = await req.json()

    if (!userId || !code || typeof code !== 'string' || code.length !== 6) {
      status = 400
      await logToSystem({ endpoint, method: 'POST', status_code: status, level: 'warning', message: 'Invalid OTP input' })
      return new Response(JSON.stringify({ valid: false, error: 'Invalid input' }), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Find valid OTP
    const { data: otpRecords, error: fetchError } = await supabase
      .from('otp_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code', code)
      .eq('used', false)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)

    if (fetchError || !otpRecords || otpRecords.length === 0) {
      await logToSystem({ endpoint, method: 'POST', status_code: 200, level: 'warning', message: 'Invalid or expired OTP code attempted' })
      return new Response(JSON.stringify({ valid: false, error: 'Invalid or expired code' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Mark OTP as used
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecords[0].id)

    // Clean up old codes for this user
    await supabase
      .from('otp_codes')
      .delete()
      .eq('user_id', userId)
      .lt('expires_at', new Date().toISOString())

    await logToSystem({ endpoint, method: 'POST', status_code: 200, level: 'success', message: 'OTP verified successfully' })
    return new Response(JSON.stringify({ valid: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('verify-login-otp error:', err)
    status = 500
    await logToSystem({ endpoint, method: 'POST', status_code: status, level: 'error', message: 'OTP verification failed' })
    return new Response(JSON.stringify({ valid: false, error: 'Internal server error' }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

import { sendLovableEmail } from 'npm:@lovable.dev/email-js'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SENDER_DOMAIN = 'notify.pizzavolante-dashboard.com'
const FROM_DOMAIN = 'pizzavolante-dashboard.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, email } = await req.json()

    if (!userId || !email) {
      return new Response(JSON.stringify({ error: 'Missing userId or email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const apiKey = Deno.env.get('LOVABLE_API_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000))

    // Invalidate previous unused codes for this user
    await supabase
      .from('otp_codes')
      .update({ used: true })
      .eq('user_id', userId)
      .eq('used', false)

    // Store new OTP
    const { error: insertError } = await supabase.from('otp_codes').insert({
      user_id: userId,
      email,
      code,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    })

    if (insertError) {
      console.error('OTP insert error:', insertError)
      return new Response(JSON.stringify({ error: 'Failed to generate OTP' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const emailHtml = `
      <div style="font-family: 'Playfair Display', Georgia, serif; max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #8B2500 0%, #A0522D 100%); padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">🍕 Pizza Volante</h1>
          <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Baguio City</p>
        </div>
        <div style="padding: 32px;">
          <h2 style="color: #1a1a1a; font-size: 20px; margin: 0 0 16px;">Login Verification Code</h2>
          <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 24px;">
            Your one-time verification code is:
          </p>
          <div style="background: #f9f5f0; border: 2px solid #8B2500; border-radius: 12px; padding: 20px; text-align: center; margin: 0 0 24px;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #8B2500; font-family: monospace;">${code}</span>
          </div>
          <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 0;">
            This code expires in <strong>5 minutes</strong>. If you didn't request this, please ignore this email.
          </p>
        </div>
        <div style="background: #f9f5f0; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #999; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Pizza Volante Dashboard</p>
        </div>
      </div>
    `

    const emailText = `Your Pizza Volante verification code is: ${code}. This code expires in 5 minutes.`
    const messageId = crypto.randomUUID()

    try {
      await sendLovableEmail(
        {
          to: email,
          from: `Pizza Volante <noreply@${FROM_DOMAIN}>`,
          sender_domain: SENDER_DOMAIN,
          subject: 'Your Pizza Volante Login Code',
          html: emailHtml,
          text: emailText,
          purpose: 'transactional',
          idempotency_key: `otp-${userId}-${Date.now()}`,
          message_id: messageId,
        },
        { apiKey, sendUrl: Deno.env.get('LOVABLE_SEND_URL') }
      )

      // Log success
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'login-otp',
        recipient_email: email,
        status: 'sent',
      })
    } catch (emailErr: any) {
      console.error('Email send error:', emailErr?.message || emailErr)
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'login-otp',
        recipient_email: email,
        status: 'failed',
        error_message: emailErr?.message || String(emailErr),
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('send-login-otp error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

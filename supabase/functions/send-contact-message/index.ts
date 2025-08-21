import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  try {
    const { name, email, subject, message }: ContactFormData = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'All fields are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get client info for logging
    const userAgent = req.headers.get('user-agent') || '';
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwarded?.split(',')[0] || realIp || '';

    // Store the message in the database
    const { data: contactMessage, error: dbError } = await supabase
      .from('contact_messages')
      .insert({
        name,
        email,
        subject,
        message,
        user_agent: userAgent,
        ip_address: ipAddress,
        status: 'new'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to store message' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Contact message stored:', contactMessage.id);

    // Send notification email to admin
    const adminEmailResponse = await resend.emails.send({
      from: 'Judicial Junction <noreply@judicialjunction.ai>',
      to: ['info@judicialjunction.ai'],
      subject: `New Contact Form Submission: ${subject}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <p><strong>From:</strong> ${name} (${email})</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong></p>
          <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          <hr style="margin: 20px 0;">
          <p style="color: #666; font-size: 12px;">
            <strong>Submission Details:</strong><br>
            ID: ${contactMessage.id}<br>
            Time: ${new Date().toISOString()}<br>
            IP: ${ipAddress}<br>
            User Agent: ${userAgent}
          </p>
        </div>
      `,
    });

    if (adminEmailResponse.error) {
      console.error('Failed to send admin email:', adminEmailResponse.error);
    } else {
      console.log('Admin notification sent:', adminEmailResponse.data?.id);
    }

    // Send confirmation email to user
    const userEmailResponse = await resend.emails.send({
      from: 'Judicial Junction <noreply@judicialjunction.ai>',
      to: [email],
      subject: 'Thank you for contacting Judicial Junction',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Thank you for contacting us!</h2>
          <p>Dear ${name},</p>
          <p>We have received your message and appreciate you reaching out to Judicial Junction. Our team will review your inquiry and respond as soon as possible.</p>
          
          <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e40af;">Your Message Summary:</h3>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Message:</strong> ${message.substring(0, 200)}${message.length > 200 ? '...' : ''}</p>
          </div>

          <p>For immediate assistance or urgent matters, please call us at <strong>(555) 123-4567</strong> during business hours (Monday - Friday, 9 AM - 6 PM CST).</p>
          
          <p>Best regards,<br>
          The Judicial Junction Team</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 12px;">
            This is an automated confirmation email. Please do not reply to this email.
            If you need to modify your message, please submit a new contact form or call us directly.
          </p>
        </div>
      `,
    });

    if (userEmailResponse.error) {
      console.error('Failed to send user confirmation email:', userEmailResponse.error);
    } else {
      console.log('User confirmation sent:', userEmailResponse.data?.id);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Thank you for your message. We will get back to you soon.',
        id: contactMessage.id
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in send-contact-message function:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred. Please try again.' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
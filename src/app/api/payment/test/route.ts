import { NextResponse } from 'next/server';

// Simple test endpoint to verify API routes are working
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Payment API routes are working',
    timestamp: new Date().toISOString(),
    env: {
      hasRazorpayKey: !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      hasRazorpaySecret: !!process.env.RAZORPAY_KEY_SECRET,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    }
  });
}

export async function POST() {
  return NextResponse.json({
    status: 'ok',
    message: 'POST endpoint working',
  });
}

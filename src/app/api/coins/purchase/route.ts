import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
 * Coin Packages (like Reddit Coins)
 */
const COIN_PACKAGES = {
  small: {
    coins: 500,
    price: 299, // ₹2.99 in paise
    bonus: 0,
  },
  medium: {
    coins: 1800,
    price: 999, // ₹9.99
    bonus: 200, // Bonus coins
  },
  large: {
    coins: 5500,
    price: 2499, // ₹24.99
    bonus: 1000, // Bonus coins
  },
};

// POST: Create Razorpay order for coin purchase
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();

    // Get authenticated user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { packageType } = body;

    if (!packageType || !COIN_PACKAGES[packageType as keyof typeof COIN_PACKAGES]) {
      return NextResponse.json({ error: 'Invalid package type' }, { status: 400 });
    }

    const selectedPackage = COIN_PACKAGES[packageType as keyof typeof COIN_PACKAGES];
    const totalCoins = selectedPackage.coins + selectedPackage.bonus;

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: selectedPackage.price,
      currency: 'INR',
      receipt: `coins_${userId}_${Date.now()}`,
      notes: {
        userId,
        packageType,
        coins: totalCoins,
        type: 'coins_purchase',
      },
    });

    // Track the pending order
    await supabase.from('coin_purchases').insert({
      user_id: userId,
      order_id: order.id,
      package_type: packageType,
      coins_amount: totalCoins,
      price_paid: selectedPackage.price,
      status: 'pending',
    });

    return NextResponse.json({
      orderId: order.id,
      amount: selectedPackage.price,
      currency: 'INR',
      coins: totalCoins,
      packageDetails: selectedPackage,
    });
  } catch (error) {
    console.error('Error creating coin purchase order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Stripe\StripeClient;
use Illuminate\Support\Facades\Auth;

class StripeController extends Controller
{
    public function createCheckout(Request $request)
    {
        $user = Auth::user();
        $data = $request->validate(['price_id' => 'required|string']);

        $stripe = new StripeClient(config('services.stripe.secret'));
        $session = $stripe->checkout->sessions->create([
            'payment_method_types' => ['card'],
            'mode' => 'subscription',
            'customer_email' => $user->email,
            'line_items' => [[ 'price' => $data['price_id'], 'quantity' => 1 ]],
            'success_url' => config('app.url') . '/billing/success',
            'cancel_url' => config('app.url') . '/billing/cancel',
        ]);

        return response()->json(['sessionId' => $session->id, 'url' => $session->url]);
    }
}

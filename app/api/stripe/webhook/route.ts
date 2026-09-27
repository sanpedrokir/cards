import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { getUserIdByStripeCustomerId, upsertSubscriptionFromStripe } from "@/lib/store";

export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (!signature) throw new Error("Missing signature.");
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId ?? session.client_reference_id ?? undefined;
      if (typeof session.customer === "string" && typeof session.subscription === "string") {
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        await syncSubscription(session.customer, subscription, event.created, userId);
      }
    } else if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      if (typeof subscription.customer === "string") {
        await syncSubscription(
          subscription.customer,
          subscription,
          event.created,
          subscription.metadata?.userId
        );
      }
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function syncSubscription(
  customerId: string,
  subscription: Stripe.Subscription,
  eventCreatedAt: number,
  knownUserId?: string
) {
  const userId = knownUserId ?? (await getUserIdByStripeCustomerId(customerId));
  if (!userId) {
    console.error("Stripe webhook: no user found for customer", customerId);
    return;
  }

  const item = subscription.items.data[0];
  const currentPeriodEnd = item
    ? new Date(item.current_period_end * 1000).toISOString()
    : null;

  await upsertSubscriptionFromStripe(userId, customerId, {
    stripeSubscriptionId: subscription.id,
    status: subscription.status,
    currentPeriodEnd,
    eventCreatedAt: new Date(eventCreatedAt * 1000).toISOString(),
  });
}

import {NextRequest} from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const GIFT_CARD_PAYMENT_LINK_ID = process.env.GIFT_CARD_PAYMENT_LINK_ID || "";

export const POST = async (request: NextRequest) => {
	const body = await request.text();
	const signature = request.headers.get("stripe-signature") || "";
	const secret = process.env.STRIPE_WEBHOOK_SECRET || "";

	const event = Stripe.webhooks.constructEvent(body, signature, secret);

	if (event.type === "checkout.session.completed") {
		const session = event.data.object;
		const paymentIntentId = session.payment_intent as string;
		console.log(session);

		if (paymentIntentId && session.payment_link === GIFT_CARD_PAYMENT_LINK_ID) {
			const email = session.customer_details?.email;
			const name = session.customer_details?.name;
			const pi = await stripe.paymentIntents.retrieve(paymentIntentId);

			const charges = (pi as any).charges as Stripe.ApiList<Stripe.Charge>;
			if (!charges?.data[0]) throw new Error("No charge found");
			const receiptNumber = charges.data[0].receipt_number;

			console.log(email, name, pi, receiptNumber);
		}
	}

	return new Response(JSON.stringify({message: "OK"}));
};

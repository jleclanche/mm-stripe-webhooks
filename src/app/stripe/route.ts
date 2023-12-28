import {NextRequest} from "next/server";
import Stripe from "stripe";

const GIFT_CARD_PAYMENT_LINK_ID = process.env.GIFT_CARD_PAYMENT_LINK_ID || "";
const WEBHOOK_TOLERANCE = 1000;

export const POST = async (request: NextRequest) => {
	if (!process.env.STRIPE_SECRET_KEY)
		return new Response(JSON.stringify({message: "Missing stripe secret key"}), {
			status: 500,
		});
	const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

	const signature = request.headers.get("stripe-signature");
	if (!signature)
		return new Response(JSON.stringify({message: "Missing webhook signature"}), {
			status: 400,
		});

	const secret = process.env.STRIPE_WEBHOOK_SECRET;
	if (!secret)
		return new Response(JSON.stringify({message: "Missing webhook secret"}), {
			status: 500,
		});

	const body = await request.text();
	const event = Stripe.webhooks.constructEvent(
		body,
		signature,
		secret,
		WEBHOOK_TOLERANCE,
	);

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

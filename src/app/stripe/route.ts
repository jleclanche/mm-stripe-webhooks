export const POST = async (request: Request) => {
	return new Response(JSON.stringify({message: "Hello World"}));
};

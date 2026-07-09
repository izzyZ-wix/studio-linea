export async function GET() {
  return new Response("google-site-verification: googlea3867c5819e17499.html\n", {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

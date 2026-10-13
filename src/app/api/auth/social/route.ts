import { api } from "@/server/http";
import { availableProviders } from "@/server/social-auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export async function GET() {
  return api(async () => availableProviders());
}

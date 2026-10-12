import { api } from "@/server/http";
import { availableProviders } from "@/server/social-auth";
export const runtime = "nodejs";
export async function GET() {
  return api(async () => availableProviders());
}

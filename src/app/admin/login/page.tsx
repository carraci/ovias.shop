import { redirect } from "next/navigation";

export default async function AdminLoginPage({ searchParams }: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect: requested } = await searchParams;
  const destination = requested && (requested === "/admin" || requested.startsWith("/admin/")) && !requested.includes("\\") && !requested.startsWith("/admin/login")
    ? requested : "/admin";
  redirect(`/account/sign-in?next=${encodeURIComponent(destination)}`);
}

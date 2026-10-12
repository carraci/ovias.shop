"use client";

import { CustomerAccountShell } from "@/components/customer-account-shell";
import dynamic from "next/dynamic";
import { usePathname, redirect } from "next/navigation";
import { useStore } from "@/components/store-provider";

const AccountDashboard = dynamic(() => import("@/components/account-dashboard").then(m => m.AccountDashboard));
const AccountSecurity = dynamic(() => import("@/components/account-security").then(m => m.AccountSecurity));
const AccountReviews = dynamic(() => import("@/components/account-reviews").then(m => m.AccountReviews));
const FullSupportDesk = dynamic(() => import("@/components/full-support-desk").then(m => m.FullSupportDesk));
const AuthExperience = dynamic(() => import("@/components/auth-experience").then(m => m.AuthExperience));
const CustomerAccountCenter = dynamic(() => import("@/components/customer-account-center").then(m => m.CustomerAccountCenter));
const CustomerProfile = dynamic(() => import("@/components/customer-profile").then(m => m.CustomerProfile));
const CustomerPaymentMethods = dynamic(() => import("@/components/customer-payment-methods").then(m => m.CustomerPaymentMethods));

function AccountContent() {
  const pathname = usePathname();
  const { user } = useStore();
  const section = pathname.split("/").filter(Boolean).at(-1);
  if (
    section === "forgot-password" ||
    section === "reset-password" ||
    section === "verify-email" ||
    section === "sign-in" ||
    section === "register"
  ) {
    return <AuthExperience initialMode={section} />;
  }
  if (section === "account" || !section)
    return user ? (
      redirect("/account/details")
    ) : (
      <AuthExperience initialMode="sign-in" />
    );
  if (section === "security") {
    return user ? (
      <AccountSecurity />
    ) : (
      <AuthExperience initialMode="sign-in" />
    );
  }
  if (section === "details" || section === "profile")
    return user ? (
      <CustomerProfile />
    ) : (
      <AuthExperience initialMode="sign-in" />
    );
  if (section === "payments") {
    return user ? <CustomerPaymentMethods /> : <AuthExperience initialMode="sign-in" />;
  }
  if (section === "reviews") {
    return user ? <AccountReviews /> : <AuthExperience initialMode="sign-in" />;
  }
  if (section === "support") {
    return <FullSupportDesk />;
  }
  if (section === "returns") {
    return <CustomerAccountCenter view="returns" />;
  }
  if (section === "refunds" || section === "notifications")
    return <CustomerAccountCenter view={section} />;
  if (section === "orders") {
    redirect("/account/details");
  }
  return (
    <AccountDashboard
      section={
        section === "registration"
          ? "returns"
          : section === "account"
            ? "overview"
            : section || "overview"
      }
    />
  );
}

export default function AccountPage() {
  const { user } = useStore();
  const pathname = usePathname();
  const auth = [
    "sign-in",
    "register",
    "forgot-password",
    "reset-password",
    "verify-email",
  ].includes(pathname.split("/").at(-1) || "");
  return user && !auth && pathname !== "/account" ? (
    <CustomerAccountShell>
      <AccountContent />
    </CustomerAccountShell>
  ) : (
    <AccountContent />
  );
}

import { StoresLocator } from "@/components/stores-locator";

export const metadata = {
  title: "Find an OVIA Store — India Boutiques & Showrooms",
  description:
    "Explore OVIA stores across India. Experience our luxury luggage, backpacks, travel accessories, bespoke personalisation, and client advisors in person.",
  alternates: { canonical: "/stores" },
};

export default function StoresPage() {
  return <StoresLocator />;
}

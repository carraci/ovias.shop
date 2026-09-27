import Link from "next/link";
export default function NotFound() {
  return (
    <section className="empty-state">
      <p className="eyebrow">A LITTLE OFF THE BEATEN PATH / 404</p>
      <h1>Let’s find your way.</h1>
      <p>This page isn’t part of the collection.</p>
      <Link href="/" className="button dark">
        Back to OVIA
      </Link>
    </section>
  );
}

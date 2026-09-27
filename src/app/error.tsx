"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="empty-state">
      <h1>A moment, please.</h1>
      <p>We couldn’t load this part of the collection. Please try again.</p>
      <button className="button dark" onClick={reset}>
        Try again
      </button>
    </section>
  );
}

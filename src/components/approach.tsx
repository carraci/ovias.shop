import Image from "next/image";
import Link from "next/link";
export function Approach() {
  return (
    <>
      <section className="approach-hero">
        <Image
          src="/media/architecture.jpg"
          alt="Light across a curved concrete interior"
          fill
          priority
          sizes="100vw"
        />
        <div>
          <p className="eyebrow">THE OVIA POINT OF VIEW</p>
          <h1>
            Every journey starts
            <br />
            with <em>a possibility.</em>
          </h1>
          <p>Considered objects. An open world.</p>
        </div>
      </section>
      <nav className="chapter-nav" aria-label="Our approach chapters">
        <a href="#beginning">01 / Our beginning</a>
        <a href="#design">02 / Our design language</a>
        <a href="#future">03 / Looking ahead</a>
      </nav>
      <section className="section approach-chapter" id="beginning">
        <p className="eyebrow">01 / OUR BEGINNING</p>
        <div>
          <h2>
            A new name.
            <br />
            <em>An open horizon.</em>
          </h2>
          <p>
            OVIA begins with a simple idea: the things we carry should leave us
            more room to experience the world.
          </p>
          <p>
            This is a new, fictional design exploration, not a claim to a
            century of manufacturing history. Our story starts here, with a
            collection of original luggage, bags and everyday accessories.
          </p>
        </div>
      </section>
      <section className="approach-pair" id="design">
        <div className="approach-image">
          <Image
            src="/media/luggage.svg"
            alt="Original OVIA luggage design study"
            fill
            sizes="50vw"
          />
        </div>
        <div>
          <p className="eyebrow">02 / OUR DESIGN LANGUAGE</p>
          <h2>
            Quiet details.
            <br />
            <em>Clear purpose.</em>
          </h2>
          <p>
            Useful proportions. A calm palette. Shapes that make space for your
            own routines. We explore what belongs in a travel companion — and
            what can be left out.
          </p>
          <Link href="/collections/signature-pieces" className="text-link">
            Explore the design studies ↗
          </Link>
        </div>
      </section>
      <section className="section approach-chapter" id="future">
        <p className="eyebrow">03 / LOOKING AHEAD</p>
        <div>
          <h2>
            The next chapter
            <br />
            <em>is still unwritten.</em>
          </h2>
          <p>
            Physical products, material performance and manufacturing partners
            must be verified before this concept becomes a commercial
            collection. Until then, OVIA is a space to explore a personal way of
            moving through the world.
          </p>
          <Link href="/journal" className="text-link">
            Notes from the journey ↗
          </Link>
        </div>
      </section>
      <p className="photo-credit section">
        Editorial architecture photograph by Joshua Kettle / Unsplash. No
        affiliation or partnership is implied.
      </p>
    </>
  );
}

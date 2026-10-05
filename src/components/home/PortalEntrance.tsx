/** A static illustration: no opening sequence, playback or scroll interaction. */
export function PortalEntrance() {
  return (
    <figure className="pc-portal-figure">
      <img
        src="/media/home/portal-static-960.webp"
        srcSet="/media/home/portal-static-640.webp 640w, /media/home/portal-static-960.webp 960w, /media/home/portal-static-1440.webp 1440w"
        sizes="(max-width: 767px) 100vw, (max-width: 1340px) 50vw, 660px"
        width={1440}
        height={960}
        alt="Un cane attraversa un portone verde aperto su un giardino luminoso."
        decoding="async"
      />
    </figure>
  );
}

import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff } from 'lucide-react';

export default function PhotoCarousel({ photos, title }) {
  const ref = useRef(null);
  const [i, setI] = useState(0);
  if (!photos.length) {
    return (
      <div className="cat-carousel cat-carousel--empty">
        <ImageOff size={32} />
        <span>Pas encore de photo</span>
      </div>
    );
  }
  const onScroll = () => {
    const el = ref.current;
    if (el) setI(Math.round(el.scrollLeft / el.clientWidth));
  };
  const aller = (d) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: d * el.clientWidth, behavior: 'smooth' });
  };
  return (
    <div className="cat-carousel">
      <div className="cat-carousel__track" ref={ref} onScroll={onScroll}>
        {photos.map((src, n) => (
          <img key={src + n} src={src} alt={`${title}, photo ${n + 1} sur ${photos.length}`} loading={n === 0 ? 'eager' : 'lazy'} />
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <button type="button" className="cat-carousel__nav cat-carousel__nav--prev" onClick={() => aller(-1)} aria-label="Photo précédente">
            <ChevronLeft size={20} />
          </button>
          <button type="button" className="cat-carousel__nav cat-carousel__nav--next" onClick={() => aller(1)} aria-label="Photo suivante">
            <ChevronRight size={20} />
          </button>
          <div className="cat-carousel__dots" aria-hidden="true">
            {photos.map((_, n) => (
              <span key={n} className={n === i ? 'on' : ''} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

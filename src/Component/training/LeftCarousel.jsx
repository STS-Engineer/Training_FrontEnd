import { useState, useEffect, useRef } from 'react';

const SLIDES = [
  {
    tag: 'Training Request',
    title: <>Build better<br /><span>learning experiences</span></>,
    sub: 'Submit your training request and our team will design a tailored module for your team.',
    img: 'bg1.webp',
  },
  {
    tag: 'Knowledge Transfer',
    title: <>Empower your<br /><span>teams to grow</span></>,
    sub: 'Share expertise across departments with structured, high-quality training content.',
    img: 'bg2.jpg',
  },
  {
    tag: 'Global Reach',
    title: <>Training without<br /><span>borders</span></>,
    sub: 'Reach all AVOCarbon sites worldwide with consistent, multilingual training modules.',
    img: 'bg3.jpg',
  },
  {
    tag: 'Continuous Learning',
    title: <>Track progress,<br /><span>measure impact</span></>,
    sub: 'Monitor completion rates and quiz results with the KPIs that matter to your team.',
    img: 'bg4.jpg',
  },
];

export default function LeftCarousel() {
  const [active, setActive] = useState(0);
  const timer = useRef(null);

  const goTo = (i) => {
    setActive(i);
    clearInterval(timer.current);
    timer.current = setInterval(() => setActive(a => (a + 1) % SLIDES.length), 5000);
  };

  useEffect(() => {
    timer.current = setInterval(() => setActive(a => (a + 1) % SLIDES.length), 5000);
    return () => clearInterval(timer.current);
  }, []);

  const s = SLIDES[active];

  return (
    <div
      className="panel-left"
      aria-hidden="true"
      style={{ backgroundImage: `url(${process.env.PUBLIC_URL}/img/${s.img})` }}
    >
      <div className="panel-left-overlay" />
      <div className="panel-left-content">
        <div className="carousel-slides">
          <div className="panel-left-tag">{s.tag}</div>
          <h2 className="panel-left-title">{s.title}</h2>
          <p className="panel-left-sub">{s.sub}</p>
        </div>
        <div className="carousel-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`carousel-dot${i === active ? ' carousel-dot-active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
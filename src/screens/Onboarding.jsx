import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "../components/ui.jsx";
import Mark from "../components/Mark.jsx";

const SLIDES = [
  {
    kicker: "01 — No account",
    title: "Walk in without a name.",
    body: "No phone number. No email. No permanent identity. A room opens the moment you want it.",
  },
  {
    kicker: "02 — A borrowed self",
    title: "You are only here, only now.",
    body: "Every room mints you a temporary identity. When the room dies, so does the name.",
  },
  {
    kicker: "03 — Built to vanish",
    title: "Talk. Then leave nothing.",
    body: "Messages, people, and codes dissolve when time is up. Chat freely. Leave nothing behind.",
  },
];

export default function Onboarding({ onDone }) {
  const [i, setI] = useState(0);
  const last = i === SLIDES.length - 1;
  const slide = SLIDES[i];

  return (
    <motion.section
      className="onboard"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -12 }}
    >
      <header className="onboard__top">
        <Mark size={32} />
        <button className="text-btn" onClick={onDone}>
          Skip
        </button>
      </header>

      <div className="onboard__stage">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            className="onboard__slide"
            initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="kicker">{slide.kicker}</p>
            <h1 className="display">{slide.title}</h1>
            <p className="lede">{slide.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="onboard__foot">
        <div className="dots" aria-hidden="true">
          {SLIDES.map((_, n) => (
            <span key={n} className={`dot ${n === i ? "dot--on" : ""}`} />
          ))}
        </div>
        <Button
          block
          size="lg"
          onClick={() => (last ? onDone() : setI((n) => n + 1))}
        >
          {last ? "Enter the quiet" : "Continue"}
        </Button>
      </footer>
    </motion.section>
  );
}

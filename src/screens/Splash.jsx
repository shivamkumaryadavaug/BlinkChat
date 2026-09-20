import { motion } from "framer-motion";
import Mark from "../components/Mark.jsx";

export default function Splash({ onSkip }) {
  return (
    <motion.section
      className="splash"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(10px)" }}
      transition={{ duration: 0.5 }}
      onClick={onSkip}
      role="presentation"
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18 }}
      >
        <Mark size={92} />
      </motion.div>
      <motion.p
        className="splash__brand"
        initial={{ y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.7 }}
      >
        blink<span>CHAT</span>
      </motion.p>
      <motion.p
        className="splash__tag"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        rooms that forget you
      </motion.p>
      <motion.p
        className="splash__hint"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        tap to enter
      </motion.p>
    </motion.section>
  );
}

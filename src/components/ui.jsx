import { motion, AnimatePresence } from "framer-motion";

export function Button({
  children,
  variant = "primary",
  size = "md",
  block = false,
  icon,
  className = "",
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      whileHover={{ y: -1 }}
      className={`btn btn--${variant} btn--${size} ${block ? "btn--block" : ""} ${className}`}
      type={props.type || "button"}
      {...props}
    >
      {icon ? <span className="btn__icon">{icon}</span> : null}
      <span>{children}</span>
    </motion.button>
  );
}

export function IconButton({ label, children, className = "", ...props }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      className={`icon-btn ${className}`}
      aria-label={label}
      type="button"
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label className="field">
      {label ? <span className="field__label">{label}</span> : null}
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

export function Toast({ children }) {
  return (
    <motion.div
      className="toast"
      role="status"
      initial={{ x: "-50%", y: -24, opacity: 0, scale: 0.96 }}
      animate={{ x: "-50%", y: 0, opacity: 1, scale: 1 }}
      exit={{ x: "-50%", y: -16, opacity: 0 }}
    >
      {children}
    </motion.div>
  );
}

export function Sheet({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="sheet__scrim"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.aside
            className="sheet"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
          >
            <div className="sheet__handle" />
            <div className="sheet__head">
              <h3>{title}</h3>
              <IconButton label="Close" onClick={onClose}>
                <XIcon />
              </IconButton>
            </div>
            {children}
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
}

export function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 3.5v11M3.5 9h11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function KeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="7" cy="9" r="3.2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9h5.5M13.2 9v2.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function LeaveIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M6 3H3.5A1.5 1.5 0 0 0 2 4.5v7A1.5 1.5 0 0 0 3.5 13H6M10 11l3-3-3-3M13 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="6" cy="6" r="2.2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.4 13c.4-2.2 1.9-3.4 3.6-3.4S9.2 10.8 9.6 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="11.2" cy="6.2" r="1.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M10.2 9.8c1.4.2 2.6 1.2 3 2.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function CopyIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="5.2" y="5.2" width="8" height="8" rx="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3.2 10.2V3.8A1.6 1.6 0 0 1 4.8 2.2h6.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="4.2" cy="8" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="11.8" cy="4.2" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="11.8" cy="11.8" r="1.6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.6 7.2 10.2 5M5.6 8.8l4.6 2.2" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

export function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3.2 9.1 14.6 3.6 9.4 14.8l-.8-5.1-5.4-.6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M10.5 3.5 5.5 8l5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect x="2.5" y="6" width="9" height="6.2" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.4 6V4.4a2.6 2.6 0 0 1 5.2 0V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

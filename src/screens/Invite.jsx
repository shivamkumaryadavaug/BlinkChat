import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { Wordmark } from "../components/Mark.jsx";
import { Button, CopyIcon, ShareIcon } from "../components/ui.jsx";

export default function Invite({ room, password, onEnter, onBack }) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState("");
  const shareUrl = `${window.location.origin}?join=${encodeURIComponent(room.roomCode)}`;

  useEffect(() => {
    QRCode.toDataURL(shareUrl, {
      margin: 1,
      width: 280,
      color: { dark: "#f3efe6", light: "#00000000" },
    }).then(setQr).catch(() => {});
  }, [shareUrl]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {}
  };

  const share = async () => {
    const text = `Join my BlinkChat room “${room.roomName}” with code ${room.roomCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "BlinkChat room", text, url: shareUrl });
        return;
      } catch {}
    }
    copy();
  };

  return (
    <motion.div
      className="page page--form"
      initial={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0 }}
    >
      <header className="topbar">
        <button className="text-btn" onClick={onBack}>
          Close
        </button>
        <Wordmark compact />
        <span className="topbar__ghost" />
      </header>

      <div className="invite">
        <p className="kicker kicker--mint">Your room is live</p>
        <h1 className="invite__code">{room.roomCode}</h1>
        <p className="invite__name">{room.roomName}</p>
        {password ? <p className="invite__lock">Password protected</p> : null}

        {qr ? (
          <div className="invite__qr">
            <img src={qr} alt="Join QR code" />
          </div>
        ) : null}

        <div className="invite__actions">
          <Button variant="ghost" icon={<CopyIcon />} onClick={copy}>
            {copied ? "Copied" : "Copy code"}
          </Button>
          <Button variant="ghost" icon={<ShareIcon />} onClick={share}>
            Share
          </Button>
        </div>

        <Button size="lg" block onClick={onEnter}>
          Enter room
        </Button>
        <p className="disclaimer" style={{ textAlign: "center", marginTop: 18 }}>
          The room deletes itself when the timer ends. Share the code only with people you trust.
        </p>
      </div>
    </motion.div>
  );
}

import { useState } from "react";
import LandingPage from "./components/LandingPage";
import CreateRoomModal from "./components/CreateRoomModal";
import JoinRoomModal from "./components/JoinRoomModal";
import ChatRoom from "./components/ChatRoom";

type View = "landing" | "chat";
type Modal = "create" | "join" | null;

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [modal, setModal] = useState<Modal>(null);
  const [activeRoomCode, setActiveRoomCode] = useState<string | null>(null);
  const [activeRoomPassword, setActiveRoomPassword] = useState<string | undefined>(undefined);
  const [expiredNotice, setExpiredNotice] = useState(false);

  const enterRoom = (roomCode: string, password?: string) => {
    setModal(null);
    setActiveRoomCode(roomCode);
    setActiveRoomPassword(password);
    setView("chat");
  };

  const leaveRoom = () => {
    setActiveRoomCode(null);
    setActiveRoomPassword(undefined);
    setView("landing");
  };

  const handleExpired = () => {
    setActiveRoomCode(null);
    setActiveRoomPassword(undefined);
    setView("landing");
    setExpiredNotice(true);
    setTimeout(() => setExpiredNotice(false), 6000);
  };

  return (
    <>
      {expiredNotice && (
        <div className="toast" role="status">
          This room has expired and was deleted.
        </div>
      )}

      {view === "landing" && (
        <LandingPage onCreateRoom={() => setModal("create")} onJoinRoom={() => setModal("join")} />
      )}

      {view === "chat" && activeRoomCode && (
        <ChatRoom
          roomCode={activeRoomCode}
          password={activeRoomPassword}
          onLeave={leaveRoom}
          onExpired={handleExpired}
        />
      )}

      {modal === "create" && (
        <CreateRoomModal onClose={() => setModal(null)} onEnterRoom={(code, password) => enterRoom(code, password)} />
      )}

      {modal === "join" && (
        <JoinRoomModal onClose={() => setModal(null)} onEnterRoom={(code, password) => enterRoom(code, password)} />
      )}
    </>
  );
}

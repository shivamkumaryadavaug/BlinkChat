import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import Ambient from "./components/Ambient.jsx";
import { Toast } from "./components/ui.jsx";
import Splash from "./screens/Splash.jsx";
import Onboarding from "./screens/Onboarding.jsx";
import Home from "./screens/Home.jsx";
import Create from "./screens/Create.jsx";
import Join from "./screens/Join.jsx";
import Invite from "./screens/Invite.jsx";
import Chat from "./screens/Chat.jsx";
import { isOnboarded, setOnboarded } from "./lib/format.js";

function readJoinParam() {
  const q = new URLSearchParams(window.location.search);
  return (q.get("join") || "").toUpperCase();
}

export default function App() {
  const [boot, setBoot] = useState("splash");
  const [screen, setScreen] = useState("home");
  const [inviteRoom, setInviteRoom] = useState(null);
  const [invitePw, setInvitePw] = useState();
  const [roomCode, setRoomCode] = useState(null);
  const [password, setPassword] = useState();
  const [joinPrefill, setJoinPrefill] = useState("");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setBoot(isOnboarded() ? "app" : "onboard");
    }, 2200);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const code = readJoinParam();
    if (code) {
      setJoinPrefill(code);
      setScreen("join");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const enterRoom = useCallback((code, pw) => {
    setRoomCode(code);
    setPassword(pw);
    setInviteRoom(null);
    setScreen("chat");
  }, []);

  const goHome = useCallback(() => {
    setRoomCode(null);
    setPassword(undefined);
    setInviteRoom(null);
    setScreen("home");
  }, []);

  const expired = useCallback(() => {
    setRoomCode(null);
    setPassword(undefined);
    setInviteRoom(null);
    setScreen("home");
    setToast("This room has expired and was deleted.");
    setTimeout(() => setToast(null), 5200);
  }, []);

  return (
    <>
      <Ambient />
      <div className="app">
        <AnimatePresence mode="wait">
          {boot === "splash" ? (
            <Splash
              key="splash"
              onSkip={() => setBoot(isOnboarded() ? "app" : "onboard")}
            />
          ) : boot === "onboard" ? (
            <Onboarding
              key="onboard"
              onDone={() => {
                setOnboarded();
                setBoot("app");
              }}
            />
          ) : (
            <div key="app" className="app__stage">
              <AnimatePresence mode="wait">
                {screen === "home" && (
                  <Home
                    key="home"
                    onCreate={() => setScreen("create")}
                    onJoin={() => {
                      setJoinPrefill("");
                      setScreen("join");
                    }}
                    onRejoin={(code) => {
                      setJoinPrefill(code);
                      setScreen("join");
                    }}
                  />
                )}
                {screen === "create" && (
                  <Create
                    key="create"
                    onBack={goHome}
                    onCreated={(room, pw) => {
                      setInviteRoom(room);
                      setInvitePw(pw);
                      setScreen("invite");
                    }}
                  />
                )}
                {screen === "join" && (
                  <Join
                    key="join"
                    initialCode={joinPrefill}
                    onBack={goHome}
                    onJoined={enterRoom}
                  />
                )}
                {screen === "invite" && inviteRoom && (
                  <Invite
                    key="invite"
                    room={inviteRoom}
                    password={invitePw}
                    onBack={goHome}
                    onEnter={() => enterRoom(inviteRoom.roomCode, invitePw)}
                  />
                )}
                {screen === "chat" && roomCode && (
                  <Chat
                    key={roomCode}
                    roomCode={roomCode}
                    password={password}
                    onLeave={goHome}
                    onExpired={expired}
                  />
                )}
              </AnimatePresence>
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence>{toast ? <Toast key="t">{toast}</Toast> : null}</AnimatePresence>
      </div>
    </>
  );
}

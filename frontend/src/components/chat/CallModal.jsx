import { useEffect, useRef } from "react";
import {
    Phone,
    PhoneOff,
    Mic,
    MicOff,
    Video,
    VideoOff
} from "lucide-react";
import Modal from "../common/Modal";
import Avatar from "../common/Avatar";
import { IconButton } from "../common/Button";

export default function CallModal({
    open,
    callType,
    callStatus,
    callDuration,
    otherUser,
    localStream,
    remoteStream,
    muted,
    cameraOff,
    onAccept,
    onReject,
    onEnd,
    onMinimize,
    onToggleMute,
    onToggleCamera
})  {
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const remoteAudioRef = useRef(null);
//     const [callDuration, setCallDuration] = useState(0);
//     useEffect(() => {
//     if (!open || callStatus !== "connected") {
//         setCallDuration(0);
//         return;
//     }

//     const interval = setInterval(() => {
//         setCallDuration((prev) => prev + 1);
//     }, 1000);

//     return () => clearInterval(interval);
// }, [open, callStatus]);
   


    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);
    useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
    }
}, [remoteStream]);


    if (!open) return null;

    const incoming = callStatus === "incoming";
    const videoCall = callType === "video";

    return (
        <Modal
            open={open}
            onClose={onMinimize}
            size="lg"
            title={incoming ? "Incoming call" : videoCall ? "Video call" : "Voice call"}
            className="call-modal"
        >
   
            <div className="call-modal__content">
    
                {videoCall && (
                    <video
                        ref={remoteVideoRef}
                        className="call-modal__remote-video"
                        autoPlay
                        playsInline
                    />
                )}
                {!videoCall && (
    <audio
        ref={remoteAudioRef}
        autoPlay
    />
)}

                {(!videoCall || !remoteStream) && (
                    <div className="call-modal__profile">
                        <Avatar user={otherUser} size="xxl" />
                        <h2>{otherUser?.name || "Unknown user"}</h2>
                      <p>
   {incoming
    ? "Incoming call..."
    : callStatus === "ringing"
      ? "Ringing..."
      : callStatus === "connecting"
        ? "Connecting..."
          : callStatus === "connected"
            ? `Connected · ${String(Math.floor(callDuration / 60)).padStart(2, "0")}:${String(callDuration % 60).padStart(2, "0")}`
            : "Calling..."}
</p>
                    </div>
                )}

                {videoCall && localStream && (
                    <video
                        ref={localVideoRef}
                        className="call-modal__local-video"
                        autoPlay
                        muted
                        playsInline
                    />
                )}

                <div className="call-modal__controls">
                    {incoming ? (
                        <>
                            <button
                                type="button"
                                className="call-control call-control--accept"
                                onClick={onAccept}
                                aria-label="Accept call"
                            >
                                <Phone />
                            </button>

                            <button
                                type="button"
                                className="call-control call-control--end"
                                onClick={onReject}
                                aria-label="Reject call"
                            >
                                <PhoneOff />
                            </button>
                        </>
                    ) : (
                        <>
                            <IconButton
                                icon={muted ? MicOff : Mic}
                                label={muted ? "Unmute microphone" : "Mute microphone"}
                                active={muted}
                                onClick={onToggleMute}
                            />

                            {videoCall && (
                                <IconButton
                                    icon={cameraOff ? VideoOff : Video}
                                    label={cameraOff ? "Turn camera on" : "Turn camera off"}
                                    active={cameraOff}
                                    onClick={onToggleCamera}
                                />
                            )}

                            <button
                                type="button"
                                className="call-control call-control--end"
                                onClick={onEnd}
                                aria-label="End call"
                            >
                                <PhoneOff />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
}
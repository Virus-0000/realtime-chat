import SocketProvider from "../context/SocketProvider";
import ChatProvider from "../context/ChatProvider";
import ChatLayout from "../components/chat/ChatLayout";

// Authenticated chat experience: one socket -> chat state -> UI
function Chat() {
    return (
        <SocketProvider>
            <ChatProvider>
                <ChatLayout />
            </ChatProvider>
        </SocketProvider>
    );
}

export default Chat;

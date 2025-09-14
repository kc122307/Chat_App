// src/zustand/useConversation.js
import { create } from "zustand";

const useConversation = create((set) => ({
	selectedConversation: null,
	setSelectedConversation: (selectedConversation) => set({ selectedConversation }),
	messages: [],
	setMessages: (messages) => set({ messages }),
    incomingCall: null,
    setIncomingCall: (incomingCall) => set({ incomingCall }),
    roomCode: null, // Add roomCode to the global state
    setRoomCode: (roomCode) => set({ roomCode }),
}));

export default useConversation;
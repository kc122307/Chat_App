import { create } from "zustand";

const useConversation = create((set) => ({
	selectedConversation: null,
	setSelectedConversation: (selectedConversation) => set({ selectedConversation }),
	messages: [],
	setMessages: (messages) => set({ messages }),
    incomingCall: null,
    setIncomingCall: (incomingCall) => set({ incomingCall }),
}));

export default useConversation;

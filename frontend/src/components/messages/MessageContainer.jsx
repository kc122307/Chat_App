// src/components/messages/MessageContainer.jsx
import { useEffect } from "react";
import useConversation from "../../zustand/useConversation";
import MessageInput from "./MessageInput";
import Messages from "./Messages";
import { TiMessages } from "react-icons/ti";
import { useAuthContext } from "../../context/AuthContext";
import { IoCall, IoVideocam } from "react-icons/io5";
import useCall from "../../hooks/useCall";
import toast from "react-hot-toast";

const MessageContainer = () => {
	const { selectedConversation, setSelectedConversation } = useConversation();
	const { startVideoCall, startAudioCall, startGroupCall, isWebRTCSupported } = useCall();
	const isGroup = selectedConversation && selectedConversation.members && Array.isArray(selectedConversation.members);

	useEffect(() => {
		return () => setSelectedConversation(null);
	}, [setSelectedConversation]);

	const handleVideoCall = () => {
		if (!isWebRTCSupported) {
			toast.error("Your browser doesn't fully support video calls. Please use a modern browser like Chrome or Firefox.");
			return;
		}
		if (isGroup) {
			startGroupCall();
		} else {
			startVideoCall();
		}
	};

	const handleAudioCall = () => {
		if (!isWebRTCSupported) {
			toast.error("Your browser doesn't fully support audio calls. Please use a modern browser like Chrome or Firefox.");
			return;
		}
		if (isGroup) {
			startGroupCall();
		} else {
			startAudioCall();
		}
	};

	return (
		<div className='flex flex-col flex-1 h-full'>
			{!selectedConversation ? (
				<NoChatSelected />
			) : (
				<>
					{/* Header with Call Buttons */}
					<div className='bg-slate-500 px-4 py-2 mb-2 flex items-center justify-between'>
						<div>
							<span className='label-text'>To:</span>{" "}
							<span className='text-gray-900 font-bold'>
								{selectedConversation.fullName || selectedConversation.name}
							</span>
						</div>
						<div className="flex gap-2">
							<button onClick={handleVideoCall} className="btn btn-sm btn-ghost text-gray-900">
								<IoVideocam className="w-5 h-5" />
							</button>
							<button onClick={handleAudioCall} className="btn btn-sm btn-ghost text-gray-900">
								<IoCall className="w-5 h-5" />
							</button>
						</div>
					</div>
					<Messages />
					<MessageInput />
				</>
			)}
		</div>
	);
};
export default MessageContainer;

const NoChatSelected = () => {
	const { authUser } = useAuthContext();
	return (
		<div className='flex items-center justify-center w-full h-full'>
			<div className='px-4 text-center sm:text-lg md:text-xl text-gray-200 font-semibold flex flex-col items-center gap-2'>
				<p>Welcome 👋 {authUser.fullName} ❄</p>
				<p>Select a chat to start messaging</p>
				<TiMessages className='text-3xl md:text-6xl text-center' />
			</div>
		</div>
	);
};

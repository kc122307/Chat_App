import { useAuthContext } from "../../context/AuthContext";
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";

const Message = ({ message }) => {
	const { authUser } = useAuthContext();
	const { selectedConversation } = useConversation();
	const fromMe = message.senderId === authUser._id;
	const formattedTime = extractTime(message.createdAt);
	const chatClassName = fromMe ? "chat-end" : "chat-start";
	const profilePic = fromMe ? authUser.profilePic : selectedConversation?.profilePic;
	const bubbleBgColor = fromMe ? "bg-blue-500" : "";

	const shakeClass = message.shouldShake ? "shake" : "";

	// Get the backend URL from environment variables
	const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

	// FIX: Correct the path to the media resource
	const mediaUrl = `${BACKEND_URL}/uploads/${message.media}`;

	return (
		<div className={`chat ${chatClassName}`}>
			<div className='chat-image avatar'>
				<div className='w-10 rounded-full'>
					<img alt='Tailwind CSS chat bubble component' src={profilePic} />
				</div>
			</div>
			{/* Render content based on mediaType */}
			{message.mediaType === 'text' && (
				<div className={`chat-bubble text-white ${bubbleBgColor} ${shakeClass} pb-2`}>{message.message}</div>
			)}
			{message.mediaType === 'image' && (
				<div className={`chat-bubble text-white p-1 ${bubbleBgColor} ${shakeClass}`}>
					<img 
						src={mediaUrl} 
						alt="Shared Image" 
						className="max-w-xs max-h-48 rounded-md" 
					/>
				</div>
			)}
			{message.mediaType === 'audio' && (
				<div className={`chat-bubble text-white ${bubbleBgColor} ${shakeClass}`}>
					<audio controls src={mediaUrl}>
						Your browser does not support the audio element.
					</audio>
				</div>
			)}
			{message.mediaType === 'file' && (
				<div className={`chat-bubble text-white ${bubbleBgColor} ${shakeClass}`}>
					<a href={mediaUrl} download className="text-sm underline">
						Download File: {message.message}
					</a>
				</div>
			)}
			<div className='chat-footer opacity-50 text-xs flex gap-1 items-center'>{formattedTime}</div>
		</div>
	);
};
export default Message;
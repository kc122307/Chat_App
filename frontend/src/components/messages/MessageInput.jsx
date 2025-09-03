// src/components/messages/MessageInput.jsx

import { useState, useRef } from "react";
import { BsSend } from "react-icons/bs";
import { FaPaperclip } from "react-icons/fa"; // Import a file icon
import useSendMessage from "../../hooks/useSendMessage";

const MessageInput = () => {
	const [message, setMessage] = useState("");
	const [selectedFile, setSelectedFile] = useState(null);
	const fileInputRef = useRef(null);
	const { loading, sendMessage } = useSendMessage();

	const handleFileButtonClick = () => {
		fileInputRef.current.click();
	};

	const handleFileChange = (e) => {
		setSelectedFile(e.target.files[0]);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!message && !selectedFile) return;

		// Use FormData to send both text and file
		const formData = new FormData();
		if (message) {
			formData.append('message', message);
		}
		if (selectedFile) {
			formData.append('media', selectedFile);
		}
		
		await sendMessage(formData);
		setMessage("");
		setSelectedFile(null);
	};

	return (
		<form className='px-4 my-3' onSubmit={handleSubmit}>
			<div className='w-full relative flex items-center gap-2'>
				<button type="button" onClick={handleFileButtonClick} className="text-gray-400 hover:text-white transition-colors duration-200">
					<FaPaperclip className="w-6 h-6" />
				</button>
				<input
					type="file"
					ref={fileInputRef}
					onChange={handleFileChange}
					className="hidden"
				/>
				<input
					type='text'
					className='border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 text-white'
					placeholder='Send a message'
					value={selectedFile ? selectedFile.name : message}
					onChange={(e) => {
						if (selectedFile) setSelectedFile(null); // Clear file if user starts typing
						setMessage(e.target.value);
					}}
				/>
				<button type='submit' className='absolute inset-y-0 end-0 flex items-center pe-3'>
					{loading ? <div className='loading loading-spinner'></div> : <BsSend />}
				</button>
			</div>
		</form>
	);
};
export default MessageInput;
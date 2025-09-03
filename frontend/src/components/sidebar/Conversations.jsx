// src/components/sidebar/Conversations.jsx
import useGetConversations from "../../hooks/useGetConversations";
import { useAuthContext } from "../../context/AuthContext";
import { useSocketContext } from "../../context/SocketContext";
import useConversation from "../../zustand/useConversation";

const Conversations = () => {
	const { loading, conversations } = useGetConversations();
    const { authUser } = useAuthContext();
    const { onlineUsers } = useSocketContext();
    const { selectedConversation, setSelectedConversation } = useConversation();

    return (
        <div className='py-2 flex flex-col overflow-auto'>
            {loading ? (
                <span className='loading loading-spinner mx-auto'></span>
            ) : conversations.length === 0 ? (
                <p className='text-center text-gray-400'>You have no users to chat with.</p>
            ) : (
                conversations.map((user) => {
                    const isSelected = selectedConversation?._id === user._id;
                    const isOnline = onlineUsers.includes(user._id);
    
                    return (
                        <div
                            key={user._id}
                            className={`flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-1 cursor-pointer ${isSelected ? "bg-sky-500" : ""}`}
                            onClick={() => setSelectedConversation(user)}
                        >
                            <div className='w-12 rounded-full relative'>
                                <img src={user.profilePic} alt='user avatar' />
                                {isOnline && (
                                    <div className="absolute right-0 bottom-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                                )}
                            </div>
                            <div className='flex flex-col flex-1'>
                                <div className='flex gap-3 justify-between'>
                                    <p className='font-bold text-gray-200'>{user.fullName}</p>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
};
export default Conversations;
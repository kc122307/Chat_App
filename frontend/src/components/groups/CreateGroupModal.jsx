// src/components/groups/CreateGroupModal.jsx
import { useState } from "react";
import useGetConversations from "../../hooks/useGetConversations";
import useCreateGroup from "../../hooks/useCreateGroup";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState([]);
    const { conversations: users, loading: usersLoading } = useGetConversations();
    const { loading: creating, createGroup } = useCreateGroup();

    const handleMemberSelect = (userId) => {
        if (selectedMembers.includes(userId)) {
            setSelectedMembers(selectedMembers.filter(id => id !== userId));
        } else {
            setSelectedMembers([...selectedMembers, userId]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedMembers.length === 0) {
            return toast.error("Please select at least one member.");
        }
        await createGroup(groupName, selectedMembers);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white">Create a New Group</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-white mb-2">Group Name</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full p-2 rounded bg-gray-700 text-white"
                            placeholder="e.g., The Devs"
                            required
                        />
                    </div>
                    <div className="mb-4 h-48 overflow-y-auto bg-gray-700 p-2 rounded">
                        <label className="block text-white mb-2">Add Members</label>
                        {usersLoading ? (
                            <span className="loading loading-spinner text-white mx-auto"></span>
                        ) : (
                            users.map(user => (
                                <div key={user._id} className="flex items-center gap-2 p-2 rounded hover:bg-gray-600 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedMembers.includes(user._id)}
                                        onChange={() => handleMemberSelect(user._id)}
                                        className="checkbox"
                                    />
                                    <img src={user.profilePic} alt="avatar" className="w-8 h-8 rounded-full" />
                                    <span className="text-white">{user.fullName}</span>
                                </div>
                            ))
                        )}
                    </div>
                    <button 
                        type="submit" 
                        className="w-full py-2 bg-sky-500 rounded text-white font-semibold hover:bg-sky-600 transition-colors"
                        disabled={creating}
                    >
                        {creating ? <span className="loading loading-spinner"></span> : "Create Group"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateGroupModal;
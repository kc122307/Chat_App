// src/pages/groups/Groups.jsx
import { useState } from "react";
import CreateGroupModal from "../../components/groups/CreateGroupModal";
import GroupList from "../../components/groups/GroupList";
import GroupMessageContainer from "../../components/groups/GroupMessageContainer";
import { AiOutlinePlusCircle } from "react-icons/ai";
import SearchInput from "../../components/sidebar/SearchInput";

const Groups = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);

    // FIX: Corrected the function names from setIsModalModal to setIsModalOpen
    const handleOpenModal = () => setIsModalOpen(true);
    const handleCloseModal = () => setIsModalOpen(false);

    return (
        <div className='flex flex-col md:flex-row h-full w-full'>
            <div className='border-r border-slate-500 p-4 flex flex-col w-full md:w-64 h-full'>
                <SearchInput />
                <div className='divider px-3'></div>
                <GroupList onSelectGroup={setSelectedGroup} />
                <div className="mt-auto">
                    <button onClick={handleOpenModal} className="btn btn-block btn-lg btn-circle text-white bg-sky-500 hover:bg-sky-600 transition-colors">
                        <AiOutlinePlusCircle className="w-8 h-8" />
                    </button>
                </div>
            </div>
            <GroupMessageContainer selectedGroup={selectedGroup} />
            <CreateGroupModal isOpen={isModalOpen} onClose={handleCloseModal} />
        </div>
    );
};
export default Groups;
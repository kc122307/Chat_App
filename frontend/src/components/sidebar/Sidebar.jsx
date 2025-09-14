// src/components/sidebar/Sidebar.jsx
import Conversations from "./Conversations";
import SearchInput from "./SearchInput";

const Sidebar = () => {
	return (
		<div className='border-r border-slate-500 p-4 flex flex-col w-full md:w-64 h-full'>
			<SearchInput />
			<div className='divider px-3'></div>
			<Conversations />
		</div>
	);
};
export default Sidebar;
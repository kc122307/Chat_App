// src/pages/home/Home.jsx

import Sidebar from "../../components/sidebar/Sidebar";
import MessageContainer from "../../components/messages/MessageContainer";

const Home = () => {
	return (
		<div className='flex h-full w-full'>
			<Sidebar />
			<MessageContainer />
		</div>
	);
};
export default Home;
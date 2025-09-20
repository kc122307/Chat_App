import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import LandingPage from "./pages/landing/LandingPage";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import SignUp from "./pages/signup/SignUp";
import Profile from "./pages/profile/Profile";
import Groups from "./pages/groups/Groups";
import MainLayout from "./components/MainLayout";
import { Toaster } from "react-hot-toast";
import { useAuthContext } from "./context/AuthContext";
// Import Room Pages
import RoomPage from "./pages/room/RoomPage";
import VideoRoom from "./pages/room/VideoRoom";

function App() {
	const { authUser } = useAuthContext();
	return (
		<div className='h-screen'>
			<Routes>
				{/* Landing Page - First page visitors see */}
				<Route
					path='/'
					element={
						authUser ? (
							<Navigate to={"/home"} />
						) : (
							<LandingPage />
						)
					}
				/>
				
				{/* Home Page - For authenticated users */}
				<Route
					path='/home'
					element={
						authUser ? (
							<MainLayout>
								<Home />
							</MainLayout>
						) : (
							<Navigate to={"/"} />
						)
					}
				/>
				<Route
					path='/profile'
					element={
						authUser ? (
							<MainLayout>
								<Profile />
							</MainLayout>
						) : (
							<Navigate to={"/"} />
						)
					}
				/>
				<Route
					path='/groups'
					element={
						authUser ? (
							<MainLayout>
								<Groups />
							</MainLayout>
						) : (
							<Navigate to={"/"} />
						)
					}
				/>
				
				<Route 
					path='/rooms' 
					element={
						authUser ? (
							<MainLayout>
								<RoomPage />
							</MainLayout>
						) : (
							<Navigate to={"/"} />
						)
					}
				/>
				
				<Route 
					path='/rooms/:roomId' 
					element={
						authUser ? (
							<VideoRoom />
						) : (
							<Navigate to={"/"} />
						)
					}
				/>

				<Route path='/login' element={
					<div className='flex items-center justify-center h-screen'>
						{authUser ? <Navigate to='/home' /> : <Login />}
					</div>
				} />
				<Route path='/signup' element={
					<div className='flex items-center justify-center h-screen'>
						{authUser ? <Navigate to='/home' /> : <SignUp />}
					</div>
				} />
			</Routes>
			<Toaster />
		</div>
	);
}

export default App;

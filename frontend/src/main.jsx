window.global = window;

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { AuthContextProvider } from "./context/AuthContext.jsx";
import { SocketContextProvider } from "./context/SocketContext.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import BrowserCheck from "./components/BrowserCheck.jsx";
import "simple-peer";
import "zustand";
import "react-router-dom";
import "react-hot-toast";
import "react-icons";
import 'webrtc-adapter';

ReactDOM.createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		<BrowserCheck>
			<ErrorBoundary>
				<BrowserRouter>
					<AuthContextProvider>
						<SocketContextProvider>
							<App />
						</SocketContextProvider>
					</AuthContextProvider>
				</BrowserRouter>
			</ErrorBoundary>
		</BrowserCheck>
	</React.StrictMode>
);

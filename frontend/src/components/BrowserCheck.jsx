import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const BrowserCheck = ({ children }) => {
    const [isCompatible, setIsCompatible] = useState(true);
    const [warnings, setWarnings] = useState([]);

    useEffect(() => {
        const checkBrowserCompatibility = () => {
            const issues = [];
            
            // Check WebRTC support
            if (!window.RTCPeerConnection) {
                issues.push('WebRTC is not supported in this browser');
            }
            
            // Check getUserMedia support
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                issues.push('Camera and microphone access is not supported');
            }
            
            // Check Socket.IO WebSocket support
            if (!window.WebSocket && !window.MozWebSocket) {
                issues.push('WebSocket support is required for real-time communication');
            }
            
            // Check if running on localhost/HTTPS for camera access
            const isSecure = window.location.protocol === 'https:' || 
                           window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1';
                           
            if (!isSecure) {
                issues.push('HTTPS is required for camera and microphone access');
            }
            
            // Browser-specific warnings
            const userAgent = navigator.userAgent.toLowerCase();
            
            if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
                // Safari specific checks
                if (!window.webkitRTCPeerConnection) {
                    issues.push('Safari WebRTC support may be limited');
                }
            }
            
            if (userAgent.includes('firefox')) {
                // Firefox specific checks - generally good WebRTC support
                console.log('[BROWSER CHECK] Firefox detected - good WebRTC support expected');
            }
            
            if (userAgent.includes('edge')) {
                // Edge specific checks
                console.log('[BROWSER CHECK] Edge detected - WebRTC support should be good');
            }
            
            if (issues.length > 0) {
                setWarnings(issues);
                if (issues.some(issue => issue.includes('not supported'))) {
                    setIsCompatible(false);
                } else {
                    // Just warnings, not blocking
                    issues.forEach(issue => {
                        toast.error(issue, { duration: 5000 });
                    });
                }
            } else {
                console.log('[BROWSER CHECK] All compatibility checks passed');
                toast.success('Browser is compatible with video chat', { duration: 2000 });
            }
        };

        checkBrowserCompatibility();
    }, []);

    if (!isCompatible) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
                <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-4">
                        Browser Not Supported
                    </h2>
                    <p className="text-gray-300 mb-6">
                        Your browser doesn't support the features required for video chat:
                    </p>
                    <ul className="text-left text-red-400 mb-6 space-y-2">
                        {warnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                        ))}
                    </ul>
                    <div className="bg-gray-700 p-4 rounded-lg mb-6">
                        <h3 className="text-lg font-semibold text-white mb-2">
                            Recommended Browsers:
                        </h3>
                        <ul className="text-gray-300 space-y-1">
                            <li>• Google Chrome (recommended)</li>
                            <li>• Mozilla Firefox</li>
                            <li>• Microsoft Edge</li>
                            <li>• Safari (latest version)</li>
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <button
                            onClick={() => window.location.reload()}
                            className="w-full bg-sky-500 hover:bg-sky-600 text-white py-2 px-4 rounded-lg transition-colors"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => setIsCompatible(true)}
                            className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg transition-colors"
                        >
                            Continue Anyway (May Not Work)
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return children;
};

export default BrowserCheck;
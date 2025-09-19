import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        // Log the error details
        console.error('ErrorBoundary caught an error:', error);
        console.error('Error info:', errorInfo);
        
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
                    <div className="bg-gray-800 p-8 rounded-lg max-w-md w-full text-center">
                        <h2 className="text-2xl font-bold text-red-500 mb-4">
                            Something went wrong
                        </h2>
                        <p className="text-gray-300 mb-6">
                            An error occurred while loading the video chat. This might be due to:
                        </p>
                        <ul className="text-left text-gray-400 mb-6 space-y-2">
                            <li>• Browser compatibility issues</li>
                            <li>• WebRTC not supported</li>
                            <li>• Network connectivity problems</li>
                            <li>• Camera/microphone permission issues</li>
                        </ul>
                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    this.setState({ hasError: false, error: null, errorInfo: null });
                                    window.location.reload();
                                }}
                                className="w-full bg-sky-500 hover:bg-sky-600 text-white py-2 px-4 rounded-lg transition-colors"
                            >
                                Reload Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 px-4 rounded-lg transition-colors"
                            >
                                Go Home
                            </button>
                        </div>
                        
                        {/* Development error details */}
                        {process.env.NODE_ENV === 'development' && (
                            <details className="mt-6 text-left">
                                <summary className="cursor-pointer text-gray-400 hover:text-white">
                                    Show Error Details (Dev)
                                </summary>
                                <div className="bg-gray-900 p-4 rounded mt-2 text-xs">
                                    <pre className="text-red-400 whitespace-pre-wrap">
                                        {this.state.error && this.state.error.toString()}
                                    </pre>
                                    <pre className="text-gray-400 whitespace-pre-wrap mt-2">
                                        {this.state.errorInfo.componentStack}
                                    </pre>
                                </div>
                            </details>
                        )}
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
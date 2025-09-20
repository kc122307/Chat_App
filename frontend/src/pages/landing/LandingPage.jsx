import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaVideo, FaComments, FaUsers, FaShield, FaGlobe, FaRocket, FaMobile, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBars, FaTimes, FaStar, FaPlay } from 'react-icons/fa';

const LandingPage = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const features = [
        {
            icon: <FaVideo className="text-4xl text-blue-500" />,
            title: "HD Video Calls",
            description: "Crystal clear video calls with up to 2 participants. Perfect for personal conversations and professional meetings."
        },
        {
            icon: <FaComments className="text-4xl text-green-500" />,
            title: "Real-time Chat",
            description: "Instant messaging with emoji support, file sharing, and message history. Stay connected with friends and colleagues."
        },
        {
            icon: <FaUsers className="text-4xl text-purple-500" />,
            title: "Group Conversations",
            description: "Create group chats, manage participants, and collaborate with your team in organized conversations."
        },
        {
            icon: <FaShield className="text-4xl text-red-500" />,
            title: "Secure & Private",
            description: "End-to-end encryption ensures your conversations remain private and secure from unauthorized access."
        },
        {
            icon: <FaGlobe className="text-4xl text-cyan-500" />,
            title: "Cross-Platform",
            description: "Works seamlessly across all devices - desktop, tablet, and mobile. Access from anywhere, anytime."
        },
        {
            icon: <FaRocket className="text-4xl text-orange-500" />,
            title: "Lightning Fast",
            description: "Optimized for speed with real-time synchronization. No lag, no delays - just smooth communication."
        }
    ];

    const testimonials = [
        {
            name: "Sarah Johnson",
            role: "Product Manager",
            comment: "Amazing app! The video quality is excellent and the interface is so intuitive. Perfect for our remote team meetings.",
            rating: 5
        },
        {
            name: "Mike Chen",
            role: "Developer",
            comment: "Love the real-time messaging and group features. It's become our go-to communication platform.",
            rating: 5
        },
        {
            name: "Emma Wilson",
            role: "Designer",
            comment: "Clean, modern design with powerful features. The video calls are crystal clear and very reliable.",
            rating: 5
        }
    ];

    const stats = [
        { number: "10K+", label: "Active Users" },
        { number: "50K+", label: "Messages Sent" },
        { number: "5K+", label: "Video Calls" },
        { number: "99.9%", label: "Uptime" }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Navigation */}
            <nav className="bg-black/20 backdrop-blur-md fixed w-full top-0 z-50 border-b border-white/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <FaComments className="text-3xl text-blue-500 mr-2" />
                            <span className="text-2xl font-bold text-white">ChatApp</span>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-8">
                                <a href="#features" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Features</a>
                                <a href="#about" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">About</a>
                                <a href="#testimonials" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Testimonials</a>
                                <a href="#contact" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">Contact</a>
                            </div>
                        </div>

                        {/* Auth Buttons */}
                        <div className="hidden md:flex items-center space-x-4">
                            <Link to="/login" className="text-gray-300 hover:text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
                                Login
                            </Link>
                            <Link to="/signup" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105">
                                Sign Up Free
                            </Link>
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden">
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="text-gray-300 hover:text-white p-2"
                            >
                                {isMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {isMenuOpen && (
                    <div className="md:hidden bg-black/40 backdrop-blur-md border-t border-white/10">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                            <a href="#features" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Features</a>
                            <a href="#about" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">About</a>
                            <a href="#testimonials" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Testimonials</a>
                            <a href="#contact" className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium">Contact</a>
                            <div className="flex flex-col space-y-2 px-3 py-2">
                                <Link to="/login" className="text-center bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium">
                                    Login
                                </Link>
                                <Link to="/signup" className="text-center bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                                    Sign Up Free
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="pt-20 pb-32 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center">
                        <div className="mb-8">
                            <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium mb-4">
                                🚀 Now Available - Join Today!
                            </span>
                        </div>
                        
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white mb-6">
                            Connect, Chat, and
                            <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                                Video Call
                            </span>
                            Like Never Before
                        </h1>
                        
                        <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                            Experience the future of communication with our powerful chat and video calling platform. 
                            Connect with friends, family, and colleagues with crystal-clear quality and lightning-fast messaging.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
                            <Link to="/signup" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-2xl">
                                <FaRocket className="inline-block mr-2" />
                                Start Free Today
                            </Link>
                            <button className="border border-white/20 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-all flex items-center">
                                <FaPlay className="mr-2" />
                                Watch Demo
                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                            {stats.map((stat, index) => (
                                <div key={index} className="text-center">
                                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">{stat.number}</div>
                                    <div className="text-gray-400">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                            Powerful Features for Modern Communication
                        </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Everything you need to stay connected, collaborate effectively, and communicate seamlessly.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div key={index} className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-all transform hover:scale-105 hover:shadow-2xl">
                                <div className="mb-4">{feature.icon}</div>
                                <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
                                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                                Built for the Modern World
                            </h2>
                            <p className="text-xl text-gray-300 mb-6 leading-relaxed">
                                Our chat and video calling platform is designed with cutting-edge technology to provide 
                                seamless communication experiences. Whether you're connecting with friends, family, or 
                                colleagues, we've got you covered.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <FaMobile className="text-blue-500 text-xl mr-4" />
                                    <span className="text-gray-300">Works on all devices</span>
                                </div>
                                <div className="flex items-center">
                                    <FaShield className="text-green-500 text-xl mr-4" />
                                    <span className="text-gray-300">End-to-end encryption</span>
                                </div>
                                <div className="flex items-center">
                                    <FaRocket className="text-purple-500 text-xl mr-4" />
                                    <span className="text-gray-300">Lightning-fast performance</span>
                                </div>
                            </div>
                        </div>
                        <div className="relative">
                            <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 p-8 rounded-2xl border border-white/10">
                                <div className="bg-white/5 p-6 rounded-xl mb-4">
                                    <FaVideo className="text-4xl text-blue-500 mb-4" />
                                    <h4 className="text-xl font-bold text-white mb-2">HD Video Calls</h4>
                                    <p className="text-gray-300">Crystal clear video quality</p>
                                </div>
                                <div className="bg-white/5 p-6 rounded-xl">
                                    <FaComments className="text-4xl text-green-500 mb-4" />
                                    <h4 className="text-xl font-bold text-white mb-2">Real-time Chat</h4>
                                    <p className="text-gray-300">Instant messaging experience</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-black/20">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                            What Our Users Say
                        </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Join thousands of satisfied users who have transformed their communication experience.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
                                <div className="flex mb-4">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <FaStar key={i} className="text-yellow-400 text-xl" />
                                    ))}
                                </div>
                                <p className="text-gray-300 mb-6 leading-relaxed">"{testimonial.comment}"</p>
                                <div>
                                    <h4 className="text-white font-bold">{testimonial.name}</h4>
                                    <p className="text-gray-400">{testimonial.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Contact Section */}
            <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                            Get in Touch
                        </h2>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Info */}
                        <div>
                            <div className="space-y-8">
                                <div className="flex items-center">
                                    <div className="bg-blue-500/20 p-4 rounded-full mr-6">
                                        <FaEnvelope className="text-blue-400 text-2xl" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg">Email Us</h4>
                                        <p className="text-gray-300">support@chatapp.com</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="bg-green-500/20 p-4 rounded-full mr-6">
                                        <FaPhone className="text-green-400 text-2xl" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg">Call Us</h4>
                                        <p className="text-gray-300">+1 (555) 123-4567</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <div className="bg-purple-500/20 p-4 rounded-full mr-6">
                                        <FaMapMarkerAlt className="text-purple-400 text-2xl" />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold text-lg">Visit Us</h4>
                                        <p className="text-gray-300">123 Tech Street, San Francisco, CA 94105</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10">
                            <form className="space-y-6">
                                <div>
                                    <label className="block text-white font-medium mb-2">Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white font-medium mb-2">Email</label>
                                    <input 
                                        type="email" 
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Your email"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white font-medium mb-2">Message</label>
                                    <textarea 
                                        rows={5}
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Your message"
                                    ></textarea>
                                </div>
                                <button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105">
                                    Send Message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                        Ready to Get Started?
                    </h2>
                    <p className="text-xl text-gray-300 mb-10">
                        Join thousands of users who are already enjoying seamless communication. Sign up now and start connecting!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link to="/signup" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105 shadow-2xl">
                            Sign Up Free
                        </Link>
                        <Link to="/login" className="border border-white/20 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white/10 transition-all">
                            Already have an account? Login
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-black/40 border-t border-white/10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center mb-4">
                                <FaComments className="text-3xl text-blue-500 mr-2" />
                                <span className="text-2xl font-bold text-white">ChatApp</span>
                            </div>
                            <p className="text-gray-300 mb-4">
                                The ultimate communication platform for modern teams and individuals. 
                                Connect, chat, and video call with ease.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Quick Links</h4>
                            <ul className="space-y-2">
                                <li><a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a></li>
                                <li><a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a></li>
                                <li><a href="#testimonials" className="text-gray-300 hover:text-white transition-colors">Testimonials</a></li>
                                <li><a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-bold mb-4">Legal</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Terms of Service</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Cookie Policy</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-white/10 mt-8 pt-8 text-center">
                        <p className="text-gray-300">
                            © 2024 ChatApp. All rights reserved. Built with ❤️ for seamless communication.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
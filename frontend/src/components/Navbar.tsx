import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music, LogOut, User as UserIcon, Upload } from 'lucide-react';
import api from '../api';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem('token');
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Check if the current user is an admin
        const checkAdminStatus = async () => {
            if (token) {
                try {
                    const response = await api.get('/auth/me/');
                    const isAdminUser = response.data.is_staff || response.data.is_superuser;
                    setIsAdmin(isAdminUser);
                    // Cache user info for faster subsequent loads
                    localStorage.setItem('userInfo', JSON.stringify(response.data));
                } catch (err) {
                    console.error('Failed to check admin status:', err);
                    // Fallback to cached user info if API fails
                    const cachedUserInfo = localStorage.getItem('userInfo');
                    if (cachedUserInfo) {
                        try {
                            const userInfo = JSON.parse(cachedUserInfo);
                            setIsAdmin(userInfo.is_staff || userInfo.is_superuser);
                        } catch (e) {
                            console.error('Failed to parse cached user info');
                        }
                    }
                }
            } else {
                setIsAdmin(false);
                localStorage.removeItem('userInfo');
            }
        };
        checkAdminStatus();
    }, [token]);

    // Handle user logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsAdmin(false);
        navigate('/login');
    };

    return (
        <nav className="bg-darker p-4 sticky top-0 z-50 border-b border-gray-800">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="flex items-center space-x-2 text-primary font-bold text-xl">
                    <Music size={28} />
                    <span>Takbon MusicTown</span>
                </Link>

                <div className="flex items-center space-x-6">
                    {token ? (
                        <>
                            <Link to="/dashboard" className="flex items-center space-x-1 hover:text-primary transition">
                                <UserIcon size={20} />
                                <span>My Music</span>
                            </Link>
                            {isAdmin && (
                                <Link
                                    to="/admin/manage"
                                    className="flex items-center space-x-1 bg-primary text-black px-4 py-2 rounded-full font-bold hover:scale-105 transition transform"
                                >
                                    <Music size={18} />
                                    <span>Manage</span>
                                </Link>
                            )}
                            {isAdmin && (
                                <Link
                                    to="/admin/upload"
                                    className="flex items-center space-x-1 bg-primary text-black px-4 py-2 rounded-full font-bold hover:scale-105 transition transform"
                                >
                                    <Upload size={18} />
                                    <span>Upload</span>
                                </Link>
                            )}
                            <button onClick={handleLogout} className="flex items-center space-x-1 hover:text-red-500 transition">
                                <LogOut size={20} />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <Link to="/login" className="bg-primary text-black px-4 py-2 rounded-full font-bold hover:scale-105 transition transform">
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Music } from 'lucide-react';
import api from '../api';

const Login: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                const res = await api.post('/auth/login/', { username, password });
                localStorage.setItem('token', res.data.token);

                // Fetch user info to cache admin status
                try {
                    const userRes = await api.get('/auth/me/');
                    localStorage.setItem('userInfo', JSON.stringify(userRes.data));
                } catch (e) {
                    console.error('Failed to fetch user info:', e);
                }

                navigate('/');
            } else {
                await api.post('/auth/register/', { username, password, email });
                // Auto login after successful registration
                const loginRes = await api.post('/auth/login/', { username, password });
                localStorage.setItem('token', loginRes.data.token);

                // Fetch user info
                try {
                    const userRes = await api.get('/auth/me/');
                    localStorage.setItem('userInfo', JSON.stringify(userRes.data));
                } catch (e) {
                    console.error('Failed to fetch user info:', e);
                }

                alert('Registration successful! Logging you in...');
                navigate('/');
            }
        } catch (err: any) {
            console.error('Error details:', err.response?.data);

            // Extract specific error messages from backend
            if (err.response?.data) {
                const errorData = err.response.data;
                let errorMessage = '';

                // Handle different error formats
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (errorData.detail) {
                    errorMessage = errorData.detail;
                } else if (errorData.non_field_errors) {
                    errorMessage = errorData.non_field_errors.join(', ');
                } else {
                    // Handle field-specific errors (username, email, password)
                    const errors = [];
                    if (errorData.username) errors.push(`Username: ${errorData.username.join(', ')}`);
                    if (errorData.email) errors.push(`Email: ${errorData.email.join(', ')}`);
                    if (errorData.password) errors.push(`Password: ${errorData.password.join(', ')}`);
                    errorMessage = errors.length > 0 ? errors.join(' | ') : 'Authentication failed. Please check your credentials.';
                }

                setError(errorMessage);
            } else {
                setError('Network error. Please check your connection and try again.');
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="bg-gray-900 p-8 rounded-lg w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-primary text-3xl font-bold mb-2">
                        <Music size={40} />
                        Takbon MusicTown
                    </Link>
                    <p className="text-gray-400">Sign in to continue to your music</p>
                </div>

                <h2 className="text-2xl font-bold mb-6 text-center">{isLogin ? 'Log In' : 'Sign Up'}</h2>

                {error && <div className="bg-red-500/20 text-red-500 p-3 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold mb-1">Username</label>
                        <input
                            type="text"
                            className="w-full bg-gray-800 border border-gray-700 rounded p-3 focus:border-primary focus:outline-none"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-bold mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full bg-gray-800 border border-gray-700 rounded p-3 focus:border-primary focus:outline-none"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full bg-gray-800 border border-gray-700 rounded p-3 focus:border-primary focus:outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-primary text-black font-bold py-3 rounded-full hover:scale-105 transition transform mt-4"
                    >
                        {isLogin ? 'Log In' : 'Sign Up'}
                    </button>
                </form>

                <p className="text-center mt-6 text-gray-400">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        className="text-white font-bold ml-2 hover:underline"
                    >
                        {isLogin ? 'Sign up' : 'Log in'}
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Login;

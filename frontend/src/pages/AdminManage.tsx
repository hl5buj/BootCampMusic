import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { API_BASE_URL } from '../api';
import { Music, Edit, Trash2, Search, Upload } from 'lucide-react';

interface Track {
    id: number;
    title: string;
    artist_name: string;
    album_title: string;
    album_cover: string | null;
    duration: number;
    download_count: number;
    created_at: string;
}

const AdminManage: React.FC = () => {
    const navigate = useNavigate();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const getImageUrl = (path: string | null): string | null => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString();
    };

    useEffect(() => {
        fetchTracks();
    }, []);

    const fetchTracks = async (): Promise<void> => {
        try {
            const res = await api.get('/music/tracks/');
            setTracks(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch tracks', err);
            setLoading(false);
        }
    };

    const handleDelete = async (id: number): Promise<void> => {
        if (!confirm('Are you sure you want to delete this track?')) return;

        try {
            await api.delete(`/admin/delete-track/${id}/`);
            alert('Track deleted successfully!');
            fetchTracks();
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Failed to delete track.');
        }
    };

    const filteredTracks = tracks.filter(track =>
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.album_title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center">
                <Music className="w-12 h-12 text-primary animate-pulse" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark text-white pb-20">
            <div className="container mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Music className="text-primary" size={40} />
                            <h1 className="text-4xl font-bold">Manage Tracks</h1>
                        </div>
                        <button
                            onClick={() => navigate('/admin/upload')}
                            className="bg-primary text-black px-6 py-3 rounded-full font-bold hover:scale-105 transition transform flex items-center gap-2"
                        >
                            <Upload size={20} />
                            Upload New Track
                        </button>
                    </div>

                    {/* Search Bar */}
                    <div className="mb-6">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search tracks, artists, or albums..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    {/* Tracks Table */}
                    <div className="bg-gray-900 rounded-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-800">
                                <tr>
                                    <th className="p-4 text-left">Track</th>
                                    <th className="p-4 text-left">Artist</th>
                                    <th className="p-4 text-left">Album</th>
                                    <th className="p-4 text-center">Duration</th>
                                    <th className="p-4 text-center">Downloads</th>
                                    <th className="p-4 text-center">Created</th>
                                    <th className="p-4 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTracks.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-gray-400">
                                            {searchQuery ? 'No tracks found matching your search.' : 'No tracks available.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTracks.map((track) => (
                                        <tr key={track.id} className="border-t border-gray-800 hover:bg-gray-800/50 transition">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    {track.album_cover ? (
                                                        <img
                                                            src={getImageUrl(track.album_cover) || ''}
                                                            alt={track.album_title}
                                                            className="w-12 h-12 rounded object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center">
                                                            <Music size={24} className="text-gray-500" />
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-white">{track.title}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-300">{track.artist_name}</td>
                                            <td className="p-4 text-gray-300">{track.album_title}</td>
                                            <td className="p-4 text-center text-gray-300">{formatDuration(track.duration)}</td>
                                            <td className="p-4 text-center text-gray-300">{track.download_count?.toLocaleString() ?? '0'}</td>
                                            <td className="p-4 text-center text-gray-300">{formatDate(track.created_at)}</td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/admin/edit/${track.id}`)}
                                                        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                                                        title="Edit track"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(track.id)}
                                                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                                                        title="Delete track"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminManage;

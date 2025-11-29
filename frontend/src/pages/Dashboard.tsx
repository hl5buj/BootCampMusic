import React, { useEffect, useState } from 'react';
import api, { API_BASE_URL } from '../api';
import { Download, Music } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Track {
    id: number;
    title: string;
    artist_name: string;
    album_cover: string | null;
}

interface DownloadLog {
    id: number;
    track: Track;
    downloaded_at: string;
}

const Dashboard: React.FC = () => {
    const [downloads, setDownloads] = useState<DownloadLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/music/downloads/')
            .then(res => setDownloads(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const getImageUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <h1 className="text-3xl font-bold mb-8">My Library</h1>

            {loading ? (
                <div className="text-center text-gray-500">Loading...</div>
            ) : downloads.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {downloads.map((log) => (
                        <div key={log.id} className="bg-gray-900 rounded-lg p-4 flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                                {log.track.album_cover ? (
                                    <img src={getImageUrl(log.track.album_cover)!} alt={log.track.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                                        <Music size={20} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-grow min-w-0">
                                <h3 className="font-bold truncate">{log.track.title}</h3>
                                <p className="text-sm text-gray-400 truncate">{log.track.artist_name}</p>
                                <p className="text-xs text-gray-500 mt-1">Downloaded on {new Date(log.downloaded_at).toLocaleDateString()}</p>
                            </div>
                            <Link to={`/track/${log.track.id}`} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                                <Download size={20} />
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-400">
                    <Download size={48} className="mx-auto mb-4 opacity-50" />
                    <p>You haven't downloaded any tracks yet.</p>
                    <Link to="/search" className="text-primary hover:underline mt-2 inline-block">Find music</Link>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

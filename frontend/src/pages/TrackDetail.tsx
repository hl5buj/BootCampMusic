import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { API_BASE_URL } from '../api';
import { Download, Play, Pause, Music, Calendar, Clock } from 'lucide-react';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import GlobalPlayer from '../components/GlobalPlayer';

interface Artist {
    id: number;
    name: string;
    bio: string;
    image: string | null;
    tracks_count: number;
    albums_count: number;
}

interface Album {
    id: number;
    title: string;
    artist: Artist;
    release_date: string;
    cover_image: string | null;
    tracks_count: number;
}

interface Track {
    id: number;
    title: string;
    artist: Artist;
    album: Album;
    file: string;
    preview_file: string | null;
    duration: number;
    created_at: string;
    download_count: number;
}

const TrackDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [track, setTrack] = useState<Track | null>(null);
    const [loading, setLoading] = useState(true);
    const { playTrack, currentTrack, isPlaying } = useMusicPlayer();

    const getFullUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    useEffect(() => {
        setLoading(true);

        api.get(`/music/tracks/${id}/`)
            .then(res => {
                const fetchedTrack = res.data;
                setTrack(fetchedTrack);

                const playerTrack = {
                    id: fetchedTrack.id,
                    title: fetchedTrack.title,
                    artist_name: fetchedTrack.artist.name,
                    album_title: fetchedTrack.album.title,
                    album_cover: fetchedTrack.album.cover_image,
                    preview_file: fetchedTrack.preview_file,
                    file: fetchedTrack.file,
                    duration: fetchedTrack.duration,
                };

                playTrack(playerTrack);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const togglePlay = () => {
        if (!track) return;

        const playerTrack = {
            id: track.id,
            title: track.title,
            artist_name: track.artist.name,
            album_title: track.album.title,
            album_cover: track.album.cover_image,
            preview_file: track.preview_file,
            file: track.file,
            duration: track.duration,
        };

        playTrack(playerTrack);
    };

    const handleDownload = async () => {
        if (!track) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert("Please login to download music.");
                return;
            }

            const downloadUrl = `http://localhost:8000/api/music/tracks/${id}/download/`;

            const response = await fetch(downloadUrl, {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    alert("Please login to download music.");
                } else {
                    alert("Download failed. The file may not be available.");
                }
                return;
            }

            const blob = await response.blob();
            const filename = `${track.artist.name} - ${track.title}.mp3`;

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.style.display = 'none';
            link.href = url;
            link.download = filename;

            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }, 100);

        } catch (err: any) {
            console.error("Download failed", err);
            alert("Download failed. Please try again.");
        }
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center">
                <div className="text-center">
                    <Music className="w-16 h-16 text-primary animate-pulse mx-auto mb-4" />
                    <p className="text-xl text-gray-400">Loading track...</p>
                </div>
            </div>
        );
    }

    if (!track) {
        return (
            <div className="min-h-screen bg-dark flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-400">Track not found</p>
                    <Link to="/" className="text-primary hover:underline mt-4 inline-block">
                        Go back home
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-dark text-white pb-20">
            <div className="relative h-96 bg-gradient-to-b from-primary/20 to-dark">
                <div className="absolute inset-0 bg-black/50" />
                {track.album.cover_image && (
                    <div
                        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30"
                        style={{ backgroundImage: `url(${getFullUrl(track.album.cover_image)})` }}
                    />
                )}
            </div>

            <div className="container mx-auto px-4 -mt-32 relative z-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full md:w-80 flex-shrink-0"
                    >
                        <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
                            {track.album.cover_image ? (
                                <img
                                    src={getFullUrl(track.album.cover_image)!}
                                    alt={track.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                    <Music size={80} />
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="flex-1"
                    >
                        <p className="text-sm uppercase tracking-wider text-gray-400 mb-2">Song</p>
                        <h1 className="text-5xl md:text-7xl font-bold mb-4">{track.title}</h1>

                        <div className="flex items-center gap-4 mb-6">
                            <Link
                                to={`/artist/${track.artist.id}`}
                                className="text-xl text-gray-300 hover:text-white hover:underline"
                            >
                                {track.artist.name}
                            </Link>
                            <span className="text-gray-500">•</span>
                            <Link
                                to={`/album/${track.album.id}`}
                                className="text-xl text-gray-300 hover:text-white hover:underline"
                            >
                                {track.album.title}
                            </Link>
                        </div>

                        <div className="flex items-center gap-4 mt-8">
                            {(track.preview_file || track.file) && (
                                <button
                                    onClick={togglePlay}
                                    className="bg-primary text-black px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 hover:scale-105 transition transform shadow-lg"
                                >
                                    {(currentTrack?.id === track.id && isPlaying) ? <Pause fill="black" size={24} /> : <Play fill="black" size={24} />}
                                    {(currentTrack?.id === track.id && isPlaying) ? 'Pause' : 'Play'}
                                </button>
                            )}

                            <button
                                onClick={handleDownload}
                                className="border-2 border-gray-500 text-white px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 hover:border-white hover:bg-white/10 transition"
                            >
                                <Download size={24} />
                                Download
                            </button>
                        </div>

                        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                                    <Clock size={16} />
                                    Duration
                                </p>
                                <p className="text-lg font-semibold">{formatDuration(track.duration)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                                    <Download size={16} />
                                    Downloads
                                </p>
                                <p className="text-lg font-semibold">{track.download_count.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-1 flex items-center gap-2">
                                    <Calendar size={16} />
                                    Release Date
                                </p>
                                <p className="text-lg font-semibold">{formatDate(track.album.release_date)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400 mb-1">Added</p>
                                <p className="text-lg font-semibold">{formatDate(track.created_at)}</p>
                            </div>
                        </div>

                        {track.artist.bio && (
                            <div className="mt-12 p-6 bg-gray-900 rounded-lg">
                                <h3 className="text-xl font-bold mb-3">About {track.artist.name}</h3>
                                <p className="text-gray-300 leading-relaxed">{track.artist.bio}</p>
                                <div className="mt-4 flex gap-6 text-sm text-gray-400">
                                    <span>{track.artist.tracks_count} tracks</span>
                                    <span>{track.artist.albums_count} albums</span>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
            <GlobalPlayer />
        </div>
    );
};

export default TrackDetail;

import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api, { API_BASE_URL } from '../api';
import { Search as SearchIcon, Music, User, Disc, Play, Pause } from 'lucide-react';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

interface Track {
    id: number;
    title: string;
    artist_name: string;
    album_title: string;
    album_cover: string | null;
    duration: number;
    preview_file: string | null;
    file: string;
}

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
    artist: {
        id: number;
        name: string;
    };
    release_date: string;
    cover_image: string | null;
}

interface SearchResults {
    tracks: Track[];
    artists: Artist[];
    albums: Album[];
}

const Search: React.FC = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults>({ tracks: [], artists: [], albums: [] });
    const [loading, setLoading] = useState(false);
    const hoverTimeoutRef = useRef<number | null>(null);

    const { playTrack, currentTrack, isPlaying } = useMusicPlayer();

    const getFullUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    const searchAll = async () => {
        if (!query.trim()) {
            setResults({ tracks: [], artists: [], albums: [] });
            return;
        }

        setLoading(true);
        try {
            const res = await api.get(`/search/?q=${encodeURIComponent(query)}`);
            setResults(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            searchAll();
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const hasResults = results.tracks.length > 0 || results.artists.length > 0 || results.albums.length > 0;

    const handleTrackHover = (track: Track) => {
        // Clear any existing timeout
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        // Set timeout to auto-play after 500ms of hovering
        hoverTimeoutRef.current = window.setTimeout(() => {
            playTrack(track);
        }, 500);
    };

    const handleTrackLeave = () => {
        // Clear timeout if user stops hovering before 500ms
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }
    };

    const handleTrackClick = (track: Track, e: React.MouseEvent) => {
        // Prevent navigation if clicking on the play button area
        if ((e.target as HTMLElement).closest('.play-button')) {
            e.preventDefault();
            playTrack(track);
        }
    };

    return (
        <div className="min-h-screen bg-dark text-white pb-20">
            <div className="container mx-auto px-4 py-12">
                {/* Search Bar */}
                <div className="max-w-3xl mx-auto mb-12">
                    <div className="flex items-center bg-gray-800 rounded-full px-6 py-4 shadow-lg">
                        <SearchIcon className="text-gray-400 mr-4" size={24} />
                        <input
                            type="text"
                            placeholder="Search for tracks, artists, or albums..."
                            className="bg-transparent border-none outline-none text-white text-lg w-full placeholder-gray-500"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                    </div>
                </div>

                {loading && (
                    <div className="text-center text-gray-400 py-12">
                        <Music className="w-12 h-12 animate-pulse mx-auto mb-4" />
                        <p>Searching...</p>
                    </div>
                )}

                {!loading && query && !hasResults && (
                    <div className="text-center text-gray-400 py-12">
                        <SearchIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-xl">No results found for "{query}"</p>
                        <p className="text-sm mt-2">Try searching with different keywords</p>
                    </div>
                )}

                {!loading && hasResults && (
                    <div className="space-y-12">
                        {/* Tracks */}
                        {results.tracks.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <Music size={28} />
                                    Tracks
                                </h2>
                                <div className="space-y-2">
                                    {results.tracks.map((track) => (
                                        <Link
                                            key={track.id}
                                            to={`/track/${track.id}`}
                                            className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-800 transition group relative"
                                            onMouseEnter={() => handleTrackHover(track)}
                                            onMouseLeave={handleTrackLeave}
                                            onClick={(e) => handleTrackClick(track, e)}
                                        >
                                            <div className="w-16 h-16 bg-gray-700 rounded flex-shrink-0 overflow-hidden relative">
                                                {track.album_cover ? (
                                                    <img
                                                        src={getFullUrl(track.album_cover)!}
                                                        alt={track.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Music className="text-gray-500" size={24} />
                                                    </div>
                                                )}
                                                {/* Play button overlay */}
                                                <div className="play-button absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {currentTrack?.id === track.id && isPlaying ? (
                                                        <Pause fill="white" className="text-white" size={24} />
                                                    ) : (
                                                        <Play fill="white" className="text-white ml-1" size={24} />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold truncate group-hover:text-primary transition">
                                                    {track.title}
                                                </p>
                                                <p className="text-sm text-gray-400 truncate">
                                                    {track.artist_name} • {track.album_title}
                                                </p>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                {formatDuration(track.duration)}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Artists */}
                        {results.artists.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <User size={28} />
                                    Artists
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                                    {results.artists.map((artist) => (
                                        <Link
                                            key={artist.id}
                                            to={`/artist/${artist.id}`}
                                            className="group"
                                        >
                                            <div className="aspect-square bg-gray-800 rounded-full overflow-hidden mb-3 shadow-lg group-hover:shadow-primary/50 transition">
                                                {artist.image ? (
                                                    <img
                                                        src={getFullUrl(artist.image)!}
                                                        alt={artist.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <User className="text-gray-500" size={48} />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="font-semibold text-center truncate group-hover:text-primary transition">
                                                {artist.name}
                                            </p>
                                            <p className="text-sm text-gray-400 text-center">
                                                {artist.tracks_count} tracks
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {/* Albums */}
                        {results.albums.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                    <Disc size={28} />
                                    Albums
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                    {results.albums.map((album) => (
                                        <Link
                                            key={album.id}
                                            to={`/album/${album.id}`}
                                            className="group"
                                        >
                                            <div className="aspect-square bg-gray-800 rounded-lg overflow-hidden mb-3 shadow-lg group-hover:shadow-primary/50 transition">
                                                {album.cover_image ? (
                                                    <img
                                                        src={getFullUrl(album.cover_image)!}
                                                        alt={album.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Disc className="text-gray-500" size={48} />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="font-semibold truncate group-hover:text-primary transition">
                                                {album.title}
                                            </p>
                                            <p className="text-sm text-gray-400 truncate">
                                                {album.artist.name}
                                            </p>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;

import React, { useEffect, useState } from 'react';
import api from '../api';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import TrackCard from '../components/TrackCard';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';

interface Track {
    id: number;
    title: string;
    artist_name: string;
    album_cover: string | null;
    preview_file?: string | null;
    file?: string | null;
    duration: number;
    genre?: string;
}

const Home: React.FC = () => {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [filteredTracks, setFilteredTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Genre state
    const [genres, setGenres] = useState<string[]>([]);
    const [selectedGenre, setSelectedGenre] = useState<string | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { pauseTrack } = useMusicPlayer();

    // Stop music immediately when returning to home
    useEffect(() => {
        // Stop music immediately when returning to home page
        // This ensures no background audio from previous pages
        pauseTrack();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        // Fetch initial list of tracks
        fetchTracks();
    }, []);

    useEffect(() => {
        // Extract unique genres from the track list for the filter dropdown
        const uniqueGenres = Array.from(new Set(tracks.map(t => t.genre).filter(Boolean))) as string[];
        setGenres(uniqueGenres);
    }, [tracks]);

    useEffect(() => {
        // Filter tracks based on search term and selected genre
        let filtered = tracks;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(track =>
                track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                track.artist_name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply genre filter
        if (selectedGenre) {
            filtered = filtered.filter(track => track.genre === selectedGenre);
        }

        setFilteredTracks(filtered);
        setCurrentPage(1); // Reset to first page on search/filter update
    }, [searchTerm, selectedGenre, tracks]);

    const fetchTracks = async () => {
        try {
            const res = await api.get('/music/tracks/');
            setTracks(res.data);
            setFilteredTracks(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredTracks.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTracks.length / itemsPerPage);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    return (
        <div className="min-h-screen bg-dark text-white pb-20 pt-8">
            <div className="container mx-auto px-4">

                {/* Header & Search */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h1 className="text-3xl font-bold">Discover Music</h1>

                    <div className="flex items-center gap-4 w-full md:w-auto">
                        {/* Genre Filter */}
                        <div className="relative">
                            <select
                                value={selectedGenre || ''}
                                onChange={(e) => setSelectedGenre(e.target.value || null)}
                                className="bg-gray-800 border border-gray-700 rounded-full px-4 py-3 focus:outline-none focus:border-primary text-white appearance-none pr-10 cursor-pointer"
                            >
                                <option value="">All Genres</option>
                                {genres.map(genre => (
                                    <option key={genre} value={genre}>{genre}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                                <ChevronRight size={16} className="rotate-90" />
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-800 border border-gray-700 rounded-full px-6 py-3 pl-12 focus:outline-none focus:border-primary text-white"
                            />
                            <Search className="absolute left-4 top-3.5 text-gray-400" size={20} />
                        </div>
                    </div>
                </div>

                {/* Track Grid */}
                {loading ? (
                    <div className="text-center py-20">Loading...</div>
                ) : (
                    <>
                        {currentItems.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12">
                                {currentItems.map((track) => (
                                    <TrackCard key={track.id} track={track} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-gray-400">
                                No tracks found.
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronLeft size={24} />
                                </button>

                                <div className="flex gap-2">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((number) => (
                                        <button
                                            key={number}
                                            onClick={() => paginate(number)}
                                            className={`w-10 h-10 rounded-full font-bold transition ${currentPage === number
                                                ? 'bg-primary text-black'
                                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                                }`}
                                        >
                                            {number}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    <ChevronRight size={24} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Home;

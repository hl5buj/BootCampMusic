import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api';
import { searchItunes } from '../utils/itunes';
import { Upload, Music, User, Disc, Calendar, Clock, Sparkles } from 'lucide-react';

const AdminUpload: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        artist_name: '',
        artist_bio: '',
        album_title: '',
        release_date: '',
        duration: 0,
        genre: ''
    });
    const [files, setFiles] = useState<{
        file: File | null;
        preview_file: File | null;
        album_cover: File | null;
    }>({
        file: null,
        preview_file: null,
        album_cover: null
    });

    const [albumCoverUrl, setAlbumCoverUrl] = useState<string | null>(null);

    const handleAutoFill = async () => {
        if (!formData.title && !formData.artist_name) {
            alert("Please enter at least a Track Title or Artist Name to search.");
            return;
        }

        setSearching(true);
        const term = `${formData.title} ${formData.artist_name}`.trim();

        try {
            const result = await searchItunes(term);
            if (result) {
                // Update text fields
                setFormData(prev => ({
                    ...prev,
                    title: result.trackName,
                    artist_name: result.artistName,
                    album_title: result.collectionName,
                    release_date: result.releaseDate.split('T')[0],
                    genre: result.primaryGenreName || ''
                }));

                // Try to get high-res artwork (replace 100x100 with 600x600)
                const highResUrl = result.artworkUrl100.replace('100x100', '600x600');
                setAlbumCoverUrl(highResUrl);

                alert("Found info! Please verify the details.");
            } else {
                alert("No results found. Try refining the title or artist.");
            }
        } catch (error) {
            console.error(error);
            alert("Error searching for metadata.");
        } finally {
            setSearching(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        if (e.target.files && e.target.files[0]) {
            setFiles({
                ...files,
                [fieldName]: e.target.files[0]
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const uploadData = new FormData();
            uploadData.append('title', formData.title);
            uploadData.append('artist_name', formData.artist_name);
            uploadData.append('artist_bio', formData.artist_bio);
            uploadData.append('album_title', formData.album_title);
            uploadData.append('release_date', formData.release_date || '2024-01-01');
            uploadData.append('duration', formData.duration.toString());
            uploadData.append('genre', formData.genre);

            if (files.file) uploadData.append('file', files.file);
            if (files.preview_file) uploadData.append('preview_file', files.preview_file);

            if (files.album_cover) {
                uploadData.append('album_cover', files.album_cover);
            } else if (albumCoverUrl) {
                uploadData.append('album_cover_url', albumCoverUrl);
            }

            await api.post('/admin/upload-track/', uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Navigate directly to manage page without alert
            navigate('/admin/manage');
        } catch (err: any) {
            console.error('Upload failed:', err);
            if (err.response?.status === 403) {
                alert('You must be an admin to upload tracks.');
            } else {
                alert('Upload failed. Please check all fields and try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark text-white pb-20">
            <div className="container mx-auto px-4 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-3xl mx-auto"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <Upload className="text-primary" size={40} />
                            <h1 className="text-4xl font-bold">Upload New Track</h1>
                        </div>
                        <button
                            type="button"
                            onClick={handleAutoFill}
                            disabled={searching}
                            className="bg-purple-600 text-white px-6 py-2 rounded-full font-bold hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50"
                        >
                            <Sparkles size={20} />
                            {searching ? 'Searching...' : 'Auto-fill Info'}
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Track Information */}
                        <div className="bg-gray-900 p-6 rounded-lg">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Music size={24} />
                                Track Information
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Track Title *</label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                                        placeholder="Enter track title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                        <Clock size={16} />
                                        Duration (seconds) *
                                    </label>
                                    <input
                                        type="number"
                                        name="duration"
                                        value={formData.duration}
                                        onChange={handleInputChange}
                                        required
                                        min="0"
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                                        placeholder="e.g., 180"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Genre</label>
                                    <input
                                        type="text"
                                        name="genre"
                                        value={formData.genre}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                                        placeholder="e.g., Pop, Rock, Jazz"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Artist Information */}
                        <div className="bg-gray-900 p-6 rounded-lg">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <User size={24} />
                                Artist Information
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Artist Name *</label>
                                    <input
                                        type="text"
                                        name="artist_name"
                                        value={formData.artist_name}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                                        placeholder="Enter artist name"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Artist Bio (Optional)</label>
                                    <textarea
                                        name="artist_bio"
                                        value={formData.artist_bio}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                                        placeholder="Enter artist biography"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Album Information */}
                        <div className="bg-gray-900 p-6 rounded-lg">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Disc size={24} />
                                Album Information
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Album Title *</label>
                                    <input
                                        type="text"
                                        name="album_title"
                                        value={formData.album_title}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                                        placeholder="Enter album title"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                                        <Calendar size={16} />
                                        Release Date (Optional)
                                    </label>
                                    <input
                                        type="date"
                                        name="release_date"
                                        value={formData.release_date}
                                        onChange={handleInputChange}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* File Uploads */}
                        <div className="bg-gray-900 p-6 rounded-lg">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Upload size={24} />
                                File Uploads
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Track File (MP3/WAV) *</label>
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        onChange={(e) => handleFileChange(e, 'file')}
                                        required
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-black hover:file:bg-primary/80"
                                    />
                                    {files.file && (
                                        <p className="text-sm text-gray-400 mt-2">Selected: {files.file.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">
                                        Preview File (Optional)
                                        <span className="text-xs text-gray-500 ml-2">- 30초 미리듣기용</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept="audio/*"
                                        onChange={(e) => handleFileChange(e, 'preview_file')}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-black hover:file:bg-primary/80"
                                    />
                                    {files.preview_file && (
                                        <p className="text-sm text-gray-400 mt-2">Selected: {files.preview_file.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Album Cover (Optional)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => handleFileChange(e, 'album_cover')}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:border-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-black hover:file:bg-primary/80"
                                    />
                                    {files.album_cover && (
                                        <p className="text-sm text-gray-400 mt-2">Selected: {files.album_cover.name}</p>
                                    )}
                                    {!files.album_cover && albumCoverUrl && (
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-400 mb-2">Auto-selected cover:</p>
                                            <img src={albumCoverUrl} alt="Album Cover Preview" className="w-32 h-32 object-cover rounded-lg" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-primary text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>Uploading...</>
                                ) : (
                                    <>
                                        <Upload size={24} />
                                        Upload Track
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/')}
                                className="px-8 py-4 rounded-full font-bold text-lg border-2 border-gray-600 hover:border-white transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
};

export default AdminUpload;

import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, Rewind, FastForward } from 'lucide-react';
import { useMusicPlayer } from '../contexts/MusicPlayerContext';
import { API_BASE_URL } from '../api';

const GlobalPlayer: React.FC = () => {
    const {
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        togglePlayPause,
        seekTo,
        setVolume,
        nextTrack,
        previousTrack,
        skipForward,
        skipBackward,
        skipToStart,
        skipToEnd,
    } = useMusicPlayer();

    const progressBarRef = useRef<HTMLDivElement>(null);
    const volumeBarRef = useRef<HTMLDivElement>(null);

    // Helper to construct full URL for images/audio
    const getFullUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    // Format seconds into MM:SS
    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    // Handle click on progress bar to seek
    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!progressBarRef.current || !duration) return;

        const rect = progressBarRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = clickX / rect.width;
        const newTime = percentage * duration;

        seekTo(newTime);
    };

    // Handle click on volume bar to change volume
    const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!volumeBarRef.current) return;

        const rect = volumeBarRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const percentage = Math.max(0, Math.min(1, clickX / rect.width));

        setVolume(percentage);
    };

    // Toggle mute/unmute
    const toggleMute = () => {
        setVolume(volume > 0 ? 0 : 0.7);
    };

    if (!currentTrack) return null;

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
            <div className="container mx-auto px-4 py-3">
                {/* Progress Bar */}
                <div
                    ref={progressBarRef}
                    className="w-full h-1 bg-gray-700 rounded-full cursor-pointer mb-3 group"
                    onClick={handleProgressClick}
                >
                    <div
                        className="h-full bg-primary rounded-full relative transition-all"
                        style={{ width: `${progress}%` }}
                    >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                    {/* Track Info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Link to={`/track/${currentTrack.id}`} className="flex-shrink-0">
                            <div className="w-14 h-14 bg-gray-800 rounded overflow-hidden">
                                {currentTrack.album_cover ? (
                                    <img
                                        src={getFullUrl(currentTrack.album_cover)!}
                                        alt={currentTrack.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <Music className="text-gray-500" size={20} />
                                    </div>
                                )}
                            </div>
                        </Link>
                        <div className="min-w-0 flex-1">
                            <Link
                                to={`/track/${currentTrack.id}`}
                                className="font-semibold hover:underline truncate block"
                            >
                                {currentTrack.title}
                            </Link>
                            <p className="text-sm text-gray-400 truncate">
                                {currentTrack.artist_name}
                            </p>
                        </div>
                    </div>

                    {/* Player Controls */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={skipToStart}
                                className="text-gray-400 hover:text-white transition"
                                aria-label="Skip to start"
                                title="Skip to start"
                            >
                                <SkipBack size={20} />
                            </button>

                            <button
                                onClick={() => skipBackward(10)}
                                className="text-gray-400 hover:text-white transition"
                                aria-label="Rewind 10 seconds"
                                title="Rewind 10s"
                            >
                                <Rewind size={18} />
                            </button>

                            <button
                                onClick={togglePlayPause}
                                className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition transform"
                                aria-label={isPlaying ? 'Pause' : 'Play'}
                            >
                                {isPlaying ? (
                                    <Pause fill="black" className="text-black" size={20} />
                                ) : (
                                    <Play fill="black" className="text-black ml-0.5" size={20} />
                                )}
                            </button>

                            <button
                                onClick={() => skipForward(10)}
                                className="text-gray-400 hover:text-white transition"
                                aria-label="Forward 10 seconds"
                                title="Forward 10s"
                            >
                                <FastForward size={18} />
                            </button>

                            <button
                                onClick={skipToEnd}
                                className="text-gray-400 hover:text-white transition"
                                aria-label="Skip to end"
                                title="Skip to end"
                            >
                                <SkipForward size={20} />
                            </button>
                        </div>

                        <div className="text-xs text-gray-400">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center gap-2 flex-1 justify-end">
                        <button
                            onClick={toggleMute}
                            className="text-gray-400 hover:text-white transition"
                            aria-label={volume > 0 ? 'Mute' : 'Unmute'}
                        >
                            {volume > 0 ? <Volume2 size={20} /> : <VolumeX size={20} />}
                        </button>

                        <div
                            ref={volumeBarRef}
                            className="w-24 h-1 bg-gray-700 rounded-full cursor-pointer group"
                            onClick={handleVolumeClick}
                        >
                            <div
                                className="h-full bg-white rounded-full relative"
                                style={{ width: `${volume * 100}%` }}
                            >
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalPlayer;

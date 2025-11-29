import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, Volume2, Music } from 'lucide-react';
import { motion } from 'framer-motion';
import { API_BASE_URL } from '../api';

interface Track {
    id: number;
    title: string;
    artist_name: string;
    album_cover: string | null;
    preview_file?: string | null;
    file?: string | null;
    duration: number;
}

interface TrackCardProps {
    track: Track;
}

const TrackCard: React.FC<TrackCardProps> = ({ track }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioError, setAudioError] = useState(false);
    const [imgError, setImgError] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const hoverTimeoutRef = useRef<number | null>(null);
    const navigate = useNavigate();

    const getImageUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    const getAudioUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    useEffect(() => {
        const audioSrc = track.file || track.preview_file;
        if (audioSrc) {
            const audio = new Audio(getAudioUrl(audioSrc)!);
            audio.volume = 0.3;
            // Preload audio to reduce delay
            audio.preload = 'auto';
            audio.addEventListener('ended', () => setIsPlaying(false));
            audio.addEventListener('error', () => setAudioError(true));
            audioRef.current = audio;
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, [track]);

    const handleMouseEnter = () => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

        // Delay start slightly to avoid accidental triggers (reduced to 150ms for better responsiveness)
        hoverTimeoutRef.current = window.setTimeout(() => {
            if (audioRef.current && !audioError) {
                audioRef.current.currentTime = 0;
                const playPromise = audioRef.current.play();

                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            setIsPlaying(true);
                            // Stop after 10 seconds (preview mode)
                            setTimeout(() => {
                                if (audioRef.current) {
                                    audioRef.current.pause();
                                    setIsPlaying(false);
                                }
                            }, 10000);
                        })
                        .catch(err => {
                            console.error('Playback failed:', err);
                            // Don't set error state for AbortError (happens on quick mouse leave)
                            if (err.name !== 'AbortError') {
                                setAudioError(true);
                            }
                        });
                }
            }
        }, 150);
    };

    const handleMouseLeave = () => {
        // Clear the timeout if the user leaves before playback starts
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }

        // Stop playback immediately
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            setIsPlaying(false);
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        navigate(`/track/${track.id}`);
    };

    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition group cursor-pointer"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
        >
            <div className="relative aspect-square mb-4 bg-gray-800 rounded-md overflow-hidden">
                {!imgError && track.album_cover ? (
                    <img
                        src={getImageUrl(track.album_cover)!}
                        alt={track.title}
                        className="w-full h-full object-cover"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800">
                        <Music size={40} className="text-gray-500" />
                    </div>
                )}

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <div className="bg-primary text-black p-3 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition">
                        {isPlaying ? (
                            <Pause fill="black" size={24} />
                        ) : (
                            <Play fill="black" size={24} />
                        )}
                    </div>
                </div>

                {isPlaying && (
                    <div className="absolute top-2 right-2 bg-primary text-black p-2 rounded-full animate-pulse">
                        <Volume2 size={16} />
                    </div>
                )}
            </div>

            <h3 className="font-bold truncate group-hover:text-primary transition">
                {track.title}
            </h3>
            <p className="text-sm text-gray-400 truncate">{track.artist_name}</p>
        </motion.div>
    );
};

export default TrackCard;

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { API_BASE_URL } from '../api';

interface Track {
    id: number;
    title: string;
    artist_name: string;
    album_title: string;
    album_cover: string | null;
    preview_file: string | null;
    file: string;
    duration: number;
}

interface MusicPlayerContextType {
    currentTrack: Track | null;
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    playTrack: (track: Track) => void;
    pauseTrack: () => void;
    resumeTrack: () => void;
    togglePlayPause: () => void;
    seekTo: (time: number) => void;
    setVolume: (volume: number) => void;
    nextTrack: () => void;
    previousTrack: () => void;
    skipForward: (seconds?: number) => void;
    skipBackward: (seconds?: number) => void;
    skipToStart: () => void;
    skipToEnd: () => void;
    playlist: Track[];
    setPlaylist: (tracks: Track[]) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export const useMusicPlayer = () => {
    const context = useContext(MusicPlayerContext);
    if (!context) {
        throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
    }
    return context;
};

interface MusicPlayerProviderProps {
    children: ReactNode;
}

export const MusicPlayerProvider: React.FC<MusicPlayerProviderProps> = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolumeState] = useState(0.7);
    const [playlist, setPlaylist] = useState<Track[]>([]);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    const getFullUrl = (path: string | null) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_BASE_URL}${path}`;
    };

    useEffect(() => {
        const audio = new Audio();
        audio.volume = volume;
        audio.preload = 'auto';

        audio.addEventListener('timeupdate', () => {
            setCurrentTime(audio.currentTime);
        });

        audio.addEventListener('loadedmetadata', () => {
            setDuration(audio.duration);
        });

        audio.addEventListener('ended', () => {
            setIsPlaying(false);
        });

        audioRef.current = audio;

        return () => {
            audio.pause();
            audio.src = '';
        };
    }, []);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const playTrack = useCallback((track: Track) => {
        if (!audioRef.current) return;

        const audioUrl = getFullUrl(track.preview_file || track.file);
        if (!audioUrl) return;

        if (currentTrack?.id === track.id) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play().catch(err => console.error(err));
                setIsPlaying(true);
            }
            return;
        }

        setCurrentTrack(track);
        const audio = audioRef.current;
        audio.pause();
        audio.currentTime = 0;
        audio.src = audioUrl;
        audio.load();
        audio.play().then(() => setIsPlaying(true)).catch(err => {
            console.error(err);
            setIsPlaying(false);
        });
    }, [currentTrack, isPlaying]);

    const pauseTrack = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
    }, []);

    const resumeTrack = () => {
        if (audioRef.current && currentTrack) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(err => console.error(err));
        }
    };

    const togglePlayPause = () => {
        if (isPlaying) {
            pauseTrack();
        } else {
            resumeTrack();
        }
    };

    const seekTo = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const setVolume = (newVolume: number) => {
        setVolumeState(Math.max(0, Math.min(1, newVolume)));
    };

    const nextTrack = () => {
        if (!currentTrack || playlist.length === 0) return;
        const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
        if (currentIndex < playlist.length - 1) {
            playTrack(playlist[currentIndex + 1]);
        }
    };

    const previousTrack = () => {
        if (!currentTrack || playlist.length === 0) return;
        const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
        if (currentIndex > 0) {
            playTrack(playlist[currentIndex - 1]);
        } else {
            seekTo(0);
        }
    };

    const skipForward = (seconds: number = 10) => {
        if (audioRef.current && duration) {
            const newTime = Math.min(currentTime + seconds, duration);
            seekTo(newTime);
        }
    };

    const skipBackward = (seconds: number = 10) => {
        if (audioRef.current) {
            const newTime = Math.max(currentTime - seconds, 0);
            seekTo(newTime);
        }
    };

    const skipToStart = () => {
        seekTo(0);
    };

    const skipToEnd = () => {
        if (audioRef.current && duration) {
            seekTo(Math.max(duration - 1, 0));
        }
    };

    const value: MusicPlayerContextType = {
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        playTrack,
        pauseTrack,
        resumeTrack,
        togglePlayPause,
        seekTo,
        setVolume,
        nextTrack,
        previousTrack,
        skipForward,
        skipBackward,
        skipToStart,
        skipToEnd,
        playlist,
        setPlaylist,
    };

    return (
        <MusicPlayerContext.Provider value={value}>
            {children}
        </MusicPlayerContext.Provider>
    );
};

import axios from 'axios';

interface ItunesResult {
    artistName: string;
    trackName: string;
    collectionName: string; // Album
    artworkUrl100: string; // Cover
    releaseDate: string;
    primaryGenreName: string;
    previewUrl: string;
}

export const searchItunes = async (term: string) => {
    try {
        const response = await axios.get(`https://itunes.apple.com/search`, {
            params: {
                term: term,
                media: 'music',
                entity: 'song',
                limit: 1
            }
        });

        if (response.data.resultCount > 0) {
            return response.data.results[0] as ItunesResult;
        }
        return null;
    } catch (error) {
        console.error("iTunes Search Error:", error);
        return null;
    }
};

export const urlToFile = async (url: string, filename: string, mimeType: string): Promise<File> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new File([blob], filename, { type: mimeType });
};

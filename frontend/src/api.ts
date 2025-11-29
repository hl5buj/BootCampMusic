import axios from 'axios';

// API_BASE_URL을 비워두면 브라우저는 현재 도메인(localhost:5173)으로 요청을 보냅니다.
// 그러면 Vite의 프록시가 이를 가로채서 백엔드(localhost:8000)로 전달합니다.
// 이것이 CORS 문제를 해결하는 가장 확실한 방법입니다.
export const API_BASE_URL = '';

const api = axios.create({
    baseURL: '/api', // 항상 /api로 시작
});

// 요청 인터셉터: 토큰이 있으면 헤더에 추가
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;

import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api', // Backend port 8000
    headers: {
        'Content-Type': 'application/json'
    }
});

export default api;

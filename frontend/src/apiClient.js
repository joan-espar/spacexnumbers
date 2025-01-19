import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
});

// // Add an interceptor to include the API key in all requests
// apiClient.interceptors.request.use((config) => {
//     const apiKey = process.env.REACT_APP_API_KEY;
//     if (apiKey) {
//         config.headers['x-api-key'] = apiKey; // Add the API key to the headers
//     }
//     return config;
// }, (error) => {
//     return Promise.reject(error);
// });

export default apiClient;
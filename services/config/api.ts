import axios from "axios"

const api = axios.create({
  baseURL: "https://689f09413fed484cf878cf87.mockapi.io/api/v1",
  timeout: 10000
})

api.interceptors.request.use(async (config) => {
  // Add authorization token to headers if available
  const token = ""; // Get token from storage or context
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
api.interceptors.response.use(
    (response) => {
      // Handle successful responses
      return response.data;
    },
    (error) => {
      // Handle errors
      return Promise.reject(error);
    }
);
export default api;

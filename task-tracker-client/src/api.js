import axios from 'axios';

const api = axios.create({
  baseURL: '/api', 
  withCredentials: true, 
});

// Перехватчик ответов: если сервер вернул 401 (сессия истекла),
// удаляем пользователя из localStorage и перенаправляем на логин
api.interceptors.response.use(
  (response) => response, 
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
// Чтобы избежать бесконечного цикла, если мы уже на /login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
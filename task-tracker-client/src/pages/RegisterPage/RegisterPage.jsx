import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import styles from './RegisterPage.module.css';

function RegisterPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false); // <-- Для блокировки кнопки
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    // Валидация
    if (!login.trim() || !password.trim()) {
      setMessage('Заполните все поля');
      return;
    }
    if (password.length < 6) {
      setMessage('Пароль должен быть не короче 6 символов');
      return;
    }

    setIsLoading(true); // Блокируем кнопку

    try {
      await api.post('/auth/register', { login, password });
      
      setMessage('Регистрация успешна! Перенаправление на вход...');
      setTimeout(() => navigate('/login'), 1500);
      
    } catch (error) {
      // Обработка ошибок сервера
      if (error.response?.status === 400) {
        setMessage('Ошибка: ' + (error.response.data.message || 'Неверные данные'));
      } else if (error.response?.status === 500) {
        setMessage('Ошибка сервера. Попробуйте позже или используйте существующий аккаунт.');
      } else {
        setMessage('Ошибка: ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setIsLoading(false); // Разблокируем кнопку
    }
  };

  return (
    <div className={styles.container}>
      <h2>Регистрация</h2>
      
      <form onSubmit={handleRegister} className={styles.form}>
        <input 
          type="text" 
          placeholder="Логин" 
          value={login} 
          onChange={(e) => setLogin(e.target.value)} 
          className={styles.input}
          disabled={isLoading}
        />
        <input 
          type="password" 
          placeholder="Пароль (минимум 6 символов)" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className={styles.input}
          disabled={isLoading}
        />
        <button 
          type="submit" 
          className={styles.button} 
          disabled={isLoading}
        >
          {isLoading ? 'Отправка...' : 'Зарегистрироваться'}
        </button>
      </form>

      {message && <p className={styles.message}>{message}</p>}
      
      <p className={styles.linkText}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}

export default RegisterPage;
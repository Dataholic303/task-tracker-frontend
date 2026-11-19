import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './LoginPage.module.css'; 
import api from '../../api';

function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('Отправка...');

    try {
      const response = await api.post('/auth/login', { login, password });
      
      console.log("Ответ при логине:", response.data); 
      
      // Если сервер вернул ID пользователя — сохраняем его
      // Сохраняем пользователя и добавляем роль (заглушка)
      const userData = {
        ...response.data,
        role: 'ADMIN' // <-- ЗАГЛУШКА. Можно поменять роль на обсервера.
      };
      localStorage.setItem('user', JSON.stringify(userData));

      navigate('/workspaces');
    } catch (error) {
      if (error.response?.status === 401) {
        setMessage('Неверный логин или пароль');
      } else {
        setMessage('Ошибка: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  return (
    
    <div className={styles.container}>
      <h2>Вход в Task Tracker</h2>
      
      <form onSubmit={handleLogin} className={styles.form}>
        <input 
          type="text" 
          placeholder="Логин" 
          value={login} 
          onChange={(e) => setLogin(e.target.value)} 
          className={styles.input} 
        />
        <input 
          type="password" 
          placeholder="Пароль" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className={styles.input} 
        />
        <button type="submit" className={styles.button}>
          Войти
        </button>
      </form>

      
      {message && <p className={styles.message}>{message}</p>}
      
      <p className={styles.linkText}>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>
    </div>
  );
}

export default LoginPage;
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import styles from './RegisterPage.module.css'; // Создадим стили чуть позже

function RegisterPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!login.trim() || !password.trim()) {
      setMessage('Заполните все поля');
      return;
    }

    try {
      await api.post('/auth/register', { login, password });
      
      setMessage('Регистрация успешна! Перенаправление на вход...');
      
      setTimeout(() => navigate('/login'), 1500);
      
    } catch (error) {
      
      setMessage('Ошибка: ' + (error.response?.data?.message || error.message));
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
        />
        <input 
          type="password" 
          placeholder="Пароль" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          className={styles.input}
        />
        <button type="submit" className={styles.button}>Зарегистрироваться</button>
      </form>

      {message && <p className={styles.message}>{message}</p>}
      
      <p className={styles.linkText}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
    </div>
  );
}

export default RegisterPage;
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './LoginPage.module.css'; 
import api from '../../api';
import Toast from '../../components/UI/Toast/Toast'; // <-- ИМПОРТ

function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState(null); // <-- ЗАМЕНА message
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setToast(null);

    if (!login.trim() || !password.trim()) {
      setToast({ message: 'Заполните логин и пароль', type: 'warning' });
      return;
    }

    try {
      const response = await api.post('/auth/login', { login, password });
      
      console.log("Ответ при логине:", response.data); 
      
      const userData = {
        ...response.data,
        role: 'ADMIN' // <- ЗАГЛУШКА
      };
      localStorage.setItem('user', JSON.stringify(userData));

      setToast({ message: 'Вы вошли в систему', type: 'success' });
      setTimeout(() => navigate('/workspaces'), 1000);
      
    } catch (error) {
      if (error.response?.status === 401) {
        setToast({ message: 'Неверный логин или пароль', type: 'error' });
      } else {
        setToast({ 
          message: 'Ошибка: ' + (error.response?.data?.message || error.message), 
          type: 'error' 
        });
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

      <p className={styles.linkText}>
        Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
      </p>

      {/* РЕНДЕР TOAST */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}

export default LoginPage;
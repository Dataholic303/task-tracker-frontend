import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import Toast from '../../components/UI/Toast/Toast'; // <-- ИМПОРТ
import styles from './RegisterPage.module.css';

function RegisterPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [toast, setToast] = useState(null); // <-- ЗАМЕНА message
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setToast(null); // Сбрасываем предыдущий Toast

    // Валидация
    if (!login.trim() || !password.trim()) {
      setToast({ message: 'Заполните все поля', type: 'warning' });
      return;
    }
    if (password.length < 6) {
      setToast({ message: 'Пароль должен быть не короче 6 символов', type: 'error' });
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/register', { login, password });
      
      setToast({ message: 'Регистрация успешна! Перенаправление на вход...', type: 'success' });
      setTimeout(() => navigate('/login'), 1500);
      
    } catch (error) {
      if (error.response?.status === 400) {
        setToast({ 
          message: 'Ошибка: ' + (error.response.data.message || 'Неверные данные'), 
          type: 'error' 
        });
      } else if (error.response?.status === 500) {
        setToast({ 
          message: 'Ошибка сервера. Попробуйте позже или используйте существующий аккаунт.', 
          type: 'error' 
        });
      } else {
        setToast({ 
          message: 'Ошибка: ' + (error.response?.data?.message || error.message), 
          type: 'error' 
        });
      }
    } finally {
      setIsLoading(false);
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
      
      <p className={styles.linkText}>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
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

export default RegisterPage;
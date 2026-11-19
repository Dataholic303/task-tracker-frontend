import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import styles from '../ProfilePage/ProfilePage.module.css'; 

function ProfilePage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = currentUser.id;
  const avatarUrl = `/users/${userId}/avatar`;

  const fetchSessions = () => {
    api.get('/auth/sessions')
      .then(res => {
        setSessions(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUploadAvatar = async () => {
    if (!file) return;
    setUploadMsg('Загрузка...');

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.put('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadMsg('Аватарка обновлена!');
      window.location.reload();
    } catch (err) {
      setUploadMsg('Ошибка: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm('Завершить эту сессию?')) return;
    try {
      await api.delete(`/auth/sessions/${sessionId}`);
      fetchSessions();
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('ВЫ УВЕРЕНЫ? Это удалит ваш аккаунт навсегда!')) return;
    try {
      await api.delete('/users/me');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (err) {
      alert('Ошибка: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div className={styles.container}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <Link to="/workspaces" className={styles.backLink}>
        ← Назад к пространствам
      </Link>

      <div className={styles.profileHeader}>
        {/* Отображение аватарки */}
        <img
          src={avatarUrl}
          alt="Аватар"
          className={styles.avatar}
          onError={(e) => { e.target.style.display = 'none'; }}
        />

        <div className={styles.userInfo}>
          <h2>Мой профиль</h2>
          <p>Логин: {currentUser.login}</p>

          {/* Форма загрузки аватарки */}
          <div className={styles.uploadForm}>
            <input type="file" onChange={handleFileChange} accept="image/*" />
            <button
              onClick={handleUploadAvatar}
              disabled={!file}
              className={styles.uploadBtn}
            >
              Загрузить
            </button>
          </div>
          {uploadMsg && <p className={styles.uploadMsg}>{uploadMsg}</p>}
        </div>
      </div>

      <h3>Активные сессии</h3>
      <div className={styles.sessionsList}>
        {sessions.map(s => (
          <div key={s.id} className={styles.sessionCard}>
            <div className={styles.sessionInfo}>
              <strong>{s.userAgent || 'Неизвестное устройство'}</strong>
              <div className={styles.sessionMeta}>
                IP: {s.ip} | {new Date(s.createdAt).toLocaleString()}
              </div>
            </div>
            <button onClick={() => handleDeleteSession(s.id)} className={styles.deleteSessionBtn}>
              Завершить
            </button>
          </div>
        ))}
        {sessions.length === 0 && <p className={styles.emptySessions}>Нет активных сессий.</p>}
      </div>

      <hr className={styles.divider} />

      <div className={styles.dangerZone}>
        <h3>Опасная зона</h3>
        <button onClick={handleDeleteAccount} className={styles.deleteAccountBtn}>
          Удалить аккаунт навсегда
        </button>
      </div>
    </div>
  );
}

export default ProfilePage;
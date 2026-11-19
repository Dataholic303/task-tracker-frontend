import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import Toast from '../../components/UI/Toast/Toast';
import ConfirmModal from '../../components/UI/ConfirmModal/ConfirmModal';
import styles from '../ProfilePage/ProfilePage.module.css';

function ProfilePage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
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
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setToast({ message: 'Аватарка обновлена!', type: 'success' });
      window.location.reload();
    } catch (err) {
      setToast({ 
        message: 'Ошибка загрузки: ' + (err.response?.data?.message || err.message), 
        type: 'error' 
      });
      setUploadMsg('');
    }
  };

  // Завершение сессии (через ConfirmModal)
  const handleDeleteSession = (sessionId) => {
    setConfirmAction({ type: 'session', id: sessionId });
  };

  // Удаление аккаунта (через ConfirmModal)
  const handleDeleteAccount = () => {
    setConfirmAction({ type: 'account' });
  };

  // Подтверждение действия
  const confirmActionHandler = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === 'session') {
        await api.delete(`/auth/sessions/${confirmAction.id}`);
        fetchSessions();
        setToast({ message: 'Сессия завершена', type: 'success' });
      } else if (confirmAction.type === 'account') {
        await api.delete('/users/me');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } catch (err) {
      setToast({ 
        message: 'Ошибка: ' + (err.response?.data?.message || err.message), 
        type: 'error' 
      });
    } finally {
      setConfirmAction(null);
    }
  };

  if (loading) return <div className={styles.container}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <Link to="/workspaces" className={styles.backLink}>
        ← Назад к пространствам
      </Link>

      <div className={styles.profileHeader}>
        <img
          src={avatarUrl}
          alt="Аватар"
          className={styles.avatar}
          onError={(e) => { e.target.style.display = 'none'; }}
        />

        <div className={styles.userInfo}>
          <h2>Мой профиль</h2>
          <p>Логин: {currentUser.login}</p>

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

      {/* РЕНДЕР TOAST */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* РЕНДЕР CONFIRM MODAL */}
      {confirmAction && (
        <ConfirmModal
          message={
            confirmAction.type === 'session' 
              ? 'Завершить эту сессию?' 
              : 'ВЫ УВЕРЕНЫ? Это удалит ваш аккаунт навсегда!'
          }
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmActionHandler}
        />
      )}
    </div>
  );
}

export default ProfilePage;
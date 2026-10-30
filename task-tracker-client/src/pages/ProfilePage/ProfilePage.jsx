import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';

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

  if (loading) return <div style={{ padding: '20px' }}>Загрузка...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/workspaces" style={{ display: 'inline-block', marginBottom: '20px' }}>
        ← Назад к пространствам
      </Link>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
        {/* Отображение аватарки */}
        <img 
          src={avatarUrl} 
          alt="Аватар" 
          style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ddd' }}
          onError={(e) => { e.target.style.display = 'none'; }} // Заглушка, если нет авы!!!
        />
        
        <div>
          <h2 style={{ margin: 0 }}>Мой профиль</h2>
          <p style={{ color: '#666', margin: '5px 0' }}>Логин: {currentUser.login}</p>
          
          {/* Форма загрузки аватарки */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
            <input type="file" onChange={handleFileChange} accept="image/*" />
            <button 
              onClick={handleUploadAvatar} 
              disabled={!file}
              style={{ padding: '5px 15px', cursor: file ? 'pointer' : 'not-allowed' }}
            >
              Загрузить
            </button>
          </div>
          {uploadMsg && <p style={{ color: 'green', fontSize: '14px', margin: '5px 0' }}>{uploadMsg}</p>}
        </div>
      </div>

      <h3>Активные сессии</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sessions.map(s => (
          <div key={s.id} style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>{s.userAgent || 'Неизвестное устройство'}</strong>
              <div style={{ fontSize: '12px', color: '#666' }}>
                IP: {s.ip} | {new Date(s.createdAt).toLocaleString()}
              </div>
            </div>
            <button onClick={() => handleDeleteSession(s.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>
              Завершить
            </button>
          </div>
        ))}
        {sessions.length === 0 && <p>Нет активных сессий.</p>}
      </div>

      <hr style={{ margin: '30px 0' }} />

      <h3 style={{ color: 'red' }}>Опасная зона</h3>
      <button onClick={handleDeleteAccount} style={{ backgroundColor: '#dc3545', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
        Удалить аккаунт навсегда
      </button>
    </div>
  );
}

export default ProfilePage;
import { useEffect, useState } from 'react';
import api from '../../api';
import WorkspaceCard from '../../components/Workspace/WorkspaceCard/WorkspaceCard';
import WorkspaceForm from '../../components/Workspace/WorkspaceForm/WorkspaceForm';
import { useNavigate, Link } from 'react-router-dom';

function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWs, setSelectedWs] = useState(null);
  const [searchLogin, setSearchLogin] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('EDITOR');
  const [memberMsg, setMemberMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  // Загрузка списка
  const fetchWorkspaces = () => {
    setLoading(true);
    api.get('/workspaces')
      .then(res => {
        setWorkspaces(res.data);
        setLoading(false);
      })
      .catch(err => {
        setErrorMsg('Ошибка загрузки: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Создание
  const handleCreate = async (data) => {
    setErrorMsg('');
    try {
      await api.post('/workspaces', { name: data.name, code: data.code });
      fetchWorkspaces();
    } catch (err) {
      setErrorMsg('Не удалось создать: ' + (err.response?.data?.message || err.message));
    }
  };

  // Удаление
  const handleDelete = async (id) => {
    if (!window.confirm('Удалить пространство?')) return;
    try {
      await api.delete(`/workspaces/${id}`);
      if (selectedWs?.id === id) setSelectedWs(null);
      fetchWorkspaces();
    } catch (err) {
      setErrorMsg('Ошибка удаления: ' + (err.response?.data?.message || err.message));
    }
  };

  // Поиск пользователей по логину
  const handleSearchUsers = async () => {
    if (!searchLogin.trim()) return;
    setMemberMsg('');
    setFoundUsers([]);
    try {
      const res = await api.get(`/users?login=${searchLogin}`);
      setFoundUsers(res.data);
    } catch (err) {
      try {
        const allRes = await api.get('/users');
        const filtered = allRes.data.filter(u =>
          u.login.toLowerCase().includes(searchLogin.toLowerCase())
        );
        setFoundUsers(filtered);
      } catch (e) {
        setMemberMsg('Ошибка поиска: ' + (e.response?.data?.message || e.message));
      }
    }
  };

  // Добавление участника в пространство
  const handleAddMember = async () => {
    if (!selectedUser || !selectedWs) return;
    setMemberMsg('');
    try {
      await api.post(`/workspaces/${selectedWs.id}/members`, {
        userId: selectedUser.id,
        role: selectedRole
      });
      setMemberMsg(`Пользователь ${selectedUser.login} добавлен как ${selectedRole}`);
      setFoundUsers([]);
      setSelectedUser(null);
      setSearchLogin('');
    } catch (err) {
      setMemberMsg('Ошибка добавления: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Загрузка...</div>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Шапка со ссылкой на профиль */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Мои рабочие пространства</h2>
        <Link
          to="/profile"
          style={{ textDecoration: 'none', color: '#007bff', fontWeight: 'bold', fontSize: '16px' }}
        >
          Профиль
        </Link>
      </div>

      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}

      <WorkspaceForm onCreate={handleCreate} />

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Левая колонка: Список карточек */}
        <div style={{ flex: 1 }}>
          <h3>Список ({workspaces.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {workspaces.map((ws) => (
              <WorkspaceCard
                key={ws.id}
                workspace={ws}
                isSelected={selectedWs?.id === ws.id}
                onClick={() => setSelectedWs(ws)} 
                onDelete={handleDelete}
              />
            ))}
            {workspaces.length === 0 && <p>Нет пространств. Создайте первое!</p>}
          </div>
        </div>

        {/* Правая колонка: Детали */}
        <div style={{ flex: 1, borderLeft: '1px solid #eee', paddingLeft: '20px' }}>
          {selectedWs ? (
            <div>
              <h3>Детали пространства</h3>
              <p><strong>Название:</strong> {selectedWs.name}</p>
              <p><strong>Код:</strong> {selectedWs.code}</p>
              <p><strong>ID:</strong> {selectedWs.id}</p>

              <button
                onClick={() => navigate(`/workspaces/${selectedWs.id}`)}
                style={{
                  marginTop: '10px',
                  padding: '10px 20px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  width: '100%',
                  fontSize: '16px'
                }}
              >
                Перейти к задачам →
              </button>

              <hr />
              <h3>Управление участниками</h3>
              {memberMsg && <p style={{ color: 'blue' }}>{memberMsg}</p>}

              {/* Поиск */}
              <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                <input
                  type="text"
                  placeholder="Логин пользователя"
                  value={searchLogin}
                  onChange={(e) => setSearchLogin(e.target.value)}
                  style={{ flex: 1, padding: '5px' }}
                />
                <button onClick={handleSearchUsers} style={{ padding: '5px 10px', cursor: 'pointer' }}>Найти</button>
              </div>

              {/* Результаты поиска */}
              {foundUsers.length > 0 && (
                <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '5px', marginBottom: '10px' }}>
                  <p>Найденные пользователи:</p>
                  {foundUsers.map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '5px 0' }}>
                      <span>{u.login}</span>
                      <button
                        onClick={() => setSelectedUser(u)}
                        style={{
                          backgroundColor: selectedUser?.id === u.id ? '#007bff' : 'transparent',
                          color: selectedUser?.id === u.id ? 'white' : 'black',
                          padding: '2px 8px', cursor: 'pointer'
                        }}
                      >
                        {selectedUser?.id === u.id ? 'Выбран' : 'Выбрать'}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Выбор роли и добавление */}
              {selectedUser && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                  <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} style={{ padding: '5px' }}>
                    <option value="ADMIN">ADMIN</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="EXECUTOR">EXECUTOR</option>
                    <option value="OBSERVER">OBSERVER</option>
                  </select>
                  <button onClick={handleAddMember} style={{ padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>
                    Добавить
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#888' }}>Нажмите на карточку, чтобы выбрать пространство.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkspacesPage;
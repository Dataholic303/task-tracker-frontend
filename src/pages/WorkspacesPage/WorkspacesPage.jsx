import { useEffect, useState } from 'react';
import api from '../../api';
import WorkspaceCard from '../../components/Workspace/WorkspaceCard/WorkspaceCard';
import WorkspaceForm from '../../components/Workspace/WorkspaceForm/WorkspaceForm';
import { useNavigate, Link } from 'react-router-dom';
import ConfirmModal from '../../components/UI/ConfirmModal/ConfirmModal';
import Toast from '../../components/UI/Toast/Toast'; // <-- ИМПОРТ
import styles from '../WorkspacesPage/WorkspacesPage.module.css';

function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWs, setSelectedWs] = useState(null);
  const [searchLogin, setSearchLogin] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('EDITOR');
  const [toast, setToast] = useState(null); // <-- ЗАМЕНА errorMsg/memberMsg
  const [confirmDelete, setConfirmDelete] = useState(null);
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
        setToast({ 
          message: 'Ошибка загрузки: ' + (err.response?.data?.message || err.message), 
          type: 'error' 
        });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Создание
  const handleCreate = async (data) => {
    try {
      await api.post('/workspaces', { name: data.name, code: data.code });
      fetchWorkspaces();
      setToast({ message: 'Пространство создано', type: 'success' });
    } catch (err) {
      setToast({ 
        message: 'Не удалось создать: ' + (err.response?.data?.message || err.message), 
        type: 'error' 
      });
    }
  };

  // Удаление
  const handleDelete = async (id) => {
    try {
      await api.delete(`/workspaces/${id}`);
      if (selectedWs?.id === id) setSelectedWs(null);
      fetchWorkspaces();
      setToast({ message: 'Пространство удалено', type: 'success' });
    } catch (err) {
      setToast({ 
        message: 'Ошибка удаления: ' + (err.response?.data?.message || err.message), 
        type: 'error' 
      });
    }
  };

  // Поиск пользователей по логину
  const handleSearchUsers = async () => {
    if (!searchLogin.trim()) return;
    setFoundUsers([]);
    try {
      const res = await api.get(`/users?login=${searchLogin}`);
      setFoundUsers(res.data);
      if (res.data.length === 0) {
        setToast({ message: 'Пользователь не найден', type: 'warning' });
      }
    } catch (err) {
      try {
        const allRes = await api.get('/users');
        const filtered = allRes.data.filter(u =>
          u.login.toLowerCase().includes(searchLogin.toLowerCase())
        );
        setFoundUsers(filtered);
        if (filtered.length === 0) {
          setToast({ message: 'Пользователь не найден', type: 'warning' });
        }
      } catch (e) {
        setToast({ 
          message: 'Ошибка поиска: ' + (e.response?.data?.message || e.message), 
          type: 'error' 
        });
      }
    }
  };

  // Добавление участника в пространство
  const handleAddMember = async () => {
    if (!selectedUser || !selectedWs) return;
    try {
      await api.post(`/workspaces/${selectedWs.id}/members`, {
        userId: selectedUser.id,
        role: selectedRole
      });
      setToast({ 
        message: `Пользователь ${selectedUser.login} добавлен как ${selectedRole}`, 
        type: 'success' 
      });
      setFoundUsers([]);
      setSelectedUser(null);
      setSearchLogin('');
    } catch (err) {
      setToast({ 
        message: 'Ошибка добавления: ' + (err.response?.data?.message || err.message), 
        type: 'error' 
      });
    }
  };

  if (loading) return <div className={styles.container}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      {/* Шапка со ссылкой на профиль */}
      <div className={styles.header}>
        <h2>Мои рабочие пространства</h2>
        <Link to="/profile" className={styles.profileLink}>
          Профиль
        </Link>
      </div>

      <WorkspaceForm onCreate={handleCreate} />

      <div className={styles.mainContent}>
        {/* Левая колонка: Список карточек */}
        <div className={styles.leftColumn}>
          <h3 className={styles.listTitle}>Список ({workspaces.length})</h3>
          <div className={styles.cardsList}>
            {workspaces.map((ws) => (
              <WorkspaceCard
                key={ws.id}
                workspace={ws}
                isSelected={selectedWs?.id === ws.id}
                onClick={() => setSelectedWs(ws)}
                onDelete={() => setConfirmDelete({ id: ws.id, name: ws.name })}
              />
            ))}
            {workspaces.length === 0 && <p className={styles.emptyMessage}>Нет пространств. Создайте первое!</p>}
          </div>
        </div>

        {/* Правая колонка: Детали */}
        <div className={styles.rightColumn}>
          {selectedWs ? (
            <div className={styles.workspaceDetails}>
              <h3>Детали пространства</h3>
              <p><strong>Название:</strong> {selectedWs.name}</p>
              <p><strong>Код:</strong> {selectedWs.code}</p>

              <button
                onClick={() => navigate(`/workspaces/${selectedWs.id}`)}
                className={styles.goToBoardBtn}
              >
                Перейти к задачам →
              </button>

              <hr />
              
              <div className={styles.memberSection}>
                <h3>Управление участниками</h3>

                {/* Поиск */}
                <div className={styles.searchBox}>
                  <input
                    type="text"
                    placeholder="Логин пользователя"
                    value={searchLogin}
                    onChange={(e) => setSearchLogin(e.target.value)}
                    className={styles.searchInput}
                  />
                  <button onClick={handleSearchUsers} className={styles.searchBtn}>
                    Найти
                  </button>
                </div>

                {/* Результаты поиска */}
                {foundUsers.length > 0 && (
                  <div className={styles.foundUsersBox}>
                    <p>Найденные пользователи:</p>
                    {foundUsers.map(u => (
                      <div key={u.id} className={styles.foundUserRow}>
                        <span>{u.login}</span>
                        <button
                          onClick={() => setSelectedUser(u)}
                          className={`${styles.selectUserBtn} ${selectedUser?.id === u.id ? styles.selectUserBtnSelected : ''}`}
                        >
                          {selectedUser?.id === u.id ? 'Выбран' : 'Выбрать'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Выбор роли и добавление */}
                {selectedUser && (
                  <div className={styles.addMemberBox}>
                    <select 
                      value={selectedRole} 
                      onChange={(e) => setSelectedRole(e.target.value)} 
                      className={styles.roleSelect}
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="EDITOR">EDITOR</option>
                      <option value="EXECUTOR">EXECUTOR</option>
                      <option value="OBSERVER">OBSERVER</option>
                    </select>
                    <button onClick={handleAddMember} className={styles.addMemberBtn}>
                      Добавить
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className={styles.placeholderText}>Нажмите на карточку, чтобы выбрать пространство.</p>
          )}
        </div>
      </div>

      {/* РЕНДЕР МОДАЛКИ ПОДТВЕРЖДЕНИЯ */}
      {confirmDelete && (
        <ConfirmModal
          message={`Удалить пространство "${confirmDelete.name}"?`}
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            handleDelete(confirmDelete.id);
            setConfirmDelete(null);
          }}
        />
      )}

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

export default WorkspacesPage;
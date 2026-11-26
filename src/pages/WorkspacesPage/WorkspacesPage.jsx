import { useEffect, useState } from 'react';
import api from '../../api';
import WorkspaceCard from '../../components/Workspace/WorkspaceCard/WorkspaceCard';
import WorkspaceForm from '../../components/Workspace/WorkspaceForm/WorkspaceForm';
import { useNavigate, Link } from 'react-router-dom';
import ConfirmModal from '../../components/UI/ConfirmModal/ConfirmModal';
import Toast from '../../components/UI/Toast/Toast'; // <-- проверьте путь
import styles from '../WorkspacesPage/WorkspacesPage.module.css';

function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWs, setSelectedWs] = useState(null);
  const [searchLogin, setSearchLogin] = useState('');
  const [foundUsers, setFoundUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState('EDITOR');
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  
  const [toast, setToast] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { type: 'workspace' | 'member', id, name }
  
  const navigate = useNavigate();

  const fetchWorkspaces = () => {
    setLoading(true);
    api.get('/workspaces')
      .then(res => {
        setWorkspaces(res.data);
        setLoading(false);
      })
      .catch(err => {
        setToast({ message: 'Ошибка загрузки: ' + (err.response?.data?.message || err.message), type: 'error' });
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Загрузка участников при выборе пространства
  useEffect(() => {
    if (selectedWs) {
      setLoadingMembers(true);
      api.get(`/workspaces/${selectedWs.id}/members`)
        .then(res => {
          const memberList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
          setMembers(memberList);
        })
        .catch(err => {
          setToast({ message: 'Ошибка загрузки участников: ' + (err.response?.data?.message || err.message), type: 'error' });
        })
        .finally(() => {
          setLoadingMembers(false);
        });
    } else {
      setMembers([]);
    }
  }, [selectedWs]);

  // Создание
  const handleCreate = async (data) => {
    try {
      await api.post('/workspaces', { name: data.name, code: data.code });
      fetchWorkspaces();
      setToast({ message: 'Пространство создано', type: 'success' });
    } catch (err) {
      setToast({ message: 'Не удалось создать: ' + (err.response?.data?.message || err.message), type: 'error' });
    }
  };

  // Удаление пространства (открывает модалку)
  const handleDeleteWorkspace = (id, name) => {
    setConfirmAction({ type: 'workspace', id, name });
  };

  // Удаление участника (открывает модалку)
  const handleRemoveMember = (userId, login) => {
    setConfirmAction({ type: 'member', id: userId, name: login });
  };

  // Подтверждение действия
  const confirmActionHandler = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction.type === 'workspace') {
        await api.delete(`/workspaces/${confirmAction.id}`);
        if (selectedWs?.id === confirmAction.id) setSelectedWs(null);
        fetchWorkspaces();
        setToast({ message: 'Пространство удалено', type: 'success' });
      } else if (confirmAction.type === 'member') {
        await api.delete(`/workspaces/${selectedWs.id}/members/${confirmAction.id}`);
        setMembers(prev => prev.filter(m => (m.userId || m.user?.id) !== confirmAction.id));
        setToast({ message: 'Участник удален', type: 'success' });
      }
    } catch (err) {
      setToast({ message: 'Ошибка удаления: ' + (err.response?.data?.message || err.message), type: 'error' });
    } finally {
      setConfirmAction(null);
    }
  };

  // Поиск пользователей
  const handleSearchUsers = async () => {
    if (!searchLogin.trim()) return;
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
        setToast({ message: 'Ошибка поиска: ' + (e.response?.data?.message || e.message), type: 'error' });
      }
    }
  };

  // Добавление участника
  const handleAddMember = async () => {
    if (!selectedUser || !selectedWs) return;
    try {
      await api.post(`/workspaces/${selectedWs.id}/members`, {
        userId: selectedUser.id,
        role: selectedRole
      });
      setToast({ message: `Пользователь ${selectedUser.login} добавлен как ${selectedRole}`, type: 'success' });
      setFoundUsers([]);
      setSelectedUser(null);
      setSearchLogin('');
      
      const res = await api.get(`/workspaces/${selectedWs.id}/members`);
      setMembers(Array.isArray(res.data) ? res.data : (res.data?.data || []));
    } catch (err) {
      setToast({ message: 'Ошибка добавления: ' + (err.response?.data?.message || err.message), type: 'error' });
    }
  };

  // Смена роли
  const handleRoleChange = async (userId, newRole) => {
    if (!selectedWs) return;
    try {
      await api.patch(`/workspaces/${selectedWs.id}/members/${userId}`, { role: newRole });
      setMembers(prev => prev.map(m => {
        const mId = m.userId || m.user?.id;
        return mId === userId ? { ...m, role: newRole } : m;
      }));
      setToast({ message: 'Роль изменена', type: 'success' });
    } catch (err) {
      setToast({ message: 'Ошибка смены роли: ' + (err.response?.data?.message || err.message), type: 'error' });
    }
  };

  if (loading) return <div className={styles.container}>Загрузка...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Мои рабочие пространства</h2>
        <Link to="/profile" className={styles.profileLink}>
          Профиль
        </Link>
      </div>

      <WorkspaceForm onCreate={handleCreate} />

      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
          <h3 className={styles.listTitle}>Список ({workspaces.length})</h3>
          <div className={styles.cardsList}>
            {workspaces.map((ws) => (
              <WorkspaceCard
                key={ws.id}
                workspace={ws}
                isSelected={selectedWs?.id === ws.id}
                onClick={() => setSelectedWs(ws)}
                onDelete={() => handleDeleteWorkspace(ws.id, ws.name)}
              />
            ))}
            {workspaces.length === 0 && <p className={styles.emptyMessage}>Нет пространств. Создайте первое!</p>}
          </div>
        </div>

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

                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  <h4>Текущие участники:</h4>
                  {loadingMembers ? (
                    <p>Загрузка...</p>
                  ) : members.length > 0 ? (
                    members.map(member => {
                      const memberId = member.userId || member.user?.id;
                      const memberLogin = member.user?.login || member.login || 'Пользователь';
                      const currentRole = member.role || 'EDITOR';
                      
                      return (
                        <div key={memberId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #eee', gap: '10px' }}>
                          <span style={{ flex: 1 }}>{memberLogin}</span>
                          <select 
                            value={currentRole} 
                            onChange={(e) => handleRoleChange(memberId, e.target.value)}
                            className={styles.roleSelect}
                            style={{ maxWidth: '130px', padding: '5px' }}
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="EDITOR">EDITOR</option>
                            <option value="EXECUTOR">EXECUTOR</option>
                            <option value="OBSERVER">OBSERVER</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(memberId, memberLogin)}
                            style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                          >
                            Удалить
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p>Нет участников.</p>
                  )}
                </div>

                <div className={styles.searchBox}>
                  <input
                    type="text"
                    placeholder="Логин пользователя"
                    value={searchLogin}
                    onChange={(e) => setSearchLogin(e.target.value)}
                    className={styles.searchInput}
                  />
                  <button onClick={handleSearchUsers} className={styles.searchBtn}>Найти</button>
                </div>

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

                {selectedUser && (
                  <div className={styles.addMemberBox}>
                    <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className={styles.roleSelect}>
                      <option value="ADMIN">ADMIN</option>
                      <option value="EDITOR">EDITOR</option>
                      <option value="EXECUTOR">EXECUTOR</option>
                      <option value="OBSERVER">OBSERVER</option>
                    </select>
                    <button onClick={handleAddMember} className={styles.addMemberBtn}>Добавить</button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className={styles.placeholderText}>Нажмите на карточку, чтобы выбрать пространство.</p>
          )}
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* CONFIRM MODAL */}
      {confirmAction && (
        <ConfirmModal
          message={
            confirmAction.type === 'workspace'
              ? `Удалить пространство "${confirmAction.name}"?`
              : `Удалить участника "${confirmAction.name}" из пространства?`
          }
          onCancel={() => setConfirmAction(null)}
          onConfirm={confirmActionHandler}
        />
      )}
    </div>
  );
}

export default WorkspacesPage;
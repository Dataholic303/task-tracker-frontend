import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import TaskForm from '../../components/Task/TaskForm/TaskForm';
import TaskModal from '../../components/Task/TaskModal/TaskModal';
import { useSSE } from '../../hooks/SSE';
import Toast from '../../components/UI/Toast';

function BoardPage() {
  const { workspaceId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [toast, setToast] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser.role || 'ADMIN'; // <-- РОЛЬ (заглушка)

  useSSE('/notifications/user', (data) => {
    console.log("SSE User Event:", data);
    setToast({ message: data.message || 'Новое уведомление', type: 'info' });
  });

  const fetchTasks = () => {
    api.get(`/workspaces/${workspaceId}/tasks`)
      .then(res => {
        const taskList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setTasks(taskList);
        setLoading(false);
      })
      .catch(err => {
        setError('Ошибка загрузки: ' + (err.response?.data?.message || err.message));
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, [workspaceId]);

  const handleCreateTask = async (taskData) => {
    setError('');
    try {
      await api.post(`/workspaces/${workspaceId}/tasks`, taskData);
      fetchTasks();
    } catch (err) {
      setError('Не удалось создать задачу: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleStatusChange = async (e, taskId, newStatus) => {
    e.stopPropagation();
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      fetchTasks();
    } catch (err) {
      setError('Не удалось изменить статус: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Загрузка задач...</div>;

  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter(t => t.status === 'DONE');

  const renderColumn = (title, taskList, color) => (
    <div style={{ flex: 1, backgroundColor: '#f4f5f7', padding: '15px', borderRadius: '8px', minHeight: '400px' }}>
      <h3 style={{ borderBottom: `2px solid ${color}`, paddingBottom: '10px' }}>
        {title} ({taskList.length})
      </h3>
      {taskList.map(task => (
        <div 
          key={task.id} 
          onClick={() => setSelectedTask(task)}
          style={{ 
            backgroundColor: 'white', 
            padding: '12px', 
            marginBottom: '10px', 
            borderRadius: '5px', 
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer',
            textAlign: 'left'
          }}
        >
          <div style={{ fontWeight: 'bold', color: '#555' }}>
            {task.jiraCode || task.code || `TASK-${task.id}`}
          </div>
          <div style={{ margin: '5px 0', fontSize: '16px' }}>{task.title}</div>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '10px' }}>
            Приоритет: {task.priority || 'MEDIUM'}
          </div>

          {/* Скрываем кнопки для OBSERVER */}
          {userRole !== 'OBSERVER' && (
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {task.status !== 'TODO' && (
                <button onClick={(e) => handleStatusChange(e, task.id, 'TODO')} style={{ fontSize: '12px', padding: '4px 8px', cursor: 'pointer' }}>
                  ← В TODO
                </button>
              )}
              {task.status !== 'IN_PROGRESS' && (
                <button onClick={(e) => handleStatusChange(e, task.id, 'IN_PROGRESS')} style={{ fontSize: '12px', padding: '4px 8px', cursor: 'pointer' }}>
                  ⚙ В Работу
                </button>
              )}
              {task.status !== 'DONE' && (
                <button onClick={(e) => handleStatusChange(e, task.id, 'DONE')} style={{ fontSize: '12px', padding: '4px 8px', cursor: 'pointer' }}>
                  ✓ Выполнено
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <Link to="/workspaces" style={{ display: 'inline-block', marginBottom: '20px' }}>
        ← Назад к пространствам
      </Link>
      <h2>Канбан-доска</h2>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {/* Скрываем форму создания для OBSERVER и EXECUTOR */}
      {userRole !== 'OBSERVER' && userRole !== 'EXECUTOR' && (
        <TaskForm onCreate={handleCreateTask} />
      )}

      <div style={{ display: 'flex', gap: '20px' }}>
        {renderColumn('TODO', todoTasks, '#6c757d')}
        {renderColumn('IN_PROGRESS', inProgressTasks, '#007bff')}
        {renderColumn('DONE', doneTasks, '#28a745')}
      </div>

      {selectedTask && (
        <TaskModal 
          task={selectedTask} 
          onClose={() => setSelectedTask(null)} 
          currentUser={currentUser}
        />
      )}

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

export default BoardPage;
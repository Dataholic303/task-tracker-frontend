import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import TaskForm from '../../components/Task/TaskForm/TaskForm';
import TaskModal from '../../components/Task/TaskModal/TaskModal';
import { useSSE } from '../../hooks/SSE';
import Toast from '../../components/UI/Toast';
import styles from './BoardPage.module.css'; // <-- ИМПОРТ СТИЛЕЙ

function BoardPage() {
  const { workspaceId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [toast, setToast] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser.role || 'ADMIN';

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

  if (loading) return <div className={styles.loading}>Загрузка задач...</div>;

  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter(t => t.status === 'DONE');

  // Функция для отрисовки одной колонки
  const renderColumn = (title, taskList, color) => (
    <div className={styles.column}>
      <h3 className={styles.columnTitle} style={{ borderBottom: `2px solid ${color}` }}>
        {title} ({taskList.length})
      </h3>
      {taskList.map(task => (
        <div
          key={task.id}
          onClick={() => setSelectedTask(task)}
          className={styles.taskCard}
        >
          <div className={styles.taskCode}>
            {task.jiraCode || task.code || `TASK-${task.id}`}
          </div>
          <div className={styles.taskTitle}>{task.title}</div>
          <div className={styles.taskPriority}>
            Приоритет: {task.priority || 'MEDIUM'}
          </div>

          {userRole !== 'OBSERVER' && (
            <div className={styles.statusButtons}>
              {task.status !== 'TODO' && (
                <button onClick={(e) => handleStatusChange(e, task.id, 'TODO')}>
                  ← В TODO
                </button>
              )}
              {task.status !== 'IN_PROGRESS' && (
                <button onClick={(e) => handleStatusChange(e, task.id, 'IN_PROGRESS')}>
                  ⚙ В Работу
                </button>
              )}
              {task.status !== 'DONE' && (
                <button onClick={(e) => handleStatusChange(e, task.id, 'DONE')}>
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
    <div className={styles.container}>
      <Link to="/workspaces" className={styles.backLink}>
        ← Назад к пространствам
      </Link>
      <h2 className={styles.title}>Канбан-доска</h2>

      {error && <p className={styles.error}>{error}</p>}

      {userRole !== 'OBSERVER' && userRole !== 'EXECUTOR' && (
        <TaskForm onCreate={handleCreateTask} />
      )}

      <div className={styles.columnsWrapper}>
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
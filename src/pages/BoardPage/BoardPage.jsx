import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';
import TaskForm from '../../components/Task/TaskForm/TaskForm';
import TaskModal from '../../components/Task/TaskModal/TaskModal';
import { useSSE } from '../../hooks/SSE';
import Toast from '../../components/UI/Toast';
import styles from './BoardPage.module.css';

// Сортировка задач по исполнителям
const sortTasksByAssignee = (taskList) => {
  return [...taskList].sort((a, b) => {
    const aAssignee = a.assignee?.login || a.assigneeId || '';
    const bAssignee = b.assignee?.login || b.assigneeId || '';

    // Задачи без исполнителя помещаем в конец
    if (!aAssignee && bAssignee) return 1;
    if (aAssignee && !bAssignee) return -1;

    // Сортировка по логину исполнителя
    return aAssignee.localeCompare(bAssignee, 'ru', {
      sensitivity: 'base'
    });
  });
};

function BoardPage() {
  const { workspaceId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [toast, setToast] = useState(null);

  // Состояния для Drag and Drop между колонками
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser.role || 'ADMIN';

  useSSE('/notifications/user', (data) => {
    console.log("SSE User Event:", data);
    setToast({
      message: data.message || 'Новое уведомление',
      type: 'info'
    });
  });

  // Загрузка задач с сервера
  const fetchTasks = () => {
    return api.get(`/workspaces/${workspaceId}/tasks`)
      .then(res => {
        const taskList = Array.isArray(res.data)
          ? res.data
          : (res.data?.data || []);

        setTasks(taskList);

        // Обновляем открытую задачу в модальном окне
        setSelectedTask(currentTask => {
          if (!currentTask) return null;

          return taskList.find(
            task => task.id === currentTask.id
          ) || currentTask;
        });

        setLoading(false);

        return taskList;
      })
      .catch(err => {
        setError(
          'Ошибка загрузки: ' +
          (err.response?.data?.message || err.message)
        );
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTasks();
  }, [workspaceId]);

  // Создание задачи
  const handleCreateTask = async (taskData) => {
    setError('');

    try {
      await api.post(`/workspaces/${workspaceId}/tasks`, taskData);
      await fetchTasks();
    } catch (err) {
      setError(
        'Не удалось создать задачу: ' +
        (err.response?.data?.message || err.message)
      );
    }
  };

  // Общая функция изменения статуса задачи
  const updateTaskStatus = async (taskId, newStatus) => {
    setError('');

    try {
      await api.patch(`/tasks/${taskId}`, {
        status: newStatus
      });

      await fetchTasks();
    } catch (err) {
      setError(
        'Не удалось изменить статус: ' +
        (err.response?.data?.message || err.message)
      );
    }
  };

  // Изменение статуса через кнопки
  const handleStatusChange = async (e, taskId, newStatus) => {
    e.stopPropagation();
    await updateTaskStatus(taskId, newStatus);
  };

  // Начало перетаскивания
  const handleDragStart = (e, taskId) => {
    if (userRole === 'OBSERVER') {
      e.preventDefault();
      return;
    }

    e.dataTransfer.setData('text/plain', String(taskId));
    e.dataTransfer.effectAllowed = 'move';

    setDraggedTaskId(taskId);
  };

  // Перетаскивание над колонкой
  const handleDragOver = (e, status) => {
    if (userRole === 'OBSERVER') return;

    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    setDragOverStatus(status);
  };

  // Отпускание задачи в другой колонке
  const handleDrop = async (e, newStatus) => {
    e.preventDefault();

    setDragOverStatus(null);

    if (userRole === 'OBSERVER') return;

    const draggedId = e.dataTransfer.getData('text/plain');

    setDraggedTaskId(null);

    if (!draggedId) return;

    const task = tasks.find(
      t => String(t.id) === draggedId
    );

    if (!task || task.status === newStatus) return;

    await updateTaskStatus(task.id, newStatus);
  };

  // Отрисовка одной колонки
  const renderColumn = (title, taskList, color, status) => (
    <div
      className={`${styles.column} ${dragOverStatus === status ? styles.dragOver : ''}`}
      onDragOver={(e) => handleDragOver(e, status)}
      onDrop={(e) => handleDrop(e, status)}
    >
      <h3
        className={styles.columnTitle}
        style={{ borderBottom: `2px solid ${color}` }}
      >
        {title} ({taskList.length})
      </h3>

      {sortTasksByAssignee(taskList).map(task => (
        <div
          key={task.id}
          draggable={userRole !== 'OBSERVER'}
          onDragStart={(e) => handleDragStart(e, task.id)}
          onDragEnd={() => {
            setDraggedTaskId(null);
            setDragOverStatus(null);
          }}
          onClick={() => setSelectedTask(task)}
          className={`${styles.taskCard} ${draggedTaskId === task.id ? styles.dragging : ''}`}
        >
          <div className={styles.taskCode}>
            {task.jiraCode || task.code || `TASK-${task.id}`}
          </div>

          <div className={styles.taskTitle}>
            {task.title}
          </div>

          <div className={styles.taskPriority}>
            Приоритет: {task.priority || 'MEDIUM'}
          </div>

          {/* Информация об исполнителе */}
          <div className={styles.taskAssignee}>
            <strong>Исполнитель:</strong>{' '}
            {task.assignee?.login || 'Не назначен'}
          </div>

          {userRole !== 'OBSERVER' && (
            <div className={styles.statusButtons}>
              {task.status !== 'TODO' && (
                <button
                  onClick={(e) =>
                    handleStatusChange(e, task.id, 'TODO')
                  }
                >
                  ← В TODO
                </button>
              )}

              {task.status !== 'IN_PROGRESS' && (
                <button
                  onClick={(e) =>
                    handleStatusChange(e, task.id, 'IN_PROGRESS')
                  }
                >
                  ⚙ В Работу
                </button>
              )}

              {task.status !== 'DONE' && (
                <button
                  onClick={(e) =>
                    handleStatusChange(e, task.id, 'DONE')
                  }
                >
                  ✓ Выполнено
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className={styles.loading}>
        Загрузка задач...
      </div>
    );
  }

  const todoTasks = tasks.filter(t => t.status === 'TODO');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');
  const doneTasks = tasks.filter(t => t.status === 'DONE');

  return (
    <div className={styles.container}>
      <Link to="/workspaces" className={styles.backLink}>
        ← Назад к пространствам
      </Link>

      <h2 className={styles.title}>
        Канбан-доска
      </h2>

      {error && (
        <p className={styles.error}>{error}</p>
      )}

      {userRole !== 'OBSERVER' && userRole !== 'EXECUTOR' && (
        <TaskForm onCreate={handleCreateTask} />
      )}

      <div className={styles.columnsWrapper}>
        {renderColumn('TODO', todoTasks, '#6c757d', 'TODO')}
        {renderColumn('IN_PROGRESS', inProgressTasks, '#007bff', 'IN_PROGRESS')}
        {renderColumn('DONE', doneTasks, '#28a745', 'DONE')}
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          currentUser={currentUser}
          onTaskUpdated={fetchTasks}
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

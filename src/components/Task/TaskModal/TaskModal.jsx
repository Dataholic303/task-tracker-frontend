import { useEffect, useState } from "react";
import api from "../../../api";
import CommentItem from "../../Comment/CommentItem";
import styles from "./TaskModal.module.css";

function TaskModal({ task, onClose, currentUser, onTaskUpdated }) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [replyToName, setReplyToName] = useState('');

  // Состояния для редактирования задачи
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editPriority, setEditPriority] = useState(task.priority || 'MEDIUM');
  const [editError, setEditError] = useState('');

  // Состояния для назначения исполнителя
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState(task.assigneeId || '');
  const [assigneeError, setAssigneeError] = useState('');
  const [assigneeMessage, setAssigneeMessage] = useState('');
  const [savingAssignee, setSavingAssignee] = useState(false);

  const userRole = currentUser?.role || 'ADMIN';
  const canEdit = userRole === 'ADMIN' || userRole === 'EDITOR';
  const canAssign = ['ADMIN', 'EDITOR', 'EXECUTOR'].includes(userRole);

  // Получение участников текущего пространства
  useEffect(() => {
    let cancelled = false;

    const fetchMembers = async () => {
      setLoadingMembers(true);
      setAssigneeError('');
      setMembers([]);

      try {
        const res = await api.get(`/workspaces/${task.workspaceId}/members`);

        const memberList = Array.isArray(res.data)
          ? res.data
          : (res.data?.data || []);

        if (!cancelled) {
          setMembers(memberList);
        }
      } catch (err) {
        if (!cancelled) {
          setAssigneeError(
            'Ошибка загрузки участников: ' +
            (err.response?.data?.message || err.message)
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingMembers(false);
        }
      }
    };

    fetchMembers();

    return () => {
      cancelled = true;
    };
  }, [task.workspaceId]);

  // Обновление выбранного исполнителя при изменении задачи
  useEffect(() => {
    setSelectedAssigneeId(task.assigneeId || '');
  }, [task.id, task.assigneeId]);

  // Загрузка комментариев
  useEffect(() => {
    setLoadingComments(true);

    api.get(`/tasks/${task.id}/comments/tree`)
      .then(res => {
        setComments(res.data);
        setLoadingComments(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingComments(false);
      });
  }, [task.id]);

  // Сохранение изменений задачи
  const handleSaveEdit = async () => {
    setEditError('');

    try {
      await api.patch(`/tasks/${task.id}`, {
        title: editTitle,
        description: editDescription,
        priority: editPriority
      });

      setIsEditing(false);

      if (onTaskUpdated) {
        await onTaskUpdated();
      }
    } catch (err) {
      setEditError(
        'Ошибка сохранения: ' +
        (err.response?.data?.message || err.message)
      );
    }
  };

  // Назначение, изменение или снятие исполнителя
  const handleSaveAssignee = async () => {
    const newAssigneeId = selectedAssigneeId || null;
    const currentAssigneeId = task.assigneeId || null;

    if (newAssigneeId === currentAssigneeId) {
      return;
    }

    setAssigneeError('');
    setAssigneeMessage('');
    setSavingAssignee(true);

    try {
      await api.patch(`/tasks/${task.id}`, {
        assigneeId: newAssigneeId
      });

      // Обновляем данные задачи и канбан-доску
      if (onTaskUpdated) {
        await onTaskUpdated();
      }

      setAssigneeMessage(
        newAssigneeId
          ? 'Исполнитель успешно обновлён.'
          : 'Назначение исполнителя снято.'
      );
    } catch (err) {
      setAssigneeError(
        'Не удалось изменить исполнителя: ' +
        (err.response?.data?.message || err.message)
      );
    } finally {
      setSavingAssignee(false);
    }
  };

  // Отправка комментария
  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const payload = { content: newComment };

    if (replyToId) {
      payload.parentId = replyToId;
    }

    try {
      await api.post(`/tasks/${task.id}/comments`, payload);

      setNewComment('');
      setReplyToId(null);
      setReplyToName('');

      const res = await api.get(`/tasks/${task.id}/comments/tree`);
      setComments(res.data);
    } catch (err) {
      alert('Ошибка отправки: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReply = (commentId, authorName) => {
    setReplyToId(commentId);
    setReplyToName(authorName);
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Удалить этот комментарий?')) return;

    try {
      await api.delete(`/comments/${commentId}`);

      const res = await api.get(`/tasks/${task.id}/comments/tree`);
      setComments(res.data);
    } catch (err) {
      alert('Ошибка удаления: ' + (err.response?.data?.message || err.message));
    }
  };

  // Сортировка участников по логину
  const sortedMembers = [...members].sort((a, b) => {
    const loginA = a.user?.login || '';
    const loginB = b.user?.login || '';

    return loginA.localeCompare(loginB, 'ru');
  });

  // Проверяем, есть ли текущий исполнитель среди участников
  const currentAssigneeInMembers = members.some(
    member =>
      String(member.userId || member.user?.id) === String(task.assigneeId)
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          ✖
        </button>

        <h2>{task.jiraCode || task.code}</h2>

        {isEditing ? (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label><strong>Название:</strong></label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '4px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label><strong>Описание:</strong></label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '4px',
                  minHeight: '60px',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label><strong>Приоритет:</strong></label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '4px'
                }}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            {editError && (
              <p className={styles.assigneeError}>{editError}</p>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleSaveEdit}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Сохранить
              </button>

              <button
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ccc',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3>{task.title}</h3>
            <p>
              <strong>Описание:</strong> {task.description || 'Нет описания'}
            </p>
            <p><strong>Приоритет:</strong> {task.priority}</p>

            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '4px 8px',
                  backgroundColor: '#19a82c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginBottom: '10px',
                  marginTop: '10px'
                }}
              >
                ✎ Редактировать
              </button>
            )}
          </div>
        )}

        {/* Блок назначения исполнителя */}
        <div className={styles.assigneeSection}>
          <h4 className={styles.assigneeTitle}>
            Исполнитель задачи
          </h4>

          <p className={styles.currentAssignee}>
            <strong>Текущий исполнитель:</strong>{' '}
            {task.assignee?.login || 'Не назначен'}
          </p>

          {canAssign ? (
            <>
              {loadingMembers ? (
                <p>Загрузка участников...</p>
              ) : (
                <>
                  <label
                    htmlFor="taskAssignee"
                    className={styles.assigneeLabel}
                  >
                    Выберите исполнителя:
                  </label>

                  <select
                    id="taskAssignee"
                    className={styles.assigneeSelect}
                    value={selectedAssigneeId}
                    onChange={(e) => {
                      setSelectedAssigneeId(e.target.value);
                      setAssigneeError('');
                      setAssigneeMessage('');
                    }}
                  >
                    <option value="">Не назначен</option>

                    {task.assigneeId && !currentAssigneeInMembers && (
                      <option value={task.assigneeId}>
                        {task.assignee?.login || 'Текущий исполнитель'}
                        {' '}(не в списке участников)
                      </option>
                    )}

                    {sortedMembers.map(member => {
                      const memberId = member.userId || member.user?.id;

                      return (
                        <option key={memberId} value={memberId}>
                          {member.user?.login || 'Без логина'}
                          {' '}({member.role})
                        </option>
                      );
                    })}
                  </select>

                  {members.length === 0 && (
                    <p className={styles.assigneeError}>
                      В этом пространстве нет участников.
                    </p>
                  )}

                  <button
                    type="button"
                    className={styles.assigneeButton}
                    onClick={handleSaveAssignee}
                    disabled={
                      savingAssignee ||
                      selectedAssigneeId === (task.assigneeId || '')
                    }
                  >
                    {savingAssignee
                      ? 'Сохранение...'
                      : 'Сохранить исполнителя'}
                  </button>
                </>
              )}
            </>
          ) : (
            <p>Изменение исполнителя недоступно для вашей роли.</p>
          )}

          {assigneeError && (
            <p className={styles.assigneeError}>
              {assigneeError}
            </p>
          )}

          {assigneeMessage && (
            <p className={styles.assigneeSuccess}>
              {assigneeMessage}
            </p>
          )}
        </div>

        <hr />

        <h4>Комментарии ({comments.length})</h4>

        <div className={styles.commentsList}>
          {loadingComments ? (
            <p>Загрузка комментариев...</p>
          ) : comments.length === 0 ? (
            <p>Комментариев пока нет.</p>
          ) : (
            comments.map(c => (
              <CommentItem
                key={c.id}
                comment={c}
                onReply={handleReply}
                onDelete={handleDeleteComment}
                currentUser={currentUser}
              />
            ))
          )}
        </div>

        <form
          onSubmit={handleSendComment}
          className={styles.commentForm}
        >
          {replyToId && (
            <div className={styles.replyBanner}>
              <span>
                Ответ на комментарий от <strong>{replyToName}</strong>
              </span>

              <button
                type="button"
                onClick={() => {
                  setReplyToId(null);
                  setReplyToName('');
                }}
              >
                ✖ Отменить
              </button>
            </div>
          )}

          <textarea
            placeholder={
              replyToId
                ? `Ответ ${replyToName}...`
                : "Напишите комментарий..."
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />

          <button type="submit">Отправить</button>
        </form>
      </div>
    </div>
  );
}

export default TaskModal;

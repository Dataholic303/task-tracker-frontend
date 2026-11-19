import { useEffect, useState } from "react";
import api from "../../../api";
import CommentItem from "../../Comment/CommentItem";
import styles from "./TaskModal.module.css";

function TaskModal({ task, onClose, currentUser }) {
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyToId, setReplyToId] = useState(null);
  const [replyToName, setReplyToName] = useState('');

  // === СОСТОЯНИЯ ДЛЯ РЕДАКТИРОВАНИЯ ===
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description || '');
  const [editPriority, setEditPriority] = useState(task.priority || 'MEDIUM');
  const [editError, setEditError] = useState('');

  // Проверяем, может ли пользователь редактировать (ADMIN или EDITOR)
  const userRole = currentUser?.role || 'ADMIN';
  const canEdit = userRole === 'ADMIN' || userRole === 'EDITOR';

  useEffect(() => {
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

  // === ФУНКЦИЯ СОХРАНЕНИЯ ИЗМЕНЕНИЙ ===
  const handleSaveEdit = async () => {
    setEditError('');
    try {
      await api.patch(`/tasks/${task.id}`, {
        title: editTitle,
        description: editDescription,
        priority: editPriority
      });
      // Обновляем задачу локально (чтобы интерфейс сразу изменился)
      task.title = editTitle;
      task.description = editDescription;
      task.priority = editPriority;
      setIsEditing(false);
    } catch (err) {
      setEditError('Ошибка сохранения: ' + (err.response?.data?.message || err.message));
    }
  };

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

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>✖</button>

        <h2>{task.jiraCode || task.code}</h2>

        {isEditing ? (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label><strong>Название:</strong></label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label><strong>Описание:</strong></label>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '4px', minHeight: '60px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label><strong>Приоритет:</strong></label>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '4px' }}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
            {editError && <p style={{ color: 'red' }}>{editError}</p>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={handleSaveEdit} style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Сохранить
              </button>
              <button onClick={() => setIsEditing(false)} style={{ padding: '8px 16px', backgroundColor: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3>{task.title}</h3>
            <p><strong>Описание:</strong> {task.description || 'Нет описания'}</p>
            <p><strong>Приоритет:</strong> {task.priority}</p>
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                style={{ padding: '6px 14px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginBottom: '10px' }}
              >
                ✎ Редактировать
              </button>
            )}
          </div>
        )}

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

        <form onSubmit={handleSendComment} className={styles.commentForm}>
          {replyToId && (
            <div className={styles.replyBanner}>
              <span>Ответ на комментарий от <strong>{replyToName}</strong></span>
              <button type="button" onClick={() => { setReplyToId(null); setReplyToName(''); }}>
                ✖ Отменить
              </button>
            </div>
          )}
          <textarea
            placeholder={replyToId ? `Ответ ${replyToName}...` : "Напишите комментарий..."}
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
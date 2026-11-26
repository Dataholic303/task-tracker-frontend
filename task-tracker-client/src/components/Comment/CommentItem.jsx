import { useState } from 'react';
import styles from './CommentItem.module.css';

function CommentItem({ comment, onReply, onDelete, currentUser }) {
  const [showReplies, setShowReplies] = useState(false); // <-- Состояние для вкладки
  const isAuthor = currentUser?.id === comment.authorId || currentUser?.id === comment.author?.id;

  return (
    <div className={styles.commentBox}>
      <div className={styles.header}>
        <div className={styles.authorBlock}>
          <img 
            src={`/users/${comment.authorId}/avatar`} 
            alt="avatar" 
            className={styles.avatar}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <strong>{comment.author?.login || 'Пользователь'}</strong>
        </div>
        <span className={styles.date}>
          {new Date(comment.createdAt).toLocaleString()}
        </span>
      </div>

      {/* Пометка, если это ответ */}
      {comment.parentId && (
        <div className={styles.replyLabel}>
          Ответ на комментарий
        </div>
      )}

      <div className={styles.text}>{comment.content || comment.text}</div>

      <div className={styles.actions}>
        <button className={styles.replyBtn} onClick={() => onReply(comment.id, comment.author?.login)}>
          Ответить
        </button>
        {isAuthor && (
          <button 
            className={`${styles.replyBtn} ${styles.deleteBtn}`}
            onClick={() => onDelete(comment.id)}
          >
            Удалить
          </button>
        )}
      </div>

      {/* Вкладка для показа/скрытия ответов */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          <button 
            className={styles.toggleRepliesBtn}
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? 'Скрыть ответы' : `Показать ответы (${comment.replies.length})`}
          </button>

          {showReplies && (
            <div className={styles.replies}>
              {comment.replies.map(reply => (
                <CommentItem 
                  key={reply.id} 
                  comment={reply} 
                  onReply={onReply} 
                  onDelete={onDelete} 
                  currentUser={currentUser} 
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CommentItem;
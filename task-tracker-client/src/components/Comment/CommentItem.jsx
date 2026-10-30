import styles from './CommentItem.module.css'; 

function CommentItem({ comment, onReply, onDelete, currentUser }) {
  // Проверяем, автор ли текущий пользователь
  const isAuthor = currentUser?.id === comment.authorId || currentUser?.id === comment.author?.id;

  return (
    <div className={styles.commentBox}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Аватарка  */}
          <img 
            src={`/users/${comment.authorId}/avatar`} 
            alt="avatar" 
            style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover', backgroundColor: '#eee' }}
            onError={(e) => { e.target.style.display = 'none'; }} // Скрываем при ошибке
          />
          <strong>{comment.author?.login || 'Пользователь'}</strong>
        </div>
        <span className={styles.date}>
          {new Date(comment.createdAt).toLocaleString()}
        </span>
      </div>

      <div className={styles.text}>{comment.content || comment.text}</div>

      <div style={{ display: 'flex', gap: '15px', marginTop: '5px' }}>
        <button className={styles.replyBtn} onClick={() => onReply(comment.id, comment.author?.login)}>
          Ответить
        </button>
        {isAuthor && (
          <button 
            className={styles.replyBtn} 
            style={{ color: '#d9534f' }} 
            onClick={() => onDelete(comment.id)}
          >
            Удалить
          </button>
        )}
      </div>

      {comment.replies && comment.replies.length > 0 && (
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
  );
}

export default CommentItem;
import styles from "./WorkspaceCard.module.css";

function WorkspaceCard({ workspace, isSelected, onClick, onDelete }) {
  return (
    <div 
      className={`${styles.card} ${isSelected ? styles.selected : ''}`}
      onClick={onClick}
    >
      <div className={styles.info}>
        <strong className={styles.name}>{workspace.name}</strong>
        <span className={styles.code}>Код: {workspace.code}</span>
      </div>
      <button 
        className={styles.deleteBtn}
        onClick={(e) => {
          e.stopPropagation(); 
          onDelete(workspace.id);
        }}
        title="Удалить"
      >
        ✖
      </button>
    </div>
  );
}

export default WorkspaceCard;
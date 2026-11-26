import styles from './ConfirmModal.module.css';

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <p className={styles.message}>{message}</p>
        <div className={styles.buttons}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Отмена
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
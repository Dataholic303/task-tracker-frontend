import { useEffect } from 'react';
import styles from './Toast.module.css';

function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // Иконки заменены на строгие символы
  const icons = {
    info: 'i',
    success: '✓',
    warning: '!',
    error: '✕'
  };

  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <span className={styles.icon}>{icons[type] || icons.info}</span>
      <span className={styles.message}>{message}</span>
      <button className={styles.closeBtn} onClick={onClose}>✖</button>
    </div>
  );
}

export default Toast;
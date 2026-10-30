import { useState } from 'react';
import styles from './TaskForm.module.css';

function TaskForm({ onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM'); 

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Передаем данные в BoardPage
    onCreate({ title, description, priority });
    
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input 
        type="text" 
        placeholder="Название задачи" 
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={styles.input}
        required
      />
      <input 
        type="text" 
        placeholder="Описание (необязательно)" 
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className={styles.input}
      />
      <select 
        value={priority} 
        onChange={(e) => setPriority(e.target.value)}
        className={styles.select}
      >
        <option value="LOW">Низкий (LOW)</option>
        <option value="MEDIUM">Средний (MEDIUM)</option>
        <option value="HIGH">Высокий (HIGH)</option>
        <option value="CRITICAL">Критический (CRITICAL)</option>
      </select>
      <button type="submit" className={styles.button}>
        + Создать задачу
      </button>
    </form>
  );
}

export default TaskForm;
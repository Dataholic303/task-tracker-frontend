import { useState } from 'react';
import styles from './TaskForm.module.css';

function TaskForm({ onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('MEDIUM'); 
  
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Название задачи обязательно для заполнения!');
      return; 
    }

    setError('');

    onCreate({ title, description, priority });
    
    setTitle('');
    setDescription('');
    setPriority('MEDIUM');
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form} noValidate>
      
      <div className={styles.inputGroup}>
        <input 
          type="text" 
          placeholder="Название задачи" 
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (error) setError(''); 
          }}
          className={`${styles.input} ${error ? styles.inputError : ''}`} 
        />
        {error && <span className={styles.errorText}>{error}</span>}
      </div>

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

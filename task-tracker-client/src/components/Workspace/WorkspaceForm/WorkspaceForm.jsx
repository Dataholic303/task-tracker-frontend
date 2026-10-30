import { useState } from 'react';
import styles from './WorkspaceForm.module.css';

function WorkspaceForm({ onCreate }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState(''); // <-- Добавили состояние для кода

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    
    // Передаем наверх объект с name и code
    onCreate({ name, code: code.toUpperCase() });
    
    setName('');
    setCode('');
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <input 
        type="text" 
        placeholder="Название пространства" 
        value={name}
        onChange={(e) => setName(e.target.value)}
        className={styles.input}
      />
      {/* Добавили поле для кода */}
      <input 
        type="text" 
        placeholder="Код (например, WEB)" 
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())} // Автоматически верхний регистр
        maxLength={5} // Ограничение длины
        className={styles.input}
        style={{ maxWidth: '150px' }}
      />
      <button type="submit" className={styles.button}>
        + Создать
      </button>
    </form>
  );
}

export default WorkspaceForm;
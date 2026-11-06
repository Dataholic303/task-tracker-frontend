import { useState } from 'react';
import styles from '../WorkspaceForm/WorkspaceForm.module.css';

function WorkspaceForm({ onCreate }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    
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
      <input 
        type="text" 
        placeholder="Код (например, WEB)" 
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        maxLength={5}
        className={`${styles.input} ${styles.codeInput}`} // <-- Два класса
      />
      <button type="submit" className={styles.button}>
        + Создать
      </button>
    </form>
  );
}

export default WorkspaceForm;
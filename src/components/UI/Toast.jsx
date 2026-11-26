import { useEffect } from 'react';

function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000); 
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    info: '#007bff',
    success: '#28a745',
    warning: '#ffc107',
    error: '#dc3545'
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: 'white',
      borderLeft: `5px solid ${colors[type] || colors.info}`,
      padding: '15px 20px',
      borderRadius: '4px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 2000,
      animation: 'slideIn 0.3s ease-out',
      maxWidth: '300px',
      fontSize: '14px'
    }}>
      {message}
    </div>
  );
}

export default Toast;
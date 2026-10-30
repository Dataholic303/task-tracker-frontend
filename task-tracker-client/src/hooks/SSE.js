import { useEffect, useRef } from 'react';

/**
 * Хук для подключения к SSE-каналу.
 * @param {string} url - Адрес SSE (например, `/notifications/task/123`)
 * @param {function} onMessage - Функция, которая вызывается при получении события
 */
export function useSSE(url, onMessage) {
  const onMessageRef = useRef(onMessage);

  // Обновляем ссылку на функцию, чтобы useEffect не перезапускался при каждом рендере
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (!url) return;

    // Важно: EventSource не поддерживает с withCredentials напрямую в конструкторе,
    // но в браузере куки отправляются автоматически для same-origin.
    // Так как у нас прокси Vite, адрес будет относительным.
    const eventSource = new EventSource(url, { withCredentials: true });

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessageRef.current(data);
      } catch (e) {
        console.error("Ошибка парсинга SSE:", e);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [url]);
}
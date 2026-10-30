# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.



# Task Tracker — Frontend

Клиентская часть системы управления задачами (аналог Jira/Trello). 
Написана на React + Vite. Общается с удаленным бэкендом (NestJS) через REST API и Server-Sent Events (SSE).

## За что отвечает фронтенд
- Отображение интерфейса: страницы входа, регистрации, список пространств, Канбан-доска, модальное окно задачи, профиль.
- Отправка HTTP-запросов к API (создание, чтение, редактирование, удаление данных).
- Работа с HttpOnly Cookies (через `withCredentials: true`).
- Живые уведомления через SSE (подписка на события сервера).
- Ролевая модель (скрытие/показ кнопок в зависимости от роли пользователя).



## Структура проекта
task-tracker-client/
├── public/ # Статические файлы (иконки, favicon)
├── src/ # Исходный код
│ ├── assets/ # Изображения, шрифты (если есть)
│ ├── components/ # Переиспользуемые компоненты
│ │ ├── Comment/ # Комментарии
│ │ ├── Task/ # Задачи
│ │ ├── UI/ # Общие UI-элементы
│ │ └── Workspace/ # Пространства
│ ├── hooks/ # Кастомные хуки
│ ├── pages/ # Страницы (роуты)
│ ├── utils/ # Вспомогательные функции
│ ├── api.js # Настройка Axios
│ ├── App.jsx # Главный роутер
│ ├── App.css # Глобальные стили
│ ├── index.css # Сброс стилей, базовые стили
│ └── main.jsx # Точка входа (ReactDOM.render)
├── index.html # HTML-шаблон
├── vite.config.js # Конфигурация Vite (прокси)
├── package.json # Зависимости и скрипты
└── README.md # Этот файл



## Подробно по папкам и файлам

### Корень проекта
- **`index.html`** — единственный HTML-файл. Сюда Vite подключает React.
- **`vite.config.js`** — настройка сборщика Vite. Здесь настроен **прокси**: запросы на `/api`, `/users` и `/notifications` перенаправляются на удаленный бэкенд (`http://94.228.121.160`), чтобы обойти CORS и передавать куки.
- **`package.json`** — список зависимостей (React, Axios, React Router) и скриптов (`npm run dev`, `npm run build`).

### `src/` — исходный код
- **`main.jsx`** — точка входа. Оборачивает `<App />` в `<BrowserRouter>` (для роутинга) и рендерит в DOM.
- **`App.jsx`** — центральный файл маршрутизации. Здесь прописаны все пути (`/login`, `/register`, `/workspaces`, `/workspaces/:workspaceId`, `/profile`).
- **`api.js`** — создает настроенный экземпляр Axios:
  - `baseURL: '/api'` — все запросы идут через прокси.
  - `withCredentials: true` — разрешает отправку HttpOnly Cookies (авторизация).
- **`index.css`** — глобальные стили (сброс отступов, шрифты).

### `src/pages/` — страницы (каждая соответствует маршруту)
- **`LoginPage/`** — форма входа. Отправляет `POST /auth/login`, сохраняет данные пользователя в `localStorage` и переходит на `/workspaces`.
- **`RegisterPage/`** — форма регистрации. Отправляет `POST /auth/register` и перенаправляет на вход.
- **`WorkspacesPage/`** — список пространств. Здесь можно:
  - Создать пространство (с названием и кодом).
  - Удалить пространство.
  - Выбрать пространство и посмотреть детали.
  - Управлять участниками (поиск по логину, добавление, выбор роли).
  - Перейти на Канбан-доску.
- **`BoardPage/`** — Канбан-доска. Загружает задачи (`GET /workspaces/:id/tasks`), делит их на три колонки (TODO, IN_PROGRESS, DONE). Здесь же:
  - Форма создания задачи.
  - Кнопки смены статуса (скрыты для роли `OBSERVER`).
  - Подключение SSE для уведомлений.
  - Открытие модального окна задачи.
- **`ProfilePage/`** — профиль. Показывает активные сессии (`GET /auth/sessions`), позволяет завершить сессию (`DELETE /auth/sessions/:id`), загрузить аватарку (`PUT /users/me/avatar`) и удалить аккаунт (`DELETE /users/me`).

### `src/components/` — переиспользуемые компоненты
- **`Comment/`**
  - **`CommentItem.jsx`** — один комментарий. Отображает автора, текст, кнопки «Ответить» и «Удалить». Рекурсивно вызывает сам себя для вложенных ответов.
  - **`CommentItem.module.css`** — стили комментария.
- **`Task/`**
  - **`TaskForm/`** — форма создания задачи (название, описание, приоритет).
  - **`TaskModal/`** — модальное окно задачи. Содержит:
    - Просмотр и редактирование задачи (PATCH `/tasks/:id`).
    - Дерево комментариев (`GET /tasks/:id/comments/tree`).
    - Форму добавления комментария (`POST /tasks/:id/comments`).
    - Удаление комментария (`DELETE /comments/:id`).
- **`UI/`**
  - **`Toast.jsx`** — всплывающее уведомление (используется для SSE). Появляется в правом нижнем углу и исчезает через 4 секунды.
- **`Workspace/`**
  - **`WorkspaceCard/`** — карточка пространства (название, код, кнопка удаления). При клике выбирает пространство.
  - **`WorkspaceForm/`** — форма создания пространства (поля «Название» и «Код»).

### `src/hooks/` — кастомные хуки
- **`SSE.js`** — хук для подключения к Server-Sent Events. Принимает URL и колбэк. Автоматически закрывает соединение при размонтировании компонента.

### `src/utils/` — вспомогательные функции
- Здесь могут лежать функции для форматирования дат, перевода статусов и т.п. (сейчас папка может быть пустой).

## Как это работает (кратко)
1. Пользователь заходит на сайт — его перенаправляет на `/login`.
2. После входа сервер устанавливает HttpOnly Cookie (JWT).
3. Все последующие запросы через `api.js` автоматически отправляют эту куку.
4. На странице `/workspaces` можно создать пространство и управлять участниками.
5. При клике на пространство открывается `/workspaces/:id` — Канбан-доска с задачами.
6. Задачи можно создавать, редактировать, перемещать по статусам и комментировать.
7. Изменения в реальном времени приходят через SSE (уведомления в углу экрана).

## Как запустить
1. Установите зависимости: `npm install`
2. Запустите сервер разработки: `npm run dev`
3. Откройте `http://localhost:5173`

> **Важно:** Для работы нужен доступ к удаленному бэкенду (`94.228.121.160`). Если сервер недоступен, запросы будут завершаться ошибкой.

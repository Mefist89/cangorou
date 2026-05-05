# Cangaroo Web — Project Rules (Local Storage Edition)

## Tech Stack

- **Framework:** SvelteKit
- **Graphics Engine:** Phaser.js (ядро исполнителя)
- **Editor:** CodeMirror 6 (умный текстовый ввод)
- **Styling:** Tailwind CSS + shadcn-svelte
- **Storage:** Browser `localStorage` (для сохранения прогресса и настроек)
- **Deployment:** Vercel (Static Hosting)

---

## Architecture & Conventions

### SvelteKit & State Management
- Используй **Svelte Stores** для управления состоянием игры (текущий уровень, позиция кенгуру).
- Все сторы должны автоматически синхронизироваться с `localStorage` через кастомный хук или `subscribe`.
- Компоненты UI должны лежать в `src/lib/components/`.

### Phaser.js Integration
- Игра инициализируется в `onMount` внутри основного Svelte-компонента.
- Взаимодействие между кодом в редакторе и Phaser происходит через шину событий.
- Ассеты кенгуру и тайлов хранятся в `static/assets/`.

### Data Persistence (Local Storage)
- Прогресс уровней хранится в виде JSON-объекта в ключе `cangaroo_progress`.
- Структура данных: `currentLevelIndex`, `completedLevels: []`, `userSettings: { speed: number }`.
- При загрузке страницы приложение первым делом проверяет наличие данных в браузере.

---

## Design System — "Cyber-Cangaroo UI"

### Target Audience
- Ученики **7-го класса (12–14 лет)** лицея «Ioan Vodă».

### Colors (Cyberpunk Palette)
- **Background:** Deep Navy (#0f172a).
- **Primary:** Neon Cyan (#22d3ee).
- **Secondary:** Neon Magenta (#d946ef).
- **Success:** Electric Lime (#84cc16).

---

## File Structure

```text
src/
  lib/
    components/   # UI компоненты
    game/         # Логика Phaser и анимации
    stores/       # Сторы с автосохранением в localStorage
    parser/       # Логика интерпретатора команд (DSL)
  routes/         # Страницы SvelteKit
static/
  assets/         # Изображения кенгуру и тайлов
```


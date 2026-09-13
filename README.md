# SubTrack — Subscription Tracker & Manager

SubTrack is a clean, private, client-side web application designed to help users track recurring bills, monitor spending burn rates, manage renewal schedules, and optimize monthly subscription expenses.

## 🚀 Key Features

- **Subscription Dashboard**: Real-time calculation of monthly and yearly spending equivalents across multiple currencies (NGN ₦, USD $, EUR €, GBP £).
- **Renewal Calendar Strip & Reminders**: Visual 30-day renewal strip highlighting upcoming payment due dates and trial expirations.
- **Spending Health Score**: Algorithmic assessment of subscription health and optimization recommendations.
- **Quick Edit & Management**: Instant one-click editing workflow populating the main form with subscription data, with support for pausing and deleting items.
- **Category Breakdown & Analytics**: Visual breakdown of spending by category with custom category support.
- **Spending Snapshot Sharing**: Exportable text snapshot and downloadable image summary card.
- **100% Private & Client-Side**: All data is securely stored locally in the browser (`localStorage`), requiring no backend or account creation.

---

## 🛠️ Technology Stack

- **Frontend Core**: Vanilla JavaScript (ES6+), HTML5, and modular CSS.
- **Styling**: Modern CSS with custom properties (CSS variables), responsive Grid & Flexbox, and support for high-contrast Light and Dark Modes.
- **Build & Bundling**: Vite for lightning-fast development and production bundling.
- **Type Safety & Tooling**: TypeScript compiler (`tsc`) and ESLint for robust code quality.

---

## 🏛️ Project Architecture

```text
subtrack/
├── index.html            # Main application HTML entry point & landing/app views
├── style.css             # Global styles, responsive layouts, and dark mode themes
├── script.js             # Application state, event handlers, rendering engines, and storage
├── src/                  # Source assets and React boilerplate entry points
├── public/               # Static assets and icons
├── metadata.json         # App metadata and frame permissions
├── package.json          # Dependencies and script definitions
└── vite.config.ts        # Vite configuration
```

---

## ⚙️ Getting Started & Development

1. **Clone or Open the Project** in your development environment.
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Run Development Server**:
   ```bash
   npm run dev
   ```
4. **Build for Production**:
   ```bash
   npm run build
   ```

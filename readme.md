# Janet Bot

> **Warning:**  
> This project is in early development. Expect bugs and incomplete features!

A Discord bot with a web portal for viewing logs and managing commands.

---

## 🌐 Public Hosting

This bot should eventually be available publicly at **[placeholder for URL]** — you won’t need to host it yourself.

---

## 🏠 Hosting Locally

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Setup

1. **Clone the repository:**
   ```sh
   git clone https://github.com/poopoofartnut/Janet-Bot
   cd "Janet Bot"
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env` and fill in your Discord bot token and client ID:
     ```
     DISCORD_TOKEN=your-bot-token-here
     CLIENT_ID=your-client-id-here
     CLIENT_SECRET=your-client-secret-here
     PORT=3000
     REDIRECT_URI=your-redirect-uri
     ```

---

## 🛠 Building the Project

Compile TypeScript to JavaScript:

```sh
npm run build
```

This will output compiled files to the `dist/` directory.

---

## 🚀 Running the App

```sh
npm start
```

- The Discord bot will start and connect to your server.
- The web portal will be available at [http://localhost:3000](http://localhost:3000) (or your specified `PORT`).

---

## 📁 Project Structure

- `src/bot/` — Discord bot logic and commands
- `src/web/` — Express web server, routes, controllers, and views
- `public/` — Static files for the web portal
- `src/types/` — TypeScript interfaces and types

---

## ✨ Features

- **Discord Bot:** Responds to slash commands (e.g., `/ping`)
- **Web Portal:** View logs and manage commands via a browser

---

## 🐞 Troubleshooting

- Ensure your `.env` file is filled out correctly.
- Make sure your Discord bot is invited to your server with the correct permissions.
- Check the terminal for error messages if the bot or web server fails to start.

---

**Enjoy using Janet Bot!**
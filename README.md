<h1 style="text-align:center">Money Talks</h1>

Money Talks App is a modern, beautifully designed personal finance tracker built as a React Single Page Application (SPA). It provides a seamless way to record transactions, manage multiple wallets, and visualize your financial flow, utilizing Google Sheets as a free, lightweight backend and Brandfetch for automatic brand logo detection.

---

## 🌟 Features

- **Single Page Application (SPA):** The entire application runs smoothly on a single page. Navigation between the dashboard, history, and settings happens instantly without page reloads, providing a fast and native app-like experience.

- **Built-in Desmos Calculator:** Integrated with the Desmos API to provide a floating, quick-access scientific calculator. This helps users easily calculate their expenses and incomes directly within the app without needing to switch tabs or open a separate calculator app.

- **Brand Data Search:** Directly integrated with the Brandfetch API to automatically fetch logos and brand information based on the wallet's platform domain.

- **Cloud Data Storage:** Uses Google Spreadsheet as the primary database. The data is pulled into Google Apps Script, which serves as a lightweight backend API before being fetched by the frontend platform and FREE of course.

- **Modern & Responsive UI:** Built using React and beautifully styled using Tailwind CSS with component architectures inspired by shadcn/ui [Shadcn UI](https://ui.shadcn.com "The Foundation for your Design System - shadcn/ui"), ensuring a clean, accessible, and highly mobile-responsive user experience.

---

## 🚀 Installation & Setup

Follow these simple steps to run the application locally:

1. Clone Repository

~~~ bash
git clone https://github.com/nuuruuur/money-talks
cd money-talks
~~~

2. Install Dependencies

Run

~~~ bash
  npm install
~~~

3. Environment Configuration (API Keys)

This application requires API keys and URLs to run properly.

Duplicate the `.env.example file` and rename it to `.env`.

Open the `.env` file and fill in your Apps Script URL, Brandfetch API Key, and (optionally) Desmos API Key:

~~~ env
REACT_APP_APPSCRIPT_URL=your_appscript_url_here
REACT_APP_BRANDFETCH_API_KEY=your_brandfetch_api_key_here
REACT_APP_DESMOS_API_KEY=aea0164e7c4348649ba21c93c4a4a54c
~~~

4. Run the Application

~~~ bash
  npm start
~~~

The application will automatically open in your browser at http://localhost:3000.

> ⚠️ Final Step Before Publishing (Very Important)
>
> Make sure you do not expose your `.env` file to the public.
>
>Check your `.gitignore` file and ensure that the `.env` file is listed inside it. This prevents your private API keys and URLs from being uploaded to your public GitHub repository.

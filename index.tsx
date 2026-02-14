import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Starting App Initialization...");

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error("Could not find root element to mount to");
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("App mounted successfully.");
} catch (error) {
  console.error("Critical Error during App mount:", error);
  document.body.innerHTML = `
    <div style="padding: 2rem; color: #f87171; font-family: sans-serif; text-align: center; background: #0f172a; height: 100vh;">
      <h1 style="font-size: 2rem; margin-bottom: 1rem;">Something went wrong</h1>
      <p style="color: #94a3b8; margin-bottom: 2rem;">${error instanceof Error ? error.message : String(error)}</p>
      <button onclick="window.location.reload()" style="padding: 0.75rem 1.5rem; background: #334155; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-size: 1rem;">
        Reload Application
      </button>
    </div>
  `;
}
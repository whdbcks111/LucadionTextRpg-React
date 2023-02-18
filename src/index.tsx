import React from 'react';
import './index.css';
import App from './App';
import ReactDOM from 'react-dom/client';

const element = document.getElementById('root');
if(element !== null) {
  const root = ReactDOM.createRoot(element);
  root.render(<App />);
}
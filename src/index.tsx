import React from 'react';
import './index.css';
import App from './App';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux'
import { legacy_createStore as createStore } from "redux";
import rootReducer from './reducers/RootReducer';

const element = document.getElementById('root');
if (element !== null) {
    const root = ReactDOM.createRoot(element);
    const store = createStore(rootReducer);

    root.render(
        <Provider store={store}>
            <App />
        </Provider>
    );
}
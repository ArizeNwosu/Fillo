
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import { ErrorBoundary } from './src/components/ui/ErrorBoundary';
import { AuthProvider } from './src/contexts/AuthContext';

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <ErrorBoundary>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </ErrorBoundary>
        </React.StrictMode>
    );
}
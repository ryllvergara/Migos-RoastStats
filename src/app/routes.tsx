import { createBrowserRouter } from 'react-router';
import { Root } from './components/Root';
import { AuthScreen } from './components/AuthScreen';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AuthScreen,
  },
  {
    path: '/',
    Component: Root,
    children: [],
  },
]);

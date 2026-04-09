import { createBrowserRouter } from 'react-router';
import { Root } from '../components/Root';
import { AuthScreen } from '../pages/AuthScreen';
import { GrillSidePOS } from '../pages/POS';
import { ProductsManager } from '../pages/ProductsManager';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AuthScreen,
  },
  {
    path: '/',
    Component: Root,
    children: [
      { path: 'pos', Component: GrillSidePOS },
      { path: 'products', Component: ProductsManager },
    ],
  },
]);

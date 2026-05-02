import { createBrowserRouter } from 'react-router';
import { Root } from '../components/Root';
import { AuthScreen } from '../pages/AuthScreen';
import { GrillSidePOS } from '../pages/POS';
import { ProductsManager } from '../pages/ProductsManager';
import { OwnerDashboard } from '../pages/OwnerDashboard';
import { Management } from '../pages/Management';
import { Audit } from '../pages/Audit';
import { Analytics } from '../pages/Analytics';

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
      { path: 'dashboard', Component: OwnerDashboard },
      { path: 'inventory', Component: ProductsManager },
      { path: 'management', Component: Management },
      { path: 'audit', Component: Audit },
      { path: 'analytics', Component: Analytics },
    ],
  },
]);

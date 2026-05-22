import { lazy } from "react";
import type { RouteObject } from "react-router-dom";

const Dashboard = lazy(() => import("../pages/Dashboard"));
const AlertsPage = lazy(() => import('../pages/Alerts'));
const Home = lazy(() => import("../pages/Home"));
const About = lazy(() => import("../pages/About"));
const AlertDefinitionsPage = lazy(() => import('../pages/admin/AlertDefinitions'));
const ObjectTypesPage = lazy(() => import('../pages/admin/ObjectTypes'));
const ObjectsPage = lazy(() => import('../pages/admin/Objects'));
const ItemDetailPage = lazy(() => import('../pages/admin/ItemDetail'));
const MobileAddItemPage = lazy(() => import('../pages/mobile/MobileAddItem'));
const ReportsPage = lazy(() => import('../pages/Reports'));
const SearchPage = lazy(() => import('../pages/Search'));
const SettingsPage = lazy(() => import('../pages/Settings'));
const TreePage = lazy(() => import('../pages/Tree'));

export const routes: RouteObject[] = [
  { path: "/", element: <Dashboard /> },
  { path: "/alerts", element: <AlertsPage /> },
  { path: "/home", element: <Home /> },
  { path: "/about", element: <About /> },
  { path: "/admin/alert-definitions", element: <AlertDefinitionsPage /> },
  { path: "/object-types", element: <ObjectTypesPage /> },
  { path: "/objects", element: <ObjectsPage /> },
  { path: "/objects/:id", element: <ItemDetailPage /> },
  { path: "/item/:uniqueCode", element: <ItemDetailPage /> },
  { path: "/tree", element: <TreePage /> },
  { path: "/search", element: <SearchPage /> },
  { path: "/mobile/add-item", element: <MobileAddItemPage /> },
  { path: "/reports", element: <ReportsPage /> },
  { path: "/settings", element: <SettingsPage /> },
];

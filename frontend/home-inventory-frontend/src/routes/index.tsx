import Home from "../pages/Home";
import About from "../pages/About";
import type { RouteObject } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import ObjectTypesPage from '../pages/admin/ObjectTypes'
import ObjectsPage from '../pages/admin/Objects'

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/about", element: <About /> },
      { path: "/object-types", element: <ObjectTypesPage /> },
      { path: "/objects", element: <ObjectsPage /> },
    ],
  },
];

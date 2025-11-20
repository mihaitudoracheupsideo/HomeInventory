import { lazy } from "react";
import type { RouteObject } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

const Home = lazy(() => import("../pages/Home"));
const About = lazy(() => import("../pages/About"));
const ObjectTypesPage = lazy(() => import('../pages/admin/ObjectTypes'));
const ObjectsPage = lazy(() => import('../pages/admin/Objects'));
const ItemDetailPage = lazy(() => import('../pages/admin/ItemDetail'));

export const routes: RouteObject[] = [
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/about", element: <About /> },
      { path: "/object-types", element: <ObjectTypesPage /> },
      { path: "/objects", element: <ObjectsPage /> },
      { path: "/objects/:id", element: <ItemDetailPage /> },
      { path: "/item/:uniqueCode", element: <ItemDetailPage /> },
    ],
  },
];

import "./App.css";
import { useRoutes } from "react-router-dom";
import { routes } from "./routes";

function App() {
  const menu = useRoutes(routes);
  return (
    <>
      <div className="w-full bg-white border border-gray-200 shadow rounded-lg">
        {menu}
      </div>
    </>
  );
}

export default App;

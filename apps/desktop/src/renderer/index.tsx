import { createRoot } from "react-dom/client";
import { App } from "./Components/App";
import "./styles.css";

const root = document.getElementById("root");

if (root) void window.main.readSettings().then((saved) => createRoot(root).render(<App savedSettings={saved} />));

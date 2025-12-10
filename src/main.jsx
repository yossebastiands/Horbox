import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";

// Import all styles
import "./index.css";
import "./styles/global.css";
import "./styles/styles.css";
import "./styles/home.css";
import "./styles/gate.css";
import "./styles/playlist.css";
import "./styles/ourgallery.css";
import "./styles/ourassets.css";
import "./styles/ourvoice.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

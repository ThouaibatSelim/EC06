import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// import "bootstrap/dist/css/bootstrap.min.css"; // désactivé — on utilise CSS Modules
import "./styles/variables.css"; // charte graphique (couleurs, fonts, radius) disponible globalement

// Point d'entrée React — monte l'app dans la div #root de index.html
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
import { NavLink } from "react-router-dom";

export default function NavBar() {
  return (
    <nav>
      <NavLink to="/">Upload</NavLink>
      <NavLink to="/dashboard">Visão geral</NavLink>
      <NavLink to="/produtos">Produtos</NavLink>
    </nav>
  );
}

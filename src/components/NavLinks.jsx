import { NavLink } from "react-router-dom";

export default function NavLinks() {
  return (
    <div className="navbar-links">
      <NavLink to="/dashboard" className={({ isActive }) => (isActive ? "active" : "")}>Dashboard</NavLink>
      <NavLink to="/leads" className={({ isActive }) => (isActive ? "active" : "")}>Lead List</NavLink>
    </div>
  );
}

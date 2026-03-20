import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import NavbarBrand from "./NavbarBrand";
import NavLinks from "./NavLinks";
import LogoutButton from "./LogoutButton";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const firstName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  return (
    <div className="navbar">
      <NavbarBrand />
      <div className="navbar-greeting">Welcome, {firstName}</div>
      <nav className="navbar-actions">
        <NavLinks />
        <LogoutButton onLogout={handleLogout} />
      </nav>
    </div>
  );
}
export default function LogoutButton({ onLogout }) {
  return (
    <button className="logout-btn" onClick={onLogout}>
      Logout
    </button>
  );
}

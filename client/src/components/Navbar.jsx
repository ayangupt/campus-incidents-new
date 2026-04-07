import { Link } from 'react-router-dom'

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">UChicago Help Desk</Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Report Incident</Link>
        <Link to="/admin">Admin</Link>
      </div>
    </nav>
  )
}

export default Navbar

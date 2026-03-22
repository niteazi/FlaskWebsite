import { Link, NavLink } from 'react-router-dom'

function Header() {
  const navItemClass = ({ isActive }) =>
    [
      'rounded px-3 py-2 text-sm font-bold transition-colors',
      isActive
        ? 'bg-white text-[#003087]'
        : 'text-white hover:bg-[#003087] hover:text-white',
    ].join(' ')

  return (
    <header className="sticky top-0 z-10 border-b border-[#003087] bg-[#005EB8]">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          id="logo"
          className="text-xl font-bold tracking-tight text-white"
          to="/"
        >
          FindMyJabs
        </Link>
        <nav aria-label="Primary">
          <ul className="flex list-none items-center gap-2 p-0">
            <li>
              <NavLink className={navItemClass} to="/about">
                About
              </NavLink>
            </li>
            <li>
              <NavLink className={navItemClass} to="/account">
                My Account
              </NavLink>
            </li>
            <li>
              <NavLink className={navItemClass} to="/admin">
                Admin
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header

import { Link, NavLink } from 'react-router-dom'

function Header() {
  const navItemClass = ({ isActive }) =>
    [
      'rounded-md px-3 py-2 text-sm font-medium transition-colors',
      isActive
        ? 'bg-slate-200 text-slate-900'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
    ].join(' ')

  return (
    <header className="sticky top-0 z-10  bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          id="logo"
          className="text-xl font-semibold tracking-tight text-slate-900"
          to="/"
        >
        FindMyJabs
        </Link>
        <nav aria-label="Primary">
          <ul className="flex list-none items-center gap-2 p-0 ">
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
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default Header

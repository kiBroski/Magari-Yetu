import Link from 'next/link'

export function Navbar() {
  const navLinks = [
    { name: 'Cars', href: '/cars' },
    { name: 'Trucks & Lorries', href: '/trucks' },
    { name: 'Motorbikes', href: '/motorbikes' },
    { name: 'Tuktuks', href: '/tuktuks' },
    { name: 'Heavy machinery', href: '/heavy-machinery' },
    { name: 'Duty calculator', href: '/tools/import-duty-calculator' },
    { name: 'Advertise', href: '/advertise' },
  ]

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="text-xl font-bold text-gray-900 tracking-tight">
            MAGARI<span className="text-amber-600">YETU</span>
          </Link>
          
          <nav className="hidden md:flex space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-sm font-medium text-gray-700 hover:text-amber-600 transition-colors"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Log in
            </Link>
            <Link href="/register" className="text-sm font-medium text-gray-700 hover:text-gray-900">
              Register
            </Link>
            <Link
              href="/sell"
              className="bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-amber-700"
            >
              Sell your vehicle
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
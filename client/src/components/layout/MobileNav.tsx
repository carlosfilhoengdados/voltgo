import { useLocation, Link } from "wouter";
import { MapPin, Search, Zap, Percent, User } from "lucide-react";

export default function MobileNav() {
  const [location] = useLocation();
  
  return (
    <nav className="md:hidden bg-white border-t border-gray-200 py-3 px-4 fixed bottom-0 left-0 right-0 z-10">
      <div className="grid grid-cols-5 gap-2">
        <Link href="/">
          <a className="flex flex-col items-center">
            <div className="relative">
              <MapPin className={`${location === "/" ? "text-primary" : "text-gray-500"}`} />
              {location === "/" && <div className="mobile-nav-indicator"></div>}
            </div>
            <span className={`text-xs mt-1 ${location === "/" ? "text-primary font-medium" : "text-gray-500"}`}>
              Mapa
            </span>
          </a>
        </Link>
        
        <Link href="/search">
          <a className="flex flex-col items-center">
            <Search className={`${location === "/search" ? "text-primary" : "text-gray-500"}`} />
            <span className={`text-xs mt-1 ${location === "/search" ? "text-primary font-medium" : "text-gray-500"}`}>
              Buscar
            </span>
          </a>
        </Link>
        
        <a className="flex flex-col items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
            <Zap className="text-white" />
          </div>
        </a>
        
        <Link href="/promotions">
          <a className="flex flex-col items-center">
            <Percent className={`${location === "/promotions" ? "text-primary" : "text-gray-500"}`} />
            <span className={`text-xs mt-1 ${location === "/promotions" ? "text-primary font-medium" : "text-gray-500"}`}>
              Ofertas
            </span>
          </a>
        </Link>
        
        <Link href="/profile">
          <a className="flex flex-col items-center">
            <User className={`${location === "/profile" ? "text-primary" : "text-gray-500"}`} />
            <span className={`text-xs mt-1 ${location === "/profile" ? "text-primary font-medium" : "text-gray-500"}`}>
              Perfil
            </span>
          </a>
        </Link>
      </div>
    </nav>
  );
}

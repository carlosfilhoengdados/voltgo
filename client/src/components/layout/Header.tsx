import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, Search } from "lucide-react";

export default function Header({ onSearch }: { onSearch?: (query: string) => void }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  return (
    <header className="bg-white border-b border-gray-200 py-3 px-4 md:px-6 hidden md:block">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Logo */}
        <Link href="/">
          <a className="flex items-center space-x-1">
            <div className="h-9 w-9 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center">
              <i className="fas fa-bolt text-white text-lg"></i>
            </div>
            <span className="text-xl font-bold text-gradient">VoltGo</span>
          </a>
        </Link>
        
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative flex items-center max-w-md w-full mx-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <Input
            type="text"
            className="w-full pl-10 pr-4 py-2"
            placeholder="Buscar eletropostos ou endereços..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </form>
        
        {/* Nav Items */}
        <nav className="flex items-center space-x-6">
          <Link href="/">
            <a className={`text-gray-700 hover:text-primary font-medium ${location === "/" ? "text-primary" : ""}`}>
              Mapa
            </a>
          </Link>
          <Link href="/favorites">
            <a className={`text-gray-700 hover:text-primary font-medium ${location === "/favorites" ? "text-primary" : ""}`}>
              Favoritos
            </a>
          </Link>
          <Link href="/promotions">
            <a className={`text-gray-700 hover:text-primary font-medium ${location === "/promotions" ? "text-primary" : ""}`}>
              Promoções
            </a>
          </Link>
          <Link href="/profile">
            <a className={`text-gray-700 hover:text-primary font-medium ${location === "/profile" ? "text-primary" : ""}`}>
              Conta
            </a>
          </Link>
          <div className="relative">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Bell className="h-5 w-5 text-gray-600" />
              <span className="notification-dot"></span>
            </Button>
          </div>
          <Avatar className="h-8 w-8 bg-gradient-to-r from-primary to-secondary text-white">
            <AvatarFallback>
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </nav>
      </div>
    </header>
  );
}

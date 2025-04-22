import { Link } from "wouter";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import StationForm from "@/components/stations/StationForm";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function StationRegistrationPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1 container mx-auto py-6 px-4 md:px-6 mb-16 md:mb-0">
        <div className="mb-6">
          <div className="flex items-center">
            <Link href="/">
              <a className="text-gray-500 mr-2">&larr;</a>
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Cadastrar novo eletroposto</h1>
          </div>
          <p className="text-gray-500 mt-1">
            Compartilhe seu eletroposto com a comunidade VoltGo
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <StationForm />
        </div>
      </main>
      
      <MobileNav />
    </div>
  );
}

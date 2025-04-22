import { useState } from "react";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import StatsCard from "@/components/user/StatsCard";
import RewardCard from "@/components/user/RewardCard";
import { ChargingSession } from "@/types";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: chargingSessions, isLoading } = useQuery({
    queryKey: ["/api/charging/history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/charging/history");
      return res.json() as Promise<ChargingSession[]>;
    },
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
          <div className="flex items-center mb-4 md:mb-0">
            <Avatar className="h-16 w-16 mr-4 bg-gradient-to-r from-primary to-secondary text-white">
              <AvatarFallback className="text-xl">
                {user.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-500">{user.email}</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
          >
            {logoutMutation.isPending ? "Saindo..." : "Sair da conta"}
          </Button>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full md:w-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="history">Histórico de Recargas</TabsTrigger>
            <TabsTrigger value="rewards">Recompensas</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <StatsCard user={user} />
            
            <RewardCard />
            
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Recargas recentes</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : chargingSessions && chargingSessions.length > 0 ? (
                  <div className="space-y-4">
                    {chargingSessions.slice(0, 3).map(session => (
                      <div 
                        key={session.id}
                        className="flex justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {session.stationId} {/* Ideally, we'd fetch the station name */}
                          </p>
                          <p className="text-sm text-gray-500">
                            {format(new Date(session.startTime), 'dd/MM/yyyy HH:mm')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-primary">
                            {session.kwhCharged ? `${session.kwhCharged.toFixed(1)} kWh` : 'Em andamento'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {session.pointsEarned} pontos
                          </p>
                        </div>
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => setActiveTab("history")}
                    >
                      Ver todo histórico
                    </Button>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-6">
                    Você ainda não realizou nenhuma recarga.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Histórico de recargas</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : chargingSessions && chargingSessions.length > 0 ? (
                  <div className="space-y-4">
                    {chargingSessions.map(session => (
                      <div 
                        key={session.id}
                        className="flex justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {session.stationId} {/* Ideally, we'd fetch the station name */}
                          </p>
                          <div className="text-sm text-gray-500 mt-1">
                            <p>Iniciado: {format(new Date(session.startTime), 'dd/MM/yyyy HH:mm')}</p>
                            {session.endTime && (
                              <p>Finalizado: {format(new Date(session.endTime), 'dd/MM/yyyy HH:mm')}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-primary">
                            {session.kwhCharged ? `${session.kwhCharged.toFixed(1)} kWh` : 'Em andamento'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {session.pointsEarned} pontos
                          </p>
                          {session.totalPrice !== null && (
                            <p className="text-sm font-medium mt-1">
                              R$ {session.totalPrice.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-6">
                    Você ainda não realizou nenhuma recarga.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="rewards">
            <RewardCard />
          </TabsContent>
        </Tabs>
      </main>
      
      <MobileNav />
    </div>
  );
}

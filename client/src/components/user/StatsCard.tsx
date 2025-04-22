import { User } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface StatsCardProps {
  user: User;
}

export default function StatsCard({ user }: StatsCardProps) {
  // Get user's charging history
  const { data: chargingSessions, isLoading } = useQuery({
    queryKey: ["/api/charging/history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/charging/history");
      return res.json();
    },
  });

  // Calculate CO2 savings (rough estimate: 0.5kg per kWh)
  const co2Saved = user.totalKwh * 0.5;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">Suas estatísticas</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Recargas totais</p>
              <p className="text-2xl font-bold text-primary">{user.totalCharges}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Pontos VoltGo</p>
              <p className="text-2xl font-bold text-secondary">{user.totalPoints}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">kWh carregados</p>
              <p className="text-2xl font-bold text-primary">{user.totalKwh.toFixed(1)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">CO2 economizado</p>
              <p className="text-2xl font-bold text-green-600">{co2Saved.toFixed(0)} kg</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

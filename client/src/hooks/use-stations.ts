import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Station } from "@/types";
import { useToast } from "@/hooks/use-toast";

interface StationFilters {
  status: string[];
  connectorTypes: string[];
  isFree: boolean | null;
  minPower: number;
}

export function useStations(filters: StationFilters) {
  const { toast } = useToast();
  const [queryFilters, setQueryFilters] = useState<string>("");

  // Build query string from filters
  useEffect(() => {
    const queryParams = new URLSearchParams();
    
    if (filters.status.length > 0) {
      queryParams.set("status", filters.status.join(","));
    }
    
    if (filters.connectorTypes.length > 0) {
      queryParams.set("connectorTypes", filters.connectorTypes.join(","));
    }
    
    if (filters.isFree !== null) {
      queryParams.set("isFree", filters.isFree.toString());
    }
    
    if (filters.minPower > 0) {
      queryParams.set("minPower", filters.minPower.toString());
    }
    
    const queryString = queryParams.toString();
    setQueryFilters(queryString ? `?${queryString}` : "");
  }, [filters]);

  // Fetch stations based on filters
  const { data, isLoading, error } = useQuery<Station[]>({
    queryKey: [`/api/stations${queryFilters}`],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", `/api/stations${queryFilters}`);
        return res.json();
      } catch (error) {
        toast({
          title: "Erro ao carregar eletropostos",
          description: "Não foi possível carregar a lista de eletropostos. Tente novamente mais tarde.",
          variant: "destructive",
        });
        throw error;
      }
    },
  });

  return { stations: data, isLoading, error };
}

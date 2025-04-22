import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Tag, Zap } from "lucide-react";
import { Reward, UserReward } from "@/types";

export default function RewardCard() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Get all available rewards
  const { data: rewards, isLoading: isLoadingRewards } = useQuery({
    queryKey: ["/api/rewards"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/rewards");
      return res.json() as Promise<Reward[]>;
    },
  });

  // Get user's claimed rewards
  const { data: userRewards, isLoading: isLoadingUserRewards } = useQuery({
    queryKey: ["/api/user/rewards"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/rewards");
      return res.json() as Promise<(UserReward & { reward: Reward })[]>;
    },
    enabled: !!user,
  });

  // Mutation to claim a reward
  const claimRewardMutation = useMutation({
    mutationFn: async (rewardId: number) => {
      const res = await apiRequest("POST", `/api/rewards/${rewardId}/claim`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/rewards"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Recompensa resgatada!",
        description: "Sua recompensa foi resgatada com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao resgatar",
        description: error.message || "Não foi possível resgatar esta recompensa.",
        variant: "destructive",
      });
    },
  });

  // Mutation to use a reward
  const useRewardMutation = useMutation({
    mutationFn: async (userRewardId: number) => {
      const res = await apiRequest("POST", `/api/user/rewards/${userRewardId}/use`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/rewards"] });
      toast({
        title: "Recompensa utilizada!",
        description: "Sua recompensa foi marcada como utilizada.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao utilizar",
        description: error.message || "Não foi possível utilizar esta recompensa.",
        variant: "destructive",
      });
    },
  });

  const isLoading = isLoadingRewards || isLoadingUserRewards;
  const availableRewards = rewards?.filter(reward => 
    !userRewards?.some(ur => ur.rewardId === reward.id && !ur.isUsed)
  );
  const claimedRewards = userRewards?.filter(ur => !ur.isUsed) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-900">Recompensas</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {claimedRewards.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Suas recompensas disponíveis</h3>
                <div className="space-y-3">
                  {claimedRewards.map(userReward => (
                    <div 
                      key={userReward.id}
                      className="flex justify-between items-center p-3 border border-dashed border-primary-300 rounded-lg bg-primary-50"
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                          {userReward.reward.type === 'discount' ? (
                            <Tag className="text-primary-600" />
                          ) : (
                            <Zap className="text-primary-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{userReward.reward.name}</p>
                          <p className="text-sm text-gray-500">{userReward.reward.description}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-primary-300 text-primary-600 hover:bg-primary-100"
                        onClick={() => useRewardMutation.mutate(userReward.id)}
                        disabled={useRewardMutation.isPending}
                      >
                        {useRewardMutation.isPending ? "Utilizando..." : "Utilizar"}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="font-medium text-gray-900 mb-3">Recompensas disponíveis para resgate</h3>
              <div className="space-y-3">
                {availableRewards?.map(reward => {
                  const canClaim = user?.totalPoints >= reward.pointsRequired;
                  const pointsNeeded = reward.pointsRequired - (user?.totalPoints || 0);
                  const percentComplete = user?.totalPoints ? Math.min(100, (user.totalPoints / reward.pointsRequired) * 100) : 0;

                  return (
                    <div 
                      key={reward.id}
                      className="flex justify-between items-center p-3 border border-dashed border-secondary-300 rounded-lg bg-secondary-50"
                    >
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-secondary-100 rounded-full flex items-center justify-center mr-3">
                          {reward.type === 'discount' ? (
                            <Tag className="text-secondary-600" />
                          ) : (
                            <Zap className="text-secondary-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{reward.name}</p>
                          <div className="flex items-center">
                            <p className="text-sm text-gray-500">
                              {canClaim 
                                ? "Disponível para resgate!" 
                                : `Faltam ${pointsNeeded} pontos`}
                            </p>
                            <Badge 
                              variant="outline" 
                              className="ml-2 bg-secondary-100 text-secondary-800 border-secondary-200"
                            >
                              {reward.pointsRequired} pontos
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="bg-white h-2 w-24 rounded-full overflow-hidden">
                          <div 
                            className="bg-secondary-500 h-full" 
                            style={{ width: `${percentComplete}%` }}
                          ></div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-secondary-300 text-secondary-600 hover:bg-secondary-100"
                          disabled={!canClaim || claimRewardMutation.isPending}
                          onClick={() => claimRewardMutation.mutate(reward.id)}
                        >
                          {claimRewardMutation.isPending ? "Resgatando..." : "Resgatar"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full bg-gradient-to-r from-primary to-secondary text-white"
          onClick={() => toast({
            title: "Em breve!",
            description: "Mais recompensas estarão disponíveis em breve."
          })}
        >
          Ver todas as recompensas
        </Button>
      </CardFooter>
    </Card>
  );
}

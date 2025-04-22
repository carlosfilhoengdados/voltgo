import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { InsertStation } from "@/types";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const connectorTypes = [
  { value: "CCS", label: "CCS" },
  { value: "CHAdeMO", label: "CHAdeMO" },
  { value: "Type2", label: "Type 2" },
];

const openingHoursOptions = [
  { value: "24 horas", label: "24 horas" },
  { value: "08:00 - 18:00", label: "Horário comercial (08:00 - 18:00)" },
  { value: "07:00 - 22:00", label: "Estendido (07:00 - 22:00)" },
  { value: "06:00 - 00:00", label: "Longo (06:00 - 00:00)" },
];

const stationSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  city: z.string().min(2, "Cidade é obrigatória"),
  lat: z.coerce.number().refine(val => !isNaN(val) && val >= -90 && val <= 90, "Latitude inválida"),
  lng: z.coerce.number().refine(val => !isNaN(val) && val >= -180 && val <= 180, "Longitude inválida"),
  connectorTypes: z.array(z.string()).min(1, "Selecione pelo menos um tipo de conector"),
  pricePerKwh: z.coerce.number().nullable().optional(),
  isFree: z.boolean().default(false),
  power: z.coerce.number().min(1, "Potência deve ser maior que 0"),
  openingHours: z.string().min(3, "Horário de funcionamento é obrigatório"),
  hasWifi: z.boolean().default(false),
  hasFreeParking: z.boolean().default(false),
  hasRestaurant: z.boolean().default(false),
  hasWaitingArea: z.boolean().default(false),
  status: z.string().default("available"),
  promotion: z.string().optional(),
});

export default function StationForm() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedConnectors, setSelectedConnectors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof stationSchema>>({
    resolver: zodResolver(stationSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      lat: 0,
      lng: 0,
      connectorTypes: [],
      pricePerKwh: 0,
      isFree: false,
      power: 0,
      openingHours: "",
      hasWifi: false,
      hasFreeParking: false,
      hasRestaurant: false,
      hasWaitingArea: false,
      status: "available",
      promotion: "",
    },
  });

  const handleConnectorChange = (connector: string, checked: boolean) => {
    if (checked) {
      setSelectedConnectors(prev => [...prev, connector]);
      form.setValue("connectorTypes", [...selectedConnectors, connector]);
    } else {
      const filtered = selectedConnectors.filter(c => c !== connector);
      setSelectedConnectors(filtered);
      form.setValue("connectorTypes", filtered);
    }
    form.trigger("connectorTypes");
  };

  const tryLocationFetch = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          form.setValue("lat", position.coords.latitude);
          form.setValue("lng", position.coords.longitude);
        },
        (error) => {
          toast({
            title: "Erro de localização",
            description: "Não foi possível obter sua localização atual. Por favor, insira manualmente.",
            variant: "destructive",
          });
        }
      );
    }
  };

  const onSubmit = async (data: z.infer<typeof stationSchema>) => {
    try {
      setIsSubmitting(true);
      
      // Create the station
      const stationData: Partial<InsertStation> = {
        ...data,
        pricePerKwh: data.isFree ? null : data.pricePerKwh,
        lat: data.lat,
        lng: data.lng,
        power: data.power,
      };
      
      const response = await apiRequest("POST", "/api/stations", stationData);
      const station = await response.json();
      
      // If there's a promotion, add it
      if (data.promotion) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3); // Set promotion to last 3 months
        
        try {
          await apiRequest("POST", `/api/stations/${station.id}/promotions`, {
            description: data.promotion,
            pointsValue: 100, // Default points value
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            stationId: station.id
          });
        } catch (promotionError) {
          console.error("Erro ao criar promoção:", promotionError);
          toast({
            title: "Eletroposto cadastrado com sucesso!",
            description: "Seu eletroposto foi cadastrado, mas houve um erro ao adicionar a promoção.",
          });
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/stations"] });
      
      toast({
        title: "Eletroposto cadastrado!",
        description: "Seu eletroposto foi cadastrado com sucesso no VoltGo.",
      });
      
      navigate("/");
    } catch (error) {
      toast({
        title: "Erro ao cadastrar",
        description: "Ocorreu um erro ao cadastrar o eletroposto. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do estabelecimento</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Shopping Centro" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Av. Paulista, 1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: São Paulo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="lat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: -23.5505" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lng"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: -46.6333" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={tryLocationFetch}
            className="w-full"
          >
            Usar minha localização atual
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="power"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Potência (kW)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="openingHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Horário de funcionamento</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o horário" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {openingHoursOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="connectorTypes"
            render={() => (
              <FormItem>
                <FormLabel>Tipos de conectores</FormLabel>
                <div className="flex flex-wrap gap-4 mt-2">
                  {connectorTypes.map(connector => (
                    <div key={connector.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`connector-${connector.value}`}
                        checked={selectedConnectors.includes(connector.value)}
                        onCheckedChange={(checked) => 
                          handleConnectorChange(connector.value, checked === true)
                        }
                      />
                      <label
                        htmlFor={`connector-${connector.value}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {connector.label}
                      </label>
                    </div>
                  ))}
                </div>
                {form.formState.errors.connectorTypes && (
                  <p className="text-sm font-medium text-destructive mt-2">
                    {form.formState.errors.connectorTypes.message}
                  </p>
                )}
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <FormField
              control={form.control}
              name="isFree"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Carregamento gratuito</FormLabel>
                    <FormDescription>
                      O carregamento de veículos é gratuito neste local.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            {!form.watch("isFree") && (
              <FormField
                control={form.control}
                name="pricePerKwh"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço por kWh</FormLabel>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">R$</span>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="Ex: 2.10"
                          type="number"
                          step="0.01"
                          className="pl-10"
                          value={field.value || ''} 
                          onChange={(e) => {
                            const value = e.target.value === '' ? null : Number(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <FormField
            control={form.control}
            name="promotion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Promoção especial (opcional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex: Ganhe um café grátis ao carregar seu veículo"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Adicione uma promoção para atrair mais clientes para seu eletroposto.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <FormLabel>Serviços adicionais</FormLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="hasWifi"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Wi-Fi gratuito</FormLabel>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hasFreeParking"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Estacionamento gratuito</FormLabel>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hasRestaurant"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Café/Restaurante</FormLabel>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="hasWaitingArea"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal">Área de espera</FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/")}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            className="bg-gradient-to-r from-primary to-secondary text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Cadastrando..." : "Cadastrar eletroposto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

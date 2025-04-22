import { useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Plus, Sliders } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface FilterTagsProps {
  filters: {
    status: string[];
    connectorTypes: string[];
    isFree: boolean | null;
    minPower: number;
  };
  onFilterChange: (filters: any) => void;
}

export default function FilterTags({ filters, onFilterChange }: FilterTagsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState({ ...filters });

  const handleTagRemove = (type: string, value?: string | boolean) => {
    const newFilters = { ...filters };
    
    if (type === 'status' && value) {
      newFilters.status = newFilters.status.filter(item => item !== value);
    } else if (type === 'connectorTypes' && value) {
      newFilters.connectorTypes = newFilters.connectorTypes.filter(item => item !== value);
    } else if (type === 'isFree') {
      newFilters.isFree = null;
    } else if (type === 'minPower') {
      newFilters.minPower = 0;
    }
    
    onFilterChange(newFilters);
  };

  const handleTagAdd = (type: string, value: string | boolean) => {
    const newFilters = { ...filters };
    
    if (type === 'status') {
      if (!newFilters.status.includes(value as string)) {
        newFilters.status.push(value as string);
      }
    } else if (type === 'connectorTypes') {
      if (!newFilters.connectorTypes.includes(value as string)) {
        newFilters.connectorTypes.push(value as string);
      }
    } else if (type === 'isFree') {
      newFilters.isFree = value as boolean;
    }
    
    onFilterChange(newFilters);
  };

  const handleLocalFilterChange = (type: string, value: any) => {
    setLocalFilters(prev => {
      if (type === 'status') {
        const status = [...prev.status];
        if (status.includes(value)) {
          return { ...prev, status: status.filter(s => s !== value) };
        } else {
          return { ...prev, status: [...status, value] };
        }
      } else if (type === 'connectorTypes') {
        const types = [...prev.connectorTypes];
        if (types.includes(value)) {
          return { ...prev, connectorTypes: types.filter(t => t !== value) };
        } else {
          return { ...prev, connectorTypes: [...types, value] };
        }
      } else if (type === 'isFree') {
        return { ...prev, isFree: value ? true : null };
      } else if (type === 'minPower') {
        return { ...prev, minPower: value };
      }
      return prev;
    });
  };

  const applyFilters = () => {
    onFilterChange(localFilters);
    setDialogOpen(false);
  };

  const getFilterName = (type: string, value: string | boolean) => {
    if (type === 'status') {
      if (value === 'available') return 'Disponível';
      if (value === 'busy') return 'Ocupado';
      if (value === 'offline') return 'Offline';
    } else if (type === 'connectorTypes') {
      if (value === 'CCS') return 'CCS';
      if (value === 'CHAdeMO') return 'CHAdeMO';
      if (value === 'Type2') return 'Type 2';
    }
    return value.toString();
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
      
      <div className="flex flex-wrap gap-2 mt-3">
        {/* Status filters */}
        {filters.status.map(status => (
          <Button
            key={status}
            variant="outline"
            className="bg-primary-100 text-primary-800 hover:bg-primary-200 rounded-full text-sm px-3 py-1 h-auto font-medium"
            onClick={() => handleTagRemove('status', status)}
          >
            <span>{getFilterName('status', status)}</span>
            <X className="ml-2 h-3 w-3" />
          </Button>
        ))}
        
        {/* Connector type filters */}
        {filters.connectorTypes.map(type => (
          <Button
            key={type}
            variant="outline"
            className="bg-primary-100 text-primary-800 hover:bg-primary-200 rounded-full text-sm px-3 py-1 h-auto font-medium"
            onClick={() => handleTagRemove('connectorTypes', type)}
          >
            <span>{getFilterName('connectorTypes', type)}</span>
            <X className="ml-2 h-3 w-3" />
          </Button>
        ))}
        
        {/* Free charging filter */}
        {filters.isFree && (
          <Button
            variant="outline"
            className="bg-primary-100 text-primary-800 hover:bg-primary-200 rounded-full text-sm px-3 py-1 h-auto font-medium"
            onClick={() => handleTagRemove('isFree')}
          >
            <span>Gratuito</span>
            <X className="ml-2 h-3 w-3" />
          </Button>
        )}
        
        {/* Min power filter */}
        {filters.minPower > 0 && (
          <Button
            variant="outline"
            className="bg-primary-100 text-primary-800 hover:bg-primary-200 rounded-full text-sm px-3 py-1 h-auto font-medium"
            onClick={() => handleTagRemove('minPower')}
          >
            <span>Min {filters.minPower}kW</span>
            <X className="ml-2 h-3 w-3" />
          </Button>
        )}
        
        {/* Quick add buttons */}
        {!filters.status.includes('available') && (
          <Button
            variant="outline"
            className="bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full text-sm px-3 py-1 h-auto font-medium"
            onClick={() => handleTagAdd('status', 'available')}
          >
            <span>Disponível</span>
            <Plus className="ml-2 h-3 w-3" />
          </Button>
        )}
        
        {!filters.isFree && (
          <Button
            variant="outline"
            className="bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full text-sm px-3 py-1 h-auto font-medium"
            onClick={() => handleTagAdd('isFree', true)}
          >
            <span>Gratuito</span>
            <Plus className="ml-2 h-3 w-3" />
          </Button>
        )}
        
        {/* More filters dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-full text-sm px-3 py-1 h-auto font-medium"
            >
              <Sliders className="mr-1 h-3 w-3" />
              <span>Mais filtros</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Filtros avançados</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-3">
                <h3 className="font-medium">Status</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="status-available"
                      checked={localFilters.status.includes('available')}
                      onCheckedChange={(checked) => 
                        handleLocalFilterChange('status', 'available')
                      }
                    />
                    <Label htmlFor="status-available">Disponível</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="status-busy"
                      checked={localFilters.status.includes('busy')}
                      onCheckedChange={(checked) => 
                        handleLocalFilterChange('status', 'busy')
                      }
                    />
                    <Label htmlFor="status-busy">Ocupado</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="status-offline"
                      checked={localFilters.status.includes('offline')}
                      onCheckedChange={(checked) => 
                        handleLocalFilterChange('status', 'offline')
                      }
                    />
                    <Label htmlFor="status-offline">Offline</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium">Tipo de conector</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="connector-ccs"
                      checked={localFilters.connectorTypes.includes('CCS')}
                      onCheckedChange={(checked) => 
                        handleLocalFilterChange('connectorTypes', 'CCS')
                      }
                    />
                    <Label htmlFor="connector-ccs">CCS</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="connector-chademo"
                      checked={localFilters.connectorTypes.includes('CHAdeMO')}
                      onCheckedChange={(checked) => 
                        handleLocalFilterChange('connectorTypes', 'CHAdeMO')
                      }
                    />
                    <Label htmlFor="connector-chademo">CHAdeMO</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="connector-type2"
                      checked={localFilters.connectorTypes.includes('Type2')}
                      onCheckedChange={(checked) => 
                        handleLocalFilterChange('connectorTypes', 'Type2')
                      }
                    />
                    <Label htmlFor="connector-type2">Type 2</Label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium">Preço</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="price-free"
                    checked={localFilters.isFree === true}
                    onCheckedChange={(checked) => 
                      handleLocalFilterChange('isFree', checked)
                    }
                  />
                  <Label htmlFor="price-free">Apenas carregadores gratuitos</Label>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <h3 className="font-medium">Potência mínima</h3>
                  <span className="text-sm text-gray-500">{localFilters.minPower} kW</span>
                </div>
                <Slider
                  value={[localFilters.minPower]}
                  min={0}
                  max={150}
                  step={10}
                  onValueChange={(value) => handleLocalFilterChange('minPower', value[0])}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0 kW</span>
                  <span>50 kW</span>
                  <span>100 kW</span>
                  <span>150 kW</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={applyFilters}>Aplicar filtros</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { useBakeryStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChefHat, Plus, Save, History, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function DoughBatches() {
  const { 
    batches, 
    ingredientTypes, 
    dailyLog, 
    receivedLots,
    users, 
    recipes,
    createBatch,
    getActiveLotForDate,
    getLotsForIngredient
  } = useBakeryStore();
  
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  
  // Date-based batch code: DOUGH-ddmmyy
  const todayDDMMYY = format(new Date(), "ddMMyy");
  
  const [formData, setFormData] = useState({
    name: "",
    recipeId: "",
    code: `DOUGH-${todayDDMMYY}`,
    createdByUserId: "",
    selectedIngredients: [] as string[],
    customLotSelections: {} as Record<string, string> // typeId -> lotId
  });

  const today = format(new Date(), "yyyy-MM-dd");

  const handleRecipeChange = (recipeName: string) => {
    const recipe = doughRecipes.find(r => r.name === recipeName);
    if (recipe) {
      setFormData(prev => ({
        ...prev,
        name: recipeName,
        recipeId: recipe.id,
        selectedIngredients: recipe.ingredients.map(ri => ri.ingredientTypeId),
        customLotSelections: {} // Reset custom selections when recipe changes
      }));
    }
  };

  const handleCreate = () => {
    if (!formData.name || !formData.createdByUserId || formData.selectedIngredients.length === 0) {
      toast({ title: "Error", description: "Fill in name, operator, and select ingredients", variant: "destructive" });
      return;
    }

    const ingredientLotIds = formData.selectedIngredients.map(typeId => {
      // Use custom selection if available, otherwise fallback to daily log active lot
      if (formData.customLotSelections[typeId]) {
        return formData.customLotSelections[typeId];
      }
      const activeLot = getActiveLotForDate(today, typeId);
      return activeLot?.id;
    }).filter((id: any): id is string => id !== undefined);

    if (ingredientLotIds.length === 0) {
      toast({ title: "Error", description: "No active lots found. Check Daily Log.", variant: "destructive" });
      return;
    }

    createBatch({
      type: 'Dough',
      code: formData.code,
      name: formData.name,
      createdAt: new Date().toISOString(),
      createdByUserId: formData.createdByUserId,
      ingredientLotIds
    });

    toast({ title: "Success", description: "Dough Batch Created" });
    setIsCreating(false);
    setFormData({
      name: "",
      recipeId: "",
      code: `DOUGH-${todayDDMMYY}`,
      createdByUserId: "",
      selectedIngredients: [],
      customLotSelections: {}
    });
  };

  const toggleIngredient = (typeId: string) => {
    setFormData(prev => {
      const exists = prev.selectedIngredients.includes(typeId);
      return {
        ...prev,
        selectedIngredients: exists 
          ? prev.selectedIngredients.filter(id => id !== typeId)
          : [...prev.selectedIngredients, typeId]
      };
    });
  };

  const doughBatches = batches.filter(b => b.type === 'Dough').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const doughRecipes = recipes.filter(r => r.type === 'Dough' && r.active);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Dough Batches</h2>
          <p className="text-muted-foreground">Create dough batches using today's ingredients.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} size="lg" className="gap-2 font-bold" disabled={isCreating}>
          <Plus className="w-5 h-5" />
          New Dough Batch
        </Button>
      </div>

      {isCreating && (
        <Card className="border-primary shadow-lg animate-in slide-in-from-top-4">
          <CardHeader className="bg-primary text-primary-foreground rounded-t-lg py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ChefHat className="w-5 h-5" />
              New Dough Record
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <Label>Select Recipe</Label>
                 <Select value={formData.name} onValueChange={handleRecipeChange}>
                    <SelectTrigger className="text-lg font-medium h-12">
                      <SelectValue placeholder="Select recipe..." />
                    </SelectTrigger>
                    <SelectContent>
                      {doughRecipes.map(r => (
                        <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
              </div>
              <div className="space-y-2">
                 <Label>Batch Code (Auto)</Label>
                 <Input 
                   value={formData.code} 
                   onChange={e => setFormData({...formData, code: e.target.value})}
                   className="font-mono bg-muted"
                 />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-bold">Today's Active Ingredients</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ingredientTypes.filter(i => i.active).map(type => {
                  const activeLot = getActiveLotForDate(today, type.id);
                  const availableLots = getLotsForIngredient(type.id);
                  const isSelected = formData.selectedIngredients.includes(type.id);
                  
                  // Find measurement from recipe if applicable
                  const currentRecipe = doughRecipes.find(r => r.id === formData.recipeId);
                  const recipeIngredient = currentRecipe?.ingredients.find(ri => ri.ingredientTypeId === type.id);
                  
                  return (
                    <div 
                      key={type.id}
                      className={cn(
                        "flex flex-col gap-2 p-3 rounded border transition-all",
                        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50",
                        !activeLot && "opacity-50 bg-muted"
                      )}
                    >
                      <div className="flex items-start gap-3 cursor-pointer" onClick={() => activeLot && toggleIngredient(type.id)}>
                        <Checkbox checked={isSelected} disabled={!activeLot} />
                        <div className="flex-1">
                          <div className="flex justify-between items-start gap-2">
                            <p className="font-bold text-sm">{type.name}</p>
                            {recipeIngredient && (
                              <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                                {recipeIngredient.quantity}{recipeIngredient.unit}
                              </span>
                            )}
                          </div>
                          {activeLot ? (
                             <p className="text-[10px] font-mono text-muted-foreground mt-0.5">Active: {activeLot.batchCode}</p>
                          ) : (
                             <p className="text-[10px] text-rose-500 mt-0.5 uppercase font-bold">No active lot</p>
                          )}
                        </div>
                      </div>

                      {isSelected && availableLots.length > 1 && (
                        <div className="mt-2 pt-2 border-t border-primary/10">
                          <Label className="text-[9px] uppercase text-muted-foreground font-bold mb-1 block">Override Batch</Label>
                          <Select 
                            value={formData.customLotSelections[type.id] || activeLot?.id || ""} 
                            onValueChange={(val) => setFormData(prev => ({
                              ...prev,
                              customLotSelections: { ...prev.customLotSelections, [type.id]: val }
                            }))}
                          >
                            <SelectTrigger className="h-7 text-[10px] font-mono">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {availableLots.map(lot => (
                                <SelectItem key={lot.id} value={lot.id} className="text-[10px] font-mono">
                                  {lot.batchCode}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Operator</Label>
              <div className="flex gap-2">
                {users.filter(u => u.role !== 'Admin').map(user => (
                   <Button
                     key={user.id}
                     variant={formData.createdByUserId === user.id ? "default" : "outline"}
                     onClick={() => setFormData({ ...formData, createdByUserId: user.id })}
                     className="min-w-[100px]"
                   >
                     {user.name}
                   </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button onClick={handleCreate} size="lg" className="w-40 font-bold gap-2">
                <Save className="w-4 h-4" />
                Save Batch
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <History className="w-5 h-5 text-muted-foreground" />
             Recent Dough Batches
           </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Batch Code</TableHead>
                <TableHead>Recipe</TableHead>
                <TableHead>Ingredients</TableHead>
                <TableHead>Operator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {doughBatches.map(batch => (
                 <TableRow key={batch.id}>
                   <TableCell className="font-mono text-xs">{format(new Date(batch.createdAt), "HH:mm")}</TableCell>
                   <TableCell className="font-mono font-bold text-primary">{batch.code}</TableCell>
                   <TableCell className="font-medium">{batch.name}</TableCell>
                   <TableCell className="text-xs text-muted-foreground">
                     {batch.ingredientLotIds.length} lots
                   </TableCell>
                   <TableCell>{users.find(u => u.id === batch.createdByUserId)?.name}</TableCell>
                 </TableRow>
               ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

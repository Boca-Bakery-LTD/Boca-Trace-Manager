import { useState } from "react";
import { useBakeryStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UtensilsCrossed, Plus, Save, History, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function FillingBatches() {
  const { 
    batches, 
    ingredientTypes, 
    users, 
    createBatch,
    getActiveLotForDate 
  } = useBakeryStore();
  
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: `FILL-${Math.floor(Math.random() * 1000)}`,
    createdByUserId: "",
    selectedIngredients: [] as string[]
  });

  const today = format(new Date(), "yyyy-MM-dd");

  const handleCreate = () => {
    if (!formData.name || !formData.createdByUserId || formData.selectedIngredients.length === 0) {
      toast({ title: "Error", description: "Fill in name, operator, and select ingredients", variant: "destructive" });
      return;
    }

    const ingredientLotIds = formData.selectedIngredients.map(typeId => {
      const activeLot = getActiveLotForDate(today, typeId);
      return activeLot?.id;
    }).filter(Boolean) as string[];

    if (ingredientLotIds.length === 0) {
      toast({ title: "Error", description: "No active lots found for selected ingredients.", variant: "destructive" });
      return;
    }

    createBatch({
      type: 'Filling',
      code: formData.code,
      name: formData.name,
      createdAt: new Date().toISOString(),
      createdByUserId: formData.createdByUserId,
      ingredientLotIds
    });

    toast({ title: "Success", description: "Filling Batch Created" });
    setIsCreating(false);
    setFormData({
      name: "",
      code: `FILL-${Math.floor(Math.random() * 1000)}`,
      createdByUserId: "",
      selectedIngredients: []
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

  const fillingBatches = batches.filter(b => b.type === 'Filling').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Filling Batches</h2>
          <p className="text-muted-foreground">Record jams, custards, and fillings for today.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} size="lg" className="gap-2 font-bold bg-amber-600 hover:bg-amber-700 text-white" disabled={isCreating}>
          <Plus className="w-5 h-5" />
          New Filling Batch
        </Button>
      </div>

      {isCreating && (
        <Card className="border-amber-600 shadow-lg animate-in slide-in-from-top-4">
          <CardHeader className="bg-amber-600 text-white rounded-t-lg py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UtensilsCrossed className="w-5 h-5" />
              New Filling Record
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <Label>Recipe Name</Label>
                 <Input 
                   placeholder="e.g. Vanilla Custard" 
                   value={formData.name}
                   onChange={e => setFormData({ ...formData, name: e.target.value })}
                   className="font-medium text-lg"
                 />
              </div>
              <div className="space-y-2">
                 <Label>Batch Code</Label>
                 <Input 
                   value={formData.code} 
                   readOnly 
                   className="font-mono bg-muted text-muted-foreground"
                 />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base">Select Ingredients (from Daily Log)</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {ingredientTypes.map(type => {
                  const activeLot = getActiveLotForDate(today, type.id);
                  const isSelected = formData.selectedIngredients.includes(type.id);
                  
                  return (
                    <div 
                      key={type.id}
                      onClick={() => activeLot && toggleIngredient(type.id)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded border cursor-pointer transition-all",
                        isSelected ? "border-amber-600 bg-amber-50 ring-1 ring-amber-600" : "hover:bg-muted/50",
                        !activeLot && "opacity-50 cursor-not-allowed bg-muted"
                      )}
                    >
                      <Checkbox checked={isSelected} disabled={!activeLot} className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600" />
                      <div className="flex-1">
                        <p className="font-bold text-sm">{type.name}</p>
                        {activeLot ? (
                           <p className="text-xs font-mono text-muted-foreground mt-1">Lot: {activeLot.batchCode}</p>
                        ) : (
                           <p className="text-xs text-rose-500 mt-1">No active lot</p>
                        )}
                      </div>
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
                     className={cn("min-w-[100px]", formData.createdByUserId === user.id && "bg-amber-600 hover:bg-amber-700")}
                   >
                     {user.name}
                   </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button onClick={handleCreate} size="lg" className="w-40 font-bold gap-2 bg-amber-600 hover:bg-amber-700 text-white">
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
             Recent Fillings
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
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {fillingBatches.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No filling batches recorded yet.</TableCell>
                 </TableRow>
               ) : (
                 fillingBatches.map(batch => (
                   <TableRow key={batch.id}>
                     <TableCell className="font-mono text-xs">{format(new Date(batch.createdAt), "HH:mm")}</TableCell>
                     <TableCell className="font-mono font-bold text-amber-700">{batch.code}</TableCell>
                     <TableCell className="font-medium">{batch.name}</TableCell>
                     <TableCell className="text-xs text-muted-foreground">
                       {batch.ingredientLotIds.length} lots linked
                     </TableCell>
                     <TableCell>{users.find(u => u.id === batch.createdByUserId)?.name}</TableCell>
                     <TableCell>
                       <Button variant="ghost" size="sm">
                         <ArrowRight className="w-4 h-4" />
                       </Button>
                     </TableCell>
                   </TableRow>
                 ))
               )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useBakeryStore, ReceivedLot } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Save, Plus, Trash2, ThermometerSnowflake, ThermometerSun } from "lucide-react";
import { useState as useReactState, useEffect } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function DailyLog() {
  const { 
    ingredientTypes, 
    dailyLog, 
    receivedLots,
    updateDailyLog, 
    getActiveLotForDate,
    getLotsForIngredient,
    addIngredientType,
    removeIngredientType
  } = useBakeryStore();

  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isAdding, setIsAdding] = useState(false);
  const [newIng, setNewIng] = useState({ name: "", storage: "Ambient" as any });

  const handleLotChange = (typeId: string, lotId: string) => {
    updateDailyLog(selectedDate, typeId, lotId);
  };

  const handleAddIng = () => {
    if (!newIng.name) return;
    addIngredientType({ name: newIng.name, storage: newIng.storage, defaultUnit: 'kg', active: true });
    setIsAdding(false);
    setNewIng({ name: "", storage: "Ambient" });
    toast({ title: "Ingredient Added" });
  };

  const activeIngs = ingredientTypes.filter(i => i.active);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Daily Ingredient Log</h2>
          <p className="text-muted-foreground">Manage ingredients and their active batch codes.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm mr-2">
            <CalendarIcon className="w-5 h-5 text-muted-foreground" />
            <span className="font-mono font-bold text-lg">{format(new Date(selectedDate), "EEEE, MMM do")}</span>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}>
              Today
            </Button>
          </div>
          <Button onClick={() => setIsAdding(true)} className="gap-2 font-bold bg-primary text-white">
            <Plus className="w-4 h-4" /> Add Ingredient
          </Button>
        </div>
      </div>

      {isAdding && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <Label>Ingredient Name</Label>
              <Input value={newIng.name} onChange={e => setNewIng({...newIng, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Storage Condition</Label>
              <Select value={newIng.storage} onValueChange={v => setNewIng({...newIng, storage: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ambient">Ambient</SelectItem>
                  <SelectItem value="Chilled">Chilled</SelectItem>
                  <SelectItem value="Frozen">Frozen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddIng} className="flex-1 font-bold">Save</Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeIngs.map((type) => {
          const activeLot = getActiveLotForDate(selectedDate, type.id);
          const availableLots = getLotsForIngredient(type.id);
          const isExplicitlySetToday = dailyLog.some(d => d.date === selectedDate && d.ingredientTypeId === type.id);

          return (
            <Card key={type.id} className={cn("transition-all duration-200", isExplicitlySetToday ? "border-primary shadow-md bg-blue-50/20" : "border-border/60 hover:border-primary/50")}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg font-bold">{type.name}</CardTitle>
                    {type.storage === 'Chilled' ? <ThermometerSnowflake className="w-3 h-3 text-blue-500" /> : <ThermometerSun className="w-3 h-3 text-orange-500" />}
                  </div>
                  <div className="flex items-center gap-2">
                    {isExplicitlySetToday && (
                      <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-[10px] px-1.5 h-5">Updated</Badge>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => removeIngredientType(type.id)} className="h-6 w-6 text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="flex items-center gap-2">
                   <Badge variant="outline" className="text-[10px] h-5">{type.storage}</Badge>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Active Batch Code</label>
                  <Select 
                    value={activeLot?.id || ""} 
                    onValueChange={(val) => handleLotChange(type.id, val)}
                  >
                    <SelectTrigger className={cn("h-12 font-mono text-lg", !activeLot ? "text-muted-foreground border-dashed" : "font-bold bg-white")}>
                      <SelectValue placeholder="Select Batch..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLots.map(lot => (
                        <SelectItem key={lot.id} value={lot.id} className="flex justify-between items-center py-3">
                          <span className="font-bold font-mono mr-4">{lot.batchCode}</span>
                          <span className="text-xs text-muted-foreground">BB: {lot.bestBefore}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { format } from "date-fns";
import { useBakeryStore, ReceivedLot } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Save, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function DailyLog() {
  const { 
    ingredientTypes, 
    dailyLog, 
    receivedLots,
    updateDailyLog, 
    getActiveLotForDate,
    getLotsForIngredient
  } = useBakeryStore();

  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [hasChanges, setHasChanges] = useState(false);

  // Auto-carry forward logic is implicitly handled by getActiveLotForDate fallback, 
  // but let's make it explicit in UI if needed.
  
  const handleLotChange = (typeId: string, lotId: string) => {
    updateDailyLog(selectedDate, typeId, lotId);
    setHasChanges(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Daily Ingredient Log</h2>
          <p className="text-muted-foreground">Record active batch codes for today's production.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg border shadow-sm">
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
          <span className="font-mono font-bold text-lg">{format(new Date(selectedDate), "EEEE, MMM do")}</span>
          <Button variant="ghost" size="sm" onClick={() => setSelectedDate(format(new Date(), "yyyy-MM-dd"))}>
            Today
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ingredientTypes.map((type) => {
          const activeLot = getActiveLotForDate(selectedDate, type.id);
          const availableLots = getLotsForIngredient(type.id);
          // Find log entry specifically for this date to see if it was explicitly updated today
          const isExplicitlySetToday = dailyLog.some(d => d.date === selectedDate && d.ingredientTypeId === type.id);

          return (
            <Card key={type.id} className={cn("transition-all duration-200", isExplicitlySetToday ? "border-primary shadow-md bg-blue-50/20" : "border-border/60 hover:border-primary/50")}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold">{type.name}</CardTitle>
                  {isExplicitlySetToday && (
                    <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700">Updated</Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-2">
                   <Badge variant="outline" className="text-xs">{type.storage}</Badge>
                   <span className="text-xs text-muted-foreground">Unit: {type.defaultUnit}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Batch Code</label>
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
                      {availableLots.length === 0 && (
                        <div className="p-2 text-xs text-center text-muted-foreground">No received lots found. Go to Inventory to add.</div>
                      )}
                    </SelectContent>
                  </Select>
                  
                  {activeLot && (
                    <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                      <span>Received: {format(new Date(activeLot.receivedAt), "dd/MM")}</span>
                      <span className={cn(
                        new Date(activeLot.bestBefore) < new Date() ? "text-rose-600 font-bold" : "text-emerald-600"
                      )}>
                        BB: {activeLot.bestBefore}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="fixed bottom-6 right-6 md:hidden">
        <Button size="lg" className="rounded-full shadow-xl w-14 h-14 p-0">
          <Save className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}

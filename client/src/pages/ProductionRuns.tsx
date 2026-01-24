import { useState } from "react";
import { useBakeryStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Factory, Plus, Save, History, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ProductionRuns() {
  const { 
    batches, 
    productionRuns,
    users, 
    createProductionRun 
  } = useBakeryStore();
  
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  
  // Default ddmmyy
  const todayDDMMYY = format(new Date(), "ddMMyy");

  const [formData, setFormData] = useState({
    productName: "",
    sku: "",
    productBatchCode: todayDDMMYY,
    quantity: "",
    createdByUserId: "",
    selectedDoughIds: [] as string[],
    selectedFillingIds: [] as string[]
  });

  const handleCreate = () => {
    if (!formData.productName || !formData.createdByUserId || (formData.selectedDoughIds.length === 0 && formData.selectedFillingIds.length === 0)) {
      toast({ title: "Error", description: "Product name, operator, and at least one batch (dough or filling) required", variant: "destructive" });
      return;
    }

    createProductionRun({
      productName: formData.productName,
      sku: formData.sku || "SKU-GENERIC",
      productBatchCode: formData.productBatchCode,
      runDate: new Date().toISOString(),
      createdByUserId: formData.createdByUserId,
      quantity: Number(formData.quantity) || 0,
      doughBatchIds: formData.selectedDoughIds,
      fillingBatchIds: formData.selectedFillingIds
    });

    toast({ title: "Success", description: "Production Run Recorded" });
    setIsCreating(false);
    setFormData({
      productName: "",
      sku: "",
      productBatchCode: todayDDMMYY,
      quantity: "",
      createdByUserId: "",
      selectedDoughIds: [],
      selectedFillingIds: []
    });
  };

  const toggleDough = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selectedDoughIds: prev.selectedDoughIds.includes(id) 
        ? prev.selectedDoughIds.filter(x => x !== id)
        : [...prev.selectedDoughIds, id]
    }));
  };

  const toggleFilling = (id: string) => {
    setFormData(prev => ({
      ...prev,
      selectedFillingIds: prev.selectedFillingIds.includes(id) 
        ? prev.selectedFillingIds.filter(x => x !== id)
        : [...prev.selectedFillingIds, id]
    }));
  };

  const recentDoughBatches = batches.filter(b => b.type === 'Dough').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  const recentFillingBatches = batches.filter(b => b.type === 'Filling').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10);
  const runs = productionRuns.sort((a,b) => new Date(b.runDate).getTime() - new Date(a.runDate).getTime());

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Production Runs</h2>
          <p className="text-muted-foreground">Log finished goods and link them to dough/filling batches.</p>
        </div>
        <Button onClick={() => setIsCreating(true)} size="lg" className="gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isCreating}>
          <Plus className="w-5 h-5" />
          Log Production Run
        </Button>
      </div>

      {isCreating && (
        <Card className="border-emerald-600 shadow-lg animate-in slide-in-from-top-4">
          <CardHeader className="bg-emerald-600 text-white rounded-t-lg py-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Factory className="w-5 h-5" />
              New Production Run
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                 <Label>Product Name</Label>
                 <Input 
                   placeholder="e.g. Strawberry Tart" 
                   value={formData.productName}
                   onChange={e => setFormData({ ...formData, productName: e.target.value })}
                   className="font-medium"
                 />
              </div>
              <div className="space-y-2">
                 <Label>Product Batch (ddmmyy)</Label>
                 <Input 
                   value={formData.productBatchCode} 
                   onChange={e => setFormData({ ...formData, productBatchCode: e.target.value })}
                   className="font-mono bg-emerald-50 text-emerald-900 border-emerald-200"
                 />
              </div>
              <div className="space-y-2">
                 <Label>Quantity Produced</Label>
                 <Input 
                   type="number"
                   placeholder="0"
                   value={formData.quantity}
                   onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                 />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-base text-primary font-bold">Select Dough Batches</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                  {recentDoughBatches.map(b => (
                    <div key={b.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer" onClick={() => toggleDough(b.id)}>
                      <Checkbox checked={formData.selectedDoughIds.includes(b.id)} />
                      <div className="flex-1">
                        <span className="font-mono font-bold text-xs mr-2">{b.code}</span>
                        <span className="text-sm">{b.name}</span>
                      </div>
                    </div>
                  ))}
                  {recentDoughBatches.length === 0 && <p className="text-xs text-muted-foreground p-2">No active dough batches.</p>}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-base text-amber-700 font-bold">Select Filling Batches</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-2">
                  {recentFillingBatches.map(b => (
                    <div key={b.id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer" onClick={() => toggleFilling(b.id)}>
                      <Checkbox checked={formData.selectedFillingIds.includes(b.id)} className="data-[state=checked]:bg-amber-600 data-[state=checked]:border-amber-600" />
                      <div className="flex-1">
                        <span className="font-mono font-bold text-xs mr-2">{b.code}</span>
                        <span className="text-sm">{b.name}</span>
                      </div>
                    </div>
                  ))}
                  {recentFillingBatches.length === 0 && <p className="text-xs text-muted-foreground p-2">No active filling batches.</p>}
                </div>
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
                     className={cn("min-w-[100px]", formData.createdByUserId === user.id && "bg-emerald-600 hover:bg-emerald-700")}
                   >
                     {user.name}
                   </Button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
              <Button onClick={handleCreate} size="lg" className="w-40 font-bold gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Save className="w-4 h-4" />
                Finish Run
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <History className="w-5 h-5 text-muted-foreground" />
             Production History
           </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product Batch</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Inputs</TableHead>
                <TableHead>Operator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
               {runs.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No production runs recorded yet.</TableCell>
                 </TableRow>
               ) : (
                 runs.map(run => (
                   <TableRow key={run.id}>
                     <TableCell className="font-mono text-xs">{format(new Date(run.runDate), "dd/MM/yy HH:mm")}</TableCell>
                     <TableCell className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded w-fit">{run.productBatchCode}</TableCell>
                     <TableCell className="font-medium">{run.productName}</TableCell>
                     <TableCell>{run.quantity}</TableCell>
                     <TableCell className="text-xs text-muted-foreground">
                       {run.doughBatchIds.length} Dough, {run.fillingBatchIds.length} Filling
                     </TableCell>
                     <TableCell>{users.find(u => u.id === run.createdByUserId)?.name}</TableCell>
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

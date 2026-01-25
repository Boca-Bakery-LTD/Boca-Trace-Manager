import { useState } from "react";
import { useBakeryStore, ProductionRun } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Factory, Save, History } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function ProductionRuns() {
  const { 
    batches, 
    productionRuns,
    productCatalog,
    users, 
    createProductionRun 
  } = useBakeryStore();
  
  const { toast } = useToast();
  
  const todayDDMMYY = format(new Date(), "ddMMyy");
  const [productBatchCode, setProductBatchCode] = useState(todayDDMMYY);
  const [createdByUserId, setCreatedByUserId] = useState("");
  
  // Track quantities and batch selections per catalog product
  const [entries, setEntries] = useState<Record<string, {
    quantity: string;
    selectedDoughIds: string[];
    selectedFillingIds: string[];
  }>>({});

  const updateEntry = (productId: string, field: string, value: any) => {
    setEntries(prev => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { quantity: "", selectedDoughIds: [], selectedFillingIds: [] }),
        [field]: value
      }
    }));
  };

  const handleFinishRun = (productId: string) => {
    const product = productCatalog.find(p => p.id === productId);
    const entry = entries[productId];
    
    if (!product || !entry || !entry.quantity || !createdByUserId) {
      toast({ title: "Error", description: "Quantity and Operator required", variant: "destructive" });
      return;
    }

    if (product.hasDough && entry.selectedDoughIds.length === 0) {
      toast({ title: "Error", description: "Please select at least one dough batch", variant: "destructive" });
      return;
    }

    if (product.hasFilling && entry.selectedFillingIds.length === 0) {
      toast({ title: "Error", description: "Please select at least one filling batch", variant: "destructive" });
      return;
    }

    createProductionRun({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      productBatchCode,
      runDate: new Date().toISOString(),
      createdByUserId,
      quantity: Number(entry.quantity),
      doughBatchIds: entry.selectedDoughIds,
      fillingBatchIds: entry.selectedFillingIds
    });

    toast({ title: "Success", description: `${product.name} Production Logged` });
    
    // Reset entry
    updateEntry(productId, 'quantity', "");
  };

  const recentDoughBatches = batches.filter(b => b.type === 'Dough').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const recentFillingBatches = batches.filter(b => b.type === 'Filling').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
  const runs = productionRuns.sort((a,b) => new Date(b.runDate).getTime() - new Date(a.runDate).getTime());

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Daily Production Log</h2>
          <p className="text-muted-foreground">Record quantities of finished products for today's run.</p>
        </div>
        <div className="flex gap-4">
           <div className="space-y-1">
             <Label className="text-[10px] uppercase font-bold text-muted-foreground">Batch Code</Label>
             <Input value={productBatchCode} onChange={e => setProductBatchCode(e.target.value)} className="font-mono bg-emerald-50 w-32 h-10" />
           </div>
           <div className="space-y-1">
             <Label className="text-[10px] uppercase font-bold text-muted-foreground">Operator</Label>
             <div className="flex gap-1">
                {users.filter(u => u.role !== 'Admin').map(u => (
                  <Button 
                    key={u.id} 
                    variant={createdByUserId === u.id ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setCreatedByUserId(u.id)}
                    className={cn(createdByUserId === u.id && "bg-emerald-600")}
                  >
                    {u.name.split(' ')[0]}
                  </Button>
                ))}
             </div>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        {productCatalog.map(product => {
          const entry = entries[product.id] || { quantity: "", selectedDoughIds: [], selectedFillingIds: [] };
          return (
            <Card key={product.id} className="overflow-hidden border-l-4 border-l-primary/20 hover:border-l-primary transition-all">
              <CardContent className="p-4 flex flex-col md:flex-row gap-6 items-start">
                <div className="md:w-1/4">
                  <h3 className="font-bold text-lg">{product.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                  <div className="mt-2 flex gap-1">
                    {product.hasDough && <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">DOUGH</span>}
                    {product.hasFilling && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">FILLING</span>}
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.hasDough && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground">SELECT DOUGH BATCH</Label>
                      <div className="flex flex-wrap gap-2">
                        {recentDoughBatches.map(b => (
                          <Button 
                            key={b.id} 
                            variant={entry.selectedDoughIds.includes(b.id) ? "default" : "outline"}
                            size="sm"
                            className="text-[10px] h-7 px-2 font-mono"
                            onClick={() => {
                              const ids = entry.selectedDoughIds.includes(b.id) ? [] : [b.id];
                              updateEntry(product.id, 'selectedDoughIds', ids);
                            }}
                          >
                            {b.code}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.hasFilling && (
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-muted-foreground">SELECT FILLING BATCH</Label>
                      <div className="flex flex-wrap gap-2">
                        {recentFillingBatches.map(b => (
                          <Button 
                            key={b.id} 
                            variant={entry.selectedFillingIds.includes(b.id) ? "default" : "outline"}
                            size="sm"
                            className={cn("text-[10px] h-7 px-2 font-mono", entry.selectedFillingIds.includes(b.id) && "bg-amber-600 hover:bg-amber-700")}
                            onClick={() => {
                              const ids = entry.selectedFillingIds.includes(b.id) ? [] : [b.id];
                              updateEntry(product.id, 'selectedFillingIds', ids);
                            }}
                          >
                            {b.code}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:w-1/5 flex gap-2 items-end">
                  <div className="space-y-2 flex-1">
                    <Label className="text-[10px] font-bold text-muted-foreground">QUANTITY</Label>
                    <Input 
                      type="number" 
                      placeholder="0" 
                      value={entry.quantity} 
                      onChange={e => updateEntry(product.id, 'quantity', e.target.value)}
                      className="h-10 text-center text-lg font-bold"
                    />
                  </div>
                  <Button 
                    onClick={() => handleFinishRun(product.id)}
                    className="h-10 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            Recent Production History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Operator</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.slice(0, 10).map(run => (
                <TableRow key={run.id}>
                  <TableCell className="font-mono text-[10px] font-bold text-emerald-700">{run.productBatchCode}</TableCell>
                  <TableCell className="text-sm font-medium">{run.productName}</TableCell>
                  <TableCell className="text-sm">{run.quantity}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {users.find(u => u.id === run.createdByUserId)?.name}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

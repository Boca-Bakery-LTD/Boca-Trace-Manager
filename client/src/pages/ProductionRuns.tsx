import { useState, useEffect } from "react";
import { useBakeryStore, ProductionRun } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Factory, Save, History, Users, CheckCircle2, Circle } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function ProductionRuns() {
  const { 
    batches, 
    productionRuns,
    productCatalog,
    users, 
    createProductionRun 
  } = useBakeryStore();
  
  const { toast } = useToast();
  const today = new Date();
  const todayDateStr = format(today, "yyyy-MM-dd");
  const todayDDMMYY = format(today, "ddMMyy");

  const staff = users.filter(u => u.role !== 'Admin');
  
  const [productBatchCode, setProductBatchCode] = useState(todayDDMMYY);
  const [leadOperatorId, setLeadOperatorId] = useState("");
  const [presentOperators, setPresentOperators] = useState<string[]>(staff.map(u => u.id));
  
  // Daily Batches
  const todayDoughBatches = batches
    .filter(b => b.type === 'Dough' && isSameDay(new Date(b.createdAt), today))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
  const todayFillingBatches = batches.filter(b => b.type === 'Filling' && isSameDay(new Date(b.createdAt), today));
  
  // Persistent filling selection logic: Use today's if exists, else most recent ever
  const recentFillings = batches.filter(b => b.type === 'Filling').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const [excludedBatches, setExcludedBatches] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, string>>({});
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const handleFinishGroup = () => {
    const finalQuantities: Record<string, number> = {};
    let hasEntries = false;
    
    productCatalog.forEach(p => {
      const q = Number(quantities[p.id]);
      if (q > 0) {
        finalQuantities[p.id] = q;
        hasEntries = true;
      }
    });

    if (!hasEntries) {
      toast({ title: "Error", description: "No quantities recorded", variant: "destructive" });
      return;
    }

    // Default batches used (most recent today's dough + current fillings)
    const dIds = todayDoughBatches.slice(0, 1).map(b => b.id);
    const fIds = (todayFillingBatches.length > 0 ? todayFillingBatches : recentFillings.slice(0, 1)).map(b => b.id);

    createProductionRun({
      productBatchCode,
      runDate: new Date().toISOString(),
      createdByUserId: presentOperators[0] || 'system',
      operatorIds: presentOperators,
      quantities: finalQuantities,
      doughBatchIds: dIds,
      fillingBatchIds: fIds,
      excludedBatches
    });

    toast({ title: "Daily Production Group Saved" });
    setQuantities({});
  };

  const toggleOperator = (id: string) => {
    setPresentOperators(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const runs = productionRuns.sort((a,b) => new Date(b.runDate).getTime() - new Date(a.runDate).getTime());

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Daily Production Group</h2>
          <p className="text-muted-foreground">Log all finished products for today's batch: <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 rounded">{productBatchCode}</span></p>
        </div>
        <div className="flex flex-col items-end gap-2">
           <Label className="text-[10px] font-bold uppercase text-muted-foreground">Select Batch Code</Label>
           <Input value={productBatchCode} onChange={e => setProductBatchCode(e.target.value)} className="w-32 h-10 font-mono text-center bg-emerald-50 font-bold border-emerald-200" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Operators & Global Config */}
        <div className="space-y-6">
          <Card className="border-emerald-100">
            <CardHeader className="py-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                Staff Presence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
               {staff.map(u => (
                 <div key={u.id} className="flex items-center justify-between p-2 rounded border hover:bg-muted/50 cursor-pointer" onClick={() => toggleOperator(u.id)}>
                    <div className="flex items-center gap-2">
                      {presentOperators.includes(u.id) ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                      <span className={cn("text-sm font-medium", !presentOperators.includes(u.id) && "text-muted-foreground line-through")}>{u.name}</span>
                    </div>
                 </div>
               ))}
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader className="py-4">
              <CardTitle className="text-sm">Today's Batches (Auto-Selected)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-[10px] text-muted-foreground font-bold uppercase mb-2">Dough</p>
              {todayDoughBatches.map(b => (
                 <div key={b.id} className="flex items-center justify-between text-xs p-2 bg-blue-50/50 rounded border border-blue-100">
                   <span className="font-mono font-bold">{b.code}</span>
                   <Button variant="ghost" size="sm" className="h-6 px-2 text-rose-500 hover:text-rose-700" onClick={() => setExcludedBatches([...excludedBatches, b.id])}>Disable</Button>
                 </div>
              ))}
              <p className="text-[10px] text-muted-foreground font-bold uppercase mt-4 mb-2">Filling</p>
              {(todayFillingBatches.length > 0 ? todayFillingBatches : recentFillings.slice(0, 1)).map(b => (
                <div key={b.id} className="flex items-center justify-between text-xs p-2 bg-amber-50/50 rounded border border-amber-100">
                  <span className="font-mono font-bold">{b.code}</span>
                  <Badge variant="outline" className="text-[8px] bg-white">{isSameDay(new Date(b.createdAt), today) ? 'Today' : 'Stored'}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Center: Daily Checklist */}
        <div className="lg:col-span-3 space-y-4">
           <Card className="border-primary/20 shadow-sm">
             <CardHeader className="bg-muted/30 py-4 flex flex-row justify-between items-center">
                <CardTitle className="text-lg">Quantities Produced Today</CardTitle>
                <Button onClick={handleFinishGroup} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                   <Save className="w-4 h-4" /> Save Daily Group
                </Button>
             </CardHeader>
             <CardContent className="p-0">
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead className="w-[300px]">Product Name</TableHead>
                     <TableHead>SKU</TableHead>
                     <TableHead>Required Batches</TableHead>
                     <TableHead className="text-right w-[150px]">Quantity</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {productCatalog.filter(p => p.active).map(product => (
                     <TableRow key={product.id} className="group hover:bg-muted/10">
                       <TableCell className="font-bold">{product.name}</TableCell>
                       <TableCell className="font-mono text-xs text-muted-foreground">{product.sku}</TableCell>
                       <TableCell>
                          <div className="flex gap-1">
                            {product.hasDough && <Badge className="bg-blue-100 text-blue-700 border-none text-[8px]">DOUGH</Badge>}
                            {product.hasFilling && <Badge className="bg-amber-100 text-amber-700 border-none text-[8px]">FILLING</Badge>}
                          </div>
                       </TableCell>
                       <TableCell className="text-right">
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="text-right font-bold text-lg h-10 bg-white group-hover:bg-primary/5 transition-colors"
                            value={quantities[product.id] || ""}
                            onChange={e => setQuantities({...quantities, [product.id]: e.target.value})}
                          />
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </CardContent>
           </Card>

           <Card>
             <CardHeader className="py-4">
               <CardTitle className="text-sm font-bold flex items-center gap-2">
                 <History className="w-4 h-4 text-muted-foreground" />
                 Recent History
               </CardTitle>
             </CardHeader>
             <CardContent>
                <Table>
                   <TableHeader>
                      <TableRow>
                        <TableHead>Batch</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Lead</TableHead>
                        <TableHead className="text-right">Total Units</TableHead>
                      </TableRow>
                   </TableHeader>
                   <TableBody>
                      {runs.slice(0, 10).map(run => {
                        const total = Object.values(run.quantities).reduce((a,b) => a + b, 0);
                        const operator = users.find(u => u.id === run.createdByUserId);
                        const isExpanded = expandedRunId === run.id;

                        return (
                          <>
                            <TableRow 
                              key={run.id} 
                              className="cursor-pointer hover:bg-muted/30"
                              onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                            >
                              <TableCell className="font-mono font-bold text-emerald-700">
                                <div className="flex items-center gap-2">
                                  {run.productBatchCode}
                                  {isExpanded ? <Badge variant="secondary" className="text-[8px]">Collapse</Badge> : <Badge variant="outline" className="text-[8px]">Expand</Badge>}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs">{format(new Date(run.runDate), "dd/MM/yy")}</TableCell>
                              <TableCell className="text-xs">{Object.keys(run.quantities).length} Products</TableCell>
                              <TableCell className="text-xs font-medium">{operator?.name}</TableCell>
                              <TableCell className="text-right font-bold">{total}</TableCell>
                            </TableRow>
                            {isExpanded && (
                              <TableRow className="bg-muted/20">
                                <TableCell colSpan={5} className="p-4">
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.entries(run.quantities).map(([productId, qty]) => {
                                      const product = productCatalog.find(p => p.id === productId);
                                      return (
                                        <div key={productId} className="flex justify-between items-center p-2 border rounded bg-white">
                                          <span className="text-xs font-medium">{product?.name}</span>
                                          <span className="text-xs font-bold text-emerald-700">{qty}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div className="mt-4 flex gap-4 text-[10px] text-muted-foreground uppercase font-bold">
                                    <div>Batches Used: </div>
                                    <div className="flex gap-2">
                                      {run.doughBatchIds.map(id => {
                                        const b = batches.find(x => x.id === id);
                                        return <Badge key={id} variant="secondary" className="text-[8px]">{b?.code}</Badge>;
                                      })}
                                      {run.fillingBatchIds.map(id => {
                                        const b = batches.find(x => x.id === id);
                                        return <Badge key={id} variant="secondary" className="text-[8px] bg-amber-50 text-amber-700 border-amber-200">{b?.code}</Badge>;
                                      })}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        )
                      })}
                   </TableBody>
                </Table>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

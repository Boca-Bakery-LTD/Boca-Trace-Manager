import { useState } from "react";
import { useBakeryStore, Batch, ProductionRun, ReceivedLot } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Siren, AlertTriangle, CheckCircle2, Printer, Search, Package, Database } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function RecallTest() {
  const { 
    productionRuns, 
    batches, 
    receivedLots, 
    ingredientTypes,
    doughBatchIngredients,
    fillingBatchIngredients,
    productCatalog,
    users,
    addAuditLog
  } = useBakeryStore();
  
  const [recallType, setRecallType] = useState<"Ingredient" | "Batch" | "Product">("Ingredient");
  const [query, setQuery] = useState("");
  const [ingredientTypeId, setIngredientTypeId] = useState<string>("all");
  
  const [hasRun, setHasRun] = useState(false);
  const [traceData, setTraceData] = useState<{
    impactedLots: ReceivedLot[];
    impactedBatches: Batch[];
    impactedRuns: ProductionRun[];
  } | null>(null);

  const handleRunRecall = () => {
    if (!query) return;

    let impactedLots: ReceivedLot[] = [];
    let impactedBatches: Batch[] = [];
    let impactedRuns: ProductionRun[] = [];

    const searchStr = query.trim().toUpperCase();

    if (recallType === 'Ingredient') {
      // 1. Find matched lots
      impactedLots = receivedLots.filter(l => {
        const matchesCode = l.batchCode.toUpperCase().includes(searchStr);
        const matchesType = ingredientTypeId === 'all' || l.ingredientTypeId === ingredientTypeId;
        return matchesCode && matchesType;
      });

      const lotIds = impactedLots.map(l => l.id);

      // 2. Find batches using these lots
      const affectedDoughBatchIds = doughBatchIngredients
        .filter(dbi => lotIds.includes(dbi.receivedLotId))
        .map(dbi => dbi.doughBatchId);
      
      const affectedFillingBatchIds = fillingBatchIngredients
        .filter(fbi => lotIds.includes(fbi.receivedLotId))
        .map(fbi => fbi.fillingBatchId);

      impactedBatches = batches.filter(b => 
        affectedDoughBatchIds.includes(b.id) || 
        affectedFillingBatchIds.includes(b.id)
      );

      const batchIds = impactedBatches.map(b => b.id);

      // 3. Find runs using these batches
      impactedRuns = productionRuns.filter(run => {
        return run.doughBatchIds.some(id => batchIds.includes(id)) || 
               run.fillingBatchIds.some(id => batchIds.includes(id));
      });

    } else if (recallType === 'Batch') {
      impactedBatches = batches.filter(b => b.code.toUpperCase().includes(searchStr));
      const batchIds = impactedBatches.map(b => b.id);

      impactedRuns = productionRuns.filter(run => {
        return run.doughBatchIds.some(id => batchIds.includes(id)) || 
               run.fillingBatchIds.some(id => batchIds.includes(id));
      });
    } else {
      impactedRuns = productionRuns.filter(r => r.productBatchCode.toUpperCase().includes(searchStr));
      
      // For product batch recalls, we also want to show the specific dough/filling batches used
      const doughIds = [...new Set(impactedRuns.flatMap(r => r.doughBatchIds))];
      const fillingIds = [...new Set(impactedRuns.flatMap(r => r.fillingBatchIds))];
      impactedBatches = batches.filter(b => doughIds.includes(b.id) || fillingIds.includes(b.id));
    }

    setTraceData({ impactedLots, impactedBatches, impactedRuns });
    setHasRun(true);
    addAuditLog('RECALL_TEST_RUN', `Recall run for ${recallType}: ${searchStr}`, 'system', 'RecallTest', searchStr);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-rose-200 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-rose-100 rounded-full text-rose-600">
            <Siren className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-3xl font-display font-bold text-rose-700 tracking-tight">Recall Verification</h2>
            <p className="text-rose-600/80">Environmental Officer report for lot-initiated recalls.</p>
          </div>
        </div>
        {hasRun && (
          <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print Report
          </Button>
        )}
      </div>

      <Card className="border-rose-200 shadow-sm print:hidden">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Recall Source Type</Label>
              <Select value={recallType} onValueChange={(v: any) => { setRecallType(v); setHasRun(false); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ingredient">Ingredient Batch</SelectItem>
                  <SelectItem value="Batch">Dough/Filling Batch</SelectItem>
                  <SelectItem value="Product">Product Batch Code</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recallType === 'Ingredient' && (
              <div className="space-y-2">
                <Label>Ingredient Type (Optional)</Label>
                <Select value={ingredientTypeId} onValueChange={setIngredientTypeId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {ingredientTypes.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className={cn("space-y-2", recallType === 'Ingredient' ? "md:col-span-1" : "md:col-span-2")}>
              <Label>Batch Code to Trace</Label>
              <Input 
                value={query} 
                onChange={e => { setQuery(e.target.value); setHasRun(false); }}
                placeholder={recallType === 'Ingredient' ? "e.g. FL-23-001" : recallType === 'Batch' ? "e.g. DOUGH-101" : "e.g. 240526"}
                className="font-mono"
              />
            </div>

            <Button onClick={handleRunRecall} className="bg-rose-600 hover:bg-rose-700 text-white font-bold h-10">
              <Search className="w-4 h-4 mr-2" />
              Run Simulation
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasRun && traceData && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 print:space-y-4">
          <div className="bg-rose-50 border border-rose-200 p-6 rounded-lg space-y-4 print:bg-white print:border-none print:p-0">
             <div className="flex justify-between items-start">
               <div>
                 <h3 className="text-2xl font-display font-bold text-rose-800">Recall Verification Report</h3>
                 <p className="text-sm text-rose-600">Generated: {format(new Date(), "PPP p")}</p>
               </div>
               <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 px-3 py-1">
                 <CheckCircle2 className="w-3 h-3 mr-1" />
                 Trace Verified
               </Badge>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="font-bold text-rose-900">Search Parameter</p>
                  <p className="font-mono text-rose-700 uppercase">{query}</p>
                </div>
                <div>
                  <p className="font-bold text-rose-900">Type</p>
                  <p className="text-rose-700">{recallType}</p>
                </div>
                <div>
                  <p className="font-bold text-rose-900">User</p>
                  <p className="text-rose-700">John Doe (Production Mgr)</p>
                </div>
                <div>
                  <p className="font-bold text-rose-900">Status</p>
                  <p className="text-rose-700">COMPLETED</p>
                </div>
             </div>

             <div className="bg-white p-4 rounded border border-rose-100 print:bg-muted/10">
                <p className="text-rose-800 font-bold mb-2">Summary Conclusion</p>
                <p className="text-rose-700">
                  System identified <span className="font-bold underline">{traceData.impactedRuns.length}</span> impacted product batches 
                  across <span className="font-bold underline">{[...new Set(traceData.impactedRuns.map(r => r.productBatchCode))].length}</span> unique production dates.
                </p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3">
            <Card className="border-rose-100">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Impacted Lots</p>
                <p className="text-3xl font-bold text-rose-600">{traceData.impactedLots.length}</p>
              </CardContent>
            </Card>
            <Card className="border-rose-100">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Dough/Filling Batches</p>
                <p className="text-3xl font-bold text-rose-600">{traceData.impactedBatches.length}</p>
              </CardContent>
            </Card>
            <Card className="border-rose-100">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Final Product Runs</p>
                <p className="text-3xl font-bold text-rose-600">{traceData.impactedRuns.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Impacted Intermediate Batches Section */}
            {traceData.impactedBatches.length > 0 && (
              <section className="space-y-2">
                <h4 className="font-bold text-rose-900 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  Impacted Production Batches (Dough/Filling)
                </h4>
                <div className="bg-white rounded border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>Batch Code</TableHead>
                        <TableHead>Recipe</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Products Made</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {traceData.impactedBatches.map(batch => {
                        const productsInBatch = productionRuns.filter(r => 
                          r.doughBatchIds.includes(batch.id) || 
                          r.fillingBatchIds.includes(batch.id)
                        ).flatMap(r => Object.keys(r.quantities).map(pid => productCatalog.find(p => p.id === pid)?.name));
                        
                        const uniqueProducts = [...new Set(productsInBatch.filter(Boolean))];

                        return (
                          <TableRow key={batch.id}>
                            <TableCell className="font-mono font-bold text-rose-700">{batch.code}</TableCell>
                            <TableCell>{batch.name}</TableCell>
                            <TableCell><Badge variant={batch.type === 'Dough' ? 'default' : 'secondary'}>{batch.type}</Badge></TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {uniqueProducts.length > 0 ? (
                                  uniqueProducts.map((name, i) => (
                                    <Badge key={i} variant="outline" className="text-[9px] bg-muted/50">{name}</Badge>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-muted-foreground italic">Not used in runs yet</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{format(new Date(batch.createdAt), "dd/MM/yy HH:mm")}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </section>
            )}

            {/* Impacted Final Products Section */}
            <section className="space-y-2">
                <h4 className="font-bold text-rose-900 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Impacted Final Products (Recall Action Required)
                </h4>
                <div className="bg-white rounded border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow>
                        <TableHead>Product Batch Code</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Production Date</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Operator</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {traceData.impactedRuns.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No impacted products found for this trace.</TableCell>
                        </TableRow>
                      ) : (
                        traceData.impactedRuns.flatMap(run => 
                          Object.entries(run.quantities).map(([productId, qty]: [string, any]) => {
                            const product = productCatalog.find(p => p.id === productId);
                            return (
                              <TableRow key={`${run.id}-${productId}`} className="bg-rose-50/20">
                                <TableCell className="font-mono font-bold text-rose-700">{run.productBatchCode}</TableCell>
                                <TableCell className="font-medium">{product?.name || 'Unknown Product'}</TableCell>
                                <TableCell className="text-xs">{format(new Date(run.runDate), "dd/MM/yyyy HH:mm")}</TableCell>
                                <TableCell className="font-bold">{qty}</TableCell>
                                <TableCell className="text-xs">{users.find(u => u.id === run.createdByUserId)?.name}</TableCell>
                              </TableRow>
                            );
                          })
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </section>
          </div>
        </div>
      )}
    </div>
  );
}

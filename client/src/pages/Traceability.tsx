import { useState, useMemo } from "react";
import { useBakeryStore, Batch, ProductionRun, ReceivedLot } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Printer, ArrowRight, Package, LayoutGrid, FileText, User, Calendar, Truck } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function Traceability() {
  const { 
    productionRuns, 
    batches, 
    receivedLots, 
    ingredientTypes,
    doughBatchIngredients,
    fillingBatchIngredients,
    productionRunDoughBatches,
    productionRunFillingBatches,
    receivingReports,
    users,
    addAuditLog
  } = useBakeryStore();

  const [mode, setMode] = useState<"product" | "ingredient" | "lookup">("product");
  const [query, setQuery] = useState("");
  const [ingredientTypeId, setIngredientTypeId] = useState<string>("all");
  const [searched, setSearched] = useState(false);
  
  // Results
  const [productResults, setProductResults] = useState<ProductionRun[]>([]);
  const [ingredientResults, setIngredientResults] = useState<{
    lots: ReceivedLot[];
    batches: Batch[];
    runs: ProductionRun[];
  } | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    const searchStr = query.trim().toUpperCase();

    if (mode === 'product') {
      const found = productionRuns.filter(r => r.productBatchCode.includes(searchStr));
      setProductResults(found);
      addAuditLog('TRACE_SEARCHED', `Product batch trace for ${searchStr}`, 'system', 'Traceability', searchStr);
    } else if (mode === 'ingredient') {
      // Forward Trace
      const matchedLots = receivedLots.filter(l => {
        const matchesCode = l.batchCode.toUpperCase().includes(searchStr);
        const matchesType = ingredientTypeId === 'all' || l.ingredientTypeId === ingredientTypeId;
        return matchesCode && matchesType;
      });

      const lotIds = matchedLots.map(l => l.id);

      const affDoughIds = doughBatchIngredients.filter(dbi => lotIds.includes(dbi.receivedLotId)).map(dbi => dbi.doughBatchId);
      const affFillIds = fillingBatchIngredients.filter(fbi => lotIds.includes(fbi.receivedLotId)).map(fbi => fbi.fillingBatchId);
      
      const affBatches = batches.filter(b => affDoughIds.includes(b.id) || affFillIds.includes(b.id));
      const batchIds = affBatches.map(b => b.id);

      const affRuns = productionRuns.filter(run => {
        const dIds = productionRunDoughBatches.filter(l => l.productionRunId === run.id).map(l => l.doughBatchId);
        const fIds = productionRunFillingBatches.filter(l => l.productionRunId === run.id).map(l => l.fillingBatchId);
        return dIds.some(id => batchIds.includes(id)) || fIds.some(id => batchIds.includes(id));
      });

      setIngredientResults({ lots: matchedLots, batches: affBatches, runs: affRuns });
      addAuditLog('TRACE_SEARCHED', `Ingredient batch forward trace for ${searchStr}`, 'system', 'Traceability', searchStr);
    }

    setSearched(true);
  };

  // Inventory Lookup (Live filter)
  const lookupResults = useMemo(() => {
    if (mode !== 'lookup' || !query) return [];
    const s = query.trim().toUpperCase();
    return receivedLots.filter(l => {
      const matchesCode = l.batchCode.toUpperCase().includes(s);
      const matchesType = ingredientTypeId === 'all' || l.ingredientTypeId === ingredientTypeId;
      return matchesCode && matchesType;
    });
  }, [mode, query, ingredientTypeId, receivedLots]);

  // Expand detail view for a specific run (Backward Trace)
  const ExpandedTrace = ({ run }: { run: ProductionRun }) => {
    const dIds = productionRunDoughBatches.filter(l => l.productionRunId === run.id).map(l => l.doughBatchId);
    const fIds = productionRunFillingBatches.filter(l => l.productionRunId === run.id).map(l => l.fillingBatchId);
    
    const linkedBatches = batches.filter(b => dIds.includes(b.id) || fIds.includes(b.id));
    const linkedLotIds = [
      ...doughBatchIngredients.filter(dbi => dIds.includes(dbi.doughBatchId)).map(dbi => dbi.receivedLotId),
      ...fillingBatchIngredients.filter(fbi => fIds.includes(fbi.fillingBatchId)).map(fbi => fbi.receivedLotId)
    ];
    
    const linkedLots = receivedLots.filter(l => linkedLotIds.includes(l.id));

    return (
      <div className="mt-4 p-4 bg-muted/30 rounded-lg border space-y-4">
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">Intermediate Batches</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {linkedBatches.map(b => (
              <div key={b.id} className="bg-white p-2 rounded border text-sm flex justify-between items-center">
                <span className="font-bold font-mono text-primary">{b.code}</span>
                <span className="flex-1 px-4">{b.name}</span>
                <Badge variant="outline">{b.type}</Badge>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-2">Ingredient Genealogy</h4>
          <Table>
            <TableHeader className="bg-white">
              <TableRow>
                <TableHead>Ingredient</TableHead>
                <TableHead>Supplier Batch</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Best Before</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {linkedLots.map(lot => {
                const type = ingredientTypes.find(t => t.id === lot.ingredientTypeId);
                return (
                  <TableRow key={lot.id}>
                    <TableCell className="font-medium">{type?.name}</TableCell>
                    <TableCell className="font-mono font-bold">{lot.batchCode}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{lot.storage}</Badge></TableCell>
                    <TableCell className="text-xs">{lot.bestBefore}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="border-b pb-6">
        <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Traceability Center</h2>
        <p className="text-muted-foreground">End-to-end genealogy and ingredient batch tracking.</p>
      </div>

      <Tabs value={mode} onValueChange={(v: any) => { setMode(v); setSearched(false); setQuery(""); }} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="product" className="font-bold">Product Trace (Backward)</TabsTrigger>
          <TabsTrigger value="ingredient" className="font-bold">Ingredient Trace (Forward)</TabsTrigger>
          <TabsTrigger value="lookup" className="font-bold">Inventory Lot Lookup</TabsTrigger>
        </TabsList>

        <Card className="border-2 border-primary/20">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                {mode !== 'product' && (
                  <div className="w-full md:w-1/3 space-y-2">
                    <Label>Ingredient Type</Label>
                    <Select value={ingredientTypeId} onValueChange={setIngredientTypeId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {ingredientTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Label>
                    {mode === 'product' ? "Product Batch Code (ddmmyy)" : "Batch Code to Trace"}
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input 
                        placeholder={mode === 'product' ? "e.g. 250126" : "Enter batch code..."} 
                        className="pl-9 h-12 text-lg font-mono"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    {mode !== 'lookup' && (
                      <Button type="submit" size="lg" className="h-12 px-8 font-bold">
                        Trace
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Product Trace View */}
        <TabsContent value="product" className="space-y-4">
          {searched && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Trace Results: {productResults.length} Runs</h3>
                <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print Report</Button>
              </div>
              {productResults.map(run => (
                <Card key={run.id} className="overflow-hidden border-l-4 border-l-primary">
                  <CardHeader className="bg-muted/30 pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{run.productName}</CardTitle>
                        <p className="text-xs text-muted-foreground font-mono mt-1">Batch: {run.productBatchCode} • Run: {format(new Date(run.runDate), "PPP p")}</p>
                      </div>
                      <Badge className="bg-primary">{run.quantity} Units</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <ExpandedTrace run={run} />
                  </CardContent>
                </Card>
              ))}
              {productResults.length === 0 && <div className="p-12 text-center border rounded-lg bg-muted/5 text-muted-foreground">No production runs found.</div>}
            </div>
          )}
        </TabsContent>

        {/* Ingredient Trace View */}
        <TabsContent value="ingredient" className="space-y-4">
           {searched && ingredientResults && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
               <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold">Forward Trace Report</h3>
                  <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" />Print Full Geneology</Button>
               </div>
               
               {/* Summary Tree */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Lots */}
                 <div className="space-y-3">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">1. Matched Lots</h4>
                   {ingredientResults.lots.map(lot => (
                     <Card key={lot.id} className="p-3 border-l-4 border-l-orange-400">
                        <p className="font-mono font-bold text-sm">{lot.batchCode}</p>
                        <p className="text-xs font-medium">{ingredientTypes.find(t => t.id === lot.ingredientTypeId)?.name}</p>
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                           <Truck className="w-3 h-3" />
                           {receivingReports.find(r => r.id === lot.receivingReportId)?.reference || 'Direct Entry'}
                        </div>
                     </Card>
                   ))}
                 </div>
                 
                 {/* Batches */}
                 <div className="space-y-3">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">2. Intermediate Batches</h4>
                   {ingredientResults.batches.map(b => (
                     <Card key={b.id} className="p-3 border-l-4 border-l-primary">
                        <p className="font-mono font-bold text-sm">{b.code}</p>
                        <p className="text-xs font-medium">{b.name}</p>
                        <Badge variant="outline" className="mt-2 text-[10px]">{b.type}</Badge>
                     </Card>
                   ))}
                   {ingredientResults.batches.length === 0 && <p className="text-xs text-muted-foreground italic">No intermediate usage found.</p>}
                 </div>

                 {/* Runs */}
                 <div className="space-y-3">
                   <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">3. Final Product Runs</h4>
                   {ingredientResults.runs.map(run => (
                     <Card key={run.id} className="p-3 border-l-4 border-l-emerald-500">
                        <p className="font-mono font-bold text-sm text-emerald-700">{run.productBatchCode}</p>
                        <p className="text-xs font-medium">{run.productName}</p>
                        <p className="text-[10px] text-muted-foreground mt-2">{format(new Date(run.runDate), "dd/MM/yy")}</p>
                     </Card>
                   ))}
                   {ingredientResults.runs.length === 0 && <p className="text-xs text-muted-foreground italic">No final production impacted.</p>}
                 </div>
               </div>
             </div>
           )}
        </TabsContent>

        {/* Lot Lookup View */}
        <TabsContent value="lookup" className="space-y-4">
          <div className="bg-white rounded-lg border shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Ingredient</TableHead>
                  <TableHead>Batch Code</TableHead>
                  <TableHead>Storage</TableHead>
                  <TableHead>Best Before</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Receiving Report</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lookupResults.map(lot => {
                  const type = ingredientTypes.find(t => t.id === lot.ingredientTypeId);
                  const report = receivingReports.find(r => r.id === lot.receivingReportId);
                  const receiver = users.find(u => u.id === report?.receivedByUserId);
                  return (
                    <TableRow key={lot.id}>
                      <TableCell className="font-medium">{type?.name}</TableCell>
                      <TableCell className="font-mono font-bold">{lot.batchCode}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{lot.storage}</Badge></TableCell>
                      <TableCell className="text-xs">{lot.bestBefore}</TableCell>
                      <TableCell className="text-xs">{lot.quantity} {lot.unit}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-[10px]">
                           <span className="font-bold uppercase text-primary">Ref: {report?.reference || 'Direct'}</span>
                           <span className="text-muted-foreground">Rec: {report ? format(new Date(report.receivedAt), "dd/MM/yy") : '-'}</span>
                           <span className="text-muted-foreground">By: {receiver?.name || '-'}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {query && lookupResults.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                       No received lots found for this batch code.
                    </TableCell>
                  </TableRow>
                )}
                {!query && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                       Enter a batch code above to search inventory.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

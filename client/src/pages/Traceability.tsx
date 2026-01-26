import { useState, useMemo } from "react";
import { useBakeryStore, ReceivedLot, Batch } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Printer, ArrowRight, Package, LayoutGrid, FileText, User, Calendar, Truck, Database } from "lucide-react";
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
  const [productResults, setProductResults] = useState<any[]>([]);
  const [ingredientResults, setIngredientResults] = useState<{
    lots: ReceivedLot[];
    batches: Batch[];
    runs: any[];
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
        return run.doughBatchIds.some(id => batchIds.includes(id)) || 
               run.fillingBatchIds.some(id => batchIds.includes(id));
      });

      setIngredientResults({ lots: matchedLots, batches: affBatches, runs: affRuns });
      addAuditLog('TRACE_SEARCHED', `Ingredient batch forward trace for ${searchStr}`, 'system', 'Traceability', searchStr);
    }

    setSearched(true);
  };

  const lookupResults = useMemo(() => {
    if (mode !== 'lookup' || !query) return [];
    const s = query.trim().toUpperCase();
    return receivedLots.filter(l => {
      const matchesCode = l.batchCode.toUpperCase().includes(s);
      const matchesType = ingredientTypeId === 'all' || l.ingredientTypeId === ingredientTypeId;
      return matchesCode && matchesType;
    });
  }, [mode, query, ingredientTypeId, receivedLots]);

  const batchResults = useMemo(() => {
    if (mode !== 'lookup' || !query) return [];
    const s = query.trim().toUpperCase();
    return batches.filter(b => b.code.toUpperCase().includes(s));
  }, [mode, query, batches]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="border-b pb-6">
        <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Traceability & Lookup</h2>
        <p className="text-muted-foreground">Find ingredient lots, dough/filling batches, or product runs.</p>
      </div>

      <Tabs value={mode} onValueChange={(v: any) => { setMode(v); setSearched(false); setQuery(""); }} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 h-12">
          <TabsTrigger value="product" className="font-bold">Product Trace</TabsTrigger>
          <TabsTrigger value="ingredient" className="font-bold">Ingredient Trace</TabsTrigger>
          <TabsTrigger value="lookup" className="font-bold">Batch & Lot Lookup</TabsTrigger>
        </TabsList>

        <Card className="border-2 border-primary/20">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                {mode !== 'product' && mode !== 'lookup' && (
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
                    {mode === 'product' ? "Product Batch Code (ddmmyy)" : "Enter Code"}
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input 
                        placeholder={mode === 'product' ? "e.g. 250126" : "Enter code to find..."} 
                        className="pl-9 h-12 text-lg font-mono"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                    </div>
                    {mode !== 'lookup' && (
                      <Button type="submit" size="lg" className="h-12 px-8 font-bold">Trace</Button>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <TabsContent value="lookup" className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Package className="w-5 h-5" />
              Ingredient Lot Results ({lookupResults.length})
            </h3>
            <Table>
              <TableHeader><TableRow><TableHead>Ingredient</TableHead><TableHead>Batch Code</TableHead><TableHead>Storage</TableHead><TableHead>Best Before</TableHead></TableRow></TableHeader>
              <TableBody>
                {lookupResults.map(lot => (
                  <TableRow key={lot.id}>
                    <TableCell>{ingredientTypes.find(t => t.id === lot.ingredientTypeId)?.name}</TableCell>
                    <TableCell className="font-mono font-bold">{lot.batchCode}</TableCell>
                    <TableCell><Badge variant="outline">{lot.storage}</Badge></TableCell>
                    <TableCell>{lot.bestBefore}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-primary">
              <Database className="w-5 h-5" />
              Production Batch Results ({batchResults.length})
            </h3>
            <Table>
              <TableHeader><TableRow><TableHead>Batch Code</TableHead><TableHead>Recipe Name</TableHead><TableHead>Type</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
              <TableBody>
                {batchResults.map(b => (
                  <TableRow key={b.id}>
                    <TableCell className="font-mono font-bold">{b.code}</TableCell>
                    <TableCell>{b.name}</TableCell>
                    <TableCell><Badge>{b.type}</Badge></TableCell>
                    <TableCell>{format(new Date(b.createdAt), "dd/MM/yy")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="product" className="space-y-4">
          {searched && (
             <div className="p-12 text-center border rounded-lg bg-muted/5 text-muted-foreground">
               Results will appear here based on your data entry.
             </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

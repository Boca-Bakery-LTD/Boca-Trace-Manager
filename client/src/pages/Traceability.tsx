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
    productCatalog,
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
          {searched && productResults.length === 0 && (
            <div className="p-12 text-center border rounded-lg bg-muted/5 text-muted-foreground">
              No product runs found matching "{query}".
            </div>
          )}
          {productResults.map(run => (
            <Card key={run.id} className="border-emerald-200">
              <CardHeader className="bg-emerald-50/50">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-emerald-700 font-mono">Batch: {run.productBatchCode}</CardTitle>
                    <CardDescription>{format(new Date(run.runDate), "PPP")}</CardDescription>
                  </div>
                  <Badge className="bg-emerald-600">Production Run</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div>
                  <h4 className="text-sm font-bold uppercase text-muted-foreground mb-3">Products Produced</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(run.quantities).map(([productId, qty]: [string, any]) => {
                      const product = productCatalog.find(p => p.id === productId);
                      return (
                        <div key={productId} className="flex justify-between items-center p-3 border rounded bg-white shadow-sm">
                          <span className="font-medium">{product?.name}</span>
                          <Badge variant="secondary" className="text-lg">{qty}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  <div>
                    <h4 className="text-sm font-bold uppercase text-muted-foreground mb-3">Dough Batches Used</h4>
                    <div className="space-y-2">
                      {run.doughBatchIds.map(id => {
                        const b = batches.find(x => x.id === id);
                        return (
                          <div key={id} className="p-2 border rounded bg-blue-50/30 flex justify-between items-center">
                            <span className="font-mono text-sm font-bold">{b?.code}</span>
                            <span className="text-xs text-muted-foreground">{b?.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase text-muted-foreground mb-3">Filling Batches Used</h4>
                    <div className="space-y-2">
                      {run.fillingBatchIds.map(id => {
                        const b = batches.find(x => x.id === id);
                        return (
                          <div key={id} className="p-2 border rounded bg-amber-50/30 flex justify-between items-center">
                            <span className="font-mono text-sm font-bold">{b?.code}</span>
                            <span className="text-xs text-muted-foreground">{b?.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="ingredient" className="space-y-6">
          {searched && ingredientResults && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Matched Lots</p>
                    <p className="text-3xl font-bold">{ingredientResults.lots.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Affected Batches</p>
                    <p className="text-3xl font-bold">{ingredientResults.batches.length}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-sm font-medium text-muted-foreground">Affected Product Runs</p>
                    <p className="text-3xl font-bold">{ingredientResults.runs.length}</p>
                  </CardContent>
                </Card>
              </div>

              {ingredientResults.lots.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">1. Ingredient Lot Identification</h3>
                  <Table>
                    <TableHeader><TableRow><TableHead>Ingredient</TableHead><TableHead>Batch Code</TableHead><TableHead>Received</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {ingredientResults.lots.map(lot => (
                        <TableRow key={lot.id}>
                          <TableCell className="font-bold">{ingredientTypes.find(t => t.id === lot.ingredientTypeId)?.name}</TableCell>
                          <TableCell className="font-mono">{lot.batchCode}</TableCell>
                          <TableCell>{format(new Date(lot.receivedAt), "dd/MM/yy")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {ingredientResults.batches.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">2. Impacted Production Batches</h3>
                  <Table>
                    <TableHeader><TableRow><TableHead>Type</TableHead><TableHead>Batch Code</TableHead><TableHead>Recipe</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {ingredientResults.batches.map(batch => (
                        <TableRow key={batch.id}>
                          <TableCell><Badge variant={batch.type === 'Dough' ? 'default' : 'secondary'}>{batch.type}</Badge></TableCell>
                          <TableCell className="font-mono font-bold">{batch.code}</TableCell>
                          <TableCell>{batch.name}</TableCell>
                          <TableCell>{format(new Date(batch.createdAt), "dd/MM/yy HH:mm")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {ingredientResults.runs.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold">3. Affected Finished Products</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {ingredientResults.runs.map(run => (
                      <Card key={run.id} className="border-emerald-200">
                        <CardHeader className="py-3 bg-emerald-50">
                          <CardTitle className="text-sm font-mono flex justify-between items-center">
                            <span>Batch: {run.productBatchCode}</span>
                            <span className="text-muted-foreground font-sans text-xs">{format(new Date(run.runDate), "dd/MM/yy")}</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(run.quantities).map(([productId, qty]: [string, any]) => {
                              const product = productCatalog.find(p => p.id === productId);
                              return (
                                <Badge key={productId} variant="outline" className="text-sm py-1">
                                  {product?.name}: <span className="ml-1 font-bold text-emerald-700">{qty}</span>
                                </Badge>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {ingredientResults.lots.length === 0 && (
                <div className="p-12 text-center border rounded-lg bg-muted/5 text-muted-foreground">
                  No ingredient lots found matching "{query}".
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

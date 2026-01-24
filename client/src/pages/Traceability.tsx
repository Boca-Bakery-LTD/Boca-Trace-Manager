import { useState } from "react";
import { useBakeryStore, Batch, ProductionRun, ReceivedLot } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Printer, ArrowRight, Package } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function Traceability() {
  const { productionRuns, batches, receivedLots, ingredientTypes } = useBakeryStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductionRun[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    
    // Find all runs with this batch code
    const found = productionRuns.filter(r => r.productBatchCode === query);
    setResults(found);
    setSearched(true);
  };

  // Helper to expand details
  const ExpandedTrace = ({ run }: { run: ProductionRun }) => {
    // Collect all unique batches
    const linkedBatches = [
      ...run.doughBatchIds.map(id => batches.find(b => b.id === id)),
      ...run.fillingBatchIds.map(id => batches.find(b => b.id === id))
    ].filter(Boolean) as Batch[];

    // Collect all ingredient lots from those batches
    const ingredientLotIds = Array.from(new Set(linkedBatches.flatMap(b => b.ingredientLotIds)));
    const linkedLots = ingredientLotIds.map(id => receivedLots.find(l => l.id === id)).filter(Boolean) as ReceivedLot[];

    return (
      <div className="mt-4 p-4 bg-muted/30 rounded-lg border space-y-4">
        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">Intermediate Batches (Dough/Filling)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {linkedBatches.map(b => (
              <div key={b.id} className="bg-white p-2 rounded border text-sm flex justify-between items-center">
                <span className="font-bold font-mono">{b.code}</span>
                <span>{b.name}</span>
                <Badge variant="outline">{b.type}</Badge>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-2">Ingredient Lots Used</h4>
          <div className="overflow-x-auto">
            <Table>
               <TableHeader className="bg-white">
                 <TableRow>
                   <TableHead>Ingredient</TableHead>
                   <TableHead>Supplier Batch</TableHead>
                   <TableHead>Received</TableHead>
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
                       <TableCell className="text-xs text-muted-foreground">{format(new Date(lot.receivedAt), "dd/MM/yyyy")}</TableCell>
                       <TableCell className="text-xs text-muted-foreground">{lot.bestBefore}</TableCell>
                     </TableRow>
                   )
                 })}
               </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Traceability Report</h2>
          <p className="text-muted-foreground">Search by Finished Product Batch Code (ddmmyy)</p>
        </div>
      </div>

      <Card className="border-2 border-primary/20">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Enter Product Batch Code (e.g. 240526)" 
                className="pl-9 h-12 text-lg font-mono"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8 font-bold">
              Generate Trace
            </Button>
          </form>
        </CardContent>
      </Card>

      {searched && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Results for "{query}"</h3>
            {results.length > 0 && (
              <Button variant="outline" size="sm" className="gap-2">
                <Printer className="w-4 h-4" />
                Print Report
              </Button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="p-12 text-center border rounded-lg bg-muted/10 text-muted-foreground">
              No production runs found for this batch code.
            </div>
          ) : (
            results.map(run => (
              <Card key={run.id} className="overflow-hidden">
                <CardHeader className="bg-primary/5 pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{run.productName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">Run Date: {format(new Date(run.runDate), "PPP p")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-xl">{run.productBatchCode}</p>
                      <p className="text-sm text-muted-foreground">{run.quantity} units</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ExpandedTrace run={run} />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

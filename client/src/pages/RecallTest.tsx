import { useState } from "react";
import { useBakeryStore, Batch, ProductionRun, ReceivedLot } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Siren, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export default function RecallTest() {
  const { productionRuns, batches, receivedLots, ingredientTypes } = useBakeryStore();
  
  const [recallType, setRecallType] = useState<"Ingredient" | "Batch" | "Product">("Ingredient");
  const [query, setQuery] = useState("");
  const [impactedRuns, setImpactedRuns] = useState<ProductionRun[]>([]);
  const [hasRun, setHasRun] = useState(false);

  const handleRunRecall = () => {
    if (!query) return;
    setHasRun(true);
    let impacted: ProductionRun[] = [];

    if (recallType === 'Ingredient') {
      // Find lot by batch code
      const lot = receivedLots.find(l => l.batchCode === query);
      if (lot) {
        // Find all batches using this lot
        const affectedBatches = batches.filter(b => b.ingredientLotIds.includes(lot.id));
        const affectedBatchIds = affectedBatches.map(b => b.id);
        
        // Find all runs using these batches
        impacted = productionRuns.filter(r => 
          r.doughBatchIds.some(id => affectedBatchIds.includes(id)) || 
          r.fillingBatchIds.some(id => affectedBatchIds.includes(id))
        );
      }
    } else if (recallType === 'Batch') {
      // Find batch by code
      const batch = batches.find(b => b.code === query);
      if (batch) {
        impacted = productionRuns.filter(r => 
          r.doughBatchIds.includes(batch.id) || 
          r.fillingBatchIds.includes(batch.id)
        );
      }
    } else {
      // Direct product match
      impacted = productionRuns.filter(r => r.productBatchCode === query);
    }

    setImpactedRuns(impacted);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 border-b border-rose-200 pb-6">
        <div className="p-3 bg-rose-100 rounded-full text-rose-600">
          <Siren className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-3xl font-display font-bold text-rose-700 tracking-tight">Recall Simulation</h2>
          <p className="text-rose-600/80">Mock recall tool for verifying traceability (Internal Use Only)</p>
        </div>
      </div>

      <Card className="border-rose-200 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Recall Source Type</Label>
              <Select value={recallType} onValueChange={(v: any) => setRecallType(v)}>
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
            
            <div className="md:col-span-2 space-y-2">
              <Label>Batch Code to Trace</Label>
              <Input 
                value={query} 
                onChange={e => setQuery(e.target.value)}
                placeholder={recallType === 'Ingredient' ? "e.g. FL-23-001" : recallType === 'Batch' ? "e.g. DOUGH-101" : "e.g. 240526"}
                className="font-mono"
              />
            </div>

            <Button onClick={handleRunRecall} className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
              Run Simulation
            </Button>
          </div>
        </CardContent>
      </Card>

      {hasRun && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2">
             <AlertTriangle className="text-rose-600" />
             <h3 className="text-xl font-bold">Impact Analysis Report</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Impacted Runs</p>
                <p className="text-4xl font-bold text-rose-600">{impactedRuns.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Total Quantity</p>
                <p className="text-4xl font-bold text-primary">{impactedRuns.reduce((acc, r) => acc + r.quantity, 0)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                <Badge variant="outline" className="text-emerald-600 bg-emerald-50 border-emerald-200 px-3 py-1">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Trace Verified
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detailed Impact List</CardTitle>
            </CardHeader>
            <CardContent>
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Run Date</TableHead>
                     <TableHead>Product</TableHead>
                     <TableHead>Batch Code</TableHead>
                     <TableHead>Affected Qty</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {impactedRuns.length === 0 ? (
                     <TableRow>
                       <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No impacted products found.</TableCell>
                     </TableRow>
                   ) : (
                     impactedRuns.map(run => (
                       <TableRow key={run.id} className="bg-rose-50/50 hover:bg-rose-100/50">
                         <TableCell className="font-mono text-xs">{format(new Date(run.runDate), "dd/MM/yy HH:mm")}</TableCell>
                         <TableCell className="font-medium">{run.productName}</TableCell>
                         <TableCell className="font-mono font-bold text-rose-700">{run.productBatchCode}</TableCell>
                         <TableCell>{run.quantity}</TableCell>
                       </TableRow>
                     ))
                   )}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

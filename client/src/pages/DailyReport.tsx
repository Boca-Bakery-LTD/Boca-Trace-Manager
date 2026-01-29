import { useState } from "react";
import { useBakeryStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Printer, Search, FileText } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function DailyReport() {
  const { 
    batches, 
    productionRuns, 
    productCatalog,
    receivedLots,
    ingredientTypes,
    doughBatchIngredients,
    fillingBatchIngredients
  } = useBakeryStore();

  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const filteredBatches = batches.filter(b => 
    format(new Date(b.createdAt), "yyyy-MM-dd") === date
  );

  const filteredRuns = productionRuns.filter(r => 
    format(new Date(r.runDate), "yyyy-MM-dd") === date
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6 print:hidden">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Daily Production Report</h2>
          <p className="text-muted-foreground">Print-ready summary of daily production and traceability.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <Label className="text-[10px] uppercase font-bold text-muted-foreground">Filter Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40" />
          </div>
          <Button onClick={handlePrint} size="lg" className="gap-2 font-bold mt-5">
            <Printer className="w-5 h-5" />
            Print Report
          </Button>
        </div>
      </div>

      <div id="printable-report" className="bg-white p-8 rounded-lg border shadow-sm print:shadow-none print:border-none print:p-0 space-y-8">
        <div className="flex justify-between items-start border-b-2 border-primary pb-4">
          <div>
            <h1 className="text-2xl font-bold text-primary uppercase">BOCA BAKERY LTD</h1>
            <h2 className="text-xl font-display text-muted-foreground">Daily Production & Traceability Report</h2>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold uppercase">Date: {format(new Date(date), "EEEE, MMMM do, yyyy")}</p>
            <p className="text-[10px] text-muted-foreground">Generated: {format(new Date(), "PPP p")}</p>
          </div>
        </div>

        {/* Dough & Filling Batches Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-1">
            <FileText className="w-5 h-5" />
            Production Batches (Intermediate)
          </h3>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[120px]">Code</TableHead>
                <TableHead>Recipe</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Ingredients & Batch Codes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground italic">No batches recorded for this date.</TableCell>
                </TableRow>
              ) : (
                filteredBatches.map(batch => {
                  const ingredients = (batch.type === 'Dough' ? doughBatchIngredients : fillingBatchIngredients)
                    .filter((bi: any) => (batch.type === 'Dough' ? bi.doughBatchId : bi.fillingBatchId) === batch.id)
                    .map((bi: any) => {
                      const lot = receivedLots.find(l => l.id === bi.receivedLotId);
                      const type = ingredientTypes.find(t => t.id === lot?.ingredientTypeId);
                      return { name: type?.name, code: lot?.batchCode };
                    });

                  return (
                    <TableRow key={batch.id}>
                      <TableCell className="font-mono font-bold">{batch.code}</TableCell>
                      <TableCell className="font-medium">{batch.name}</TableCell>
                      <TableCell>
                        <Badge variant={batch.type === 'Dough' ? 'default' : 'secondary'} className="text-[10px]">
                          {batch.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="grid grid-cols-1 gap-1">
                          {ingredients.map((ing, i) => (
                            <div key={i} className="text-[11px] flex justify-between gap-4">
                              <span className="text-muted-foreground">{ing.name}</span>
                              <span className="font-mono font-bold">{ing.code}</span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </section>

        {/* Finished Products Section */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2 border-b pb-1">
            <Search className="w-5 h-5" />
            Impacted Finished Products
          </h3>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Product Batch</TableHead>
                <TableHead>Product Name</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
                <TableHead>Intermediate Batches Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRuns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4 text-muted-foreground italic">No production runs recorded for this date.</TableCell>
                </TableRow>
              ) : (
                filteredRuns.flatMap(run => 
                  Object.entries(run.quantities).map(([productId, qty]: [string, any]) => {
                    const product = productCatalog.find(p => p.id === productId);
                    return (
                      <TableRow key={`${run.id}-${productId}`}>
                        <TableCell className="font-mono">{run.productBatchCode}</TableCell>
                        <TableCell className="font-bold">{product?.name}</TableCell>
                        <TableCell className="text-right font-bold">{qty}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {run.doughBatchIds.map(id => (
                              <Badge key={id} variant="outline" className="text-[9px] font-mono">
                                {batches.find(b => b.id === id)?.code}
                              </Badge>
                            ))}
                            {run.fillingBatchIds.map(id => (
                              <Badge key={id} variant="outline" className="text-[9px] font-mono bg-amber-50">
                                {batches.find(b => b.id === id)?.code}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )
              )}
            </TableBody>
          </Table>
        </section>

        <div className="pt-12 grid grid-cols-2 gap-8 text-center">
          <div className="border-t pt-2">
            <p className="text-xs font-bold uppercase">Production Supervisor</p>
          </div>
          <div className="border-t pt-2">
            <p className="text-xs font-bold uppercase">Quality Control Sign-off</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #printable-report, #printable-report * { visibility: visible; }
          #printable-report { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}

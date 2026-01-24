import { useState } from "react";
import { Search, ArrowRight, Factory, Truck, Package, AlertTriangle, AlertOctagon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LOTS, PRODUCTS, PARTNERS, SHIPMENTS, Lot, Product, Partner } from "@/lib/mockData";

export default function Traceability() {
  const [query, setQuery] = useState("");
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [traceDirection, setTraceDirection] = useState<'backward' | 'forward'>('backward');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const found = LOTS.find(l => l.lotNumber.toLowerCase().includes(query.toLowerCase()));
    if (found) {
      setSelectedLot(found);
    } else {
      // Mock finding one for demo if not found
      if(query.length > 0) alert("Lot not found in mock data. Try 'FG-CKV-20231028-A'");
    }
  };

  const getProduct = (id: string) => PRODUCTS.find(p => p.id === id);
  const getPartner = (id?: string) => PARTNERS.find(p => p.id === id);
  const getLot = (id: string) => LOTS.find(l => l.id === id);

  // Recursive genealogy component could be complex, doing a flat list for prototype
  const TraceView = ({ lot }: { lot: Lot }) => {
    const product = getProduct(lot.productId);
    const supplier = getPartner(lot.receivedFromId);
    
    // Ingredients used (Backward)
    const ingredients = lot.producedFromIds?.map(id => getLot(id)).filter(Boolean) as Lot[];
    
    // Used in (Forward)
    const usedIn = LOTS.filter(l => l.producedFromIds?.includes(lot.id));
    
    // Shipments (Forward)
    const shipments = SHIPMENTS.filter(s => s.lotId === lot.id);

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Main Lot Info */}
          <Card className="flex-1 border-l-4 border-l-primary shadow-lg">
            <CardHeader className="bg-muted/30 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="mb-2 bg-white">{product?.type}</Badge>
                  <CardTitle className="text-2xl font-display text-primary">{product?.name}</CardTitle>
                  <p className="font-mono text-muted-foreground mt-1 text-lg">{lot.lotNumber}</p>
                </div>
                <div className={`px-3 py-1 rounded font-bold uppercase text-sm border ${
                  lot.status === 'Released' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                  lot.status === 'Hold' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                  'bg-rose-100 text-rose-800 border-rose-200'
                }`}>
                  {lot.status}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</span>
                <p className="font-medium text-lg">{lot.remainingQuantity} / {lot.quantity} <span className="text-sm text-muted-foreground">{lot.unit}</span></p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Production Date</span>
                <p className="font-medium text-lg">{lot.productionDate}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expiry</span>
                <p className="font-medium text-lg">{lot.expiryDate}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Location</span>
                <p className="font-medium text-lg">{lot.location}</p>
              </div>
            </CardContent>
          </Card>

          {/* Supplier/Origin Info */}
          {(supplier || lot.receivedFromId) && (
             <Card className="md:w-1/3 border-dashed">
               <CardHeader>
                 <CardTitle className="flex items-center gap-2">
                   <Truck className="w-5 h-5 text-muted-foreground" />
                   Origin
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <p className="font-bold text-lg">{supplier?.name || "Internal Production"}</p>
                 <p className="text-muted-foreground">{supplier?.code}</p>
                 <p className="text-xs text-muted-foreground mt-2">Received: {lot.productionDate}</p>
               </CardContent>
             </Card>
          )}
        </div>

        {/* Traceability Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Backward Trace (Inputs) */}
          <div className="space-y-4">
            <h3 className="text-xl font-display font-bold flex items-center gap-2 text-primary">
              <Package className="w-5 h-5" />
              Input Ingredients (Backward)
            </h3>
            {ingredients && ingredients.length > 0 ? (
              <div className="space-y-3 pl-4 border-l-2 border-muted">
                {ingredients.map(ing => {
                   const ingProd = getProduct(ing.productId);
                   return (
                     <div key={ing.id} className="relative group">
                       <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-muted border-2 border-white group-hover:bg-primary transition-colors"></div>
                       <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedLot(ing)}>
                         <CardContent className="p-3 flex justify-between items-center">
                           <div>
                             <p className="font-medium text-sm">{ingProd?.name}</p>
                             <p className="text-xs font-mono text-muted-foreground">{ing.lotNumber}</p>
                           </div>
                           <Badge variant="secondary" className="text-xs">{ing.status}</Badge>
                         </CardContent>
                       </Card>
                     </div>
                   );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-muted/20 rounded-lg border border-dashed text-muted-foreground">
                No upstream ingredients linked (Raw Material).
              </div>
            )}
          </div>

          {/* Forward Trace (Outputs) */}
          <div className="space-y-4">
            <h3 className="text-xl font-display font-bold flex items-center gap-2 text-primary">
              <ArrowRight className="w-5 h-5" />
              Usage & Shipments (Forward)
            </h3>
            
            <div className="space-y-6 pl-4 border-l-2 border-muted">
              {/* Used In Production */}
              {usedIn.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-2">Used In Production</h4>
                  {usedIn.map(child => {
                    const childProd = getProduct(child.productId);
                    return (
                      <div key={child.id} className="relative group">
                        <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-muted border-2 border-white group-hover:bg-primary transition-colors"></div>
                        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedLot(child)}>
                          <CardContent className="p-3 flex justify-between items-center">
                            <div>
                              <p className="font-medium text-sm">{childProd?.name}</p>
                              <p className="text-xs font-mono text-muted-foreground">{child.lotNumber}</p>
                            </div>
                            <Badge variant="outline">{childProd?.type === 'FinishedGood' ? 'FG' : 'WIP'}</Badge>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Shipments */}
              {shipments.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold uppercase text-muted-foreground tracking-wider mb-2">Customer Shipments</h4>
                  {shipments.map(ship => {
                    const customer = getPartner(ship.customerId);
                    return (
                      <div key={ship.id} className="relative group">
                         <div className="absolute -left-[21px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></div>
                        <Card className="bg-blue-50/50 border-blue-100">
                          <CardContent className="p-3 flex justify-between items-center">
                            <div>
                              <p className="font-bold text-sm text-blue-900">{customer?.name}</p>
                              <p className="text-xs text-blue-700">Shipped: {ship.date}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-mono font-bold text-sm">{ship.quantity} {lot.unit}</p>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )
                  })}
                </div>
              )}
              
              {usedIn.length === 0 && shipments.length === 0 && (
                 <div className="p-8 text-center bg-muted/20 rounded-lg border border-dashed text-muted-foreground">
                   No forward usage or shipments found.
                 </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Recall Action Bar */}
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center justify-between mt-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-100 rounded-full text-rose-600">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-rose-900">Emergency Actions</h4>
              <p className="text-xs text-rose-700">Initiate recall or hold for this lot and all related downstream products.</p>
            </div>
          </div>
          <Button variant="destructive" className="font-bold">Initiate Mock Recall</Button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Traceability Engine</h2>
          <p className="text-muted-foreground">One-up, one-back genealogy and recall management.</p>
        </div>
      </div>

      <Card className="bg-muted/30 border-muted">
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Scan or enter Lot Number (e.g., FG-CKV-20231028-A)" 
                className="pl-9 h-12 text-lg bg-white"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="h-12 px-8 bg-primary hover:bg-primary/90 text-white font-semibold">
              Trace
            </Button>
          </form>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline" className="cursor-pointer hover:bg-white" onClick={() => setQuery("FG-CKV-20231028-A")}>
              Demo: Finished Cake
            </Badge>
            <Badge variant="outline" className="cursor-pointer hover:bg-white" onClick={() => setQuery("RM-FLR-20231020")}>
              Demo: Flour Lot
            </Badge>
          </div>
        </CardContent>
      </Card>

      {selectedLot ? (
        <TraceView lot={selectedLot} />
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground opacity-50">
          <Search className="w-16 h-16 mb-4" />
          <p className="text-lg font-medium">Enter a lot number to begin trace analysis</p>
        </div>
      )}
    </div>
  );
}

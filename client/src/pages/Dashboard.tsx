import { 
  Users, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Factory,
  Search
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LOTS, PRODUCTS, SHIPMENTS } from "@/lib/mockData";
import { format, parseISO, isAfter, isBefore, addDays } from "date-fns";

export default function Dashboard() {
  const totalLots = LOTS.length;
  const releasedLots = LOTS.filter(l => l.status === 'Released').length;
  const holdLots = LOTS.filter(l => l.status === 'Hold').length;
  const quarantineLots = LOTS.filter(l => l.status === 'Quarantine').length;
  
  // Mock Expiring Soon
  const expiringSoon = LOTS.filter(l => {
    const expiry = parseISO(l.expiryDate);
    return isAfter(expiry, new Date()) && isBefore(expiry, addDays(new Date(), 30));
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Production Overview</h2>
          <p className="text-muted-foreground mt-1">Real-time traceability status and inventory metrics.</p>
        </div>
        <div className="text-sm font-medium bg-white px-4 py-2 rounded-md shadow-sm border text-muted-foreground">
          {format(new Date(), "EEEE, MMMM do, yyyy")}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Released Lots</p>
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-foreground">{releasedLots}</div>
              <span className="text-xs text-muted-foreground">active</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-amber-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">On Hold</p>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-foreground">{holdLots}</div>
              <span className="text-xs text-muted-foreground">lots</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-rose-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Quarantine</p>
              <Users className="h-5 w-5 text-rose-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-foreground">{quarantineLots}</div>
              <span className="text-xs text-muted-foreground">awaiting QA</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Expiring (30d)</p>
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold text-foreground">{expiringSoon}</div>
              <span className="text-xs text-muted-foreground">lots</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity / Production */}
        <Card className="shadow-md border-border/50">
          <CardHeader>
            <CardTitle>Recent Lots</CardTitle>
            <CardDescription>Latest inventory movements and production runs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {LOTS.slice(0, 5).map(lot => {
                const product = PRODUCTS.find(p => p.id === lot.productId);
                return (
                  <div key={lot.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/50">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs ${
                        product?.type === 'Ingredient' ? 'bg-blue-100 text-blue-700' : 
                        product?.type === 'FinishedGood' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {product?.type === 'Ingredient' ? 'RM' : product?.type === 'FinishedGood' ? 'FG' : 'WP'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{product?.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{lot.lotNumber}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                        lot.status === 'Released' ? 'bg-emerald-100 text-emerald-700' :
                        lot.status === 'Hold' ? 'bg-amber-100 text-amber-700' :
                        lot.status === 'Quarantine' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {lot.status}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{lot.remainingQuantity} {lot.unit}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-md border-border/50">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common manufacturing tasks.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <button className="flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-primary hover:bg-blue-50/50 transition-all group">
              <ArrowDownRight className="w-8 h-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-foreground">Receive Goods</span>
              <span className="text-xs text-muted-foreground text-center mt-1">Log incoming raw materials</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50/50 transition-all group">
              <Factory className="w-8 h-8 text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-foreground">Start Production</span>
              <span className="text-xs text-muted-foreground text-center mt-1">Create new batch</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-amber-500 hover:bg-amber-50/50 transition-all group">
              <AlertTriangle className="w-8 h-8 text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-foreground">Place Hold</span>
              <span className="text-xs text-muted-foreground text-center mt-1">Quarantine a specific lot</span>
            </button>
            <button className="flex flex-col items-center justify-center p-6 bg-white border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50/50 transition-all group">
              <Search className="w-8 h-8 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-foreground">Trace Lot</span>
              <span className="text-xs text-muted-foreground text-center mt-1">Genealogy & Recall</span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

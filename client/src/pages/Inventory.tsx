import { useState } from "react";
import { useBakeryStore, ReceivedLot } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Truck, AlertTriangle, FileText, Trash2, Copy, Eye, Edit2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface ReceivingLineItem {
  tempId: string;
  ingredientTypeId: string;
  batchCode: string;
  bestBefore: string;
  quantity: string;
  storage: string;
}

export default function Inventory() {
  const { 
    receivedLots, 
    receivingReports,
    ingredientTypes, 
    users, 
    addReceivedLot, 
    updateReceivedLot,
    removeReceivedLot,
    createReceivingReport,
    removeReceivingReport,
    getCurrentUser
  } = useBakeryStore();

  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'Admin';

  const { toast } = useToast();
  
  // Modal States
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isViewReportOpen, setIsViewReportOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Filters
  const [filter, setFilter] = useState("");

  // Create Report Form State
  const [reportData, setReportData] = useState({
    receivedAtDate: format(new Date(), "yyyy-MM-dd"),
    receivedAtTime: format(new Date(), "HH:mm"),
    receivedByUserId: "",
    reference: "",
    notes: ""
  });

  const [lines, setLines] = useState<ReceivingLineItem[]>([
    { tempId: '1', ingredientTypeId: '', batchCode: '', bestBefore: '', quantity: '', storage: 'Ambient' }
  ]);

  // View Report Helper
  const viewReport = receivingReports.find(r => r.id === selectedReportId);
  const viewReportLines = selectedReportId ? receivedLots.filter(l => l.receivingReportId === selectedReportId) : [];

  const handleAddLine = () => {
    setLines([...lines, { 
      tempId: Math.random().toString(), 
      ingredientTypeId: '', 
      batchCode: '', 
      bestBefore: '', 
      quantity: '', 
      storage: 'Ambient' 
    }]);
  };

  const handleDuplicateLine = (line: ReceivingLineItem) => {
    setLines([...lines, { 
      ...line, 
      tempId: Math.random().toString(),
      batchCode: '' // Clear batch code as that should be unique usually
    }]);
  };

  const handleRemoveLine = (id: string) => {
    if (lines.length > 1) {
      setLines(lines.filter(l => l.tempId !== id));
    }
  };

  const updateLine = (id: string, field: keyof ReceivingLineItem, value: string) => {
    setLines(lines.map(l => {
      if (l.tempId === id) {
        const updated = { ...l, [field]: value };
        // Auto-set storage based on ingredient type if ingredient changes
        if (field === 'ingredientTypeId') {
          const type = ingredientTypes.find(t => t.id === value);
          if (type) updated.storage = type.storage;
        }
        return updated;
      }
      return l;
    }));
  };

  const handleSubmitReport = () => {
    if (!reportData.receivedByUserId) {
      toast({ title: "Error", description: "Please select who received the goods", variant: "destructive" });
      return;
    }

    const validLines = lines.filter(l => l.ingredientTypeId && l.batchCode);
    if (validLines.length === 0) {
      toast({ title: "Error", description: "Add at least one valid line item", variant: "destructive" });
      return;
    }

    const receivedAt = new Date(`${reportData.receivedAtDate}T${reportData.receivedAtTime}`).toISOString();

    createReceivingReport({
      receivedAt,
      receivedByUserId: reportData.receivedByUserId,
      reference: reportData.reference,
      notes: reportData.notes
    }, validLines.map(l => {
      const type = ingredientTypes.find(t => t.id === l.ingredientTypeId);
      return {
        ingredientTypeId: l.ingredientTypeId,
        batchCode: l.batchCode,
        bestBefore: l.bestBefore || format(new Date(Date.now() + 30*24*60*60*1000), "yyyy-MM-dd"),
        quantity: Number(l.quantity) || 0,
        unit: type?.defaultUnit || 'kg',
        storage: (l.storage as any),
        receivedByUserId: reportData.receivedByUserId, // Will be overridden by store but good for type safety
        receivedAt: receivedAt // Will be overridden
      };
    }));

    toast({ title: "Success", description: `Report created with ${validLines.length} lines` });
    setIsReportOpen(false);
    
    // Reset Form
    setReportData({
      receivedAtDate: format(new Date(), "yyyy-MM-dd"),
      receivedAtTime: format(new Date(), "HH:mm"),
      receivedByUserId: "",
      reference: "",
      notes: ""
    });
    setLines([{ tempId: '1', ingredientTypeId: '', batchCode: '', bestBefore: '', quantity: '', storage: 'Ambient' }]);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Inventory & Receiving</h2>
          <p className="text-muted-foreground">Manage incoming raw materials and stock.</p>
        </div>
        
        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white gap-2 font-semibold">
              <FileText className="w-5 h-5" />
              Create Receiving Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-display">New Receiving Report</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Report Header Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-lg border">
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={reportData.receivedAtDate} onChange={e => setReportData({...reportData, receivedAtDate: e.target.value})} />
                </div>
                <div>
                  <Label>Time</Label>
                  <Input type="time" value={reportData.receivedAtTime} onChange={e => setReportData({...reportData, receivedAtTime: e.target.value})} />
                </div>
                 <div className="md:col-span-2">
                   <Label>Received By (Sign-off)</Label>
                   <Select value={reportData.receivedByUserId} onValueChange={v => setReportData({...reportData, receivedByUserId: v})}>
                     <SelectTrigger className={cn(!reportData.receivedByUserId && "border-primary")}>
                       <SelectValue placeholder="Select Staff Member..." />
                     </SelectTrigger>
                     <SelectContent>
                       {users.filter(u => u.role !== 'Admin').map(u => (
                         <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                </div>
                <div className="md:col-span-2">
                  <Label>Delivery Ref / Supplier</Label>
                  <Input placeholder="e.g. INV-9901 from GrainCo" value={reportData.reference} onChange={e => setReportData({...reportData, reference: e.target.value})} />
                </div>
                <div className="md:col-span-2">
                  <Label>Notes</Label>
                  <Input placeholder="e.g. Pallet slightly damaged" value={reportData.notes} onChange={e => setReportData({...reportData, notes: e.target.value})} />
                </div>
              </div>

              {/* Lines */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                   <h3 className="font-bold text-lg">Line Items</h3>
                   <Button size="sm" variant="outline" onClick={handleAddLine}><Plus className="w-4 h-4 mr-2" /> Add Line</Button>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted">
                      <TableRow>
                        <TableHead className="w-[200px]">Ingredient</TableHead>
                        <TableHead className="w-[150px]">Batch Code</TableHead>
                        <TableHead className="w-[130px]">Best Before</TableHead>
                        <TableHead className="w-[100px]">Qty</TableHead>
                        <TableHead className="w-[120px]">Storage</TableHead>
                        <TableHead className="w-[100px] text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line, idx) => (
                        <TableRow key={line.tempId} className="hover:bg-muted/10">
                          <TableCell>
                             <Select value={line.ingredientTypeId} onValueChange={v => updateLine(line.tempId, 'ingredientTypeId', v)}>
                               <SelectTrigger>
                                 <SelectValue placeholder="Select..." />
                               </SelectTrigger>
                               <SelectContent>
                                 {ingredientTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                               </SelectContent>
                             </Select>
                          </TableCell>
                          <TableCell>
                            <Input 
                              placeholder="Batch #" 
                              value={line.batchCode} 
                              onChange={e => updateLine(line.tempId, 'batchCode', e.target.value)}
                              className="font-mono"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="date" 
                              value={line.bestBefore} 
                              onChange={e => updateLine(line.tempId, 'bestBefore', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              placeholder="0"
                              value={line.quantity} 
                              onChange={e => updateLine(line.tempId, 'quantity', e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                             <Select value={line.storage} onValueChange={v => updateLine(line.tempId, 'storage', v)}>
                               <SelectTrigger>
                                 <SelectValue />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="Ambient">Ambient</SelectItem>
                                 <SelectItem value="Chilled">Chilled</SelectItem>
                                 <SelectItem value="Frozen">Frozen</SelectItem>
                               </SelectContent>
                             </Select>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" title="Duplicate" onClick={() => handleDuplicateLine(line)}>
                                <Copy className="w-4 h-4 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="icon" title="Remove" onClick={() => handleRemoveLine(line.tempId)} disabled={lines.length === 1}>
                                <Trash2 className="w-4 h-4 text-rose-500" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                 <Button variant="outline" onClick={() => setIsReportOpen(false)}>Cancel</Button>
                 <Button size="lg" onClick={handleSubmitReport} className="font-bold">Save Report</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-2 space-y-4">
           <h3 className="font-bold text-xl flex items-center gap-2">
             <FileText className="w-5 h-5 text-muted-foreground" />
             Recent Reports
           </h3>
           
           <div className="bg-white rounded-md border shadow-sm">
             <Table>
               <TableHeader>
                 <TableRow>
                   <TableHead>Date</TableHead>
                   <TableHead>Reference</TableHead>
                   <TableHead>Received By</TableHead>
                   <TableHead>Lines</TableHead>
                   <TableHead></TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {receivingReports.length === 0 ? (
                   <TableRow>
                     <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No reports yet.</TableCell>
                   </TableRow>
                 ) : (
                   receivingReports.sort((a,b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()).map(report => (
                     <TableRow key={report.id}>
                       <TableCell className="font-mono text-xs">{format(new Date(report.receivedAt), "dd/MM/yy HH:mm")}</TableCell>
                       <TableCell>{report.reference || '-'}</TableCell>
                       <TableCell>{users.find(u => u.id === report.receivedByUserId)?.name}</TableCell>
                       <TableCell><Badge variant="outline">{report.lotIds.length} items</Badge></TableCell>
                       <TableCell>
                         <Button variant="ghost" size="sm" onClick={() => { setSelectedReportId(report.id); setIsViewReportOpen(true); }}>
                           <Eye className="w-4 h-4 mr-2" /> View
                         </Button>
                       </TableCell>
                     </TableRow>
                   ))
                 )}
               </TableBody>
             </Table>
           </div>
        </div>
        
        {/* Helper Side Panel for Individual Lots (Quick Lookup) */}
        <div className="space-y-4">
           <h3 className="font-bold text-xl flex items-center gap-2">
             <Search className="w-5 h-5 text-muted-foreground" />
             Lot Lookup
           </h3>
           <Input 
             placeholder="Search batch codes..." 
             value={filter}
             onChange={e => setFilter(e.target.value)}
             className="bg-white"
           />
           <div className="bg-white rounded-md border shadow-sm max-h-[500px] overflow-y-auto">
                      {receivedLots
                        .filter(l => !filter || l.batchCode.toLowerCase().includes(filter.toLowerCase()))
                        .sort((a,b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
                        .slice(0, 20)
                        .map(lot => {
                          const type = ingredientTypes.find(t => t.id === lot.ingredientTypeId);
                          return (
                            <div key={lot.id} className="p-3 border-b last:border-0 hover:bg-muted/20 group relative">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold font-mono text-sm">{lot.batchCode}</span>
                                <Badge variant="outline" className="text-[10px]">{lot.storage}</Badge>
                              </div>
                              <p className="text-sm font-medium">{type?.name}</p>
                              <p className="text-xs text-muted-foreground mt-1 flex justify-between">
                                <span>Qty: {lot.quantity} {lot.unit}</span>
                                <span className={cn(new Date(lot.bestBefore) < new Date() ? "text-rose-500 font-bold" : "")}>BB: {lot.bestBefore}</span>
                              </p>
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex gap-1 bg-white/80 p-1 rounded shadow-sm">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                  const newCode = prompt("New Batch Code:", lot.batchCode);
                                  if (newCode) updateReceivedLot(lot.id, { batchCode: newCode });
                                }}>
                                  <Edit2 className="w-3 h-3" />
                                </Button>
                                {isAdmin && (
                                  <Button variant="ghost" size="icon" className="h-6 w-6 text-rose-500" onClick={() => removeReceivedLot(lot.id)}>
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })
                      }
           </div>
        </div>
      </div>

      {/* View Report Dialog */}
      <Dialog open={isViewReportOpen} onOpenChange={setIsViewReportOpen}>
         <DialogContent className="max-w-4xl">
           <DialogHeader>
             <DialogTitle>Receiving Report Details</DialogTitle>
             <CardDescription>
                {viewReport && `${format(new Date(viewReport.receivedAt), "PPP p")} • Ref: ${viewReport.reference || 'N/A'}`}
             </CardDescription>
           </DialogHeader>
           
           <div className="border rounded-md overflow-hidden mt-4">
             <Table>
               <TableHeader className="bg-muted">
                 <TableRow>
                   <TableHead>Ingredient</TableHead>
                   <TableHead>Batch Code</TableHead>
                   <TableHead>Best Before</TableHead>
                   <TableHead>Qty</TableHead>
                   <TableHead>Storage</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {viewReportLines.map(lot => {
                    const type = ingredientTypes.find(t => t.id === lot.ingredientTypeId);
                    return (
                      <TableRow key={lot.id}>
                        <TableCell className="font-medium">{type?.name}</TableCell>
                        <TableCell className="font-mono font-bold">{lot.batchCode}</TableCell>
                        <TableCell className={cn(new Date(lot.bestBefore) < new Date() ? "text-rose-600 font-bold" : "")}>
                          {lot.bestBefore}
                        </TableCell>
                        <TableCell>{lot.quantity} {lot.unit}</TableCell>
                        <TableCell>{lot.storage}</TableCell>
                      </TableRow>
                    )
                 })}
               </TableBody>
             </Table>
           </div>

           <div className="mt-4 bg-muted/30 p-3 rounded text-sm text-muted-foreground">
              Notes: {viewReport?.notes || 'None'}
           </div>
         </DialogContent>
      </Dialog>
    </div>
  );
}

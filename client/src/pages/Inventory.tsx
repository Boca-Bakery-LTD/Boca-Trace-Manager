import { useState } from "react";
import { useBakeryStore, ReceivedLot } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Truck, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function Inventory() {
  const { receivedLots, ingredientTypes, users, addReceivedLot } = useBakeryStore();
  const { toast } = useToast();
  const [isReceivingOpen, setIsReceivingOpen] = useState(false);
  const [filter, setFilter] = useState("");

  // Form State
  const [formData, setFormData] = useState({
    ingredientTypeId: "",
    batchCode: "",
    bestBefore: "",
    quantity: "",
    receivedByUserId: "",
    storage: "Ambient",
    notes: ""
  });

  const handleSubmit = () => {
    if (!formData.ingredientTypeId || !formData.batchCode || !formData.receivedByUserId) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const type = ingredientTypes.find(t => t.id === formData.ingredientTypeId);

    addReceivedLot({
      ingredientTypeId: formData.ingredientTypeId,
      batchCode: formData.batchCode,
      bestBefore: formData.bestBefore || format(new Date(Date.now() + 30*24*60*60*1000), "yyyy-MM-dd"), // Default 30 days
      receivedAt: new Date().toISOString(),
      receivedByUserId: formData.receivedByUserId,
      quantity: Number(formData.quantity) || 0,
      unit: type?.defaultUnit || 'kg',
      storage: (formData.storage as any) || type?.storage || 'Ambient',
      notes: formData.notes
    });

    toast({ title: "Success", description: "Lot received successfully" });
    setIsReceivingOpen(false);
    setFormData({ ...formData, batchCode: "", quantity: "", notes: "" }); // Reset some fields
  };

  const filteredLots = receivedLots.filter(l => 
    l.batchCode.toLowerCase().includes(filter.toLowerCase()) || 
    ingredientTypes.find(t => t.id === l.ingredientTypeId)?.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Inventory & Receiving</h2>
          <p className="text-muted-foreground">Manage incoming raw materials and stock.</p>
        </div>
        
        <Dialog open={isReceivingOpen} onOpenChange={setIsReceivingOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white gap-2 font-semibold">
              <Truck className="w-5 h-5" />
              Receive New Lot
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Receive Goods</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Ingredient Type</Label>
                  <Select 
                    value={formData.ingredientTypeId} 
                    onValueChange={(val) => {
                      const type = ingredientTypes.find(t => t.id === val);
                      setFormData({ ...formData, ingredientTypeId: val, storage: type?.storage || 'Ambient' });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Ingredient..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ingredientTypes.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-2">
                  <Label>Supplier Batch Code</Label>
                  <Input 
                    placeholder="e.g. LOT-123-ABC" 
                    className="font-mono"
                    value={formData.batchCode}
                    onChange={e => setFormData({ ...formData, batchCode: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Best Before</Label>
                  <Input 
                    type="date" 
                    value={formData.bestBefore}
                    onChange={e => setFormData({ ...formData, bestBefore: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Storage</Label>
                  <Select value={formData.storage} onValueChange={val => setFormData({ ...formData, storage: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ambient">Ambient</SelectItem>
                      <SelectItem value="Chilled">Chilled</SelectItem>
                      <SelectItem value="Frozen">Frozen</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Quantity</Label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                  />
                </div>

                <div className="col-span-2">
                   <Label>Received By (Sign-off)</Label>
                   <div className="grid grid-cols-3 gap-2 mt-1">
                     {users.filter(u => u.role !== 'Admin').map(user => (
                       <div 
                         key={user.id}
                         onClick={() => setFormData({ ...formData, receivedByUserId: user.id })}
                         className={cn(
                           "cursor-pointer border rounded-md p-2 text-center text-sm transition-all",
                           formData.receivedByUserId === user.id ? "bg-primary text-white border-primary ring-2 ring-offset-1 ring-primary" : "hover:bg-muted"
                         )}
                       >
                         {user.name}
                       </div>
                     ))}
                   </div>
                </div>
                
                <div className="col-span-2">
                  <Label>Notes (Optional)</Label>
                  <Input 
                    placeholder="Damaged box, check temp, etc."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              
              <Button onClick={handleSubmit} className="w-full mt-4" size="lg">Confirm Receipt</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search batch codes..." 
            className="pl-9"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-md border shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Received</TableHead>
              <TableHead>Ingredient</TableHead>
              <TableHead>Batch Code</TableHead>
              <TableHead>Best Before</TableHead>
              <TableHead>Storage</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Receiver</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLots.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No lots found.</TableCell>
               </TableRow>
            ) : (
              filteredLots.map((lot) => {
                const type = ingredientTypes.find(t => t.id === lot.ingredientTypeId);
                const user = users.find(u => u.id === lot.receivedByUserId);
                return (
                  <TableRow key={lot.id}>
                    <TableCell className="font-mono text-xs">{format(new Date(lot.receivedAt), "dd/MM/yy HH:mm")}</TableCell>
                    <TableCell className="font-medium">{type?.name}</TableCell>
                    <TableCell className="font-mono font-bold">{lot.batchCode}</TableCell>
                    <TableCell className={cn(
                      new Date(lot.bestBefore) < new Date() ? "text-rose-600 font-bold flex items-center gap-1" : ""
                    )}>
                      {new Date(lot.bestBefore) < new Date() && <AlertTriangle className="w-3 h-3" />}
                      {lot.bestBefore}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn(
                        lot.storage === 'Chilled' ? "bg-blue-50 text-blue-700 border-blue-200" :
                        lot.storage === 'Frozen' ? "bg-cyan-50 text-cyan-700 border-cyan-200" : "bg-orange-50 text-orange-700 border-orange-200"
                      )}>
                        {lot.storage}
                      </Badge>
                    </TableCell>
                    <TableCell>{lot.quantity} {lot.unit}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{user?.name}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

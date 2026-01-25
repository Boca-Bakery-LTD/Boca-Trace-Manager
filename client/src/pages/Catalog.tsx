import { useState } from "react";
import { useBakeryStore, ProductCatalog } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Plus, Save, Trash2, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Catalog() {
  const { productCatalog, addProduct, updateProduct, removeProduct } = useBakeryStore();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    hasDough: true,
    hasFilling: false,
    active: true
  });

  const handleSave = () => {
    if (!formData.name) return;
    addProduct(formData);
    toast({ title: "Success", description: "Product added to catalog" });
    setIsAdding(false);
    setFormData({ name: "", sku: "", hasDough: true, hasFilling: false, active: true });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Product Catalog</h2>
          <p className="text-muted-foreground">Manage predefined products and their required batch types.</p>
        </div>
        <Button onClick={() => setIsAdding(true)} className="gap-2 font-bold">
          <Plus className="w-5 h-5" />
          Add New Product
        </Button>
      </div>

      {isAdding && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              New Catalog Item
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Jam Doughnut" />
              </div>
              <div className="space-y-2">
                <Label>SKU / Ref</Label>
                <Input value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} placeholder="e.g. DN-01" />
              </div>
            </div>
            <div className="flex gap-8 py-2">
              <div className="flex items-center gap-2">
                <Checkbox id="dough" checked={formData.hasDough} onCheckedChange={(c) => setFormData({...formData, hasDough: !!c})} />
                <Label htmlFor="dough">Requires Dough Batch</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="filling" checked={formData.hasFilling} onCheckedChange={(c) => setFormData({...formData, hasFilling: !!c})} />
                <Label htmlFor="filling">Requires Filling Batch</Label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleSave} className="font-bold">Save Product</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Components</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {productCatalog.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-bold">{p.name}</TableCell>
                <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {p.hasDough && <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">Dough</span>}
                    {p.hasFilling && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase">Filling</span>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="icon" onClick={() => removeProduct(p.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                     <Trash2 className="w-4 h-4" />
                   </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

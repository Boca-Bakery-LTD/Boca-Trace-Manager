import { useState } from "react";
import { useBakeryStore, ProductCatalog, Recipe } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Plus, Save, Trash2, ChefHat, UtensilsCrossed, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Catalog() {
  const { 
    productCatalog, 
    addProduct, 
    updateProduct, 
    removeProduct, 
    recipes, 
    addRecipe, 
    updateRecipe,
    removeRecipe,
    ingredientTypes,
    getCurrentUser
  } = useBakeryStore();
  
  const user = getCurrentUser();
  const isAdmin = user?.role === 'Admin';
  
  const { toast } = useToast();
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingRecipe, setIsAddingRecipe] = useState(false);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  
  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    hasDough: true,
    hasFilling: false,
    active: true
  });

  const [recipeForm, setRecipeForm] = useState({
    name: "",
    type: 'Dough' as 'Dough' | 'Filling',
    ingredients: [] as { ingredientTypeId: string; quantity: number; unit: any }[],
    active: true
  });

  const handleSaveProduct = () => {
    if (!productForm.name) return;
    addProduct(productForm);
    toast({ title: "Success", description: "Product added to catalog" });
    setIsAddingProduct(false);
    setProductForm({ name: "", sku: "", hasDough: true, hasFilling: false, active: true });
  };

  const handleSaveRecipe = () => {
    if (!recipeForm.name || recipeForm.ingredients.length === 0) {
      toast({ title: "Error", description: "Name and at least one ingredient required", variant: "destructive" });
      return;
    };
    
    if (editingRecipeId) {
      updateRecipe(editingRecipeId, recipeForm);
      toast({ title: "Success", description: "Recipe updated successfully" });
    } else {
      addRecipe(recipeForm);
      toast({ title: "Success", description: "Recipe created successfully" });
    }
    
    setIsAddingRecipe(false);
    setEditingRecipeId(null);
    setRecipeForm({ name: "", type: 'Dough', ingredients: [], active: true });
  };

  const startEditRecipe = (recipe: Recipe) => {
    setRecipeForm({
      name: recipe.name,
      type: recipe.type,
      ingredients: [...recipe.ingredients],
      active: recipe.active
    });
    setEditingRecipeId(recipe.id);
    setIsAddingRecipe(true);
  };

  const toggleRecipeIngredient = (id: string) => {
    setRecipeForm(prev => {
      const exists = prev.ingredients.find(i => i.ingredientTypeId === id);
      if (exists) {
        return {
          ...prev,
          ingredients: prev.ingredients.filter(i => i.ingredientTypeId !== id)
        };
      } else {
        return {
          ...prev,
          ingredients: [...prev.ingredients, { ingredientTypeId: id, quantity: 0, unit: 'kg' }]
        };
      }
    });
  };

  const updateIngredientValue = (id: string, field: 'quantity' | 'unit', value: any) => {
    setRecipeForm(prev => ({
      ...prev,
      ingredients: prev.ingredients.map(i => 
        i.ingredientTypeId === id ? { ...i, [field]: value } : i
      )
    }));
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto pb-20">
      {/* Product Catalog Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b pb-6">
          <div>
            <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Product Catalog</h2>
            <p className="text-muted-foreground">Manage predefined products and their required batch types.</p>
          </div>
          <Button onClick={() => setIsAddingProduct(true)} className="gap-2 font-bold">
            <Plus className="w-5 h-5" />
            Add New Product
          </Button>
        </div>

        {isAddingProduct && (
          <Card className="border-primary shadow-md animate-in fade-in zoom-in duration-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                New Catalog Item
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Product Name</Label>
                  <Input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} placeholder="e.g. Jam Doughnut" />
                </div>
                <div className="space-y-2">
                  <Label>SKU / Ref</Label>
                  <Input value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} placeholder="e.g. DN-01" />
                </div>
              </div>
              <div className="flex gap-8 py-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="dough" checked={productForm.hasDough} onCheckedChange={(c) => setProductForm({...productForm, hasDough: !!c})} />
                  <Label htmlFor="dough">Requires Dough Batch</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="filling" checked={productForm.hasFilling} onCheckedChange={(c) => setProductForm({...productForm, hasFilling: !!c})} />
                  <Label htmlFor="filling">Requires Filling Batch</Label>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={() => setIsAddingProduct(false)}>Cancel</Button>
                <Button onClick={handleSaveProduct} className="font-bold">Save Product</Button>
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
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => removeProduct(p.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* Recipe Management Section */}
      <section className="space-y-6">
        <div className="flex justify-between items-center border-b pb-6">
          <div>
            <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Recipe Management</h2>
            <p className="text-muted-foreground">Define recipes with pre-selected ingredients for production batches.</p>
          </div>
          <Button onClick={() => setIsAddingRecipe(true)} variant="outline" className="gap-2 font-bold border-primary text-primary hover:bg-primary/5">
            <Plus className="w-5 h-5" />
            Create New Recipe
          </Button>
        </div>

        {isAddingRecipe && (
          <Card className="border-primary shadow-md animate-in fade-in zoom-in duration-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                {editingRecipeId ? 'Edit Recipe' : 'New Recipe Configuration'}
              </CardTitle>
              <CardDescription>Define batch type, ingredients, and required measurements.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Recipe Name</Label>
                  <Input 
                    value={recipeForm.name} 
                    onChange={e => setRecipeForm({...recipeForm, name: e.target.value})} 
                    placeholder="e.g. Classic White Dough" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Batch Type</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant={recipeForm.type === 'Dough' ? 'default' : 'outline'}
                      onClick={() => setRecipeForm({...recipeForm, type: 'Dough'})}
                      className="flex-1"
                    >
                      Dough
                    </Button>
                    <Button 
                      variant={recipeForm.type === 'Filling' ? 'default' : 'outline'}
                      onClick={() => setRecipeForm({...recipeForm, type: 'Filling'})}
                      className="flex-1"
                    >
                      Filling
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-bold">Ingredients & Measurements</Label>
                <div className="grid grid-cols-1 gap-4">
                  {ingredientTypes.filter(i => i.active).map(ing => {
                    const selected = recipeForm.ingredients.find(ri => ri.ingredientTypeId === ing.id);
                    return (
                      <div 
                        key={ing.id}
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center gap-4 p-3 rounded border transition-colors",
                          selected ? "bg-primary/5 border-primary shadow-sm" : "hover:bg-muted/50"
                        )}
                      >
                        <div 
                          className="flex items-center gap-3 cursor-pointer min-w-[200px]"
                          onClick={() => toggleRecipeIngredient(ing.id)}
                        >
                          <Checkbox checked={!!selected} onCheckedChange={() => {}} />
                          <span className={cn("text-sm", selected && "font-bold text-primary")}>{ing.name}</span>
                        </div>

                        {selected && (
                          <div className="flex flex-1 items-center gap-2 animate-in fade-in slide-in-from-left-2">
                            <div className="flex-1 max-w-[120px]">
                              <Input 
                                type="number"
                                placeholder="Qty"
                                value={selected.quantity || ""}
                                onChange={(e) => updateIngredientValue(ing.id, 'quantity', parseFloat(e.target.value))}
                                className="h-8 text-sm"
                              />
                            </div>
                            <div className="w-[100px]">
                              <Select 
                                value={selected.unit} 
                                onValueChange={(val) => updateIngredientValue(ing.id, 'unit', val)}
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="g">Grams (g)</SelectItem>
                                  <SelectItem value="kg">Kilograms (kg)</SelectItem>
                                  <SelectItem value="ml">Millilitres (ml)</SelectItem>
                                  <SelectItem value="L">Litres (L)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={() => { setIsAddingRecipe(false); setEditingRecipeId(null); }}>Cancel</Button>
                <Button onClick={handleSaveRecipe} className="font-bold gap-2">
                  <Save className="w-4 h-4" />
                  {editingRecipeId ? 'Update Recipe' : 'Save Recipe'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipe Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pre-selected Ingredients</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipes.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-bold">{r.name}</TableCell>
                  <TableCell>
                    {r.type === 'Dough' ? (
                      <span className="flex items-center gap-1.5 text-primary text-xs font-bold uppercase">
                        <ChefHat className="w-3 h-3" /> Dough
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-600 text-xs font-bold uppercase">
                        <UtensilsCrossed className="w-3 h-3" /> Filling
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {r.ingredients.map(ri => {
                        const ing = ingredientTypes.find(i => i.id === ri.ingredientTypeId);
                        return ing ? (
                          <span key={ri.ingredientTypeId} className="bg-muted px-2 py-0.5 rounded text-[10px] whitespace-nowrap flex items-center gap-1">
                            {ing.name} <span className="text-primary font-bold">({ri.quantity}{ri.unit})</span>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => startEditRecipe(r)} className={cn("hover:bg-primary/10 text-primary", !isAdmin && "opacity-50 pointer-events-none")}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {isAdmin && (
                        <Button variant="ghost" size="icon" onClick={() => removeRecipe(r.id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}

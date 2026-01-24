import { useState } from "react";
import { Filter, Download, Plus, MoreHorizontal, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOTS, PRODUCTS } from "@/lib/mockData";
import { Badge } from "@/components/ui/badge";

export default function Inventory() {
  const [filter, setFilter] = useState("");

  const filteredLots = LOTS.filter(l => 
    l.lotNumber.toLowerCase().includes(filter.toLowerCase()) || 
    l.id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Inventory & Lots</h2>
          <p className="text-muted-foreground">Manage raw materials, WIP, and finished goods.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Receive Goods
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Input 
          placeholder="Filter by Lot #..." 
          className="max-w-xs bg-white"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <Button variant="outline" size="icon">
          <Filter className="w-4 h-4" />
        </Button>
        <Button variant="outline" size="icon">
          <QrCode className="w-4 h-4" />
        </Button>
      </div>

      <div className="bg-white rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-bold">Lot Number</TableHead>
              <TableHead className="font-bold">Product</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold">Quantity</TableHead>
              <TableHead className="font-bold">Location</TableHead>
              <TableHead className="font-bold">Expiry</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLots.map((lot) => {
              const product = PRODUCTS.find(p => p.id === lot.productId);
              return (
                <TableRow key={lot.id} className="hover:bg-muted/20">
                  <TableCell className="font-mono font-medium">{lot.lotNumber}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{product?.name}</span>
                      <span className="text-xs text-muted-foreground">{product?.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase border ${
                        lot.status === 'Released' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        lot.status === 'Hold' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        lot.status === 'Quarantine' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                        'bg-gray-100 text-gray-800 border-gray-200'
                      }`}>
                      {lot.status}
                    </div>
                  </TableCell>
                  <TableCell>{lot.remainingQuantity} {lot.unit}</TableCell>
                  <TableCell>{lot.location}</TableCell>
                  <TableCell className="text-muted-foreground">{lot.expiryDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Print Label</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-amber-600">Place on Hold</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

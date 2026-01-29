import { useState } from "react";
import { useBakeryStore, User, Role } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Shield, Trash2, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Badge } from "@/components/ui/badge";

export default function UserManagement() {
  const { users, addUser, removeUser, getCurrentUser } = useBakeryStore();
  const { toast } = useToast();
  
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

  const [newUser, setNewUser] = useState({
    name: "",
    pin: "",
    role: "Staff" as Role
  });

  const handleAddUser = () => {
    if (!newUser.name || !newUser.pin) return;
    addUser({ ...newUser, active: true });
    setNewUser({ name: "", pin: "", role: "Staff" });
    toast({ title: "User Added Successfully" });
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
        <Shield className="w-12 h-12 mb-4 opacity-20" />
        <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
        <p>Only Administrators can manage users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-center border-b pb-6">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary tracking-tight">User Management</h2>
          <p className="text-muted-foreground">Manage bakery staff and access permissions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 h-fit border-primary shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Add New User
            </CardTitle>
            <CardDescription>Define credentials and roles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} placeholder="e.g. Alex Baker" />
            </div>
            <div className="space-y-2">
              <Label>PIN / Password</Label>
              <Input type="password" value={newUser.pin} onChange={e => setNewUser({...newUser, pin: e.target.value})} placeholder="4-digit PIN" maxLength={4} />
            </div>
            <div className="space-y-2">
              <Label>Access Role</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['Staff', 'Admin'] as Role[]).map(role => (
                  <Button 
                    key={role}
                    variant={newUser.role === role ? 'default' : 'outline'}
                    onClick={() => setNewUser({...newUser, role})}
                    size="sm"
                    className="font-bold"
                  >
                    {role}
                  </Button>
                ))}
              </div>
            </div>
            <Button className="w-full font-bold mt-2" onClick={handleAddUser}>Create Account</Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u: User) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'Admin' ? 'default' : 'secondary'} className={u.role === 'Admin' ? 'bg-primary' : ''}>
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="icon" className="text-muted-foreground">
                         <Key className="w-4 h-4" />
                       </Button>
                       <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => removeUser?.(u.id)}>
                         <Trash2 className="w-4 h-4" />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

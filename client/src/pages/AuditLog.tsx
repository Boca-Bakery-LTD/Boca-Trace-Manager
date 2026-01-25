import { format } from "date-fns";
import { useBakeryStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, User, Activity, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AuditLog() {
  const { auditLog, users } = useBakeryStore();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="border-b pb-6">
        <h2 className="text-3xl font-display font-bold text-primary tracking-tight">Audit History</h2>
        <p className="text-muted-foreground">Immutable record of all key production and traceability events.</p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[180px]">Timestamp</TableHead>
              <TableHead>Event Type</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Entity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {auditLog.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  No audit events recorded.
                </TableCell>
              </TableRow>
            ) : (
              auditLog.map((event: any) => {
                const user = users.find(u => u.id === event.userId);
                return (
                  <TableRow key={event.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {format(new Date(event.timestamp), "dd/MM/yy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[10px] uppercase border-primary/20 bg-primary/5">
                        {event.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {event.details}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-xs">
                        <User className="w-3 h-3 text-muted-foreground" />
                        {user?.name || "System"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {event.entityType && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                           <Database className="w-3 h-3" />
                           {event.entityType}
                        </div>
                      )}
                    </TableCell>
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

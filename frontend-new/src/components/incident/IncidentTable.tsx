import { useState, useMemo } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Search, RotateCcw } from "lucide-react";

export interface Incident {
  _id?: string;
  id?: string;
  user: string;
  category: string;
  location: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "pending" | "in_progress" | "resolved";
  date: string;
  description?: string;
  images?: string[];
  video?: string | null;
}

interface IncidentTableProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
}

const CATEGORIES = ["All", "Theft", "Medical Emergency", "Lost Documents", "Suspicious Activity", "Others"];
const STATUSES = ["All", "Pending", "In Progress", "Resolved"];

const severityColor: Record<Incident["severity"], string> = {
  low: "bg-emerald text-emerald-foreground",
  medium: "bg-amber text-amber-foreground",
  high: "bg-amber text-amber-foreground",
  critical: "bg-critical text-critical-foreground",
};

const statusColor: Record<Incident["status"], string> = {
  pending: "bg-sky text-sky-foreground",
  in_progress: "bg-amber text-amber-foreground",
  resolved: "bg-emerald text-emerald-foreground",
};

const statusLabel: Record<Incident["status"], string> = {
  pending: "Pending",
  in_progress: "In Progress",
  resolved: "Resolved",
};

const IncidentTable = ({ incidents, onSelectIncident }: IncidentTableProps) => {
  const [searchId, setSearchId] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = useMemo(() => {
    return incidents.filter((inc) => {
      if (searchId && !(inc.id || inc._id || '').toLowerCase().includes(searchId.toLowerCase())) return false;
      if (categoryFilter !== "All" && inc.category !== categoryFilter) return false;
      if (statusFilter !== "All") {
        const mapped = statusFilter === "In Progress" ? "in_progress" : statusFilter.toLowerCase();
        if (inc.status !== mapped) return false;
      }
      return true;
    });
  }, [incidents, searchId, categoryFilter, statusFilter]);

  const resetFilters = () => {
    setSearchId("");
    setCategoryFilter("All");
    setStatusFilter("All");
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No incidents found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inc) => (
                <TableRow
                  key={inc.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => onSelectIncident(inc)}
                >
                  <TableCell className="font-mono text-xs">{inc.id}</TableCell>
                  <TableCell>{inc.user}</TableCell>
                  <TableCell>{inc.category}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{inc.location}</TableCell>
                  <TableCell>
                    <Badge className={severityColor[inc.severity]}>
                      {inc.severity.charAt(0).toUpperCase() + inc.severity.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColor[inc.status]}>
                      {statusLabel[inc.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{inc.date}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default IncidentTable;

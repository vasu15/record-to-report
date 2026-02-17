import { useState, useEffect, useRef } from "react";
import { apiPost, apiGet } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Sparkles, Users, Info, Search, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface Approver {
  id: number;
  name: string;
  email: string;
  role: string;
  source?: string;
  ruleName?: string;
}

interface MatchedRule {
  id: number;
  name: string;
  description: string;
}

interface ApproverSuggestions {
  ruleBasedApprovers: Approver[];
  roleBasedApprovers: Approver[];
  matchedRules: MatchedRule[];
  suggestedApproverIds: number[];
}

interface ApproverSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poLineId: number | null;
  type: "period" | "activity" | "nonpo";
  title: string;
  description: string;
  onSubmit: (selectedApproverIds: number[]) => Promise<void>;
  submitLabel?: string;
}

export function ApproverSelectionDialog({
  open,
  onOpenChange,
  poLineId,
  type,
  title,
  description,
  onSubmit,
  submitLabel = "Submit for Approval"
}: ApproverSelectionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [suggestions, setSuggestions] = useState<ApproverSuggestions | null>(null);
  const [selectedApprovers, setSelectedApprovers] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && poLineId) {
      loadSuggestions();
      loadAllUsers();
    } else {
      setSuggestions(null);
      setSelectedApprovers(new Set());
      setSearchQuery("");
      setAllUsers([]);
      setShowSearchDropdown(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, poLineId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const data = await apiPost<ApproverSuggestions>("/api/rules/suggest-approvers", {
        poLineId,
        type
      });
      setSuggestions(data);
      // Pre-select rule-based approvers
      setSelectedApprovers(new Set(data.suggestedApproverIds));
    } catch (err) {
      console.error("Failed to load approver suggestions:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      const users = await apiGet<any[]>("/api/users");
      setAllUsers(users);
    } catch (err) {
      console.error("Failed to load all users:", err);
    }
  };

  const toggleApprover = (id: number) => {
    const newSet = new Set(selectedApprovers);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedApprovers(newSet);
  };

  const selectFromSearch = (user: any) => {
    const newSet = new Set(selectedApprovers);
    newSet.add(user.id);
    setSelectedApprovers(newSet);
    setSearchQuery("");
    setShowSearchDropdown(false);
  };

  const handleSubmit = async () => {
    if (selectedApprovers.size === 0) return;
    
    setSubmitting(true);
    try {
      await onSubmit(Array.from(selectedApprovers));
      onOpenChange(false);
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Global search across all users
  const searchAllUsers = () => {
    if (!searchQuery || !searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return allUsers
      .filter((user) =>
        (user.name && user.name.toLowerCase().includes(query)) ||
        (user.email && user.email.toLowerCase().includes(query)) ||
        (user.roles && user.roles.some((r: string) => r.toLowerCase().includes(query)))
      )
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.roles?.join(", ") || "No Role"
      }));
  };

  const isSearchActive = searchQuery && searchQuery.trim().length > 0;
  const globalSearchResults = isSearchActive ? searchAllUsers() : [];
  const hasSearchResults = globalSearchResults.length > 0;

  // Get selected users details for display
  const getSelectedUserDetails = () => {
    const allApprovers = [
      ...(suggestions?.ruleBasedApprovers || []),
      ...(suggestions?.roleBasedApprovers || []),
      ...allUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.roles?.join(", ") || "No Role"
      }))
    ];
    
    const uniqueMap = new Map();
    allApprovers.forEach(a => uniqueMap.set(a.id, a));
    
    return Array.from(selectedApprovers)
      .map(id => uniqueMap.get(id))
      .filter(Boolean);
  };

  const selectedUserDetails = getSelectedUserDetails();

  const ApproverCard = ({ approver, isSelected }: { approver: Approver; isSelected: boolean }) => (
    <div 
      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer hover:bg-accent/50 ${
        isSelected ? "bg-accent border-primary" : "border-border"
      }`}
      onClick={() => toggleApprover(approver.id)}
    >
      <Checkbox 
        checked={isSelected} 
        onCheckedChange={() => toggleApprover(approver.id)}
        onClick={(e) => e.stopPropagation()}
      />
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs bg-primary/10 text-primary">
          {approver.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{approver.name}</p>
        <p className="text-xs text-muted-foreground truncate">{approver.email}</p>
      </div>
      <Badge variant="outline" className="text-[9px] shrink-0">{approver.role}</Badge>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : suggestions ? (
          <>
            {/* Search Input with Dropdown */}
            <div className="relative" ref={searchRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                placeholder="Search for any user..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(e.target.value.trim().length > 0);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length > 0) {
                    setShowSearchDropdown(true);
                  }
                }}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearchDropdown(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground z-10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              
              {/* Search Dropdown */}
              {showSearchDropdown && isSearchActive && (
                <div className="absolute top-full mt-1 w-full bg-background border rounded-lg shadow-lg max-h-[300px] overflow-auto z-50">
                  {hasSearchResults ? (
                    <div className="p-2">
                      {globalSearchResults.map((user) => (
                        <div
                          key={user.id}
                          onClick={() => selectFromSearch(user)}
                          className={`flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${
                            selectedApprovers.has(user.id) ? "bg-accent/50" : ""
                          }`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                          <Badge variant="outline" className="text-[9px] shrink-0">{user.role}</Badge>
                          {selectedApprovers.has(user.id) && (
                            <Badge variant="secondary" className="text-[9px]">Selected</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No users found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Users Display */}
            {selectedUserDetails.length > 0 && (
              <div className="border rounded-lg p-3 bg-accent/5">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Selected Approvers</h4>
                  <Badge variant="secondary" className="text-[9px]">
                    {selectedUserDetails.length}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedUserDetails.map((user: any) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 bg-background border rounded-md px-2 py-1"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                          {user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{user.name}</span>
                      <button
                        onClick={() => toggleApprover(user.id)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="space-y-4 py-2">
                {/* Matched Rules Info */}
                {suggestions?.matchedRules && suggestions.matchedRules.length > 0 && (
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-primary">Approval Rules Applied</p>
                    </div>
                    {suggestions.matchedRules.map((rule) => (
                      <div key={rule.id} className="pl-6">
                        <p className="text-xs font-medium">{rule.name}</p>
                        <p className="text-xs text-muted-foreground">{rule.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rule-Based Approvers */}
                {suggestions.ruleBasedApprovers.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold">Suggested by Rules</h4>
                      <Badge variant="secondary" className="text-[9px]">
                        {suggestions.ruleBasedApprovers.length}
                      </Badge>
                    </div>
                    <div className="grid gap-2">
                      {suggestions.ruleBasedApprovers.map((approver) => (
                        <ApproverCard 
                          key={approver.id} 
                          approver={approver} 
                          isSelected={selectedApprovers.has(approver.id)} 
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Separator */}
                {suggestions.ruleBasedApprovers.length > 0 && suggestions.roleBasedApprovers.length > 0 && (
                  <Separator />
                )}

                {/* Role-Based Approvers */}
                {suggestions.roleBasedApprovers.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <h4 className="text-sm font-semibold text-muted-foreground">Other Available Approvers</h4>
                      <Badge variant="outline" className="text-[9px]">
                        {suggestions.roleBasedApprovers.length}
                      </Badge>
                    </div>
                    <div className="grid gap-2">
                      {suggestions.roleBasedApprovers.map((approver) => (
                        <ApproverCard 
                          key={approver.id} 
                          approver={approver} 
                          isSelected={selectedApprovers.has(approver.id)} 
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* No default approvers */}
                {suggestions.ruleBasedApprovers.length === 0 && suggestions.roleBasedApprovers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No default approvers available</p>
                    <p className="text-xs mt-1">Use search above to find and add any user</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </>
        ) : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={selectedApprovers.size === 0 || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                {submitLabel} ({selectedApprovers.size})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

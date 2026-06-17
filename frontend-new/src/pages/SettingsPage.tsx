import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UserDashboardLayout } from "@/components/dashboard/UserDashboardLayout";
import { useAuth, EmergencyContact } from "@/contexts/AuthContext";
import { Trash2, Star, Plus } from "lucide-react";

const SettingsPage = () => {
  const { user, updateUser, logout } = useAuth();
  
  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  // Emergency Contacts state
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [newContactName, setNewContactName] = useState("");
  const [newContactRel, setNewContactRel] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || "");
      setPhone(user.phone || "");
      setContacts(user.emergencyContacts || []);
    }
  }, [user]);

  // Handle profile updates
  const handleSaveProfile = () => {
    updateUser({ name: displayName, phone });
    toast.success("Profile updated successfully!");
  };

  // Emergency Contact Management
  const handleAddContact = () => {
    if (!newContactName || !newContactRel || !newContactPhone) {
      toast.error("Please fill all contact fields");
      return;
    }
    // Simple phone validation
    if (!/^\+?[\d\s-]{10,}$/.test(newContactPhone)) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (contacts.some(c => c.phone === newContactPhone)) {
      toast.error("This phone number is already added");
      return;
    }
    if (contacts.length >= 5) {
      toast.error("Maximum 5 emergency contacts allowed");
      return;
    }

    const newContact: EmergencyContact = {
      id: Date.now().toString(),
      name: newContactName,
      relationship: newContactRel,
      phone: newContactPhone,
      isPrimary: contacts.length === 0, // First contact is primary by default
    };

    const newContacts = [...contacts, newContact];
    setContacts(newContacts);
    updateUser({ emergencyContacts: newContacts });
    
    setNewContactName("");
    setNewContactRel("");
    setNewContactPhone("");
    toast.success("Emergency contact added!");
  };

  const handleRemoveContact = (id: string) => {
    const newContacts = contacts.filter(c => c.id !== id);
    // If we removed the primary, make the first remaining contact primary
    if (contacts.find(c => c.id === id)?.isPrimary && newContacts.length > 0) {
      newContacts[0].isPrimary = true;
    }
    setContacts(newContacts);
    updateUser({ emergencyContacts: newContacts });
    toast.success("Contact removed");
  };

  const handleSetPrimary = (id: string) => {
    const newContacts = contacts.map(c => ({
      ...c,
      isPrimary: c.id === id
    }));
    setContacts(newContacts);
    updateUser({ emergencyContacts: newContacts });
    toast.success("Primary contact updated");
  };

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleUpdatePassword = () => {
    setPasswordError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters.");
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Password updated successfully!");
  };

  // Notification state
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [incidentUpdates, setIncidentUpdates] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);

  // Privacy state
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [dataSharing, setDataSharing] = useState(false);

  // Delete account modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");

  const handleDeleteAccount = () => {
    setIsDeleteModalOpen(false);
    setDeleteConfirmation("");
    toast.success("Account deleted");
    logout();
  };

  return (
    <UserDashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6 pt-2 pb-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email || ""} readOnly className="opacity-60 cursor-not-allowed bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveProfile}>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Emergency Contacts Section */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contacts</CardTitle>
            <CardDescription>Manage up to 5 emergency contacts to be notified during an SOS.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 rounded-md border border-border bg-muted/30">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{contact.name}</span>
                      {contact.isPrimary && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded">
                          <Star className="h-3 w-3 fill-amber-500" /> Primary
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                      <span>{contact.relationship}</span>
                      <span>&bull;</span>
                      <span>{contact.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!contact.isPrimary && (
                      <Button variant="ghost" size="sm" onClick={() => handleSetPrimary(contact.id)} className="h-8 text-xs hover:text-amber-500">
                        Set Primary
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveContact(contact.id)} className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              {contacts.length === 0 && (
                <div className="text-sm text-muted-foreground text-center p-4 border border-dashed rounded-md">
                  No emergency contacts added yet.
                </div>
              )}
            </div>

            {contacts.length < 5 && (
              <div className="pt-4 border-t border-border mt-4">
                <h4 className="text-sm font-medium mb-3">Add New Contact</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input placeholder="Jane Doe" value={newContactName} onChange={e => setNewContactName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Relationship</Label>
                    <Input placeholder="Spouse" value={newContactRel} onChange={e => setNewContactRel(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Phone Number</Label>
                    <Input placeholder="+91 9876543210" value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} />
                  </div>
                </div>
                <Button variant="outline" onClick={handleAddContact} className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" /> Add Contact
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Change Password Section */}
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Update your password to keep your account secure.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            {passwordError && (
              <p className="text-sm font-medium text-destructive">{passwordError}</p>
            )}
            <Button onClick={handleUpdatePassword}>Update Password</Button>
          </CardContent>
        </Card>

        {/* Notifications Section */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Manage your notification preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications" className="text-sm font-normal">Email Notifications</Label>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch id="emailNotifications" checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="incidentUpdates" className="text-sm font-normal">Incident Updates</Label>
                <p className="text-xs text-muted-foreground">Get updates on reported incidents</p>
              </div>
              <Switch id="incidentUpdates" checked={incidentUpdates} onCheckedChange={setIncidentUpdates} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emergencyAlerts" className="text-sm font-normal">Emergency Alerts</Label>
                <p className="text-xs text-muted-foreground">Receive emergency safety alerts</p>
              </div>
              <Switch id="emergencyAlerts" checked={emergencyAlerts} onCheckedChange={setEmergencyAlerts} />
            </div>
            <Button onClick={() => toast.success("Notification settings saved!")}>Save Notification Settings</Button>
          </CardContent>
        </Card>

        {/* Privacy Section */}
        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
            <CardDescription>Control your privacy settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileVisibility">Profile Visibility</Label>
              <Select value={profileVisibility} onValueChange={setProfileVisibility}>
                <SelectTrigger id="profileVisibility">
                  <SelectValue placeholder="Select visibility" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dataSharing" className="text-sm font-normal">Data Sharing</Label>
                <p className="text-xs text-muted-foreground">Allow sharing of anonymized data for research</p>
              </div>
              <Switch id="dataSharing" checked={dataSharing} onCheckedChange={setDataSharing} />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone Section */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Permanently delete your account and all associated data.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
                Delete Account
              </Button>

              {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <Card className="w-full max-w-md p-6">
                    <CardHeader>
                      <CardTitle className="text-destructive">Are you absolutely sure?</CardTitle>
                      <CardDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="deleteConfirmation">
                          Type <span className="font-mono bg-muted px-1 rounded">DELETE</span> to confirm
                        </Label>
                        <Input
                          id="deleteConfirmation"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          placeholder="Type DELETE to confirm"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>
                          Cancel
                        </Button>
                        <Button variant="destructive" className="flex-1" onClick={handleDeleteAccount} disabled={deleteConfirmation !== "DELETE"}>
                          Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </UserDashboardLayout>
  );
};

export default SettingsPage;

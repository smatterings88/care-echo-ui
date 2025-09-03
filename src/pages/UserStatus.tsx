import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { auth } from "@/lib/firebase";
import { updateProfile, sendPasswordResetEmail } from "firebase/auth";

export default function UserStatus() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [saving, setSaving] = useState(false);

  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6">
          <p className="mb-4">You are not logged in.</p>
          <Button onClick={() => navigate('/login')}>Go to Login</Button>
        </Card>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateProfile(auth.currentUser!, { displayName });
    } catch (e) {
      // no-op UI level
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    await sendPasswordResetEmail(auth, user.email);
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="p-6 space-y-4">
        <h2 className="text-xl font-bold">My Profile</h2>
        <div className="grid gap-4 max-w-md">
          <div>
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            <Button variant="outline" onClick={handlePasswordReset}>Send Password Reset</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

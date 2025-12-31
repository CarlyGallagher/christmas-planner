'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2, Save, Eye, EyeOff } from 'lucide-react';
import type { Profile } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setEmail(user.email || '');

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (profileData) {
        setProfile(profileData);
        setDisplayName(profileData.display_name);
        console.log('Profile loaded:', profileData);
        console.log('Avatar URL:', profileData.avatar_url);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      setMessage({ type: 'error', text: 'Display name is required' });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      router.refresh(); // Refresh to update navbar
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all password fields' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    try {
      setChangingPassword(true);
      setMessage(null);

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update password' });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please upload an image file' });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image must be less than 2MB' });
      return;
    }

    try {
      setUploading(true);
      setMessage(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      if (profile) {
        setProfile({ ...profile, avatar_url: publicUrl });
      }

      console.log('Avatar uploaded successfully. Public URL:', publicUrl);
      setMessage({ type: 'success', text: 'Avatar updated successfully!' });
      router.refresh(); // Refresh to update navbar
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setMessage({ type: 'error', text: 'Failed to upload avatar' });
    } finally {
      setUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Profile Settings</h1>

      {message && (
        <div
          className={`mb-6 p-4 rounded-md ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your profile photo and personal details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile}>
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left side - Profile Photo */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => !uploading && document.getElementById('avatar-upload')?.click()}>
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                  <div className="h-32 w-32 rounded-full overflow-hidden bg-green-600 flex items-center justify-center">
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={displayName}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          console.error('Image failed to load:', profile.avatar_url);
                          console.error('Error event:', e);
                        }}
                        onLoad={() => {
                          console.log('Image loaded successfully:', profile.avatar_url);
                        }}
                      />
                    ) : (
                      <span className="text-white text-3xl font-semibold">
                        {getInitials(displayName)}
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-transparent group-hover:bg-black group-hover:bg-opacity-20 rounded-full transition-all duration-200 pointer-events-none">
                    {uploading ? (
                      <Loader2 className="h-8 w-8 text-white animate-spin" />
                    ) : (
                      <Camera className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 text-center">
                  Click to change
                  <br />
                  JPG, PNG or GIF. Max 2MB.
                </p>
              </div>

              {/* Right side - Form Fields */}
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    disabled={saving}
                    required
                  />
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>Update your email and password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email Section */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-sm text-gray-500">
              Email cannot be changed
            </p>
          </div>

          {/* Divider */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-4">Change Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    disabled={changingPassword}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-500">
                  Must be at least 8 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={changingPassword}
                    required
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={changingPassword}>
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

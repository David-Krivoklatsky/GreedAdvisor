'use client';

import React, { useState } from 'react';
import { User } from '../../../types/profile';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';

interface ProfileSectionProps {
  user: User;
  onUpdate: (data: {
    email: string;
    password?: string;
    profilePictureFile?: File;
  }) => Promise<void>;
  updating: boolean;
}

export default function ProfileSection({ user, onUpdate, updating }: ProfileSectionProps) {
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || '');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePictureFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = event => {
        setProfilePicture(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password && password !== confirmPassword) {
      return; // Handle validation in parent
    }

    await onUpdate({
      email,
      ...(password && { password }),
      ...(profilePictureFile && { profilePictureFile }),
    });
  };

  const imageSrc = profilePicture || '/profile-picture.svg';

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your account information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center space-x-6">
            <div className="shrink-0">
              <img
                className="h-16 w-16 rounded-full border border-border object-cover bg-muted"
                src={imageSrc}
                alt="Profile"
              />
            </div>
            <div>
              <Label htmlFor="profile-picture">Profile Picture</Label>
              <Input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="mt-1"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password">New Password (leave blank to keep current)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="new-password"
              className="mt-1"
              placeholder="Enter new password"
            />
          </div>

          {/* Confirm Password */}
          {password && (
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                className="mt-1"
                placeholder="Confirm new password"
                required
              />
              {password !== confirmPassword && confirmPassword && (
                <p className="text-sm mt-1 text-destructive">Passwords do not match</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={updating || (!!password && password !== confirmPassword)}
            className="w-full bg-primary text-primary-foreground"
          >
            {updating ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

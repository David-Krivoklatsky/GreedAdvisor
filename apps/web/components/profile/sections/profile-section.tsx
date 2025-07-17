'use client';

import Image from 'next/image';
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
  error: string;
  success: string;
}

export default function ProfileSection({
  user,
  onUpdate,
  updating,
  error,
  success,
}: ProfileSectionProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>Update your account information</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center space-x-6">
            <div className="shrink-0">
              <Image
                className="h-16 w-16 object-cover rounded-full"
                src={profilePicture || '/profile-picture.svg'}
                alt="Profile"
                width={64}
                height={64}
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
                className="mt-1"
                placeholder="Confirm new password"
                required
              />
              {password !== confirmPassword && confirmPassword && (
                <p className="text-red-500 text-sm mt-1">Passwords do not match</p>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={updating || (!!password && password !== confirmPassword)}
            className="w-full"
            style={{ backgroundColor: '#1F09FF', color: 'white' }}
          >
            {updating ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

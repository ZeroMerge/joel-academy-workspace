import { createClient } from '@/lib/supabase/server';
import { updateProfile } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { X } from 'lucide-react';
import Link from 'next/link';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData?.user) return null;

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', userData.user.id)
    .single();

  if (!profile) return <div>Profile not found</div>;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8 mt-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted text-sm mt-1">Manage your account and availability</p>
        </div>
        <Link href="/home" className="p-2 text-muted hover:text-foreground hover:bg-muted/10 rounded-full transition-colors">
          <X className="h-5 w-5" strokeWidth={1.5} />
        </Link>
      </div>

      <div className="bg-muted/10 p-6 rounded-lg">
        <form action={updateProfile} className="space-y-6">
          <div className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="email">Email (Cannot be changed)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={profile.email}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="handle">Handle (@)</Label>
              <Input
                id="handle"
                name="handle"
                defaultValue={profile.handle}
                disabled
                title="Contact an admin to change your handle"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={profile.name}
                required
              />
            </div>
            
            <div className="pt-4 ">
              <h3 className="font-semibold mb-4">Availability Status</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="availability">Current Capacity</Label>
                  <select 
                    id="availability" 
                    name="availability" 
                    defaultValue={profile.availability}
                    className="w-full bg-background  rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                  >
                    <option value="available">Available for new tasks</option>
                    <option value="limited">Limited Capacity</option>
                    <option value="unavailable">Unavailable (Exams, Leave)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="return_date">Expected Return Date (If unavailable)</Label>
                  <Input
                    id="return_date"
                    name="return_date"
                    type="date"
                    defaultValue={profile.availability_return_date || ''}
                  />
                  <p className="text-xs text-muted">Helps leads know when they can assign you work again.</p>
                </div>
              </div>
            </div>

          </div>
          
          <div className="pt-4 flex justify-end">
             <Button type="submit">
               Save Changes
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

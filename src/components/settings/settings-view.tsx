"use client";

import { Laptop, LogOut, Moon, ShieldCheck, Sun, SunMoon, Trash2 } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { AvatarUpload } from "@/components/profile/avatar-upload";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { userProfile } from "@/data/user-profile";
import { saveProfile, useProfile } from "@/lib/profile-store";
import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/use-hydrated";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: SunMoon },
] as const;

function SettingsCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <h2 className="text-foreground text-[15px] font-semibold">{title}</h2>
      <p className="text-muted-foreground mt-1 mb-4 text-xs">{description}</p>
      {children}
    </Card>
  );
}

function ToggleRow({
  label,
  description,
  initial,
}: {
  label: string;
  description: string;
  initial: boolean;
}) {
  const [checked, setChecked] = useState(initial);

  return (
    <div className="flex items-center gap-4 border-line border-b py-3 last:border-b-0 last:pb-0 first:pt-0">
      <div className="min-w-0 flex-1">
        <p className="text-foreground text-sm font-medium">{label}</p>
        <p className="text-muted-foreground text-xs">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={setChecked} label={label} />
    </div>
  );
}

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const profile = useProfile();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Profile, appearance, notifications and security for this account."
        actions={<Button>Save changes</Button>}
      />

      <div className="grid items-start gap-6 xl:grid-cols-12">
        <div className="space-y-6 xl:col-span-7">
          <AvatarUpload />

          <SettingsCard
            title="Profile"
            description="Shown in the topbar, on statements and in shared reports."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-muted-foreground text-xs">Full name</span>
                <Input
                  value={profile.name}
                  onChange={(event) => saveProfile({ name: event.target.value })}
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-muted-foreground text-xs">E-mail</span>
                <Input
                  type="email"
                  value={profile.email}
                  onChange={(event) => saveProfile({ email: event.target.value })}
                />
              </label>
            </div>
            <div className="border-line mt-4 flex items-center gap-3 border-t pt-4">
              <Laptop className="text-muted-foreground size-4" />
              <p className="text-muted-foreground text-xs">
                Changes are saved instantly on this device · {userProfile.subtitle.toLowerCase()}
              </p>
            </div>
          </SettingsCard>

          <SettingsCard title="Notifications" description="Choose what pagwave sends you.">
            <ToggleRow
              label="Payment alerts"
              description="Every card payment above $100"
              initial
            />
            <ToggleRow
              label="Weekly digest"
              description="Spending summary every Monday morning"
              initial
            />
            <ToggleRow
              label="Product renewals"
              description="Reminder 3 days before a subscription renews"
              initial={false}
            />
            <ToggleRow
              label="Security notices"
              description="New device sign-ins and password changes"
              initial
            />
          </SettingsCard>
        </div>

        <div className="space-y-6 xl:col-span-5">
          <SettingsCard title="Appearance" description="Pick the theme used across the dashboard.">
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((option) => {
                const Icon = option.icon;
                const active = hydrated && theme === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTheme(option.value)}
                    aria-pressed={active}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-2xl border px-3 py-4 text-xs font-medium transition-colors",
                      active
                        ? "border-accent bg-accent-soft text-accent"
                        : "border-line text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </SettingsCard>

          <SettingsCard title="Security" description="Protect access to your money.">
            <div className="flex items-center gap-4 border-line border-b pb-3">
              <ShieldCheck className="text-success size-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-medium">Two-factor authentication</p>
                <p className="text-muted-foreground text-xs">Authenticator app · enabled</p>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
            <div className="flex items-center gap-4 pt-3">
              <p className="text-foreground min-w-0 flex-1 text-sm font-medium">Change password</p>
              <Button variant="outline" size="sm">
                Update
              </Button>
            </div>
          </SettingsCard>

          <SettingsCard title="Danger zone" description="Actions that cannot be undone.">
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <LogOut /> Sign out of all devices
              </Button>
              <Button variant="outline" className="text-danger hover:text-danger w-full justify-start">
                <Trash2 /> Delete account
              </Button>
            </div>
          </SettingsCard>
        </div>
      </div>
    </div>
  );
}
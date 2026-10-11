'use client';

// This device: push notifications and "install on your phone".

import { useEffect, useState } from 'react';
import { BellAlertIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { currentSubscription, disablePush, enablePush, pushSupported } from '@/lib/push';
import { useT } from '@/lib/i18n';

/** Push state of this browser and a toggle */
export function usePush() {
  const t = useT();
  const { toast } = useToast();
  const [supported] = useState(pushSupported);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supported) return;
    currentSubscription().then((s) => setOn(!!s && Notification.permission === 'granted')).catch(() => undefined);
  }, [supported]);

  const set = async (want: boolean) => {
    setBusy(true);
    try {
      if (want) {
        const ok = await enablePush();
        setOn(ok);
        toast(ok ? { title: t('Notifications are on for this device') }
          : { title: t('Notifications are blocked. Allow them in your browser settings.'), variant: 'destructive' });
      } else {
        await disablePush();
        setOn(false);
      }
    } catch {
      toast({ title: t('Notifications couldn’t be turned on here.'), variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };
  return { supported, on, busy, set };
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function useInstall() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios] = useState(() => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent));
  const [installed, setInstalled] = useState(() => typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true));
  useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e as BeforeInstallPromptEvent); };
    const onInstalled = () => { setInstalled(true); setEvt(null); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  const install = async () => {
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice.catch(() => undefined);
    setEvt(null);
  };
  return { canPrompt: !!evt, ios, installed, install };
}

export function DeviceCard() {
  const t = useT();
  const push = usePush();
  const inst = useInstall();
  const showInstall = !inst.installed && (inst.canPrompt || inst.ios);
  if (!push.supported && !showInstall) return null;
  return (
    <section aria-labelledby="device-title" className="rounded-2xl border bg-card p-5 sm:p-6">
      <h2 id="device-title" className="font-display text-xl font-semibold">{t('On this device')}</h2>
      <div className="mt-3 space-y-4">
        {push.supported && (
          <div className="flex items-start gap-3">
            <BellAlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-trace" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">{push.on ? t('We’ll notify you here when something new turns up.') : t('Get a notification when something new turns up.')}</p>
              <Button size="sm" variant={push.on ? 'ghost' : 'outline'} className="mt-2" disabled={push.busy} onClick={() => push.set(!push.on)}>
                {push.on ? t('Turn off notifications') : t('Notify me on this device')}
              </Button>
            </div>
          </div>
        )}
        {showInstall && (
          <div className="flex items-start gap-3">
            <DevicePhoneMobileIcon className="mt-0.5 h-5 w-5 shrink-0 text-trace" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              {inst.canPrompt ? (
                <>
                  <p className="text-sm">{t('Keep OSIG one tap away.')}</p>
                  <Button size="sm" variant="outline" className="mt-2" onClick={inst.install}>{t('Install OSIG on your phone')}</Button>
                </>
              ) : (
                <p className="text-sm">{t('To install OSIG on your iPhone: tap Share, then Add to Home Screen.')}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Bluetooth, MessageCircle, Radio, Send, Users, Wifi, X, MapPin } from 'lucide-react';

interface MeshSnapshot {
  status: string;
  peers: string[];
  messages: any[];
  locationPreview?: any;
  locationError?: string;
  isAcquiringLocation?: boolean;
}

interface ResQMeshNativeBridge {
  startMesh: () => void;
  stopMesh: () => void;
  sendMessage: (text: string) => void;
  sendMessageWithLocation?: (text: string, locationJson: string) => void;
  requestLocation?: () => void;
  getSnapshot: () => string;
}

declare global {
  interface Window {
    ResQMeshNative?: ResQMeshNativeBridge;
  }
}

const EMPTY_SNAPSHOT: MeshSnapshot = {
  status: 'Idle · tap Start mesh',
  peers: [],
  messages: [],
};

function readSnapshot(): MeshSnapshot {
  try {
    const raw = window.ResQMeshNative?.getSnapshot();
    if (!raw) return EMPTY_SNAPSHOT;
    const parsed = JSON.parse(raw) as Partial<MeshSnapshot>;
    return {
      status: typeof parsed.status === 'string' ? parsed.status : EMPTY_SNAPSHOT.status,
      peers: Array.isArray(parsed.peers) ? parsed.peers.filter((v): v is string => typeof v === 'string') : [],
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
      locationPreview: parsed.locationPreview,
      locationError: parsed.locationError,
      isAcquiringLocation: parsed.isAcquiringLocation
    };
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

export function MeshPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [snapshot, setSnapshot] = useState<MeshSnapshot>(readSnapshot);
  const [draft, setDraft] = useState('');
  const [includeLocation, setIncludeLocation] = useState(false);
  const [bridgeAvailable] = useState(() => Boolean(window.ResQMeshNative));

  useEffect(() => {
    const onUpdate = (event: Event) => {
      const detail = (event as CustomEvent<MeshSnapshot>).detail;
      if (!detail) return;
      setSnapshot({
        status: typeof detail.status === 'string' ? detail.status : EMPTY_SNAPSHOT.status,
        peers: Array.isArray(detail.peers) ? detail.peers : [],
        messages: Array.isArray(detail.messages) ? detail.messages : [],
        locationPreview: detail.locationPreview,
        locationError: detail.locationError,
        isAcquiringLocation: detail.isAcquiringLocation
      });
    };
    const refresh = () => setSnapshot(readSnapshot());
    window.addEventListener('resqmesh-mesh-update', onUpdate);
    window.addEventListener('focus', refresh);
    refresh();
    return () => {
      window.removeEventListener('resqmesh-mesh-update', onUpdate);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const send = () => {
    const text = draft.trim();
    if (!text || !window.ResQMeshNative) return;
    
    if (includeLocation && snapshot.locationPreview && window.ResQMeshNative.sendMessageWithLocation) {
      window.ResQMeshNative.sendMessageWithLocation(text, JSON.stringify(snapshot.locationPreview));
    } else {
      window.ResQMeshNative.sendMessage(text);
    }
    setDraft('');
    setIncludeLocation(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex justify-end bg-black/55 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="mesh-panel-title"
        className="flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl animate-slide-in-up"
      >
        <header className="border-b border-border bg-card px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-success/25 bg-success/10 text-success">
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <h2 id="mesh-panel-title" className="text-lg font-extrabold tracking-tight">Offline Mesh</h2>
                <p className="text-xs text-muted-foreground">Nearby device communication</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-secondary"
              aria-label="Close offline mesh panel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-border bg-secondary/35 p-3">
            <div className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <span className={`h-2 w-2 rounded-full ${snapshot.peers.length > 0 ? 'bg-success' : 'bg-warning'}`} />
              Mesh status
            </div>
            <p className="break-words text-sm font-semibold text-foreground">{snapshot.status}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2.5 py-1">
                <Users className="h-3.5 w-3.5" /> {snapshot.peers.length} connected {snapshot.peers.length === 1 ? 'peer' : 'peers'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2.5 py-1">
                <Bluetooth className="h-3.5 w-3.5" /> Bluetooth
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2.5 py-1">
                <Wifi className="h-3.5 w-3.5" /> Nearby Wi-Fi
              </span>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => window.ResQMeshNative?.startMesh()}
              disabled={!bridgeAvailable}
              className="rounded-xl bg-success px-3 py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >Start Mesh</button>
            <button
              type="button"
              onClick={() => window.ResQMeshNative?.stopMesh()}
              disabled={!bridgeAvailable}
              className="rounded-xl border border-border bg-secondary/60 px-3 py-2.5 text-sm font-bold text-foreground transition hover:bg-secondary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >Stop Mesh</button>
          </div>
          {!bridgeAvailable && (
            <p className="mt-3 rounded-lg border border-warning/25 bg-warning/10 px-3 py-2 text-xs leading-relaxed text-warning">
              Native mesh controls are available in the installed Android app. This browser preview has no Bluetooth mesh bridge.
            </p>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="mb-4">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Connected devices
            </h3>
            {snapshot.peers.length > 0 ? (
              <div className="space-y-2">
                {snapshot.peers.map((peer, index) => (
                  <div key={`${peer}-${index}`} className="flex items-center gap-2 rounded-xl border border-success/20 bg-success/[0.06] px-3 py-2.5 text-sm">
                    <span className="h-2 w-2 rounded-full bg-success" />
                    <span className="min-w-0 flex-1 truncate font-semibold">{peer}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-success">Connected</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border px-3 py-5 text-center text-sm text-muted-foreground">
                No connected peers yet. Start the mesh on both devices and keep Bluetooth and Wi-Fi enabled.
              </div>
            )}
          </div>

          <div>
            <h3 className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5" /> Message log
            </h3>
            <div className="min-h-36 space-y-2 rounded-xl border border-border bg-card/60 p-3">
              {snapshot.messages.length > 0 ? snapshot.messages.map((msg, index) => {
                const isObj = typeof msg === 'object' && msg !== null;
                const text = isObj ? msg.text : msg;
                const mine = isObj ? msg.mine : text.startsWith('Me:');
                const notice = isObj ? msg.notice : (text.includes('joined the mesh') || text.includes('left the mesh'));
                const location = isObj ? msg.location : null;

                return (
                  <div key={`${index}-${text}`} className={`max-w-[94%] break-words rounded-xl px-3 py-2 text-sm ${notice ? 'mx-auto border border-border bg-secondary/55 text-center text-xs text-muted-foreground' : mine ? 'ml-auto bg-primary text-primary-foreground' : 'mr-auto border border-border bg-secondary/70 text-foreground'}`}>
                    <div>{text}</div>
                    {location && (
                      <div className={`mt-2 flex flex-col gap-1 rounded-lg p-2 text-[10px] ${mine ? 'bg-primary-foreground/10 text-primary-foreground/90' : 'bg-background/50 text-muted-foreground'}`}>
                        <div className={`flex items-center gap-1 font-semibold ${mine ? 'text-primary-foreground' : 'text-foreground'}`}>
                          <MapPin className="h-3 w-3" /> Location attached
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                          <span>Lat: {location.latitude.toFixed(4)}</span>
                          <span>Lon: {location.longitude.toFixed(4)}</span>
                          <span>Acc: ±{Math.round(location.accuracyMeters)}m</span>
                          <span>Time: {new Date(location.capturedAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(`${location.latitude}, ${location.longitude}`)}
                            className={`font-semibold hover:underline ${mine ? 'text-primary-foreground' : 'text-primary'}`}
                          >
                            Copy coordinates
                          </button>
                          <a
                            href={`geo:${location.latitude},${location.longitude}?q=${location.latitude},${location.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className={`font-semibold hover:underline ${mine ? 'text-primary-foreground' : 'text-primary'}`}
                          >
                            Open in Maps
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }) : (
                <p className="py-8 text-center text-sm text-muted-foreground">Messages will appear here when the mesh is active.</p>
              )}
            </div>
          </div>
        </div>

        <form
          className="border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
          onSubmit={(event) => { event.preventDefault(); send(); }}
        >
          <div className="mb-3 flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground w-fit">
              <input
                type="checkbox"
                checked={includeLocation}
                onChange={(e) => {
                  setIncludeLocation(e.target.checked);
                  if (e.target.checked) {
                    window.ResQMeshNative?.requestLocation?.();
                  }
                }}
                disabled={!bridgeAvailable}
                className="h-4 w-4 rounded border-border text-primary"
              />
              Attach my location
            </label>
            {includeLocation && (
              <div className="rounded-lg border border-border bg-secondary/30 p-2 text-xs">
                {snapshot.isAcquiringLocation ? (
                  <span className="text-muted-foreground animate-pulse">Acquiring GPS fix...</span>
                ) : snapshot.locationError ? (
                  <span className="text-warning flex items-center justify-between">
                    <span>{snapshot.locationError}</span>
                    <button type="button" onClick={() => window.ResQMeshNative?.requestLocation?.()} className="underline font-semibold">Retry</button>
                  </span>
                ) : snapshot.locationPreview ? (
                  <div className="flex items-center gap-2 text-success">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>Lat: {snapshot.locationPreview.latitude.toFixed(4)}, Lon: {snapshot.locationPreview.longitude.toFixed(4)}</span>
                    <span className="text-[10px] bg-success/20 px-1 rounded whitespace-nowrap">±{Math.round(snapshot.locationPreview.accuracyMeters)}m</span>
                  </div>
                ) : null}
              </div>
            )}
          </div>
          <label htmlFor="mesh-message" className="mb-2 block text-xs font-semibold text-muted-foreground">Send an offline message</label>
          <div className="flex items-center gap-2">
            <input
              id="mesh-message"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder={bridgeAvailable ? 'Type a message…' : 'Available in Android app'}
              maxLength={2000}
              disabled={!bridgeAvailable}
              className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!bridgeAvailable || !draft.trim()}
              aria-label="Send offline message"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-alert text-white shadow-md shadow-alert/20 transition hover:brightness-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">Local Nearby Connections transport. It does not require cellular data or internet, but Bluetooth and Wi-Fi radios must remain enabled.</p>
        </form>
      </section>
    </div>
  );
}

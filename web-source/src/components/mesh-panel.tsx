import { useEffect, useState, useRef } from 'react';
import { X, MapPin, Send, Signal, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  status: 'Idle · Tap Connect',
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

interface ParsedMessage {
  id: string;
  sender: string;
  text: string;
  mine: boolean;
  notice: boolean;
  location: any;
  timestamp: string;
}

function parseRawMessage(msg: any, index: number): ParsedMessage {
  const isObj = typeof msg === 'object' && msg !== null;
  const rawText = isObj ? msg.text : msg;
  const mine = isObj ? msg.mine : rawText.startsWith('Me:');
  const notice = isObj ? msg.notice : (rawText.includes('joined the mesh') || rawText.includes('left the mesh'));
  const location = isObj ? msg.location : null;
  
  let sender = mine ? 'Me' : 'Unknown';
  let text = rawText;
  
  if (!notice && !mine && rawText.includes(': ')) {
     const splitIndex = rawText.indexOf(': ');
     sender = rawText.substring(0, splitIndex);
     text = rawText.substring(splitIndex + 2);
  } else if (mine && rawText.startsWith('Me: ')) {
     text = rawText.substring(4);
  }

  return {
    id: `${index}-${rawText.slice(0, 10)}`,
    sender,
    text,
    mine,
    notice,
    location,
    // Using a subtle time display; in a real app this would come from the backend payload.
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };
}

export function MeshPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [snapshot, setSnapshot] = useState<MeshSnapshot>(readSnapshot);
  const [draft, setDraft] = useState('');
  const [includeLocation, setIncludeLocation] = useState(false);
  const [bridgeAvailable] = useState(() => Boolean(window.ResQMeshNative));
  
  const [messages, setMessages] = useState<ParsedMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // Sync messages
  useEffect(() => {
    setMessages(prev => {
      const updated = [...prev];
      for (let i = prev.length; i < snapshot.messages.length; i++) {
        updated.push(parseRawMessage(snapshot.messages[i], i));
      }
      return updated;
    });
  }, [snapshot.messages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

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

  return (
    <div
      className={cn(
        "fixed inset-0 z-[80] flex justify-end transition-all duration-300",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      )}
      role="presentation"
    >
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm" 
        onClick={() => onOpenChange(false)} 
      />
      
      <section
        role="dialog"
        aria-label="Local Network"
        className={cn(
          "relative flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header: Network Status */}
        <header className="flex-none px-6 py-5 border-b border-border/60 bg-card/30">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-medium tracking-tight text-foreground">Local Network</h2>
            <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("h-1.5 w-1.5 rounded-full", snapshot.peers.length > 0 ? "bg-primary" : "bg-muted-foreground")} />
              <span className="text-xs text-foreground font-medium">{snapshot.status}</span>
            </div>
            
            <div className="flex items-center gap-3 text-xs font-medium">
              <button 
                onClick={() => window.ResQMeshNative?.startMesh()} 
                disabled={!bridgeAvailable} 
                className="text-primary hover:text-primary/80 disabled:opacity-40 transition-colors"
              >
                Connect
              </button>
              <span className="text-border">|</span>
              <button 
                onClick={() => window.ResQMeshNative?.stopMesh()} 
                disabled={!bridgeAvailable} 
                className="text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Connected Peers */}
          {snapshot.peers.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border/40">
              <div className="flex items-center gap-1.5 mb-2.5">
                <Signal className="h-3 w-3 text-muted-foreground" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Connected Peers ({snapshot.peers.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {snapshot.peers.map((peer, i) => (
                  <div key={i} className="flex items-center gap-1.5 px-2 py-1 bg-secondary/50 rounded-sm border border-border/30">
                    <LinkIcon className="h-2.5 w-2.5 text-primary" />
                    <span className="text-[11px] font-mono text-secondary-foreground">{peer}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {!bridgeAvailable && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-secondary/30 rounded-md border border-border/40">
              <AlertCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Native mesh controls are available in the installed Android app. This preview has no Bluetooth mesh bridge.
              </p>
            </div>
          )}
        </header>

        {/* Message Log */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-6 space-y-5">
          {messages.length > 0 ? messages.map((m) => {
            if (m.notice) {
              return (
                <div key={m.id} className="flex justify-center my-3">
                  <span className="px-3 py-1 bg-secondary/30 text-[10px] text-muted-foreground rounded-sm border border-border/30">
                    {m.text}
                  </span>
                </div>
              );
            }
            
            return (
              <div key={m.id} className={cn("flex flex-col max-w-[85%]", m.mine ? "ml-auto items-end" : "mr-auto items-start")}>
                <div className="flex items-baseline gap-2 mb-1 px-0.5">
                  <span className="text-[11px] font-medium text-muted-foreground">{m.sender}</span>
                  <span className="text-[9px] text-muted-foreground/50">{m.timestamp}</span>
                </div>
                
                <div className={cn(
                  "px-3.5 py-2 text-sm leading-relaxed", 
                  m.mine 
                    ? "bg-primary text-primary-foreground rounded-l-md rounded-tr-md" 
                    : "bg-secondary/60 text-secondary-foreground rounded-r-md rounded-tl-md border border-border/40"
                )}>
                  {m.text}
                </div>
                
                {m.location && (
                  <div className={cn(
                    "mt-1.5 flex flex-col gap-1 p-2.5 rounded-md text-[10px]", 
                    m.mine 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "bg-secondary/40 text-muted-foreground border border-border/40"
                  )}>
                    <div className="flex items-center gap-1.5 font-medium">
                      <MapPin className="h-3 w-3" />
                      Location Attached
                    </div>
                    <div className="text-[11px] font-mono mt-0.5 opacity-80">
                      {m.location.latitude.toFixed(4)}, {m.location.longitude.toFixed(4)} <span className="opacity-70">(±{Math.round(m.location.accuracyMeters)}m)</span>
                    </div>
                    <div className="flex gap-4 mt-1">
                      <button 
                        onClick={() => navigator.clipboard.writeText(`${m.location.latitude}, ${m.location.longitude}`)} 
                        className="hover:underline opacity-90 font-medium transition-opacity hover:opacity-100"
                      >
                        Copy
                      </button>
                      <a 
                        href={`geo:${m.location.latitude},${m.location.longitude}?q=${m.location.latitude},${m.location.longitude}`} 
                        className="hover:underline opacity-90 font-medium transition-opacity hover:opacity-100"
                      >
                        View Map ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          }) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 select-none">
              <Signal className="h-8 w-8 mb-3 opacity-20" />
              <p className="text-sm font-medium">No messages</p>
              <p className="text-xs mt-1">Messages from nearby peers will appear here</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <form
          className="flex-none p-4 border-t border-border/50 bg-card/30"
          onSubmit={(e) => { e.preventDefault(); send(); }}
        >
          {includeLocation && (
            <div className="mb-3 px-3 py-2.5 rounded-md bg-secondary/30 border border-border/40 flex items-center justify-between transition-all">
              <div className="flex items-center gap-2 text-xs">
                <MapPin className={cn("h-3.5 w-3.5", snapshot.isAcquiringLocation ? "animate-pulse text-muted-foreground" : snapshot.locationPreview ? "text-primary" : "text-muted-foreground")} />
                {snapshot.isAcquiringLocation ? (
                  <span className="text-muted-foreground">Acquiring GPS fix...</span>
                ) : snapshot.locationError ? (
                  <span className="text-destructive font-medium">{snapshot.locationError}</span>
                ) : snapshot.locationPreview ? (
                  <span className="text-foreground">
                    <span className="text-primary font-medium">Ready</span> 
                    <span className="text-muted-foreground ml-1">({snapshot.locationPreview.accuracyMeters.toFixed(0)}m accuracy)</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">Waiting for location...</span>
                )}
              </div>
              
              {snapshot.locationError && (
                <button 
                  type="button" 
                  onClick={() => window.ResQMeshNative?.requestLocation?.()} 
                  className="text-[10px] font-medium text-foreground hover:underline"
                >
                  Retry
                </button>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                 setIncludeLocation(!includeLocation);
                 if (!includeLocation) window.ResQMeshNative?.requestLocation?.();
              }}
              className={cn(
                "p-2.5 rounded-md transition-colors", 
                includeLocation ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary/60"
              )}
              disabled={!bridgeAvailable}
              title="Attach Location"
            >
              <MapPin className="h-4 w-4" />
            </button>
            
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={bridgeAvailable ? "Type a message..." : "Messaging disabled in preview"}
              disabled={!bridgeAvailable}
              className="flex-1 bg-secondary/30 border border-border/50 rounded-md px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
            />
            
            <button
              type="submit"
              disabled={!bridgeAvailable || !draft.trim()}
              className="p-2.5 rounded-md text-primary bg-primary/10 disabled:opacity-30 disabled:bg-transparent disabled:text-muted-foreground hover:bg-primary/20 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}


import { Radio, Siren, Map, ListChecks, Building2, ChevronRight, Activity, AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AidRequest } from '@/types';
import type { MapRegion } from '@/components/map-view';
import { REGION_ZONES } from '@/mockData';

interface HomeViewProps {
  requests: AidRequest[];
  region: MapRegion;
  meshConnected: boolean;
  meshPeersCount: number;
  isOnline: boolean;
  onSos: () => void;
  onMesh: () => void;
  onNavigateTab: (tab: 'map' | 'feed' | 'shelters') => void;
}

export function HomeView({
  requests,
  region,
  meshConnected,
  meshPeersCount,
  isOnline,
  onSos,
  onMesh,
  onNavigateTab
}: HomeViewProps) {
  const info = REGION_ZONES[region];
  const recentRequests = requests.slice(0, 3); // Get latest 3

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-2 pb-24 sm:p-4">
      {/* Emergency Context Banner */}
      <div className="rounded-2xl border border-alert/30 bg-alert/5 p-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <ShieldAlert className="h-24 w-24" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-alert px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
              <AlertTriangle className="h-3 w-3" />
              Active Emergency
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground mb-1">{info.zone}</h1>
          <p className="text-sm font-medium text-warning mb-3">⚠ {info.hazard}</p>
          <p className="text-xs text-muted-foreground max-w-[80%]">{info.location}</p>
        </div>
      </div>

      {/* Mesh Status Card (Priority 1: Obvious entry point) */}
      <button 
        onClick={onMesh}
        className={cn(
          "flex items-center justify-between rounded-2xl border p-4 text-left transition-all active:scale-[0.98]",
          meshConnected ? "border-[#0D9488]/40 bg-[#0D9488]/10" : "border-border bg-card hover:bg-secondary/50"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full",
            meshConnected ? "bg-[#0D9488]/20 text-[#0D9488]" : "bg-secondary text-muted-foreground"
          )}>
            <Radio className={cn("h-6 w-6", meshConnected && "animate-pulse")} />
          </div>
          <div>
            <h2 className={cn("text-base font-bold", meshConnected ? "text-[#0D9488]" : "text-foreground")}>
              Offline Mesh Network
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {meshConnected ? `Connected to ${meshPeersCount} direct peers` : "Mesh stopped. Tap to configure."}
            </p>
          </div>
        </div>
        <ChevronRight className={cn("h-5 w-5", meshConnected ? "text-[#0D9488]" : "text-muted-foreground")} />
      </button>

      {/* Primary Actions Grid */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={onSos}
          className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-alert py-4 text-white shadow-lg shadow-alert/25 transition-all hover:bg-alert/90 active:scale-[0.98]"
        >
          <Siren className="h-5 w-5 animate-pulse" />
          <span className="font-bold">Send SOS / Request Aid</span>
        </button>

        <ActionCard 
          icon={<Map className="h-5 w-5" />} 
          title="Map" 
          subtitle="View incident area"
          onClick={() => onNavigateTab('map')} 
        />
        <ActionCard 
          icon={<ListChecks className="h-5 w-5" />} 
          title="Needs Feed" 
          subtitle="Help others nearby"
          onClick={() => onNavigateTab('feed')} 
        />
        <ActionCard 
          icon={<Building2 className="h-5 w-5" />} 
          title="Shelters" 
          subtitle="Safe locations"
          onClick={() => onNavigateTab('shelters')} 
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl border border-border bg-card p-4 mt-2">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <Activity className="h-4 w-4 text-info" />
            Recent Activity
          </h2>
          <button onClick={() => onNavigateTab('feed')} className="text-xs font-semibold text-info hover:underline">
            View All
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {recentRequests.length > 0 ? (
            recentRequests.map(req => (
              <div key={req.id} className="flex flex-col gap-1 rounded-xl border border-border bg-secondary/20 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{req.title}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{req.category}</span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{req.details}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground">No recent requests.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionCard({ icon, title, subtitle, onClick, className }: { icon: React.ReactNode, title: string, subtitle: string, onClick: () => void, className?: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:bg-secondary/50 active:scale-[0.98]",
        className
      )}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/80 text-info">
        {icon}
      </div>
      <div className="text-left">
        <div className="text-sm font-bold text-foreground">{title}</div>
        <div className="text-[10px] text-muted-foreground">{subtitle}</div>
      </div>
    </button>
  );
}

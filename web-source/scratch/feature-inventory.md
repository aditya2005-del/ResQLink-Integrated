# ResQLink Feature Inventory & Parity Checklist

## 1. Top Navigation (TopNav)
- **SOS Button**: Opens `SosDrawer` with location sharing and form.
- **Theme Toggle**: Switches light/dark mode.
- **Network Toggle (Mock)**: Simulates online/offline state.
- **Offer Help**: Opens `OfferHelpPanel` or `VolunteerRegistrationModal`.
- **Find Help**: Opens `FindHelpPanel` (search resources).
- **Shelters**: Opens `ShelterWidget` (list of shelters).
- **AI Triage**: Opens `TriagePanel`.
- **NGO Portal**: Opens `NgoLoginModal` or `NgoDashboard`.
- **Mesh Status Indicator**: Shows current mesh state, clicking opens `MeshPanel`.

## 2. Emergency Dashboard & Status Banner (StatusBanner)
- **Emergency Zone/Region Switcher**: Dropdown to switch between NCR and Badrinath.
- **Filter Tabs**: Filters requests by category (all, medical, food, shelter, volunteers).

## 3. Map View (MapView)
- **Map rendering**: Shows requests, shelters, volunteers as markers.
- **Interactions**: Clicking markers selects them and shows details.
- **User Location**: Custom map control to center on user.
- **Map Layers**: Not explicitly seen yet, but we will preserve whatever is in MapView.

## 4. Live Feed / Needs (LiveFeed)
- **Request List**: Shows aid requests.
- **Offline Queue**: Shows items waiting to sync.
- **Resolve/Help Actions**: Interacting with requests.

## 5. Offline Mesh (MeshPanel)
- **Broadcast**: Sending multi-hop messages.
- **Peers**: Listing nearby devices.
- **Topology**: Visualizing the mesh network.

## 6. Drawers & Modals
- **Help Bot**: Floating chat bot.
- **Cross-device Sync**: Underlying hook for request syncing.


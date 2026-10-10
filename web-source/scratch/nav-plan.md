Plan:
1. Update `TopNav.tsx`:
   - Add a listener for `resqmesh-mesh-update` to get `meshStatus` and `meshPeers`.
   - Add a compact Mesh indicator at the top.
   - Keep the SOS button.
2. Update `MobileNav.tsx`:
   - Remove SOS from `MobileNav`.
   - Add `Mesh` to the tabs (icon: Radio).
   - Tabs: Map, Needs, Mesh, Shelters.
3. Update `App.tsx`:
   - Link the `MobileNav` 'mesh' tab to opening `setMeshOpen(true)`.
   - Simplify the Emergency Dashboard (StatusBanner, MapView layout).

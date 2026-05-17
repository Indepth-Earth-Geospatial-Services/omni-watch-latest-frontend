"use client";
import React, { Suspense } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import GeoMap from "@/components/features/geospaital-map/geo-map";
import { useElementGroups } from "@/hooks/useMapElements";

function MapStatusHeader() {
  const { data: elementGroups = [] } = useElementGroups();
  const totalElements = elementGroups.reduce((acc, g) => acc + g.elements.length, 0);

  return (
    <div className="flex items-center space-x-4 mb-6">
      <div className="bg-card border border-gray-800 px-4 py-2 rounded-lg flex items-center space-x-3">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Map Layers</p>
          <p className="text-sm font-semibold">{elementGroups.length} Active Groups</p>
        </div>
      </div>
      <div className="bg-card border border-gray-800 px-4 py-2 rounded-lg flex items-center space-x-3">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Geospatial Assets</p>
          <p className="text-sm font-semibold">{totalElements} Points/Lines/Polygons</p>
        </div>
      </div>
    </div>
  );
}

export default function GeospatialPage() {
  return (
    <MainLayout
      title="Geospatial Intelligence"
      subtitle="Interactive mission planning and tactical mapping"
    >
      <MapStatusHeader />

      <div className="relative bg-card border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center min-h-[70vh] bg-neutral-950 text-gray-400">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
              <p className="animate-pulse">Initializing Tactical Map...</p>
            </div>
          }
        >
          <GeoMap />
        </Suspense>
      </div>
    </MainLayout>
  );
}

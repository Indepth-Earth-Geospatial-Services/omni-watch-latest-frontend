import React, { Suspense } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import GeoMap from "@/components/features/geospaital-map/geo-map";

export default function GeospatialPage() {
  return (
    <MainLayout
      title="Geospatial Map"
      subtitle="Real-time geographical intelligence"
    >
      <Card>
        <CardContent>
          <div className="bg-secondary/20 border-2 border-dashed border-border rounded-lg min-h-96  pb-40">
            {/* <div className="text-center">
                <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Geospatial map component will be implemented here
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Integration with mapping services coming soon
                </p>
              </div> */}
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-96 text-muted-foreground">
                  Loading map...
                </div>
              }
            >
              <GeoMap />
            </Suspense>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  );
}

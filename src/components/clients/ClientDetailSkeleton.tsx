
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

const ClientDetailSkeleton = () => {
  return (
    <>
      <div className="mb-6">
        <Skeleton className="h-9 w-36" />
      </div>

      <Skeleton className="h-10 w-64 mb-6" />

      <div className="mb-8">
        <Accordion type="single" collapsible defaultValue="client-info" className="w-full">
          <AccordionItem value="client-info">
            <AccordionTrigger className="bg-background hover:bg-muted px-4 py-3 rounded-md border text-lg font-medium">
              <Skeleton className="h-6 w-40" />
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-8 pt-6">
                {/* Personal Information Skeleton */}
                <div>
                  <Skeleton className="h-7 w-48 mb-4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i}>
                              <Skeleton className="h-4 w-24 mb-1" />
                              <Skeleton className="h-10 w-full" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i}>
                              <Skeleton className="h-4 w-24 mb-1" />
                              <Skeleton className="h-10 w-full" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Address Skeleton */}
                <div>
                  <Skeleton className="h-7 w-32 mb-4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i}>
                              <Skeleton className="h-4 w-24 mb-1" />
                              <Skeleton className="h-10 w-full" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          {Array.from({ length: 2 }).map((_, i) => (
                            <div key={i}>
                              <Skeleton className="h-4 w-24 mb-1" />
                              <Skeleton className="h-10 w-full" />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Case Information Skeleton */}
                <div>
                  <Skeleton className="h-7 w-44 mb-4" />
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-6">
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-24 mb-3" />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Array.from({ length: 9 }).map((_, i) => (
                              <div key={i} className="flex items-center space-x-2">
                                <Skeleton className="h-4 w-4" />
                                <Skeleton className="h-4 w-24" />
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-24 w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  );
};

export default ClientDetailSkeleton;

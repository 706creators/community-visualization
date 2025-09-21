"use client";

import { useState } from "react";
import D3Example from "@/app/components/CommunityGraph2";
import Sidebar from "@/app/components/Sidebar";
import { GraphData } from "./types/graph";

export default function Home() {
  const [uploadedData, setUploadedData] = useState<GraphData | null>(null);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        uploadedData={uploadedData}
        setUploadedData={setUploadedData}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Community Network Visualization
            </h1>
            <div className="text-sm text-gray-500">
              {uploadedData
                ? `${uploadedData.nodes.length} nodes, ${uploadedData.edges.length} edges`
                : "Interactive graph visualization"}
            </div>
          </div>
        </header>

        {/* Graph Container */}
        <main className="flex-1 p-6">
          <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200">
            <D3Example data={uploadedData} />
          </div>
        </main>
      </div>
    </div>
  );
}

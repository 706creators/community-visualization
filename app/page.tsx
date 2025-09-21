"use client";

import { useState } from "react";
import D3Example from "@/app/components/CommunityGraph2";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadedData, setUploadedData] = useState(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "text/csv") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const csvData = e.target.result;
        // TODO: 解析CSV数据并转换为图形数据格式
        // 这里先设置一个示例，你需要根据CSV格式来解析
        console.log("CSV Data:", csvData);
        // setUploadedData(parsedData);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-16"
        } transition-all duration-300 bg-white shadow-lg border-r border-gray-200 flex flex-col`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          {sidebarOpen && (
            <h1 className="text-xl font-semibold text-gray-800">
              Community Graph
            </h1>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
          >
            {sidebarOpen ? (
              <ChevronLeftIcon className="w-5 h-5" />
            ) : (
              <ChevronRightIcon className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 p-4">
          {sidebarOpen ? (
            <div className="space-y-6">
              {/* Upload Section */}
              <div>
                <h2 className="text-lg font-medium text-gray-700 mb-3">
                  Data Upload
                </h2>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <label htmlFor="csv-upload" className="cursor-pointer">
                    <span className="text-sm text-gray-600">
                      Click to upload CSV file
                    </span>
                    <input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-2">
                    Upload your community data in CSV format
                  </p>
                </div>
              </div>

              {/* Graph Controls */}
              <div>
                <h2 className="text-lg font-medium text-gray-700 mb-3">
                  Controls
                </h2>
                <div className="space-y-3">
                  <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                    Reset View
                  </button>
                  <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors">
                    Export Graph
                  </button>
                </div>
              </div>

              {/* Legend */}
              <div>
                <h2 className="text-lg font-medium text-gray-700 mb-3">Legend</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span>Person</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 bg-green-500"
                      style={{
                        clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                      }}
                    ></div>
                    <span>Space/Area</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500"></div>
                    <span>Event/Act</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-3 w-full rounded-md hover:bg-gray-100 text-gray-600"
                title="Upload CSV"
              >
                <DocumentArrowUpIcon className="w-6 h-6 mx-auto" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Community Network Visualization
            </h1>
            <div className="text-sm text-gray-500">
              Interactive graph visualization
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

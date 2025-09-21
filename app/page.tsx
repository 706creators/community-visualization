"use client";

import { useState } from "react";
import D3Example from "@/app/components/CommunityGraph2";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentArrowUpIcon,
} from "@heroicons/react/24/outline";

interface Node {
  id: string;
  type: string;
  name: string;
  time: string | null;
}

interface Edge {
  source: string;
  target: string;
  relationship: string;
  value: number;
}

interface GraphData {
  nodes: Node[];
  edges: Edge[];
}

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [uploadedData, setUploadedData] = useState<GraphData | null>(null);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");

  // CSV解析函数
  const parseCSV = (csvText: string): GraphData => {
    try {
      const lines = csvText.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.trim());

      const nodes = new Map<string, Node>();
      const edges: Edge[] = [];

      // 解析每一行数据
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const row: { [key: string]: string } = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });

        // 根据CSV格式创建节点和边
        // 假设CSV格式：source,target,relationship,source_type,target_type,time
        const { source, target, relationship, source_type, target_type, time } =
          row;

        if (source && target) {
          // 添加源节点
          if (!nodes.has(source)) {
            nodes.set(source, {
              id: source,
              type: source_type || "person",
              name: source,
              time: time || null,
            });
          }

          // 添加目标节点
          if (!nodes.has(target)) {
            nodes.set(target, {
              id: target,
              type: target_type || "person",
              name: target,
              time: time || null,
            });
          }

          // 添加边
          edges.push({
            source: source,
            target: target,
            relationship: relationship || "connected",
            value: 1,
          });
        }
      }

      return {
        nodes: Array.from(nodes.values()),
        edges: edges,
      };
    } catch (error) {
      throw new Error(`CSV解析错误: ${(error as Error).message}`);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      setFileName(file.name);
      setParseError("");

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvData = e.target?.result as string;
          console.log("Raw CSV Data:", csvData);

          const parsedData = parseCSV(csvData);
          console.log("Parsed Data:", parsedData);

          setUploadedData(parsedData);
        } catch (error) {
          console.error("解析错误:", error);
          setParseError((error as Error).message);
        }
      };
      reader.readAsText(file);
    } else {
      setParseError("请选择有效的CSV文件");
    }
  };

  const resetData = () => {
    setUploadedData(null);
    setFileName("");
    setParseError("");
    // 重置文件输入
    const fileInput = document.getElementById("csv-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
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

                {/* 显示上传的文件名 */}
                {fileName && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">已上传: {fileName}</p>
                    <button
                      onClick={resetData}
                      className="text-xs text-green-600 hover:text-green-800 mt-1"
                    >
                      重新上传
                    </button>
                  </div>
                )}

                {/* 显示解析错误 */}
                {parseError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-700">{parseError}</p>
                  </div>
                )}
              </div>

              {/* Data Info */}
              {uploadedData && (
                <div>
                  <h2 className="text-lg font-medium text-gray-700 mb-3">
                    Data Info
                  </h2>
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    <p>节点数量: {uploadedData.nodes.length}</p>
                    <p>边数量: {uploadedData.edges.length}</p>
                  </div>
                </div>
              )}

              {/* Graph Controls */}
              <div>
                <h2 className="text-lg font-medium text-gray-700 mb-3">
                  Controls
                </h2>
                <div className="space-y-3">
                  <button
                    onClick={resetData}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
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
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
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

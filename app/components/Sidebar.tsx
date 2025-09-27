"use client";

import { useState } from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DocumentArrowUpIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { GraphData } from "../types/graph";
import { parseCSV, downloadSampleCSV } from "../utils/csvParser";

interface SidebarProps {
  uploadedData: GraphData | null;
  setUploadedData: (data: GraphData | null) => void;
}

export default function Sidebar({ uploadedData, setUploadedData }: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");

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
    <div
      className={`${
        sidebarOpen ? "w-80" : "w-16"
      } transition-all duration-300 bg-white shadow-lg border-r border-gray-200 flex flex-col`}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {sidebarOpen && (
          <h1 className="text-xl font-semibold text-gray-800">
            Panel
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
                  Expected format: 发起人姓名,参与人姓名,活动主题,活动场地,活动时间
                  <br />
                  Multiple names separated by semicolon (;)
                </p>
              </div>

              {/* 下载示例文件按钮 */}
              <div className="mt-4">
                <button
                  onClick={downloadSampleCSV}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Download Sample CSV
                </button>
                <p className="text-xs text-gray-500 mt-1 text-center">
                  Get a sample file with the correct format
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
                  <div className="mt-2">
                    <p className="font-medium">节点类型分布:</p>
                    {Object.entries(
                      uploadedData.nodes.reduce((acc, node) => {
                        acc[node.type] = (acc[node.type] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).map(([type, count]) => (
                      <p key={type} className="text-xs ml-2">
                        {type}: {count}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Legend */}
            <div>
              <h2 className="text-lg font-medium text-gray-700 mb-3">Legend</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span>Member (成员)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 bg-green-500"
                    style={{
                      clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
                    }}
                  ></div>
                  <span>Space (场地)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500"></div>
                  <span>Event (活动)</span>
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
  );
}
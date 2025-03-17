"use client"

import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { useState, useMemo, useEffect } from "react";
import { generateMonthlyData } from '@/utils/dataFetcher';

// Define types for better type safety
interface ChannelData {
  name: string;
  value: number;
  percentage: string;
}

interface PipelineStage {
  stage: string;
  active: number;
  rejected: number;
}

interface MonthlyData {
  month: string;
  processed: number;
  scheduled: number;
  attended: number;
  l1Select: number;
  l1Reject: number;
  noShow: number;
  l2Scheduled: number;
  l2Selected: number;
  l2Rejected: number;
  inProcess: number;
  offer: number;
  processedToScheduled: string;
  l1NoShowRate: string;
  l1RejectionRate: string;
  l2RejectionRate: string;
  offerPercentage: string;
  channelData: ChannelData[];
  pipelineStages: PipelineStage[];
}

// Add specific interface for offers chart data
interface OffersChartData {
  month: string;
  offers: number;
}

// Move mock data outside of component
const mockMonthlyData: MonthlyData[] = [
  {
    month: "Jan",
    processed: 714,
    scheduled: 488,
    attended: 420,
    l1Select: 74,
    l1Reject: 346,
    noShow: 68,
    l2Scheduled: 74,
    l2Selected: 29,
    l2Rejected: 45,
    inProcess: 0,
    offer: 29,
    processedToScheduled: "68.00%",
    l1NoShowRate: "16%",
    l1RejectionRate: "82%",
    l2RejectionRate: "60%",
    offerPercentage: "4%",
    channelData: [
      { name: "Naukri", value: 17, percentage: "58%" },
      { name: "Referral", value: 5, percentage: "17%" },
      { name: "Vendor", value: 6, percentage: "21%" },
      { name: "Linkedin", value: 1, percentage: "2%" }
    ],
    pipelineStages: [
      { stage: 'Pool', active: 714, rejected: 0 },
      { stage: 'HR Screening', active: 488, rejected: 226 },
      { stage: 'Xobin Test', active: 420, rejected: 68 },
      { stage: 'L1 Interview', active: 74, rejected: 346 },
      { stage: 'L2 Interview', active: 29, rejected: 45 },
      { stage: 'Final Round', active: 29, rejected: 0 },
      { stage: 'HR Round', active: 29, rejected: 0 },
      { stage: 'Pre Offer Documentation', active: 29, rejected: 0 },
      { stage: 'Offer Approval', active: 29, rejected: 0 },
      { stage: 'Offer', active: 29, rejected: 0 },
      { stage: 'Nurturing Campaign', active: 29, rejected: 0 },
      { stage: 'Hired', active: 29, rejected: 0 }
    ]
  },
  {
    month: "Feb",
    processed: 634,
    scheduled: 634,
    attended: 524,
    l1Select: 154,
    l1Reject: 370,
    noShow: 110,
    l2Scheduled: 154,
    l2Selected: 21,
    l2Rejected: 37,
    inProcess: 0,
    offer: 17,
    processedToScheduled: "100%",
    l1NoShowRate: "21%",
    l1RejectionRate: "70%",
    l2RejectionRate: "24%",
    offerPercentage: "2%",
    channelData: [
      { name: "Naukri", value: 10, percentage: "58%" },
      { name: "Referral", value: 3, percentage: "17%" },
      { name: "Vendor", value: 4, percentage: "21%" },
      { name: "Linkedin", value: 0, percentage: "2%" }
    ],
    pipelineStages: [
      { stage: 'Pool', active: 634, rejected: 0 },
      { stage: 'HR Screening', active: 634, rejected: 370 },
      { stage: 'Xobin Test', active: 524, rejected: 110 },
      { stage: 'L1 Interview', active: 154, rejected: 370 },
      { stage: 'L2 Interview', active: 21, rejected: 37 },
      { stage: 'Final Round', active: 17, rejected: 0 },
      { stage: 'HR Round', active: 17, rejected: 0 },
      { stage: 'Pre Offer Documentation', active: 17, rejected: 0 },
      { stage: 'Offer Approval', active: 17, rejected: 0 },
      { stage: 'Offer', active: 17, rejected: 0 },
      { stage: 'Nurturing Campaign', active: 17, rejected: 0 },
      { stage: 'Hired', active: 17, rejected: 0 }
    ]
  }
];

const mockOffersData: OffersChartData[] = [
  { month: "Jan", offers: 32 },
  { month: "Feb", offers: 19 }
];

// Update the chart theme with Ideas2IT colors
const chartTheme = {
  axis: {
    ticks: {
      text: {
        fill: '#e5e7eb',
        fontSize: 12
      }
    },
    legend: {
      text: {
        fill: '#e5e7eb',
        fontSize: 12
      }
    }
  },
  grid: {
    line: {
      stroke: "#dddddd",
      strokeWidth: 1
    }
  },
  legends: {
    text: {
      fill: "#888888",
      fontSize: 12
    }
  },
  colors: ['#ff6b00', '#0066b2', '#ff8533', '#3399ff', '#ffa366', '#66b3ff'],
  background: '#1f2937',
  textColor: '#e5e7eb',
} as const;

// Define channel colors
const channelColors = {
  "Naukri": "#ff6b00",    
  "Referral": "#0066b2", 
  "Vendor": "#00cc66",    
  "Linkedin": "#0077b5"
};

// Add this function before the Dashboard component
const downloadCSV = (data: MonthlyData[]) => {
  // Headers for each table
  const stageWiseHeaders = [
    'Month', 'Processed', 'Scheduled', 'Attended', 'L1 Select', 'L1 Reject',
    'No Show', 'L2 Scheduled', 'L2 Selected', 'L2 Rejected', 'In Process', 'Offer'
  ];

  const conversionHeaders = [
    'Month', 'Processed to Scheduled', 'L1 No Show Rate', 'L1 Rejection Rate',
    'L2 Rejection Rate', 'Offer Percentage'
  ];

  const channelHeaders = ['Month', 'Channel', 'Candidates Offered', 'Split'];

  // Prepare data for each table
  const stageWiseRows = data.map(month => [
    month.month, month.processed, month.scheduled, month.attended,
    month.l1Select, month.l1Reject, month.noShow, month.l2Scheduled,
    month.l2Selected, month.l2Rejected, month.inProcess, month.offer
  ]);

  const conversionRows = data.map(month => [
    month.month, month.processedToScheduled, month.l1NoShowRate,
    month.l1RejectionRate, month.l2RejectionRate, month.offerPercentage
  ]);

  const channelRows = data.flatMap(month =>
    month.channelData.map(channel => [
      month.month, channel.name, channel.value, channel.percentage
    ])
  );

  // Combine all data with section headers
  const csvContent = [
    ['Stage-wise Conversion'],
    stageWiseHeaders,
    ...stageWiseRows,
    [], // Empty row for spacing
    ['Conversion Percentage'],
    conversionHeaders,
    ...conversionRows,
    [], // Empty row for spacing
    ['Channel Attribution'],
    channelHeaders,
    ...channelRows
  ]
    .map(row => row.join(','))
    .join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `recruitment_metrics_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [pipelineView, setPipelineView] = useState<'active' | 'rejected'>('active');
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const jobs = [ /* your jobs array */ ];
    
    async function fetchData() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await generateMonthlyData(jobs);
        setMonthlyData(data);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        console.error('Error fetching dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  // Get current month data with proper type checking
  const currentMonthData = useMemo(() => {
    if (selectedMonth === 'All') {
      // Combine data for all months
      const combinedData = {
        ...mockMonthlyData[0], // Use first month as base
        processed: mockMonthlyData.reduce((sum, month) => sum + month.processed, 0),
        // ... other combined metrics
        pipelineStages: mockMonthlyData[0].pipelineStages.map((stage, index) => ({
          ...stage,
          active: mockMonthlyData.reduce((sum, month) => sum + month.pipelineStages[index].active, 0),
          rejected: mockMonthlyData.reduce((sum, month) => sum + month.pipelineStages[index].rejected, 0),
        }))
      };
      return combinedData;
    }
    return mockMonthlyData.find(data => data.month === selectedMonth);
  }, [selectedMonth]);

  const renderPipelineStages = (stages: PipelineStage[], startIndex: number, endIndex: number) => {
    if (!stages) return null;
    
    return stages.slice(startIndex, endIndex).map((stage) => (
      <div key={stage.stage} className="bg-gray-800 p-3 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-gray-300">{stage.stage}</span>
          <span className="font-bold text-[#ff6b00]">
            {pipelineView === 'active' ? stage.active : stage.rejected}
          </span>
        </div>
        <div className="relative pt-1">
          <div className="overflow-hidden h-1.5 text-xs flex rounded bg-gray-600">
            <div 
              className={`${pipelineView === 'active' ? 'bg-[#ff6b00]' : 'bg-[#0066b2]'}`}
              style={{ 
                width: `${((pipelineView === 'active' ? stage.active : stage.rejected) / 
                  (currentMonthData?.pipelineStages[0].active || 1)) * 100}%` 
              }}
            />
          </div>
        </div>
      </div>
    ));
  };

  // Update offers chart configuration
  const offersChartConfig = {
    data: mockMonthlyData.map(month => ({
      month: month.month,
      offers: month.offer
    })),
    keys: ['offers'],
    indexBy: 'month',
    margin: { top: 20, right: 20, bottom: 40, left: 40 },
    padding: 0.3,
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Count',
      legendPosition: 'middle',
      legendOffset: -35,
      truncateTickAt: 0
    },
    axisBottom: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Month',
      legendPosition: 'middle',
      legendOffset: 35,
      truncateTickAt: 0
    },
    legends: []
  };

  // Update the pie chart configuration
  const channelChartConfig = {
    data: currentMonthData?.channelData || [],
    margin: { top: 20, right: 100, bottom: 20, left: 20 }, // Reduced right margin
    innerRadius: 0.6,
    padAngle: 0.5,
    cornerRadius: 4,
    activeOuterRadiusOffset: 8,
    theme: chartTheme,
    colors: { scheme: 'blues' },
    borderWidth: 1,
    borderColor: {
      from: 'color',
      modifiers: [['darker', 0.2]] as const
    },
    arcLinkLabelsSkipAngle: 10,
    arcLinkLabelsTextColor: "#e5e7eb",
    arcLinkLabelsThickness: 2,
    arcLinkLabelsColor: { from: 'color' as const },
    arcLabelsSkipAngle: 10,
    arcLabelsTextColor: "#ffffff",
    legends: [
      {
        anchor: 'right' as const,
        direction: 'column' as const,
        justify: false,
        translateX: 80, // Reduced translation
        translateY: 0,
        itemsSpacing: 6, // Reduced spacing
        itemWidth: 80, // Reduced width
        itemHeight: 20, // Reduced height
        itemTextColor: '#e5e7eb',
        itemDirection: 'left-to-right' as const,
        itemOpacity: 1,
        symbolSize: 10, // Reduced symbol size
        symbolShape: 'circle' as const
      }
    ]
  };

  // Line chart configuration for conversion trends
  const conversionChartConfig = {
    data: [
      {
        id: "Processed to Scheduled",
        data: mockMonthlyData.map(d => ({
          x: d.month,
          y: parseFloat(d.processedToScheduled)
        }))
      },
      {
        id: "L1 No Show Rate",
        data: mockMonthlyData.map(d => ({
          x: d.month,
          y: parseFloat(d.l1NoShowRate)
        }))
      },
      {
        id: "L1 Rejection Rate",
        data: mockMonthlyData.map(d => ({
          x: d.month,
          y: parseFloat(d.l1RejectionRate)
        }))
      }
    ],
    margin: { top: 50, right: 110, bottom: 50, left: 60 },
    theme: chartTheme,
    xScale: { type: 'point' as const },
    yScale: { 
      type: 'linear' as const,
      min: 0,
      max: 100
    },
    curve: 'cardinal' as const,
    axisTop: null,
    axisRight: null,
    axisBottom: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Month',
      legendOffset: 36,
      legendPosition: 'middle' as const
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Rate (%)',
      legendOffset: -40,
      legendPosition: 'middle' as const
    },
    pointSize: 10,
    pointColor: { theme: 'background' },
    pointBorderWidth: 2,
    pointBorderColor: { from: 'serieColor' },
    pointLabelYOffset: -12,
    useMesh: true,
    legends: [
      {
        anchor: 'bottom-right' as const,
        direction: 'column' as const,
        justify: false,
        translateX: 100,
        translateY: 0,
        itemsSpacing: 0,
        itemDirection: 'left-to-right' as const,
        itemWidth: 80,
        itemHeight: 20,
        itemOpacity: 0.75,
        symbolSize: 12,
        symbolShape: 'circle' as const,
        symbolBorderColor: 'rgba(0, 0, 0, .5)',
        effects: [
          {
            on: 'hover' as const,
            style: {
              itemBackground: 'rgba(0, 0, 0, .03)',
              itemOpacity: 1
            }
          }
        ]
      }
    ]
  };

  // Funnel chart configuration
  const funnelChartConfig = {
    data: [
      {
        stage: "Processed",
        value: currentMonthData?.processed || 0
      },
      {
        stage: "Scheduled",
        value: currentMonthData?.scheduled || 0
      },
      {
        stage: "Attended",
        value: currentMonthData?.attended || 0
      },
      {
        stage: "L1 Select",
        value: currentMonthData?.l1Select || 0
      },
      {
        stage: "L2 Select",
        value: currentMonthData?.l2Selected || 0
      },
      {
        stage: "Offer",
        value: currentMonthData?.offer || 0
      }
    ],
    keys: ["value"],
    indexBy: "stage",
    margin: { top: 30, right: 30, bottom: 50, left: 60 },
    padding: 0.3,
    theme: chartTheme,
    colors: { scheme: 'blues' },
    borderRadius: 4,
    borderWidth: 1,
    borderColor: {
      from: 'color',
      modifiers: [['darker', 0.2]] as const
    },
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Count',
      legendPosition: 'middle' as const,
      legendOffset: -40
    },
    axisBottom: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: -45,
      legend: 'Stage',
      legendPosition: 'middle' as const,
      legendOffset: 40
    },
    labelSkipWidth: 12,
    labelSkipHeight: 12,
    labelTextColor: {
      from: 'color',
      modifiers: [['darker', 1.6]] as const
    },
    role: "application",
    enableLabel: true
  };

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center bg-gray-800 p-6 rounded-lg shadow-lg border-b-4 border-[#ff6b00]">
        <h1 className="text-3xl font-bold text-white">CXO Dashboard</h1>
      </div>

      {/* Month Selector */}
      <Tabs defaultValue="All" onValueChange={setSelectedMonth} className="space-y-4">
        <TabsList className="bg-gray-800 p-1 rounded-lg">
          <TabsTrigger value="All" className="data-[state=active]:bg-[#ff6b00] text-white">All Time</TabsTrigger>
          <TabsTrigger value="Jan" className="data-[state=active]:bg-[#ff6b00] text-white">January</TabsTrigger>
          <TabsTrigger value="Feb" className="data-[state=active]:bg-[#ff6b00] text-white">February</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
        <Card className="p-6 bg-gray-800 shadow-lg rounded-lg border-l-4 border-[#ff6b00]">
          <h3 className="text-lg font-semibold text-gray-300">Total Processed</h3>
          <p className="text-4xl font-bold text-white mt-2">{currentMonthData?.processed}</p>
          <div className="mt-2 flex items-center text-[#ff8533]">
            <span className="text-sm">↑ 12% vs last month</span>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 shadow-lg rounded-lg border-l-4 border-[#0066b2]">
          <h3 className="text-lg font-semibold text-gray-300">Offers Made</h3>
          <p className="text-4xl font-bold text-white mt-2">{currentMonthData?.offer}</p>
          <div className="mt-2 flex items-center text-[#3399ff]">
            <span className="text-sm">{currentMonthData?.offerPercentage} conversion</span>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 shadow-lg rounded-lg border-l-4 border-[#ff6b00]">
          <h3 className="text-lg font-semibold text-gray-300">Total Rejections</h3>
          <p className="text-4xl font-bold text-white mt-2">
            {(currentMonthData?.rejected || 0) + (currentMonthData?.l2Rejected || 0)}
          </p>
          <div className="mt-2 flex items-center text-[#ff8533]">
            <span className="text-sm">{currentMonthData?.l1RejectionRate} rate</span>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 shadow-lg rounded-lg border-l-4 border-[#ff8533]">
          <h3 className="text-lg font-semibold text-gray-300">Active Pipeline</h3>
          <p className="text-4xl font-bold text-white mt-2">
            {(currentMonthData?.l1Select || 0) + (currentMonthData?.l2Selected || 0)}
          </p>
          <div className="mt-2 flex items-center text-[#ffa366]">
            <span className="text-sm">In Progress</span>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800 shadow-lg rounded-lg border-l-4 border-[#0066b2]">
          <h3 className="text-lg font-semibold text-gray-300">Conversion Rate</h3>
          <p className="text-4xl font-bold text-white mt-2">{currentMonthData?.offerPercentage}</p>
          <div className="mt-2 flex items-center text-[#66b3ff]">
            <span className="text-sm">Overall</span>
          </div>
        </Card>
      </div>

      {/* Updated Pipeline Analytics Card with Conversion Metrics */}
      <Card className="p-6 bg-gray-800 shadow-lg rounded-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Recruitment Pipeline Analytics</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setPipelineView('active')}
              className={`px-4 py-2 rounded-lg ${
                pipelineView === 'active' 
                  ? 'bg-[#ff6b00] text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              Active Pipeline
            </button>
            <button 
              onClick={() => setPipelineView('rejected')}
              className={`px-4 py-2 rounded-lg ${
                pipelineView === 'rejected' 
                  ? 'bg-[#0066b2] text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              Rejection Analysis
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {currentMonthData?.pipelineStages && (
              <>
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Initial Screening</h3>
                  <div className="space-y-3">
                    {renderPipelineStages(currentMonthData.pipelineStages, 0, 4)}
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Interview Process</h3>
                  <div className="space-y-3">
                    {renderPipelineStages(currentMonthData.pipelineStages, 4, 8)}
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-white mb-4">Offer Process</h3>
                  <div className="space-y-3">
                    {renderPipelineStages(currentMonthData.pipelineStages, 8, 12)}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* New Conversion Metrics Column */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-white mb-4">Conversion Metrics</h3>
            <div className="space-y-4">
              {/* L1 to L2 Conversion */}
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">L1 to L2</span>
                  <span className="text-[#ff6b00] font-bold">
                    {((currentMonthData?.l1Select / currentMonthData?.attended) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="relative pt-1">
                  <div className="overflow-hidden h-1.5 text-xs flex rounded bg-gray-600">
                    <div 
                      className="bg-[#ff6b00]"
                      style={{ width: `${(currentMonthData?.l1Select / currentMonthData?.attended) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* L2 to Offer */}
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">L2 to Offer</span>
                  <span className="text-[#0066b2] font-bold">
                    {((currentMonthData?.offer / currentMonthData?.l2Selected) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="relative pt-1">
                  <div className="overflow-hidden h-1.5 text-xs flex rounded bg-gray-600">
                    <div 
                      className="bg-[#0066b2]"
                      style={{ width: `${(currentMonthData?.offer / currentMonthData?.l2Selected) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Overall Pipeline */}
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Overall Pipeline</span>
                  <span className="text-green-400 font-bold">{currentMonthData?.offerPercentage}</span>
                </div>
                <div className="relative pt-1">
                  <div className="overflow-hidden h-1.5 text-xs flex rounded bg-gray-600">
                    <div 
                      className="bg-green-500"
                      style={{ width: currentMonthData?.offerPercentage }}
                    />
                  </div>
                </div>
              </div>

              {/* Time to Hire */}
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Avg. Time to Hire</span>
                  <span className="text-[#ff6b00] font-bold">30 days</span>
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  From application to offer
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Updated Channel Attribution Card */}
      <Card className="p-6 bg-gray-800 shadow-lg rounded-lg">
        <h2 className="text-2xl font-bold text-white mb-6">Channel Attribution</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Channel Stats */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white mb-4">Channel Distribution</h3>
            {currentMonthData?.channelData.map((channel) => (
              <div 
                key={channel.name}
                className="bg-gray-700 rounded-lg p-4 transition-all duration-200 hover:bg-gray-600"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: channelColors[channel.name] }}
                    />
                    <span className="text-white font-medium">{channel.name}</span>
                  </div>
                  <span className="text-gray-300 font-semibold">{channel.percentage}</span>
                </div>
                <div className="relative pt-1">
                  <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-600">
                    <div 
                      className="transition-all duration-500 ease-in-out"
                      style={{ 
                        width: channel.percentage,
                        backgroundColor: channelColors[channel.name]
                      }}
                    />
                  </div>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-400">Candidates</span>
                  <span className="text-white font-semibold">{channel.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Channel Distribution Chart */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Visual Distribution</h3>
            <div className="h-[300px]"> {/* Reduced height from 400px to 300px */}
              <ResponsivePie
                {...channelChartConfig}
                data={currentMonthData?.channelData.map(channel => ({
                  id: channel.name,
                  label: channel.name,
                  value: channel.value,
                  color: channelColors[channel.name]
                }))}
                colors={({ id }) => channelColors[id]}
                arcLabelsComponent={({ datum, label }) => (
                  <g transform={`translate(${datum.x},${datum.y})`}>
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      style={{
                        fontSize: '11px', // Reduced font size
                        fontWeight: 'bold'
                      }}
                    >
                      {label}
                    </text>
                  </g>
                )}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Monthly Offers Chart - Only show when All is selected */}
      {selectedMonth === 'All' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 bg-gray-800 shadow-lg rounded-lg">
            <h2 className="text-xl font-bold mb-4 text-white">Monthly Offers</h2>
            <div className="h-[300px]">
              <ResponsiveBar
                {...offersChartConfig}
                theme={{
                  ...chartTheme,
                  axis: {
                    ...chartTheme.axis,
                    ticks: {
                      ...chartTheme.axis.ticks,
                      text: { fill: '#e5e7eb' }
                    },
                    legend: {
                      ...chartTheme.axis.legend,
                      text: { fill: '#e5e7eb' }
                    }
                  }
                }}
                colors={['#ff6b00']}
                label={d => `${d.value}`}
                labelTextColor="#ffffff"
              />
            </div>
          </Card>

          {/* Channel Attribution remains the same ... */}
        </div>
      )}

      {/* Monthly Performance Metrics - Only show when All is selected */}
      {selectedMonth === 'All' && (
        <Card className="p-6 bg-gray-800 shadow-lg rounded-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Monthly Performance Metrics</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => downloadCSV(mockMonthlyData)}
                className="px-4 py-2 bg-[#ff6b00] text-white rounded-lg hover:bg-[#ff8533] transition-colors duration-200 flex items-center gap-2"
              >
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download Report
              </button>
            </div>
          </div>
          
          {/* Stage-wise Conversion Table */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Stage-wise Conversion</h3>
              <div className="text-sm text-gray-400">
                Showing data for all months
              </div>
            </div>
            
            <div className="relative overflow-x-auto rounded-lg border border-gray-700">
              {mockMonthlyData && mockMonthlyData.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-700 text-gray-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Month</th>
                      <th className="px-4 py-3 font-semibold">Processed</th>
                      <th className="px-4 py-3 font-semibold">Scheduled</th>
                      <th className="px-4 py-3 font-semibold">Attended</th>
                      <th className="px-4 py-3 font-semibold">L1 Select</th>
                      <th className="px-4 py-3 font-semibold">L1 Reject</th>
                      <th className="px-4 py-3 font-semibold">No Show</th>
                      <th className="px-4 py-3 font-semibold">L2 Scheduled</th>
                      <th className="px-4 py-3 font-semibold">L2 Selected</th>
                      <th className="px-4 py-3 font-semibold">L2 Rejected</th>
                      <th className="px-4 py-3 font-semibold">In Process</th>
                      <th className="px-4 py-3 font-semibold">Offer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {mockMonthlyData.map((data, index) => (
                      <tr 
                        key={data.month} 
                        className={`hover:bg-gray-700 transition-colors ${
                          index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-[#ff6b00]">{data.month}</td>
                        <td className="px-4 py-3 text-gray-300">{data.processed}</td>
                        <td className="px-4 py-3 text-gray-300">{data.scheduled}</td>
                        <td className="px-4 py-3 text-gray-300">{data.attended}</td>
                        <td className="px-4 py-3 text-green-400">{data.l1Select}</td>
                        <td className="px-4 py-3 text-red-400">{data.l1Reject}</td>
                        <td className="px-4 py-3 text-yellow-400">{data.noShow}</td>
                        <td className="px-4 py-3 text-gray-300">{data.l2Scheduled}</td>
                        <td className="px-4 py-3 text-green-400">{data.l2Selected}</td>
                        <td className="px-4 py-3 text-red-400">{data.l2Rejected}</td>
                        <td className="px-4 py-3 text-blue-400">{data.inProcess}</td>
                        <td className="px-4 py-3 text-[#ff6b00] font-medium">{data.offer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-gray-400">No data available</div>
              )}
            </div>
          </div>

          {/* Conversion Percentage Table */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Conversion Percentage</h3>
              <div className="text-sm text-gray-400">
                Month-wise conversion rates
              </div>
            </div>
            
            <div className="relative overflow-x-auto rounded-lg border border-gray-700">
              {mockMonthlyData && mockMonthlyData.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-700 text-gray-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Month</th>
                      <th className="px-4 py-3 font-semibold">Processed to Scheduled</th>
                      <th className="px-4 py-3 font-semibold">L1 No Show Rate</th>
                      <th className="px-4 py-3 font-semibold">L1 Rejection Rate</th>
                      <th className="px-4 py-3 font-semibold">L2 Rejection Rate</th>
                      <th className="px-4 py-3 font-semibold">Offer Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {mockMonthlyData.map((data, index) => (
                      <tr 
                        key={data.month} 
                        className={`hover:bg-gray-700 transition-colors ${
                          index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'
                        }`}
                      >
                        <td className="px-4 py-3 font-medium text-[#ff6b00]">{data.month}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-[#ff6b00] h-2 rounded-full"
                                style={{ width: data.processedToScheduled }}
                              />
                            </div>
                            <span className="text-gray-300">{data.processedToScheduled}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full"
                                style={{ width: data.l1NoShowRate }}
                              />
                            </div>
                            <span className="text-gray-300">{data.l1NoShowRate}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-red-500 h-2 rounded-full"
                                style={{ width: data.l1RejectionRate }}
                              />
                            </div>
                            <span className="text-gray-300">{data.l1RejectionRate}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-red-500 h-2 rounded-full"
                                style={{ width: data.l2RejectionRate }}
                              />
                            </div>
                            <span className="text-gray-300">{data.l2RejectionRate}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: data.offerPercentage }}
                              />
                            </div>
                            <span className="text-gray-300">{data.offerPercentage}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-gray-400">No data available</div>
              )}
            </div>
          </div>

          {/* Channel Attribution Table */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Channel Attribution</h3>
              <div className="text-sm text-gray-400">
                Source-wise breakdown
              </div>
            </div>
            
            <div className="relative overflow-x-auto rounded-lg border border-gray-700">
              {mockMonthlyData && mockMonthlyData.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-700 text-gray-300">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Channel</th>
                      <th className="px-4 py-3 font-semibold">Candidates Offered</th>
                      <th className="px-4 py-3 font-semibold">Split</th>
                      <th className="px-4 py-3 font-semibold">Distribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {["Naukri", "Referral", "Vendor", "Linkedin"].map((channel, index) => {
                      const totalValue = mockMonthlyData.reduce((sum, month) => {
                        const channelData = month.channelData.find(c => c.name === channel);
                        return sum + (channelData?.value || 0);
                      }, 0);
                      const percentage = mockMonthlyData[0]?.channelData.find(c => c.name === channel)?.percentage || '0%';
                      return (
                        <tr 
                          key={channel}
                          className={`hover:bg-gray-700 transition-colors ${
                            index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: channelColors[channel] }}
                              />
                              <span className="font-medium text-white">{channel}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-300">{totalValue}</td>
                          <td className="px-4 py-3 text-gray-300">{percentage}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-32 bg-gray-600 rounded-full h-2">
                                <div 
                                  className="h-2 rounded-full"
                                  style={{ 
                                    width: percentage,
                                    backgroundColor: channelColors[channel]
                                  }}
                                />
                              </div>
                              <span className="text-gray-300">{percentage}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="p-4 text-gray-400">No data available</div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
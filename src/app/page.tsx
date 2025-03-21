"use client"

import { Card } from "@/components/ui/card";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { useState, useMemo } from "react";
import { generateMonthlyData, getJobDataFromCache, combineJobsData } from '@/utils/dataFetcher';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FiCalendar } from 'react-icons/fi';
import React from 'react';
import { EStage } from "@/types/dashboard";
import { Check, ChevronDown } from 'lucide-react';

// Define types for better type safety
interface ChannelData {
  name: string;
  value: number;
  active: number;
  rejected: number;
  percentage: string;
}

interface PipelineStage {
  stage: string;
  active: number;
  rejected: number;
}

interface MonthlyData {
  month: string;
  totalApplicants: number;
  processed: number;
  scheduled: number;
  attended: number;
  l1Select: number;
  l1Reject: number;
  noShow: number;
  l2Scheduled: number;
  l2Selected: number;
  l2Rejected: number;
  offer: number;
  processedToScheduled: string;
  l1NoShowRate: string;
  l1RejectionRate: string;
  l2RejectionRate: string;
  offerPercentage: string;
  channelData: ChannelData[];
  pipelineStages: PipelineStage[];
  totalRejected: number;
  totalOffers: number;
  activePipeline: number;
  stageConversionRates: {
    [key: string]: {
      selectionRate: string;
      rejectionRate: string;
    }
  };
}

// Update the chart theme with a more modern color palette inspired by the examples
const chartTheme = {
  axis: {
    ticks: {
      text: {
        fill: '#64748b', // Slate blue for better readability
        fontSize: 11
      }
    },
    legend: {
      text: {
        fill: '#475569',
        fontSize: 12,
        fontWeight: 500
      }
    }
  },
  grid: {
    line: {
      stroke: "#e2e8f0",
      strokeWidth: 0.5
    }
  },
  legends: {
    text: {
      fill: "#475569",
      fontSize: 11,
      fontWeight: 500
    }
  },
  colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
  text: {
    fill: '#334155',
    fontSize: 11
  },
  background: '#ffffff'
} as const;

// Define channel colors with more vibrant options inspired by the examples
interface ChannelColors {
  [key: string]: string;
}

const channelColors: ChannelColors = {
  "Naukri": "#f59e0b",    // Amber
  "Referral": "#3b82f6",  // Blue
  "Vendor": "#10b981",    // Emerald
  "Linkedin": "#0077b5"   // LinkedIn blue
};

// Add this helper function to get months till current date
const getAvailableMonths = () => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();

  const availableMonths = months.map((month, index) => ({
    name: month,
    shortName: month.slice(0, 3),
    value: index,
    disabled: index > currentMonth,
    current: index === currentMonth
  }));

  return availableMonths;
};

// Add the MonthSelector component
const MonthSelector = ({ selectedMonth, setSelectedMonth }: { 
  selectedMonth: string, 
  setSelectedMonth: (month: string) => void 
}) => {
  const availableMonths = getAvailableMonths();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[240px] justify-start text-left font-normal",
            !selectedMonth && "text-muted-foreground"
          )}
        >
          <FiCalendar className="mr-2 h-4 w-4" />
          {selectedMonth === 'All' ? 'All Time' : selectedMonth}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <div className="space-y-4 p-4">
          <div className="grid gap-2">
            <Button
              variant={selectedMonth === 'All' ? "default" : "ghost"}
              className="w-full justify-start font-normal"
              onClick={() => setSelectedMonth('All')}
            >
              All Time
            </Button>
            <div className="border-t my-2" />
            <div className="grid grid-cols-3 gap-2">
              {availableMonths.map((month) => (
                <Button
                  key={month.name}
                  variant={selectedMonth === month.shortName ? "default" : "ghost"}
                  className={cn(
                    "justify-center font-normal",
                    month.disabled && "opacity-50 cursor-not-allowed",
                    month.current && "border-2 border-primary"
                  )}
                  disabled={month.disabled}
                  onClick={() => setSelectedMonth(month.shortName)}
                >
                  {month.shortName}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Add the JobSelector component after the MonthSelector
const JobSelector = ({ selectedJobs, setSelectedJobs }: { 
  selectedJobs: string[], 
  setSelectedJobs: (jobs: string[]) => void 
}) => {
  // Sort jobs by JobName
  const sortedJobs = [...jobs].sort((a, b) => a.JobName.localeCompare(b.JobName));
  
  const toggleJob = (jobId: string) => {
    if (jobId === 'all') {
      // Toggle "All Jobs" - if all jobs are selected, deselect all; otherwise, select all
      if (selectedJobs.length === jobs.length) {
        setSelectedJobs([]);
      } else {
        setSelectedJobs(jobs.map(job => job.JobId));
      }
    } else if (selectedJobs.includes(jobId)) {
      // If job is already selected, remove it
      setSelectedJobs(selectedJobs.filter(id => id !== jobId));
    } else {
      // Add the job to selection
      setSelectedJobs([...selectedJobs, jobId]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-[240px] justify-start text-left font-normal"
        >
          <ChevronDown className="mr-2 h-4 w-4" />
          {selectedJobs.length === jobs.length 
            ? 'All Jobs' 
            : selectedJobs.length === 0 
              ? 'Select Jobs' 
              : `${selectedJobs.length} Job${selectedJobs.length > 1 ? 's' : ''} Selected`}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0 max-h-[400px] overflow-auto" align="start">
        <div className="space-y-4 p-4">
          <div className="grid gap-2">
            <div 
              className="flex items-center space-x-2 rounded-md p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => toggleJob('all')}
            >
              <div className={`h-4 w-4 rounded border flex items-center justify-center ${selectedJobs.length === jobs.length ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                {selectedJobs.length === jobs.length && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="font-medium">All Jobs</span>
            </div>
            <div className="border-t my-2" />
            <div className="grid gap-1">
              {sortedJobs.map((job) => (
                <div 
                  key={job.JobId}
                  className="flex items-center space-x-2 rounded-md p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => toggleJob(job.JobId)}
                >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center ${selectedJobs.includes(job.JobId) ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                    {selectedJobs.includes(job.JobId) && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span className="text-sm">{job.JobName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Define the jobs data
const jobs = [
  { "JobId": "54a5cabd-ad1b-4bf2-b83c-02b9708657bd", "JobName": ".Net Developer(Angular)" },
  { "JobId": "4f896c34-5eb2-4d1d-8e98-037920221114", "JobName": "iOS Developer - Ionic" },
  { "JobId": "56b839ba-4c3e-451f-876f-0601e980e08d", "JobName": "Frontend Developers (React / Angular)" },
  { "JobId": "a99a350e-89b4-471d-afc5-09707a2daa52", "JobName": ".net + Kendo UI" },
  { "JobId": "e9f6e12c-da7f-4560-a1b0-105f1c9a74ee", "JobName": "Lead Data Scientist" },
  { "JobId": "59f4f5c3-deaa-4fc7-ade7-23e2d248360a", "JobName": "Product Owner / Product Manager" },
  { "JobId": "bffa3869-eddf-4455-8a18-262c41426f27", "JobName": "Java Developer" },
  { "JobId": "52543465-e997-41e8-8c18-2a35cbaa8890", "JobName": "Technical Architect - Java" },
  { "JobId": "2125ad92-8139-432e-b0ae-38643bc61395", "JobName": "Business Analyst" },
  { "JobId": "46a6f146-1ab1-4498-8ff2-410b5b1ad6d2", "JobName": "Data Engineer" },
  { "JobId": "293b5f27-a7aa-48df-868e-41d832c4ec8b", "JobName": "Data Architect" },
  { "JobId": "cd4bf0a4-08f6-47d4-b344-54a12de574be", "JobName": ".Net Developer" },
  { "JobId": "c0461afe-1745-4f93-8659-57dbdbc40faf", "JobName": "Lead Consultant" },
  { "JobId": "6150831f-f7b8-49d8-bed9-5aaa62932341", "JobName": "Consulting Practice Head" },
  { "JobId": "c64b2bf3-09ef-426d-9f9e-608c40590ae2", "JobName": "Java - Walkin - 25th Jan" },
  { "JobId": "96be25f1-d34a-47c7-a088-620b54bdc404", "JobName": ".Net Developer (React.js)" },
  { "JobId": "ec290a44-8a1a-488d-a5ac-6a9d878588a0", "JobName": "Python Developer" },
  { "JobId": "a63821b1-6ef4-40d7-8265-6bbeb94b64f8", "JobName": ".Net Developer(Core + VB.net)" },
  { "JobId": "b1c99a28-5c67-4de1-9124-82fd8037c269", "JobName": "Senior Frontend Developer(React + Angular)" },
  { "JobId": "7bbf2cc9-f5de-41ed-a50e-859dbfbe77ae", "JobName": "Delivery Manager" },
  { "JobId": "0c24c6b7-230b-483d-8935-8b95c008f8cf", "JobName": "Fullstack Engineer" },
  { "JobId": "0529b315-0215-4903-9a11-9686cb21f286", "JobName": "DevOps Architect" },
  { "JobId": "3b855aaa-55d7-45e5-b29d-9b61fca39dc8", "JobName": "Lead Business Analyst" },
  { "JobId": "c506e280-aeb0-4d54-baf6-a7e406e43b80", "JobName": "Qliksense Developer" },
  { "JobId": "c8665db1-8f27-4812-b07d-b30182daa8be", "JobName": ".Net Developer (Vue.js)" },
  { "JobId": "3c9b0f63-15fb-43ed-a3dd-b92597562995", "JobName": "DevOps Engineer" },
  { "JobId": "97bd35f1-baac-47b5-bb34-bf1c74d712c4", "JobName": "PowerBI Developer" },
  { "JobId": "dd01dd36-a23a-45ee-bb28-c10acb3652a6", "JobName": "Project Manager" },
  { "JobId": "7f2ab5e7-65d3-4644-834e-c34d1a683907", "JobName": "Data Scientist/ Senior Data Scientist" },
  { "JobId": "f61ac7d2-614b-4ed3-9c6a-e17de9b461dc", "JobName": "Business Head / Practice Head" },
  { "JobId": "ee82966b-6339-4953-808e-e2f19c712730", "JobName": "Business Analyst - Consulting Practice" },
  { "JobId": "4f937369-7402-439a-8830-f77e381ebf09", "JobName": "Support Roles" },
  { "JobId": "cc558d28-9c23-4ccb-921c-feac9f91ae63", "JobName": "LegacyLeap" }
];

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedJobs, setSelectedJobs] = useState<string[]>(jobs.map(job => job.JobId)); // Initialize with all jobs
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add this state for token management
  const [apiToken, setApiToken] = useState<string>('');
  const [showTokenModal, setShowTokenModal] = useState(false);
  
  // Add a state to track if initial data has been loaded
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);

  // Define allStages here
  const allStages = Object.values(EStage);

  // Modify the useEffect hook to only load data once
  React.useEffect(() => {
    const token = sessionStorage.getItem('apiToken');
    if (token) {
      setApiToken(token);
      if (!initialDataLoaded) {
        // Only fetch data on initial load
        fetchDashboardData(token);
      } else {
        // Just update the displayed data based on selected jobs
        updateDisplayedData();
      }
    } else {
      setShowTokenModal(true);
    }
  }, [initialDataLoaded]); // Remove selectedJobs dependency

  // Add a separate effect to update displayed data when selections change
  React.useEffect(() => {
    if (initialDataLoaded) {
      updateDisplayedData();
    }
  }, [selectedJobs, selectedMonth, initialDataLoaded]);

  // Function to update displayed data without API calls
  const updateDisplayedData = () => {
    // Combine data from cache for selected jobs
    const combinedData = combineJobsData(selectedJobs);
    setMonthlyData(combinedData);
  };

  // Modify the fetchDashboardData function
  const fetchDashboardData = async (token: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch data for all jobs once
      await generateMonthlyData(jobs, token);
      
      // After fetching, combine from cache based on selected jobs
      updateDisplayedData();
      
      // Mark initial data as loaded
      setInitialDataLoaded(true);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Failed to fetch data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Add the AuthTokenModal component
  const AuthTokenModal = () => {
    const [token, setToken] = useState(apiToken || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      // Update the token state
      setApiToken(token);

      // Close the modal
      setShowTokenModal(false);

      // Fetch data with the new token
      await fetchDashboardData(token);

      setIsSubmitting(false);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Enter API Token</h2>
            <button
              onClick={() => setShowTokenModal(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
                API Token
              </label>
              <input
                type="text"
                id="token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your API token"
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const currentMonthData = useMemo(() => {
    if (selectedMonth === 'All') {
      if (!monthlyData.length) return null;

      const combinedData = {
        ...monthlyData[0],
        totalApplicants: monthlyData.reduce((sum, month) => sum + month.totalApplicants, 0),
        processed: monthlyData.reduce((sum, month) => sum + month.processed, 0),
        scheduled: monthlyData.reduce((sum, month) => sum + month.scheduled, 0),
        attended: monthlyData.reduce((sum, month) => sum + month.attended, 0),
        l1Select: monthlyData.reduce((sum, month) => sum + month.l1Select, 0),
        l1Reject: monthlyData.reduce((sum, month) => sum + month.l1Reject, 0),
        noShow: monthlyData.reduce((sum, month) => sum + month.noShow, 0),
        l2Scheduled: monthlyData.reduce((sum, month) => sum + month.l2Scheduled, 0),
        l2Selected: monthlyData.reduce((sum, month) => sum + month.l2Selected, 0),
        l2Rejected: monthlyData.reduce((sum, month) => sum + month.l2Rejected, 0),
        offer: monthlyData.reduce((sum, month) => sum + month.offer, 0),
        totalRejected: monthlyData.reduce((sum, month) => sum + month.totalRejected, 0),
        totalOffers: monthlyData.reduce((sum, month) => sum + month.totalOffers, 0),
        activePipeline: monthlyData.reduce((sum, month) => sum + month.activePipeline, 0),
        pipelineStages: monthlyData[0].pipelineStages.map((stage, index) => ({
          ...stage,
          active: monthlyData.reduce((sum, month) => sum + month.pipelineStages[index].active, 0),
          rejected: monthlyData.reduce((sum, month) => sum + month.pipelineStages[index].rejected, 0),
        })),
        channelData: monthlyData[0].channelData.map((channel, index) => {
          const totalValue = monthlyData.reduce((sum, month) => sum + month.channelData[index].value, 0);
          const totalActive = monthlyData.reduce((sum, month) => sum + month.channelData[index].active, 0);
          const totalRejected = monthlyData.reduce((sum, month) => sum + month.channelData[index].rejected, 0);
          const totalApplicants = monthlyData.reduce((sum, month) => sum + month.totalApplicants, 0);

          return {
            ...channel,
            value: totalValue,
            active: totalActive,
            rejected: totalRejected,
            percentage: `${Math.round((totalValue / totalApplicants) * 100)}%`
          };
        })
      };
      return combinedData;
    }
    return monthlyData.find(data => data.month === selectedMonth) || null;
  }, [selectedMonth, monthlyData]);

  // Add this function before the return statement in the Dashboard component
  const exportStageConversionRates = () => {
    if (!monthlyData.length) return;

    const headers = [
      'Month',
      'Metric',
      'Pool',
      'HR Screening',
      'Xobin Test',
      'L1 Interview',
      'L2 Interview',
      'Final Round',
      'HR Round',
      'Pre Offer Doc',
      'Offer Approval',
      'Offer',
      'Nurturing Campaign',
      'Hired'
    ];

    let csvContent = headers.join(',') + '\n';

    // Add data for each month
    monthlyData.forEach(data => {
      const selectionRow = [
        data.month,
        'Selection Rate'
      ];

      // Add selection rates for each stage
      Object.values(EStage).forEach(stage => {
        selectionRow.push(data.stageConversionRates[stage]?.selectionRate || 'N/A');
      });

      csvContent += selectionRow.join(',') + '\n';

      const rejectionRow = [
        data.month,
        'Rejection Rate'
      ];

      // Add rejection rates for each stage
      Object.values(EStage).forEach(stage => {
        rejectionRow.push(data.stageConversionRates[stage]?.rejectionRate || 'N/A');
      });

      csvContent += rejectionRow.join(',') + '\n';
    });

    // Calculate and add average row
    const avgSelectionRow = ['Average', 'Selection Rate'];
    const avgRejectionRow = ['Average', 'Rejection Rate'];

    Object.values(EStage).forEach(stage => {
      // Calculate average selection rate
      const selectionRates = monthlyData
        .map(month => month.stageConversionRates[stage]?.selectionRate || '0%')
        .map(rate => parseFloat(rate) || 0);
      const avgSelection = selectionRates.reduce((sum, rate) => sum + rate, 0) / selectionRates.length;
      avgSelectionRow.push(`${avgSelection.toFixed(2)}%`);

      // Calculate average rejection rate
      const rejectionRates = monthlyData
        .map(month => month.stageConversionRates[stage]?.rejectionRate || '0%')
        .map(rate => parseFloat(rate) || 0);
      const avgRejection = rejectionRates.reduce((sum, rate) => sum + rate, 0) / rejectionRates.length;
      avgRejectionRow.push(`${avgRejection.toFixed(2)}%`);
    });

    csvContent += avgSelectionRow.join(',') + '\n';
    csvContent += avgRejectionRow.join(',') + '\n';

    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'stage_conversion_rates.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        <div className="text-red-500 flex items-center">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-white underline"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Update offers chart configuration
  const offersChartConfig = {
    data: monthlyData.map(month => ({
      month: month.month,
      offers: month.totalOffers
    })),
    keys: ['offers'],
    indexBy: 'month',
    margin: { top: 20, right: 20, bottom: 40, left: 40 },
    padding: 0.15,
    axisLeft: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Count',
      legendPosition: 'middle' as const,
      legendOffset: -35,
      truncateTickAt: 0
    },
    axisBottom: {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: 'Month',
      legendPosition: 'middle' as const,
      legendOffset: 35,
      truncateTickAt: 0
    },
    legends: []
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      {showTokenModal && <AuthTokenModal />}

      {/* Header with clean design like in second image */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-6 py-4 flex justify-between items-center max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-gray-900">CXO Dashboard</h1>
            <div className="h-6 w-px bg-gray-300"></div>
            <MonthSelector
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
            />
            <div className="h-6 w-px bg-gray-300"></div>
            <JobSelector
              selectedJobs={selectedJobs}
              setSelectedJobs={setSelectedJobs}
            />
          </div>

          {/* Add the API Token button */}
          {apiToken && <Button
            onClick={() => setShowTokenModal(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            {'Update API Token'}
          </Button>
        }
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 max-w-[1920px] mx-auto space-y-6">
        {/* If no token is set, show a message */}
        {!apiToken && !isLoading && (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">API Token Required</h2>
            <p className="text-gray-600 mb-4">Please enter your API token to fetch dashboard data</p>
            <Button
              onClick={() => setShowTokenModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Enter API Token
            </Button>
          </div>
        )}

        {/* Only show dashboard content if token is set or data is loading */}
        {(apiToken || isLoading) && (
          <>
            {/* Top Metrics Cards - Clean white cards like in examples */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card className="p-4 bg-white shadow-sm rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Total Applicants</h3>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{currentMonthData?.totalApplicants || 0}</p>
              </Card>

              <Card className="p-4 bg-white shadow-sm rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Offers Made</h3>
                <p className="text-2xl font-semibold text-gray-900 mt-2">{currentMonthData?.totalOffers || 0}</p>
              </Card>

              <Card className="p-4 bg-white shadow-sm rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Total Rejections</h3>
                <p className="text-2xl font-semibold text-gray-900 mt-2">
                  {(currentMonthData?.totalRejected || 0)}
                </p>
              </Card>

              <Card className="p-4 bg-white shadow-sm rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Active Pipeline</h3>
                <p className="text-2xl font-semibold text-gray-900 mt-2">
                  {(currentMonthData?.activePipeline || 0)}
                </p>
              </Card>
              <Card className="p-4 bg-white shadow-sm rounded-lg">
                <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
                <p className="text-2xl font-semibold text-gray-900 mt-2">
                  {currentMonthData?.totalOffers && currentMonthData?.totalApplicants
                    ? ((currentMonthData.totalOffers / currentMonthData.totalApplicants) * 100).toFixed(2) + '%'
                    : '0%'}
                </p>
              </Card>
            </div>

            {/* Pipeline Analytics - Clean white card like in examples */}
            <Card className="p-6 bg-white rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recruitment Pipeline Analytics
                </h2>
              </div>

              <div className="bg-white rounded-lg">
                {/* Increased chart height for better visibility */}
                <div className="h-[400px]">
                  <ResponsiveBar
                    data={currentMonthData?.pipelineStages
                      // Filter out the "Reject" stage
                      .filter(stage => stage.stage !== "Reject")
                      // Sort stages in the specified order
                      .sort((a, b) => {
                        const stageOrder = [
                          "Pool",
                          "HR Screening",
                          "Xobin Test",
                          "L1 Interview",
                          "L2 Interview",
                          "Final Round",
                          "HR Round",
                          "Pre Offer Documentation",
                          "Offer Approval",
                          "Offer",
                          "Nurturing Campaign",
                          "Hired"
                        ];
                        return stageOrder.indexOf(a.stage) - stageOrder.indexOf(b.stage);
                      })
                      .map(stage => ({
                        // Shorten "Pre Offer Documentation" to prevent overlap
                        stage: stage.stage === "Pre Offer Documentation" ? "Pre Offer Doc" : stage.stage,
                        active: stage.active,
                        rejected: stage.rejected
                      })) || []}
                    keys={['active', 'rejected']}
                    indexBy="stage"
                    groupMode="grouped"
                    margin={{ top: 30, right: 70, bottom: 120, left: 70 }}
                    padding={0.25}
                    innerPadding={4}
                    valueScale={{ type: 'linear' }}
                    indexScale={{ type: 'band', round: true }}
                    colors={['#3b82f6', '#ef4444']} // Blue and red like in examples
                    borderRadius={4}
                    axisBottom={{
                      tickSize: 5,
                      tickPadding: 12,
                      tickRotation: -55,
                      legend: 'Pipeline Stages',
                      legendPosition: 'middle',
                      legendOffset: 95,
                      truncateTickAt: 0
                    }}
                    axisLeft={{
                      tickSize: 5,
                      tickPadding: 8,
                      tickRotation: 0,
                      legend: 'Number of Candidates',
                      legendPosition: 'middle',
                      legendOffset: -55
                    }}
                    enableLabel={true}
                    labelSkipWidth={20}
                    labelSkipHeight={20}
                    labelTextColor="#ffffff"
                    labelFormat={value => `${value}`}
                    labelOffset={-5}
                    legends={[]}
                    theme={{
                      background: 'transparent',
                      axis: {
                        domain: {
                          line: {
                            stroke: '#e2e8f0',
                            strokeWidth: 1
                          }
                        },
                        ticks: {
                          line: {
                            stroke: '#e2e8f0',
                            strokeWidth: 1
                          },
                          text: {
                            fill: '#64748b',
                            fontSize: 10,
                            fontWeight: 500
                          }
                        },
                        legend: {
                          text: {
                            fill: '#475569',
                            fontSize: 12,
                            fontWeight: 600
                          }
                        }
                      },
                      grid: {
                        line: {
                          stroke: '#f1f5f9',
                          strokeWidth: 1
                        }
                      },
                      tooltip: {
                        container: {
                          background: '#ffffff',
                          color: '#1e293b',
                          fontSize: '12px',
                          borderRadius: '4px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          padding: '8px 12px',
                          border: '1px solid #e2e8f0'
                        }
                      }
                    }}
                    role="application"
                    ariaLabel="Pipeline Stages Analysis"
                    barAriaLabel={e => `${e.id}: ${e.formattedValue} candidates in ${e.indexValue}`}
                    tooltip={({ id, value, color, indexValue }) => (
                      <div
                        style={{
                          padding: 12,
                          color: '#333',
                          background: '#fff',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          borderRadius: 4
                        }}
                      >
                        <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                          {indexValue === "Pre Offer Doc" ? "Pre Offer Documentation" : indexValue}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div
                            style={{
                              width: 12,
                              height: 12,
                              backgroundColor: color,
                              borderRadius: '50%',
                              marginRight: 8
                            }}
                          />
                          <span style={{ marginRight: 8 }}>{id}:</span>
                          <span style={{ fontWeight: 'bold' }}>{value}</span>
                        </div>
                      </div>
                    )}
                  />
                </div>

                {/* Custom legends below the chart */}
                <div className="flex justify-center items-center mt-4 space-x-12">
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-[#3b82f6] mr-2"></div>
                    <span className="text-sm font-medium text-gray-700">Active Pipeline</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 rounded-full bg-[#ef4444] mr-2"></div>
                    <span className="text-sm font-medium text-gray-700">Rejection Analysis</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Channel Attribution - Clean white cards like in examples */}
            <Card className="p-6 bg-white shadow-sm rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Channel Attribution</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {currentMonthData?.channelData.map((channel) => (
                  <div key={channel.name} className="bg-white rounded-lg p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: channelColors[channel.name] }}
                        />
                        <span className="font-medium text-gray-900">{channel.name}</span>
                      </div>
                      <span className="text-sm text-gray-500">{channel.percentage}</span>
                    </div>

                    <div className="h-[160px]">
                      <ResponsivePie
                        data={[
                          {
                            id: 'active',
                            label: 'Active',
                            value: channel.active,
                            color: '#3b82f6'
                          },
                          {
                            id: 'rejected',
                            label: 'Rejected',
                            value: channel.rejected,
                            color: '#ef4444'
                          }
                        ]}
                        margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        innerRadius={0.6}
                        padAngle={0.5}
                        cornerRadius={3}
                        activeOuterRadiusOffset={3}
                        colors={['#3b82f6', '#ef4444']}
                        borderWidth={1}
                        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                        enableArcLinkLabels={false}
                        enableArcLabels={false}
                        legends={[]}
                        layers={[
                          'arcs',
                          'legends',
                          ({ centerX, centerY }) => (
                            <g>
                              <text
                                x={centerX}
                                y={centerY - 10}
                                textAnchor="middle"
                                dominantBaseline="central"
                                style={{
                                  fontSize: '20px',
                                  fontWeight: 'bold',
                                  fill: '#1e293b'
                                }}
                              >
                                {channel.value}
                              </text>
                              <text
                                x={centerX}
                                y={centerY + 10}
                                textAnchor="middle"
                                dominantBaseline="central"
                                style={{
                                  fontSize: '12px',
                                  fill: '#64748b'
                                }}
                              >
                                Total
                              </text>
                            </g>
                          )
                        ]}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="text-gray-600">Active</span>
                        <span className="font-semibold text-[#3b82f6]">{channel.active}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                        <span className="text-gray-600">Rejected</span>
                        <span className="font-semibold text-[#ef4444]">{channel.rejected}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Stage-wise Conversion Rates Table - Clean design like in examples */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Stage-wise Conversion Rates</h3>
                <div className="flex items-center gap-2">
                  <div className="text-sm text-gray-500">
                    Selection and rejection rates by stage
                  </div>
                  <Button
                    onClick={exportStageConversionRates}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm flex items-center gap-1"
                    size="sm"
                  >
                    <svg
                      className="w-3 h-3"
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
                    Export
                  </Button>
                </div>
              </div>

              <div className="relative overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Month</th>
                      <th className="px-4 py-3 font-semibold">Metric</th>
                      <th className="px-4 py-3 font-semibold">Pool</th>
                      <th className="px-4 py-3 font-semibold">HR Screening</th>
                      <th className="px-4 py-3 font-semibold">Xobin Test</th>
                      <th className="px-4 py-3 font-semibold">L1 Interview</th>
                      <th className="px-4 py-3 font-semibold">L2 Interview</th>
                      <th className="px-4 py-3 font-semibold">Final Round</th>
                      <th className="px-4 py-3 font-semibold">HR Round</th>
                      <th className="px-4 py-3 font-semibold">Pre Offer Doc</th>
                      <th className="px-4 py-3 font-semibold">Offer Approval</th>
                      <th className="px-4 py-3 font-semibold">Offer</th>
                      <th className="px-4 py-3 font-semibold">Nurturing Campaign</th>
                      <th className="px-4 py-3 font-semibold">Hired</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {monthlyData.map((data, index) => (
                      <React.Fragment key={`${data.month}-rates`}>
                        {/* Selection Rate Row */}
                        <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} transition-color`}>
                          <td className="px-4 py-3 font-medium text-gray-900" rowSpan={2}>
                            {data.month}
                          </td>
                          <td className="px-4 py-3 text-green-600 font-medium">Selection Rate</td>
                          <td className="px-4 py-3 text-green-600">
                            {data.stageConversionRates[EStage.Pool]?.selectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-green-600">
                            {data.stageConversionRates[EStage.HR_Screening]?.selectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-green-600">
                            {data.stageConversionRates[EStage.Xobin_Test]?.selectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-green-600">
                            {data.stageConversionRates[EStage.L1_Interview]?.selectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-green-600">
                            {data.stageConversionRates[EStage.L2_Interview]?.selectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-green-600">
                            {data.stageConversionRates[EStage.Final_Round]?.selectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-green-600">
                            {data.stageConversionRates[EStage.HR_Round]?.selectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-green-600">
                            {data.stageConversionRates[EStage.Pre_Offer_Documentation]?.selectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-green-600">
                            {data.stageConversionRates[EStage.Offer_Approval]?.selectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-green-600">
                            {data.stageConversionRates[EStage.Offer]?.selectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-green-600">
                            {data.stageConversionRates[EStage.Nurturing_Campaign]?.selectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-green-600">
                            {data.stageConversionRates[EStage.Hired]?.selectionRate || "N/A"}
                          </td>
                        </tr>

                        {/* Rejection Rate Row */}
                        <tr className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} transition-colors`}>
                          <td className="px-4 py-3 text-red-600 font-medium">Rejection Rate</td>
                          <td className="px-4 py-3 text-red-600">
                            {data.stageConversionRates[EStage.Pool]?.rejectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-red-600">
                            {data.stageConversionRates[EStage.HR_Screening]?.rejectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-red-600">
                            {data.stageConversionRates[EStage.Xobin_Test]?.rejectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-red-600">
                            {data.stageConversionRates[EStage.L1_Interview]?.rejectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-red-600">
                            {data.stageConversionRates[EStage.L2_Interview]?.rejectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-red-600">
                            {data.stageConversionRates[EStage.Final_Round]?.rejectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-red-600">
                            {data.stageConversionRates[EStage.HR_Round]?.rejectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-red-600">
                            {data.stageConversionRates[EStage.Pre_Offer_Documentation]?.rejectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-red-600">
                            {data.stageConversionRates[EStage.Offer_Approval]?.rejectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-red-600">
                            {data.stageConversionRates[EStage.Offer]?.rejectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-red-600">
                            {data.stageConversionRates[EStage.Nurturing_Campaign]?.rejectionRate || "N/A"}
                          </td>
                          <td className="px-4 py-3 text-red-600">
                            {data.stageConversionRates[EStage.Hired]?.rejectionRate || "N/A"}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}

                    {/* Average Row */}
                    <tr className="bg-gray-100 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900" rowSpan={2}>Average</td>
                      <td className="px-4 py-3 text-green-600 font-medium">Selection Rate</td>
                      {allStages.map(stage => (
                        <td key={`avg-selection-${stage}`} className="px-4 py-3 text-green-600">
                          {(() => {
                            const rates = monthlyData
                              .map(month => month.stageConversionRates[stage]?.selectionRate || "0%")
                              .map(rate => parseFloat(rate) || 0);
                            const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
                            return `${avg.toFixed(2)}%`;
                          })()}
                        </td>
                      ))}
                    </tr>
                    <tr className="bg-gray-100 transition-colors">
                      <td className="px-4 py-3 text-red-600 font-medium">Rejection Rate</td>
                      {allStages.map(stage => (
                        <td key={`avg-rejection-${stage}`} className="px-4 py-3 text-red-600">
                          {(() => {
                            const rates = monthlyData
                              .map(month => month.stageConversionRates[stage]?.rejectionRate || "0%")
                              .map(rate => parseFloat(rate) || 0);
                            const avg = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
                            return `${avg.toFixed(2)}%`;
                          })()}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Charts section - Clean white cards like in examples */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="p-6 bg-white shadow-sm rounded-lg">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Offers</h2>
                <div className="h-[250px]">
                  <ResponsiveBar<{ month: string; offers: number }>
                    data={offersChartConfig.data}
                    keys={offersChartConfig.keys}
                    indexBy={offersChartConfig.indexBy}
                    margin={offersChartConfig.margin}
                    padding={offersChartConfig.padding}
                    axisLeft={{
                      ...offersChartConfig.axisLeft,
                      legendPosition: 'middle'
                    }}
                    axisBottom={{
                      ...offersChartConfig.axisBottom,
                      legendPosition: 'middle'
                    }}
                    legends={offersChartConfig.legends}
                    theme={{
                      ...chartTheme,
                      background: '#ffffff',
                      text: {
                        fill: '#374151',
                        fontSize: 11
                      }
                    }}
                    colors={['#3b82f6']}
                    borderRadius={4}
                  />
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
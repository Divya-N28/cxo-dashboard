"use client"

import { Card } from "@/components/ui/card";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { useState, useMemo, useEffect, useCallback } from "react";
import { generateDashboardData, testApiToken, stageMapping } from '@/utils/dataFetcher';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FiCalendar } from 'react-icons/fi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import React from 'react';
import { EStage } from "@/types/dashboard";
import { Check, ChevronDown, Settings, BarChart } from 'lucide-react';
import ReferralDashboard from '@/components/ReferralDashboard';
import CandidateDetailsModal from '@/components/CandidateDetailsModal';
import ApiTokenSettings from '@/components/ApiTokenSettings';
import JobFilter from '@/components/JobFilter';

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

// Add new interfaces for candidate data
interface CandidateData {
  UserData: {
    Name: string;
    EmailId: string;
    PhoneNumber: string;
    EducationList: {
      InstituteName: string;
      Degree: string;
      EndYear: number;
    }[];
  };
  WorkData: {
    WorkDataList: {
      CompanyName: string;
      Role: string;
      StartDate: {
        Month: number;
        Day: number;
        Year: number;
      };
      EndDate: {
        Month: number;
        Day: number;
        Year: number;
      };
    }[];
    TotalExperience: number;
  };
  Source: {
    SourceCategory: string;
    SourceDrillDown1: string;
    SourceDrillDown2: string;
  };
  ResumeStage: {
    Name: string;
    Value: number;
    previousStatus: number,
  };
  Parent: {
    Name: string;
    JobCode: string;
    ParentId: string;
  };
  ResumeUrl: string;
  UploadDateTime: string;
}

interface DashboardData {
  monthlyData: MonthlyData[];
  jobData: { [jobId: string]: { name: string, code: string } };
  candidatesByStage: {
    [month: string]: {
      [stage: string]: string[]
    }
  };
  candidatesByChannel: {
    [month: string]: {
      [channel: string]: string[]
    }
  };
  referralData: {
    summary: {
      month: string;
      totalReferrals: number;
      referrers: {
        name: string;
        count: number;
        percentage: string;
        candidates: string[];
      }[];
      stages: {
        stage: string;
        count: number;
        percentage: string;
        candidates: string[];
      }[];
      conversionRate: string;
    }[];
    topReferrers: {
      name: string;
      count: number;
      percentage: string;
      candidates: string[];
    }[];
  };
  candidateData: { [resumeId: string]: CandidateData };
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
  "LinkedIn": "#0077b5",  // LinkedIn blue
  "Referral": "#3b82f6",  // Blue
  "Vendor": "#10b981",    // Emerald
  "Career Page": "#8b5cf6", // Purple
  "JobBoards": "#f43f5e",  // Rose
  "RecruitmentPartners": "#14b8a6", // Teal
  "Unknown": "#6b7280"    // Gray
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



// Define the order for proper pipeline visualization
const pipelineStageOrder = {
  "Pool": 1,
  "HR Screening": 2,
  "Xobin Test": 3,
  "L1 Interview": 4,
  "L2 Interview": 5,
  "Final Round": 6,
  "HR Round": 7,
  "Pre Offer Documentation": 8,
  "Offer Approval": 9,
  "Offer": 10,
  "Nurturing Campaign": 11,
  "Hired": 12,
  // "Reject": 13
};

export default function Dashboard() {
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Modal state for candidate details
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selectedCandidates, setSelectedCandidates] = useState<CandidateData[]>([]);
  const [modalTitle, setModalTitle] = useState<string>('Candidate Details');

  // Add these state variables to your Dashboard component
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiTokenSet, setApiTokenSet] = useState(false);
  const [filteredData, setFilteredData] = useState<any>({});

  // Update the fetchData function to properly handle the API flow
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('turbohire_api_token');

    if (!token) {
      setLoading(false);
      setError('API token is missing. Please set it in the settings.');
      return;
    }

    try {
      // First test if the token is valid
      const tokenTest = await testApiToken(token);

      if (!tokenTest.success) {
        // If token test failed, show error
        setError('API token is invalid. Please update it in settings.');
        setLoading(false);
        return;
      }

      // If token is valid, fetch dashboard data
      const result = await generateDashboardData(token);
      if (result.error) {
        setError(`Error: ${result.error.message}`);
      } else if (result.data) {
        setDashboardData(result.data);
        calculateFilteredData(result.data);
        console.log(Object.keys(result.data.refferals));
      } else {
        setError('No data returned from API');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dashboardData) {
      calculateFilteredData(dashboardData);
      console.log(dashboardData)
    }

  }, [selectedJobs, selectedMonth])

  const calculateFilteredData = (_dashboardData: any) => {
    const values = {
      totalApplicants: 0,
      activePipeline: 0,
      totalOffers: 0,
      totalRejected: 0,
      conversionRate: 0,
      pipelineStages: {},
      channelAttr: {},
      pipelineChartData: [],
      channelChartData: [],
      channelData: [],
    }

    // Initialize channelChartData array
    values.channelChartData = [];

        // Create a map to aggregate channel counts across all data entries
    const channelCounts = new Map();
    
    Object.keys(_dashboardData.allDatas).map((item) => {
      const data = _dashboardData.allDatas[item];

      const [itemMonth, itemJobId] = item.split('_');

      const monthMatches = selectedMonth === "All" || selectedMonth === itemMonth;
      const jobMatches = selectedJobs.length === 0 || selectedJobs.includes(itemJobId);

      if ((monthMatches && jobMatches)) {
        values.totalApplicants += data.totalApplicants;
        values.activePipeline += data.activePipeline;
        values.totalOffers += data.totalOffers;
        values.totalRejected += data.totalRejected;

        Object.entries(data.channel).forEach(([channelName, count]) => {
          const currentCount = channelCounts.get(channelName) || 0;
          channelCounts.set(channelName, currentCount + count);
        });
      }
    })

    Object.keys(_dashboardData.candidateData).map((item) => {
      const data = _dashboardData.candidateData[item];
      const [itemMonth, itemJobId] = item.split('_');

      const monthMatches = selectedMonth === "All" || selectedMonth === itemMonth;
      const jobMatches = selectedJobs.length === 0 || selectedJobs.includes(itemJobId);

      if ((monthMatches && jobMatches)) {

      const currentStage = stageMapping[data.ResumeStage.Value];
      const previousStage = stageMapping[data.ResumeStage.previousStatus];

      if (data.ResumeStage.Value === 1) {
        if (!values.pipelineStages[previousStage]) {
          values.pipelineStages[previousStage] = {
            stage: previousStage,
            active: 0,
            rejected: 0
          }
        }
        values.pipelineStages[previousStage].rejected++;
      } else {
        if (!values.pipelineStages[currentStage]) {
          values.pipelineStages[currentStage] = {
            stage: currentStage,
            active: 0,
            rejected: 0
          }
        }
        values.pipelineStages[currentStage].active++;
      }

      values.channelData.push({
        name: data.Source.SourceDrillDown1,
        value: data.Source.SourceDrillDown2,
        active: data.ResumeStage.Value,
        rejected: data.ResumeStage.previousStatus
      })
    }
    })

    Object.keys(values.pipelineStages).map((item) => {
      const data = values.pipelineStages[item];
      values.pipelineChartData.push(data);
    })


    // Convert aggregated data to pie chart format
    channelCounts.forEach((count, channelName) => {
      values.channelChartData.push({
        id: channelName,
        label: channelName,
        value: count,
        color: channelColors[channelName] || '#6b7280' // Use predefined color or fallback to gray
      });
    });

    setFilteredData(values);
  }
  // Make sure we fetch data when the component mounts
  useEffect(() => {
    const token = localStorage.getItem('turbohire_api_token');
    setApiTokenSet(!!token);

    if (token) {
      fetchData();
    }
  }, []);

  // Handle candidate click
  const handleCandidateClick = (resumeIds: string[], title: string = 'Candidate Details') => {
    if (!dashboardData || !resumeIds.length) return;

    const candidates = resumeIds
      .map(id => dashboardData.candidateData[id])
      .filter(Boolean);

    setSelectedCandidates(candidates);
    setModalTitle(title);
    setModalOpen(true);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Recruitment Dashboard</h1>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSettingsOpen(true)}
          title="API Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <MonthSelector selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />

            {dashboardData && (
              <JobFilter
                jobs={Object.entries(dashboardData.jobData).map(([id, job]) => ({
                  id,
                  name: job.name,
                  code: job.code
                }))}
                selectedJobs={selectedJobs}
                setSelectedJobs={setSelectedJobs}
              />
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        ) : (
          <>
            <TabsContent value="overview" className="mt-0">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card
                  className="p-4 bg-white shadow-sm rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    if (!filteredData) return;
                    const allCandidates = Object.values(filteredData.candidateData || {});
                    handleCandidateClick(
                      allCandidates.map(c => c.ResumeId),
                      'All Candidates'
                    );
                  }}
                >
                  <h3 className="text-sm font-medium text-gray-500">Total Applicants</h3>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">
                    {filteredData?.totalApplicants || 0}
                  </p>
                </Card>

                <Card
                  className="p-4 bg-white shadow-sm rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    if (!filteredData) return;
                    const activeCandidates = Object.values(filteredData.candidateData || {})
                      .filter(c => {
                        const stageName = stageMapping[c.ResumeStage.Value.toString()];
                        return c.ResumeStage.Value !== 1 && // Not rejected
                          !["Offer", "Nurturing Campaign", "Hired"].includes(stageName); // Not in offer stages
                      });

                    handleCandidateClick(
                      activeCandidates.map(c => c.ResumeId),
                      'Active Pipeline'
                    );
                  }}
                >
                  <h3 className="text-sm font-medium text-gray-500">Active Pipeline</h3>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">
                    {filteredData?.activePipeline || 0}

                  </p>
                </Card>

                <Card
                  className="p-4 bg-white shadow-sm rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    if (!filteredData) return;
                    const offerCandidates = Object.values(filteredData.candidateData || {})
                      .filter(c => {
                        const stageName = stageMapping[c.ResumeStage.Value.toString()];
                        return ["Offer", "Nurturing Campaign", "Hired"].includes(stageName);
                      });

                    handleCandidateClick(
                      offerCandidates.map(c => c.ResumeId),
                      'Offers'
                    );
                  }}
                >
                  <h3 className="text-sm font-medium text-gray-500">Total Offers</h3>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">
                    {filteredData?.totalOffers || 0}
                  </p>
                </Card>

                <Card
                  className="p-4 bg-white shadow-sm rounded-lg cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    if (!filteredData) return;
                    const rejectedCandidates = Object.values(filteredData.candidateData || {})
                      .filter(c => c.ResumeStage.Value === 1);

                    handleCandidateClick(
                      rejectedCandidates.map(c => c.ResumeId),
                      'Rejected Candidates'
                    );
                  }}
                >
                  <h3 className="text-sm font-medium text-gray-500">Total Rejected</h3>
                  <p className="text-2xl font-semibold text-gray-900 mt-2">
                    {filteredData?.totalRejected || 0}
                  </p>
                </Card>

                {/* Conversion Rate */}
                <Card className="p-6 bg-white shadow-sm rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
                      <h3 className="text-2xl font-bold text-gray-900 mt-1">{0}</h3>
                    </div>
                    <div className="p-2 bg-purple-50 rounded-full">
                      <BarChart className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-purple-600 flex items-center">
                    <span>Applicants to offers</span>
                  </div>
                </Card>
              </div>

              {/* Add the charts section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Recruitment Pipeline */}
                <Card className="p-4 bg-white shadow-sm rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Recruitment Pipeline</h3>
                  <div className="h-80">
                    {filteredData.pipelineChartData.length > 0 ? (
                      <ResponsiveBar
                        data={filteredData.pipelineChartData}
                        keys={['active', 'rejected']}
                        indexBy="stage"
                        margin={{ top: 10, right: 10, bottom: 100, left: 60 }}
                        padding={0.3}
                        groupMode="stacked"
                        valueScale={{ type: 'linear' }}
                        indexScale={{ type: 'band', round: true }}
                        colors={['#3b82f6', '#ef4444']}
                        theme={chartTheme}
                        axisBottom={{
                          tickSize: 5,
                          tickPadding: 10,
                          tickRotation: -45,
                          legend: 'Stage',
                          legendPosition: 'middle',
                          legendOffset: 80
                        }}
                        axisLeft={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: 'Count',
                          legendPosition: 'middle',
                          legendOffset: -50
                        }}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        legends={[
                          {
                            dataFrom: 'keys',
                            anchor: 'bottom',
                            direction: 'row',
                            justify: false,
                            translateX: 0,
                            translateY: 50,
                            itemsSpacing: 20,
                            itemWidth: 100,
                            itemHeight: 20,
                            itemDirection: 'left-to-right',
                            itemOpacity: 0.85,
                            symbolSize: 12,
                            data: [
                              { id: 'active', label: 'Active', color: '#3b82f6' },
                              { id: 'rejected', label: 'Rejected', color: '#ef4444' }
                            ],
                            effects: [
                              {
                                on: 'hover',
                                style: {
                                  itemOpacity: 1
                                }
                              }
                            ]
                          }
                        ]}
                        tooltip={({ id, value, indexValue, color }) => (
                          <div className="bg-white p-2 shadow-lg rounded-lg border">
                            <strong>{indexValue}</strong>
                            <div style={{ color }}>
                              {id === 'active' ? 'Active: ' : 'Rejected: '}{value}
                            </div>
                          </div>
                        )}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Channel Attribution */}
                <Card className="p-4 bg-white shadow-sm rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Channel Attribution</h3>
                  <div className="h-80">
                    {filteredData.channelChartData.length > 0 ? (
                      <ResponsivePie
                        data={filteredData.channelChartData}
                        margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                        innerRadius={0.5}
                        padAngle={0.7}
                        cornerRadius={3}
                        activeOuterRadiusOffset={8}
                        colors={{ datum: 'data.color' }}
                        borderWidth={1}
                        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                        arcLinkLabelsSkipAngle={10}
                        arcLinkLabelsTextColor="#333333"
                        arcLinkLabelsThickness={2}
                        arcLinkLabelsColor={{ from: 'color' }}
                        arcLabelsSkipAngle={10}
                        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                        theme={chartTheme}
                        legends={[
                          {
                            anchor: 'bottom',
                            direction: 'row',
                            justify: false,
                            translateX: 0,
                            translateY: 56,
                            itemsSpacing: 20,
                            itemWidth: 100,
                            itemHeight: 18,
                            itemTextColor: '#999',
                            itemDirection: 'left-to-right',
                            itemOpacity: 1,
                            symbolSize: 18,
                            symbolShape: 'circle',
                          }
                        ]}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Monthly Trends */}
                <Card className="p-4 bg-white shadow-sm rounded-lg">
                  <h3 className="text-lg font-medium mb-4">Monthly Trends</h3>
                  <div className="h-80">
                    {[].length > 0 ? (
                      <ResponsiveBar
                        data={[]}
                        keys={['activePipeline', 'offers', 'rejected']}
                        indexBy="month"
                        margin={{ top: 20, right: 20, bottom: 80, left: 60 }}
                        padding={0.3}
                        groupMode="grouped"
                        valueScale={{ type: 'linear' }}
                        indexScale={{ type: 'band', round: true }}
                        colors={['#3b82f6', '#10b981', '#ef4444']}
                        theme={chartTheme}
                        axisBottom={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: 'Month',
                          legendPosition: 'middle',
                          legendOffset: 32
                        }}
                        axisLeft={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: 'Count',
                          legendPosition: 'middle',
                          legendOffset: -40
                        }}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        legends={[
                          {
                            dataFrom: 'keys',
                            anchor: 'bottom',
                            direction: 'row',
                            justify: false,
                            translateX: 0,
                            translateY: 60,
                            itemsSpacing: 20,
                            itemWidth: 100,
                            itemHeight: 20,
                            itemDirection: 'left-to-right',
                            itemOpacity: 0.85,
                            symbolSize: 12,
                            effects: [
                              {
                                on: 'hover',
                                style: {
                                  itemOpacity: 1
                                }
                              }
                            ]
                          }
                        ]}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Stage-wise Conversion Rates */}
                <Card className="p-4 bg-white shadow-sm rounded-lg mt-6">
                  <h3 className="text-lg font-medium mb-4">Stage-wise Conversion Rates</h3>
                  <div className="h-80">
                    {[].length > 0 ? (
                      <ResponsiveBar
                        data={[]}
                        keys={['selectionRate', 'rejectionRate']}
                        indexBy="stage"
                        margin={{ top: 10, right: 10, bottom: 100, left: 60 }}
                        padding={0.3}
                        groupMode="grouped"
                        valueScale={{ type: 'linear' }}
                        indexScale={{ type: 'band', round: true }}
                        colors={['#10b981', '#ef4444']}
                        theme={chartTheme}
                        axisBottom={{
                          tickSize: 5,
                          tickPadding: 10,
                          tickRotation: -45,
                          legend: 'Stage',
                          legendPosition: 'middle',
                          legendOffset: 80
                        }}
                        axisLeft={{
                          tickSize: 5,
                          tickPadding: 5,
                          tickRotation: 0,
                          legend: 'Rate (%)',
                          legendPosition: 'middle',
                          legendOffset: -50,
                          format: v => `${v}%`
                        }}
                        labelFormat={v => `${v}%`}
                        labelSkipWidth={12}
                        labelSkipHeight={12}
                        legends={[
                          {
                            dataFrom: 'keys',
                            anchor: 'bottom',
                            direction: 'row',
                            justify: false,
                            translateX: 0,
                            translateY: 50,
                            itemsSpacing: 20,
                            itemWidth: 100,
                            itemHeight: 20,
                            itemDirection: 'left-to-right',
                            itemOpacity: 0.85,
                            symbolSize: 12,
                            data: [
                              {
                                id: 'selectionRate',
                                label: 'Selection Rate',
                                color: '#10b981'
                              },
                              {
                                id: 'rejectionRate',
                                label: 'Rejection Rate',
                                color: '#ef4444'
                              }
                            ],
                            effects: [
                              {
                                on: 'hover',
                                style: {
                                  itemOpacity: 1
                                }
                              }
                            ]
                          }
                        ]}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No data available</p>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Channel Attribution Details */}
              <Card className="p-4 bg-white shadow-sm rounded-lg mt-6">
                <h3 className="text-lg font-medium mb-4">Channel Performance Metrics</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Channel</th>
                        <th className="text-right py-3 px-4">Total</th>
                        <th className="text-right py-3 px-4">Active</th>
                        <th className="text-right py-3 px-4">Offers</th>
                        <th className="text-right py-3 px-4">Rejected</th>
                        <th className="text-right py-3 px-4">Selection Rate</th>
                        <th className="text-right py-3 px-4">Rejection Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[].map((channel, index) => (
                        <tr
                          key={channel.name}
                          className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                        >
                          <td className="py-3 px-4 font-medium">
                            <div className="flex items-center">
                              <div
                                className="w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: channelColors[channel.name] || '#6366f1' }}
                              ></div>
                              {channel.name}
                            </div>
                          </td>
                          <td className="text-right py-3 px-4">{channel.total}</td>
                          <td className="text-right py-3 px-4">{channel.active}</td>
                          <td className="text-right py-3 px-4">{channel.offers}</td>
                          <td className="text-right py-3 px-4">{channel.rejected}</td>
                          <td className="text-right py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${parseFloat(channel.selectionRate) > 50
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                              }`}>
                              {channel.selectionRate}
                            </span>
                          </td>
                          <td className="text-right py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${parseFloat(channel.rejectionRate) < 50
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                              }`}>
                              {channel.rejectionRate}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="referrals" className="mt-0">
              {dashboardData && (
                <ReferralDashboard
                  referralData={dashboardData.refferals}
                  selectedMonth={selectedMonth}
                  selectedJobs={selectedJobs}
                  onCandidateClick={(candidateIds) => {
                    handleCandidateClick(candidateIds, 'Referral Candidates');
                  }}
                />
              )}  
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Candidate Details Modal */}
      <CandidateDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        candidates={selectedCandidates}
        title={modalTitle}
      />

      <ApiTokenSettings
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onTokenSaved={() => {
          setApiTokenSet(true);
          fetchData();
        }}
      />
    </div>
  );
}
import React, { useMemo, useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { stageMapping, stageOrderMapping } from '@/utils/dataFetcher';
import { Users, Award, BarChart, ChevronRight, Briefcase, X } from 'lucide-react';

// Helper functions
const getMonthString = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', { month: 'short' });
};

const getMonthYear = (dateString: string) => {
  const date = new Date(dateString);
  return `${getMonthString(dateString)}_${date.getFullYear()}`;
};

// Add calculateConversionRate as a helper function
const calculateConversionRate = (
  stages: Map<string, Set<string>>,
  offerStages: string[]
) => {
  const totalCandidates = Array.from(stages.values())
    .reduce((sum, candidates) => sum + candidates.size, 0);

  const offeredCandidates = Array.from(stages.entries())
    .filter(([stage]) => offerStages.includes(stage))
    .reduce((sum, [_, candidates]) => sum + candidates.size, 0);

  return totalCandidates > 0
    ? `${Math.round((offeredCandidates / totalCandidates) * 100)}%`
    : '0%';
};

// Add calculateTopReferrers as a helper function
const calculateTopReferrers = (summary: any[]) => {
  const referrerMap = new Map<string, { count: number; candidates: Set<string> }>();

  summary.forEach(month => {
    month.referrers.forEach((referrer: any) => {
      if (!referrerMap.has(referrer.name)) {
        referrerMap.set(referrer.name, { count: 0, candidates: new Set() });
      }
      const data = referrerMap.get(referrer.name)!;
      data.count += referrer.count;
      referrer.candidates.forEach((id: string) => data.candidates.add(id));
    });
  });

  return Array.from(referrerMap.entries())
    .map(([name, data]) => ({
      name,
      count: data.count,
      percentage: '0%', // Calculate if needed
      candidates: Array.from(data.candidates)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

interface CandidateDataType {
  UserData: {
    Name: string;
    EmailId: string;
  };
  Source: {
    SourceCategory: string;
    SourceDrillDown1: string;
    SourceDrillDown2: string;
  };
  ResumeStage: {
    Name: string;
    Value: number;
    previousStatus: number;
  };
  Parent: {
    ParentId: string;
    Type: string;
    Name: string;
    JobCode: string;
  };
  ResumeId: string;
  UploadDateTime: string;
  DateTime: string;
}

interface ReferralDashboardProps {
  referralData: { [key: string]: any };
  selectedMonth?: string;
  selectedJobs?: string[];
  onCandidateClick: (candidateIds: string[], title?: string) => void;
}

export default function ReferralDashboard({
  referralData,
  selectedMonth = 'All',
  selectedJobs = [],
  onCandidateClick
}: ReferralDashboardProps) {
  // Define the pipeline stage order and offer stages
  const offerStages = ["Offer", "Nurturing Campaign", "Hired"];
  const [filteredData, setFilteredData] = useState<any>({});

  // // Transform candidateData into referralData format
  // const candidateData = useMemo(() => {
  //   if(referralData){
  //   const data: {
  //     [key: string]: {
  //       referrer: { name: string };
  //       stage: string;
  //       resumeId: string;
  //       jobId: string;
  //       month: string;
  //     }
  //   } = {};

  //   Object.keys(referralData).forEach((item) => {
  //     const candidate = referralData[item];
  //     const monthYear = getMonthYear(candidate.UploadDateTime);
  //     const key = `${monthYear}_${candidate.Parent.ParentId}_${candidate.ResumeId}`;

  //     data[key] = {
  //       referrer: {
  //         name: candidate.Source.SourceDrillDown2
  //       },
  //       stage: candidate.ResumeStage.Name,
  //       resumeId: candidate.ResumeId,
  //       jobId: candidate.Parent.ParentId,
  //       month: monthYear
  //     };

  //   });

  //   return data;
  // }
  // }, [referralData]);

  // // Calculate total number of unique jobs
  // const totalJobCount = useMemo(() => {
  //   const uniqueJobs = new Set(
  //     Object.values(candidateData)
  //       .filter(c => c.Source?.SourceCategory === 'Referral')
  //       .map(c => c.Parent.ParentId)
  //   );
  //   return uniqueJobs.size;
    
  // }, [candidateData]);

  // // Filter referralData based on selected month and jobs
  // const filteredReferralData = useMemo(() => {
  //   return Object.entries(referralData).reduce((acc, [key, data]) => {
  //     const monthMatches = selectedMonth === 'All' || data.month === selectedMonth;
  //     const jobMatches = selectedJobs.length === 0 || selectedJobs.includes(data.jobId);

  //     if (monthMatches && jobMatches) {
  //       acc[key] = data;
  //     }
  //     return acc;
  //   }, {} as typeof referralData);
  // }, [referralData, selectedMonth, selectedJobs]);

  // // Check if all jobs are selected
  // const isAllJobsSelected = useMemo(() => {
  //   return selectedJobs.length === 0 || selectedJobs.length === totalJobCount;
  // }, [selectedJobs, totalJobCount]);

  // // Transform raw referral data into structured format
  // const processedData = useMemo(() => {
  //   const entries = Object.entries(referralData);
  //   const monthData: Record<string, {
  //     referrers: Map<string, Set<string>>;
  //     stages: Map<string, Set<string>>;
  //     totalReferrals: number;
  //   }> = {};

  //   // Filter entries based on selected jobs
  //   const filteredEntries = entries.filter(([_, data]) => {
  //     if (selectedJobs.length === 0) return true;
  //     return selectedJobs.includes(data.jobId);
  //   });

  //   // Process each referral entry
  //   filteredEntries.forEach(([_, data]) => {
  //     const { month, referrer, stage, resumeId } = data;

  //     if (!monthData[month]) {
  //       monthData[month] = {
  //         referrers: new Map(),
  //         stages: new Map(),
  //         totalReferrals: 0
  //       };
  //     }

  //     // Add to referrers
  //     if (!monthData[month].referrers.has(referrer.name)) {
  //       monthData[month].referrers.set(referrer.name, new Set());
  //     }
  //     monthData[month].referrers.get(referrer.name)?.add(resumeId);

  //     // Add to stages
  //     if (!monthData[month].stages.has(stage)) {
  //       monthData[month].stages.set(stage, new Set());
  //     }
  //     monthData[month].stages.get(stage)?.add(resumeId);

  //     monthData[month].totalReferrals++;
  //   });

  //   // Convert to the expected format
  //   const summary = Object.entries(monthData).map(([month, data]) => ({
  //     month,
  //     totalReferrals: data.totalReferrals,
  //     referrers: Array.from(data.referrers.entries()).map(([name, candidates]) => ({
  //       name,
  //       count: candidates.size,
  //       percentage: `${Math.round((candidates.size / data.totalReferrals) * 100)}%`,
  //       candidates: Array.from(candidates)
  //     })),
  //     stages: Array.from(data.stages.entries()).map(([stage, candidates]) => ({
  //       stage,
  //       count: candidates.size,
  //       percentage: `${Math.round((candidates.size / data.totalReferrals) * 100)}%`,
  //       candidates: Array.from(candidates)
  //     })),
  //     conversionRate: calculateConversionRate(data.stages, offerStages)
  //   }));

  //   // Filter by selected month if not 'All'
  //   const filteredSummary = selectedMonth === 'All'
  //     ? summary
  //     : summary.filter(m => m.month === selectedMonth);

  //   return {
  //     summary: filteredSummary,
  //     topReferrers: calculateTopReferrers(filteredSummary)
  //   };
  // }, [referralData, selectedJobs, selectedMonth, offerStages]);

  // // Get current month data
  // const currentMonth = processedData.summary[0] || {
  //   month: '',
  //   totalReferrals: 0,
  //   referrers: [],
  //   stages: [],
  //   conversionRate: '0%'
  // };



  // // Calculate total offers across all filtered months
  // const totalOffers = useMemo(() => {
  //   return processedData.summary.reduce((sum, month) => {
  //     // Sum up candidates in offer stages
  //     return sum + month.stages
  //       .filter(stage => offerStages.includes(stage.stage))
  //       .reduce((stageSum, stage) => stageSum + stage.count, 0);
  //   }, 0);
  // }, [processedData, offerStages]);

  // // Calculate conversion rate
  // const conversionRate = useMemo(() => {
  //   return totalReferrals > 0 ? `${Math.round((totalOffers / totalReferrals) * 100)}%` : '0%';
  // }, [totalReferrals, totalOffers]);

  // // Calculate total rejections across all filtered months
  // const totalRejections = useMemo(() => {
  //   return processedData.summary.reduce((sum, month) => {
  //     // Find the reject stage if it exists
  //     const rejectStage = month.stages.find(stage => stage.stage === "Reject");
  //     return sum + (rejectStage?.count || 0);
  //   }, 0);
  // }, [processedData]);

  // // Prepare data for monthly trend chart
  // const monthlyTrendData = processedData.summary
  //   .slice()
  //   .reverse()
  //   .map(month => ({
  //     month: month.month,
  //     referrals: month.totalReferrals,
  //     conversionRate: parseFloat(month.conversionRate.replace('%', ''))
  //   }));

  // // Process pipeline data
  // const pipelineData = useMemo(() => {
  //   const stageMap = new Map<string, {
  //     stage: string;
  //     active: number;
  //     rejected: number;
  //     activeCandidates: string[];
  //     rejectedCandidates: string[];
  //   }>();

  //   // Initialize stages
  //   Object.keys(stageMapping).forEach(stage => {
  //     stageMap.set(stage, {
  //       stage,
  //       active: 0,
  //       rejected: 0,
  //       activeCandidates: [],
  //       rejectedCandidates: []
  //     });
  //   });

  //   // Process each candidate
  //   Object.values(filteredReferralData).forEach(data => {
  //     const candidate = candidateData[data.resumeId];

  //     if (data.stage === "Reject") {
  //       // Handle rejected candidates
  //       const previousStage = candidate.ResumeStage.previousStatus?.toString();
  //       const stageName = previousStage ? (stageMapping[previousStage] || "Pool") : "Pool";

  //       if (stageMap.has(stageName)) {
  //         const stageData = stageMap.get(stageName)!;
  //         stageData.rejected++;
  //         stageData.rejectedCandidates.push(data.resumeId);
  //       }
  //     } else {
  //       // Handle active candidates
  //       if (stageMap.has(data.stage)) {
  //         const stageData = stageMap.get(data.stage)!;
  //         stageData.active++;
  //         stageData.activeCandidates.push(data.resumeId);
  //       }
  //     }
  //   });

  //   return Array.from(stageMap.values());
  // }, [filteredReferralData, candidateData, stageMapping]);

  // // If no data is available after filtering
  // if (processedData.summary.length === 0) {
  //   return (
  //     <div className="flex items-center justify-center h-64">
  //       <p className="text-gray-500">No referral data available for the selected filters.</p>
  //     </div>
  //   );
  // }

  // // Determine what to display for the job selection
  // const jobSelectionDisplay = isAllJobsSelected ? "All Jobs" :
  //   selectedJobs.length === 1 ? candidateData[Object.keys(candidateData).find(id =>
  //     candidateData[id].Parent.ParentId === selectedJobs[0]
  //   ) || '']?.Parent?.Name || "Selected Job" :
  //     `${selectedJobs.length} Jobs Selected`;
  useEffect(() => {
    if (referralData) {
      calculateFilteredData();
    }

  }, [selectedJobs, selectedMonth])

  const calculateFilteredData = () => {
    const values = {
      totalApplicants: 0,
      activePipeline: 0,
      totalOffers: 0,
      totalRejected: 0,
      conversionRate: 0,
      pipelineStages: {},
      channelAttr: {},
      pipelineChartData: [],
      topReferrers: {},
      monthlyTrendData: []
    }

    Object.keys(referralData).map((item) => {
      const data = referralData[item];
      const [itemMonth, itemJobId] = item.split('_');

      const monthMatches = selectedMonth === "All" || selectedMonth === itemMonth;
      const jobMatches = selectedJobs.length === 0 || selectedJobs.includes(itemJobId);

      if ((monthMatches && jobMatches)) {
        // Update total applicants
        values.totalApplicants += 1;

        const currentStage = stageMapping[data.ResumeStage.Value];
        const previousStage = stageMapping[data.ResumeStage.previousStatus];

        // Update metrics based on stage
        if (data.ResumeStage.Value === 1) {
          values.totalRejected++;
        } else if (['Offer', 'Nurturing Campaign', 'Hired', "Nuturing Campaign"].includes(currentStage)) {
          values.totalOffers++;
        } else {
          values.activePipeline++;
        }

        // Update pipeline stages
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

        // Update top referrers
        if (!values.topReferrers[data.Source.SourceDrillDown2]) {
          values.topReferrers[data.Source.SourceDrillDown2] = {
            name: data.Source.SourceDrillDown2,
            count: 0,
            candidates: []
          }
        }
        values.topReferrers[data.Source.SourceDrillDown2].count++;
        values.topReferrers[data.Source.SourceDrillDown2].candidates.push(data.ResumeId);

        // Update monthly trend data
        if (!values.monthlyTrendData[itemMonth]) {
          values.monthlyTrendData[itemMonth] = {
            month: itemMonth,
            referrals: 0,
            conversionRate: 0
          }
        }
        values.monthlyTrendData[itemMonth].referrals++;
      }
    });

    // Calculate conversion rate
    values.conversionRate = values.totalApplicants > 0 
      ? Math.round((values.totalOffers / values.totalApplicants) * 100)
      : 0;

    // Process pipeline stages into chart data
    stageOrderMapping.map((item) => {
      const data = values.pipelineStages[item];
      if(data) {
        values.pipelineChartData.push(data);
      }
    });

    // Sort and limit top referrers
    values.topReferrers = Object.values(values.topReferrers)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .reduce((acc, referrer) => {
        acc[referrer.name] = referrer;
        return acc;
      }, {});

    // Sort monthly trend data chronologically
    values.monthlyTrendData = Object.values(values.monthlyTrendData)
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());

    // Calculate conversion rates for each month
    values.monthlyTrendData.forEach(month => {
      const monthData = Object.entries(referralData)
        .filter(([key]) => key.startsWith(month.month));
      
      const monthOffers = monthData.filter(([_, data]) => {
        const stage = stageMapping[data.ResumeStage.Value];
        return ['Offer', 'Nurturing Campaign', 'Hired', "Nuturing Campaign"].includes(stage);
      }).length;

      month.conversionRate = monthData.length > 0 
        ? Math.round((monthOffers / monthData.length) * 100)
        : 0;
    });

    setFilteredData(values);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Referrals */}
        <Card className="p-6 bg-white shadow-sm rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Referrals</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{filteredData?.totalApplicants}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-full">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div className="mt-4 text-sm text-blue-600 flex items-center" onClick={() => {
              const totalCandidates = Object.entries(referralData)
                .filter(([key, data]) => {
                  const [itemMonth, itemJobId] = key.split('_');
                  const monthMatches = selectedMonth === "All" || selectedMonth === itemMonth;
                  const jobMatches = selectedJobs.length === 0 || selectedJobs.includes(itemJobId);
                  return monthMatches && jobMatches;
                })
                .map(([_, data]) => data.ResumeId);

              onCandidateClick(totalCandidates, 'Total Referrals');
            }}>
            <span>View all referrals</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </Card>

        {/* Active Pipeline Card */}
        <Card className="p-6 bg-white shadow-sm rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Active Pipeline</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{filteredData?.activePipeline}</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-full">
              <Briefcase className="h-5 w-5 text-green-500" />
            </div>
          </div>
          <div className="mt-4 text-sm text-green-600 flex items-center" onClick={() => {
              const totalCandidates = Object.entries(referralData)
                .filter(([key, data]) => {
                  const [itemMonth, itemJobId] = key.split('_');
                  const monthMatches = selectedMonth === "All" || selectedMonth === itemMonth;
                  const jobMatches = selectedJobs.length === 0 || selectedJobs.includes(itemJobId);
                  return monthMatches && jobMatches && data.ResumeStage.Value !== 1 && !['Offer', 'Nurturing Campaign', 'Hired', "Nuturing Campaign"].includes(stageMapping[data.ResumeStage.Value]);
                })
                .map(([_, data]) => data.ResumeId);

              console.log(totalCandidates);
              onCandidateClick(totalCandidates, 'Active Pipeline');
            }}>
            <span>Active Pipeline</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </Card>

        {/* Total Offers */}
        <Card className="p-6 bg-white shadow-sm rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Offers</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{filteredData?.totalOffers}</h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-full">
              <Award className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div
            className="mt-4 text-sm text-amber-600 cursor-pointer flex items-center"
            onClick={() => {
              const offerCandidates = Object.entries(referralData)
                .filter(([key, data]) => {
                  const [itemMonth, itemJobId] = key.split('_');
                  const monthMatches = selectedMonth === "All" || selectedMonth === itemMonth;
                  const jobMatches = selectedJobs.length === 0 || selectedJobs.includes(itemJobId);
                  const stage = stageMapping[data.ResumeStage.Value];
                  return monthMatches && jobMatches && ['Offer', 'Nurturing Campaign', 'Hired', "Nuturing Campaign"].includes(stage);
                })
                .map(([_, data]) => data.ResumeId);
              onCandidateClick(offerCandidates, 'Referrals with Offers');
            }}
          >
            <span>View offers</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </Card>

        {/* Conversion Rate */}
        <Card className="p-6 bg-white shadow-sm rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Conversion Rate</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{filteredData?.conversionRate}%</h3>
            </div>
            <div className="p-2 bg-purple-50 rounded-full">
              <BarChart className="h-5 w-5 text-purple-500" />
            </div>
          </div>
          <div className="mt-4 text-sm text-purple-600 flex items-center">
            <span>Referrals to offers</span>
          </div>
        </Card>

        {/* Total Rejected */}
        <Card className="p-6 bg-white shadow-sm rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Rejected</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{filteredData?.totalRejected}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-full">
              <X className="h-5 w-5 text-red-500" />
            </div>
          </div>
          <div
            className="mt-4 text-sm text-red-600 cursor-pointer flex items-center"
            onClick={() => {
              const rejectedCandidates = Object.entries(referralData)
                .filter(([key, data]) => {
                  const [itemMonth, itemJobId] = key.split('_');
                  const monthMatches = selectedMonth === "All" || selectedMonth === itemMonth;
                  const jobMatches = selectedJobs.length === 0 || selectedJobs.includes(itemJobId);
                  return monthMatches && jobMatches && data.ResumeStage.Value === 1;
                })
                .map(([_, data]) => data.ResumeId);
              onCandidateClick(rejectedCandidates, 'Rejected Referrals');
            }}
          >
            <span>View rejected</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </Card>
        
      </div>

      {/* Recruitment Pipeline Card */}
      <Card className="p-6 bg-white shadow-sm rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recruitment Pipeline</h2>
        <div className="h-[400px]">
          {filteredData?.pipelineChartData?.length > 0 ? (
            <ResponsiveBar
              data={filteredData?.pipelineChartData}
              keys={['active', 'rejected']}
              indexBy="stage"
              margin={{ top: 50, right: 130, bottom: 80, left: 60 }}
              padding={0.3}
              groupMode="stacked"
              valueScale={{ type: 'linear' }}
              indexScale={{ type: 'band', round: true }}
              colors={({ id, data }) => id === 'active' ? '#3b82f6' : '#ef4444'} // Blue for active, Red for rejected
              borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 45, // Rotate labels for better readability
                legend: 'Stage',
                legendPosition: 'middle',
                legendOffset: 60
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
              labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
              legends={[
                {
                  dataFrom: 'keys',
                  anchor: 'top-right',
                  direction: 'column',
                  justify: false,
                  translateX: 120,
                  translateY: 0,
                  itemsSpacing: 2,
                  itemWidth: 100,
                  itemHeight: 20,
                  itemDirection: 'left-to-right',
                  itemOpacity: 0.85,
                  symbolSize: 20,
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
              role="application"
              ariaLabel="Recruitment pipeline"
              barAriaLabel={e => `${e.id}: ${e.formattedValue} in stage: ${e.indexValue}`}
              tooltip={({ id, value, color, indexValue }) => (
                <div style={{
                  background: 'white',
                  padding: '9px 12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}>
                  <div style={{ color }}>
                    <strong>{indexValue}</strong> - {id}
                  </div>
                  <div>Count: {value}</div>
                </div>
              )}
              onClick={(data) => {
                const stage = data.indexValue;
                const isActive = data.id === 'active';
                
                const candidates = Object.entries(referralData)
                  .filter(([key, candidateData]) => {
                    const [itemMonth, itemJobId] = key.split('_');
                    const monthMatches = selectedMonth === "All" || selectedMonth === itemMonth;
                    const jobMatches = selectedJobs.length === 0 || selectedJobs.includes(itemJobId);
                    
                    if (!monthMatches || !jobMatches) return false;

                    if (isActive) {
                      return stageMapping[candidateData.ResumeStage.Value] === stage;
                    } else {
                      return candidateData.ResumeStage.Value === 1 && 
                             stageMapping[candidateData.ResumeStage.previousStatus] === stage;
                    }
                  })
                  .map(([_, data]) => data.ResumeId);

                const title = `${isActive ? 'Active' : 'Rejected'} Referrals in ${stage} Stage`;
                onCandidateClick(candidates, title);
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No pipeline data available</p>
            </div>
          )}
        </div>
      </Card>

      {/* Top Referrers and Monthly Trend in the same row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <Card className="p-6 bg-white shadow-sm rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Referrers</h2>
          <div className="space-y-3">
            {Object.values(filteredData?.topReferrers || {}).length > 0 ? (
              Object.values(filteredData?.topReferrers || {}).map((referrer, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => onCandidateClick(referrer.candidates, `Referrals by ${referrer.name}`)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-3">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-800">{referrer.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">{referrer.count} referrals</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-gray-500">No referrer data available</p>
              </div>
            )}
          </div>
        </Card>

        {/* Monthly Trend */}
        <Card className="p-6 bg-white shadow-sm rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Referral Trend</h2>
          <div className="h-[300px]">
            {filteredData?.monthlyTrendData?.length > 0 ? (
              <ResponsiveBar
                data={filteredData?.monthlyTrendData}
                keys={['referrals']}
                indexBy="month"
                margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={['#3b82f6']}
                borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                axisTop={null}
                axisRight={null}
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
                  legend: 'Referrals',
                  legendPosition: 'middle',
                  legendOffset: -40
                }}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                legends={[
                  {
                    dataFrom: 'keys',
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 120,
                    translateY: 0,
                    itemsSpacing: 2,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemDirection: 'left-to-right',
                    itemOpacity: 0.85,
                    symbolSize: 20,
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
                role="application"
                ariaLabel="Monthly referral trend"
                barAriaLabel={e => `${e.id}: ${e.formattedValue} in month: ${e.indexValue}`}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No trend data available</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
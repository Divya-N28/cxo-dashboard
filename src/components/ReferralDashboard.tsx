import React, { useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';
import { stageMapping } from '@/utils/dataFetcher';
import { Users, Award, BarChart, ChevronRight, Briefcase, X } from 'lucide-react';

interface ReferralDashboardProps {
  referralData: {
    summary: {
      month: string;
      totalReferrals: number;
      referrers: {
        name: string;
        count: number;
        percentage: string;
        candidates: string[];
        candidateJobs?: { [candidateId: string]: string };
      }[];
      stages: {
        stage: string;
        count: number;
        percentage: string;
        candidates: string[];
        candidateJobs?: { [candidateId: string]: string };
      }[];
      conversionRate: string;
    }[];
    topReferrers: {
      name: string;
      count: number;
      percentage: string;
      candidates: string[];
      candidateJobs?: { [candidateId: string]: string };
    }[];
  };
  candidateData?: any; // Add this to access candidate data with job information
  selectedMonth?: string;
  selectedJobs?: string[];
  onCandidateClick: (candidateIds: string[], title?: string) => void;
}

export default function ReferralDashboard({ 
  referralData, 
  candidateData,
  selectedMonth = 'All', 
  selectedJobs = [], 
  onCandidateClick 
}: ReferralDashboardProps) {
  // Debug logging
  useEffect(() => {
    console.log("ReferralDashboard props:", { 
      selectedMonth, 
      selectedJobs,
      hasCandidateData: !!candidateData,
      hasReferralData: !!referralData
    });
  }, [referralData, candidateData, selectedMonth, selectedJobs]);

  // Define the pipeline stage order exactly as in page.tsx
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
    "Reject": 13
  };
  
  // Define offer stages for conversion rate calculation
  const offerStages = ["Offer", "Nurturing Campaign", "Hired"];
  
  // Calculate total number of unique jobs
  const totalJobCount = useMemo(() => {
    if (!candidateData) return 0;
    return new Set(Object.values(candidateData).map((c: any) => c.Parent.ParentId)).size;
  }, [candidateData]);
  
  // Check if all jobs are selected
  const isAllJobsSelected = useMemo(() => {
    return selectedJobs.length === 0 || selectedJobs.length === totalJobCount;
  }, [selectedJobs, totalJobCount]);
  
  // Filter data based on selected month and jobs
  const filteredData = useMemo(() => {
    // Start with a deep copy of the referral data
    const result = JSON.parse(JSON.stringify(referralData));
    
    // Filter by month if not 'All'
    if (selectedMonth !== 'All') {
      result.summary = result.summary.filter((month: any) => month.month === selectedMonth);
    }
    
    // Filter by jobs if any are selected and not all jobs
    if (selectedJobs.length > 0 && !isAllJobsSelected) {
      // Filter each month's referrers and stages
      result.summary = result.summary.map((month: any) => {
        // Filter referrers
        const filteredReferrers = month.referrers.map((referrer: any) => {
          return {
            ...referrer,
            candidates: referrer.candidates.filter((candidateId: string) => {
              const candidate = candidateData[candidateId];
              return candidate && selectedJobs.includes(candidate.Parent.ParentId);
            })
          };
        }).filter((referrer: any) => referrer.candidates.length > 0);
        
        // Recalculate counts
        const filteredReferrerCounts = filteredReferrers.map((referrer: any) => ({
          ...referrer,
          count: referrer.candidates.length
        }));
        
        // Filter stages
        const filteredStages = month.stages.map((stage: any) => {
          return {
            ...stage,
            candidates: stage.candidates.filter((candidateId: string) => {
              const candidate = candidateData[candidateId];
              return candidate && selectedJobs.includes(candidate.Parent.ParentId);
            })
          };
        }).filter((stage: any) => stage.candidates.length > 0);
        
        // Recalculate counts and percentages
        const totalFilteredCandidates = filteredStages.reduce((sum: number, stage: any) => sum + stage.candidates.length, 0);
        const filteredStageCounts = filteredStages.map((stage: any) => ({
          ...stage,
          count: stage.candidates.length,
          percentage: totalFilteredCandidates > 0 ? `${Math.round((stage.candidates.length / totalFilteredCandidates) * 100)}%` : '0%'
        }));
        
        // Calculate conversion rate for filtered data - include all offer stages
        const totalOfferCount = filteredStageCounts
          .filter((s: any) => offerStages.includes(s.stage))
          .reduce((sum: number, stage: any) => sum + stage.count, 0);
        
        const totalCount = filteredReferrerCounts.reduce((sum: number, referrer: any) => sum + referrer.count, 0);
        
        const filteredConversionRate = totalCount > 0 ? `${Math.round((totalOfferCount / totalCount) * 100)}%` : '0%';
        
        return {
          ...month,
          referrers: filteredReferrerCounts,
          stages: filteredStageCounts,
          totalReferrals: totalCount,
          conversionRate: filteredConversionRate
        };
      }).filter((month: any) => month.totalReferrals > 0);
    }
    
    // Calculate top referrers across all filtered months
    const allReferrers: Record<string, any> = {};
    result.summary.forEach((month: any) => {
      month.referrers.forEach((referrer: any) => {
        if (!allReferrers[referrer.name]) {
          allReferrers[referrer.name] = {
            name: referrer.name,
            count: 0,
            candidates: []
          };
        }
        allReferrers[referrer.name].count += referrer.count;
        allReferrers[referrer.name].candidates = [
          ...allReferrers[referrer.name].candidates,
          ...referrer.candidates
        ];
      });
    });
    
    // Sort and limit top referrers
    result.topReferrers = Object.values(allReferrers)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);
    
    return result;
  }, [referralData, selectedMonth, selectedJobs, candidateData, isAllJobsSelected, offerStages]);
  
  // Get current month data
  const currentMonth = filteredData.summary[0] || { 
    month: '',
    totalReferrals: 0,
    referrers: [],
    stages: [],
    conversionRate: '0%'
  };
  
  // Calculate total referrals across all filtered months
  const totalReferrals = useMemo(() => {
    return filteredData.summary.reduce((sum, month) => sum + month.totalReferrals, 0);
  }, [filteredData]);
  
  // Calculate total offers across all filtered months
  const totalOffers = useMemo(() => {
    return filteredData.summary.reduce((sum, month) => {
      // Sum up candidates in offer stages
      return sum + month.stages
        .filter(stage => offerStages.includes(stage.stage))
        .reduce((stageSum, stage) => stageSum + stage.count, 0);
    }, 0);
  }, [filteredData, offerStages]);
  
  // Calculate conversion rate
  const conversionRate = useMemo(() => {
    return totalReferrals > 0 ? `${Math.round((totalOffers / totalReferrals) * 100)}%` : '0%';
  }, [totalReferrals, totalOffers]);
  
  // Calculate total rejections across all filtered months
  const totalRejections = useMemo(() => {
    return filteredData.summary.reduce((sum, month) => {
      // Find the reject stage if it exists
      const rejectStage = month.stages.find(stage => stage.stage === "Reject");
      return sum + (rejectStage?.count || 0);
    }, 0);
  }, [filteredData]);
  
  // Prepare data for monthly trend chart
  const monthlyTrendData = filteredData.summary
    .slice()
    .reverse()
    .map(month => ({
      month: month.month,
      referrals: month.totalReferrals,
      conversionRate: parseFloat(month.conversionRate.replace('%', ''))
    }));
  
  // Prepare data for recruitment pipeline bar chart
  const pipelineData = useMemo(() => {
    if (!currentMonth.stages || currentMonth.stages.length === 0) {
      return [];
    }
    
    // Get all stages in the correct order
    const orderedStages = Object.keys(pipelineStageOrder).sort(
      (a, b) => pipelineStageOrder[a as keyof typeof pipelineStageOrder] - pipelineStageOrder[b as keyof typeof pipelineStageOrder]
    );
    
    // Create a map to store pipeline stages
    const stageMap = new Map();
    
    // Initialize all stages with zero counts
    orderedStages.forEach(stageName => {
      stageMap.set(stageName, {
        stage: stageName,
        active: 0,
        rejected: 0,
        activeCandidates: [],
        rejectedCandidates: []
      });
    });
    
    // Find the reject stage if it exists
    const rejectStage = currentMonth.stages.find(s => s.stage === "Reject");
    
    // Process each stage to build the pipeline data
    currentMonth.stages.forEach(stage => {
      // Skip the reject stage as we'll handle it separately
      if (stage.stage === "Reject") return;
      
      // Skip stages that don't exist in our ordered stages
      if (!stageMap.has(stage.stage)) return;
      
      // Update the stage data
      const stageData = stageMap.get(stage.stage);
      stageData.active = stage.count;
      stageData.activeCandidates = stage.candidates || [];
    });
    
    // If we have a reject stage, distribute the rejections based on the logic in page.tsx
    if (rejectStage && rejectStage.count > 0 && candidateData) {
      // Get all rejected candidates
      const rejectedCandidateIds = rejectStage.candidates || [];
      
      // For each rejected candidate, find where they were rejected
      rejectedCandidateIds.forEach(candidateId => {
        const candidate = candidateData[candidateId];
        if (!candidate) return;
        
        // Get the previous stage where the candidate was rejected
        const previousStatus = candidate.ResumeStage?.previousStatus?.toString();
        const previousStageName = previousStatus ? (stageMapping[previousStatus] || "Pool") : "Pool";
        
        // Find the previous stage in our pipeline data
        if (stageMap.has(previousStageName)) {
          const previousStageData = stageMap.get(previousStageName);
          previousStageData.rejected++;
          previousStageData.rejectedCandidates.push(candidateId);
        }
      });
    } else if (rejectStage && rejectStage.count > 0) {
      // If we don't have candidateData, just add all rejections to the Pool stage
      if (stageMap.has("Pool")) {
        const poolStageData = stageMap.get("Pool");
        poolStageData.rejected = rejectStage.count;
        poolStageData.rejectedCandidates = rejectStage.candidates || [];
      }
    }
    
    // Convert the map to an array and maintain the order from pipelineStageOrder
    return orderedStages
      .filter(stageName => stageMap.has(stageName))
      .map(stageName => stageMap.get(stageName));
  }, [currentMonth.stages, candidateData]);
  
  // If no data is available after filtering
  if (filteredData.summary.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">No referral data available for the selected filters.</p>
      </div>
    );
  }
  
  // Determine what to display for the job selection
  const jobSelectionDisplay = isAllJobsSelected ? "All Jobs" : 
    selectedJobs.length === 1 ? candidateData[Object.keys(candidateData).find(id => 
      candidateData[id].Parent.ParentId === selectedJobs[0]
    ) || '']?.Parent?.Name || "Selected Job" : 
    `${selectedJobs.length} Jobs Selected`;
  
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Referrals */}
        <Card className="p-6 bg-white shadow-sm rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Referrals</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalReferrals}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-full">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <div 
            className="mt-4 text-sm text-blue-600 cursor-pointer flex items-center"
            onClick={() => {
              // Get all candidate IDs across all months
              const allCandidateIds = filteredData.summary.flatMap(month => 
                month.referrers.flatMap(referrer => referrer.candidates)
              );
              onCandidateClick(allCandidateIds, 'All Referrals');
            }}
          >
            <span>View all referrals</span>
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </Card>
        
        {/* Total Offers */}
        <Card className="p-6 bg-white shadow-sm rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Offers</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalOffers}</h3>
            </div>
            <div className="p-2 bg-amber-50 rounded-full">
              <Award className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <div 
            className="mt-4 text-sm text-amber-600 cursor-pointer flex items-center"
            onClick={() => {
              // Get offer candidate IDs
              const offerCandidateIds = filteredData.summary.flatMap(month => 
                month.stages
                  .filter(stage => offerStages.includes(stage.stage))
                  .flatMap(stage => stage.candidates)
              );
              onCandidateClick(offerCandidateIds, 'Referrals with Offers');
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
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{conversionRate}</h3>
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
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{totalRejections}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-full">
              <X className="h-5 w-5 text-red-500" />
            </div>
          </div>
          <div 
            className="mt-4 text-sm text-red-600 cursor-pointer flex items-center"
            onClick={() => {
              // Get rejected candidate IDs
              const rejectedCandidateIds = filteredData.summary.flatMap(month => {
                const rejectStage = month.stages.find(stage => stage.stage === "Reject");
                return rejectStage ? rejectStage.candidates : [];
              });
              onCandidateClick(rejectedCandidateIds, 'Rejected Referrals');
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
          {pipelineData.length > 0 ? (
            <ResponsiveBar
              data={pipelineData}
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
                const candidates = data.id === 'active' 
                  ? data.data.activeCandidates 
                  : data.data.rejectedCandidates;
                
                const title = `${data.id === 'active' ? 'Active' : 'Rejected'} Referrals in ${data.indexValue} Stage`;
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
            {filteredData.topReferrers.length > 0 ? (
              filteredData.topReferrers.slice(0, 5).map((referrer, index) => (
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
            {monthlyTrendData.length > 0 ? (
              <ResponsiveBar
                data={monthlyTrendData}
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
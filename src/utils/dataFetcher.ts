import axios from 'axios';
import { EStage } from '@/types/dashboard';

interface Job {
    JobId: string;
    JobName: string;
}

interface StageMapping {
    [key: string]: string;
}

interface ApiResponse {
    TotalFilteredCount: number;
    StagesCount: {
        [key: string]: number;
    };
}

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

// Define a proper type for stage conversion rates
interface StageConversionRate {
    selectionRate: string;
    rejectionRate: string;
}

interface StageConversionRates {
    [key: string]: StageConversionRate;
}

export const stageOrderMapping = [
  "Pool",
  "HR Screening",
  "Hiring Manager Screening",
  "Panel Screening",
  "Xobin Test",
  "L1 Interview", 
  "L2 Interview",
  "Final Round",
  "HR Round",
  "Pre Offer Documentation",
  "Offer Approval",
  "Offer",
  "Nurturing Campaign",
  "Nuturing Campaign",
  "Hired"
]

export const stageMapping: StageMapping = {
    "0": "Pool",
    "14": "HR Screening",
    "28": "Hiring Manager Screening",
    "23": "Panel Screening",
    "15": "Xobin Test",
    "9": "L1 Interview",
    "10": "L2 Interview",
    "11": "Final Round",
    "16": "HR Round",
    "17": "Pre Offer Documentation",
    "18": "Offer Approval",
    "5": "Offer",
    "19": "Nurturing Campaign",
    "6": "Hired",
    "1": "Reject",
    "27": "Nuturing Campaign"
};

  const l2SelectStages = [
    EStage.Final_Round,
    EStage.HR_Round,
    EStage.Pre_Offer_Documentation,
    EStage.Offer_Approval,
    EStage.Offer,
    EStage.Nurturing_Campaign,
    EStage.Hired
  ];

  const allStages = [
    EStage.Pool,
    EStage.HR_Screening,
    EStage.Xobin_Test,
    EStage.L1_Interview,
    EStage.L2_Interview,
    EStage.Final_Round,
    EStage.HR_Round,
    EStage.Pre_Offer_Documentation,
    EStage.Offer_Approval,
    EStage.Offer,
    EStage.Nurturing_Campaign,
    EStage.Hired
  ];

  const l1ScheduleStages = [
    EStage.L1_Interview,
    EStage.L2_Interview,
    EStage.Final_Round,
    EStage.HR_Round,
    EStage.Pre_Offer_Documentation,
    EStage.Offer_Approval,
    EStage.Offer,
    EStage.Nurturing_Campaign,
    EStage.Hired
  ];

export const channelCategories = ["Naukri", "LinkedIn", "Referral", "CareerPage"]

const sourceTypes = [
    { SourceCategory: "JobBoards", SourceName: "naukri" },
    { SourceCategory: "JobBoards", SourceName: "linkedin" },
    { SourceCategory: "Referral", SourceName: "referral" },
    { SourceCategory: "RecruitmentPartners", SourceName: "" },
    { SourceCategory: "CareerPage", SourceName: "CareerPage" }
];

let API_TOKEN = "";
const API_BASE_URL = process.env.API_BASE_URL || 'https://api.turbohire.co/api';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

// Add request interceptor to add authorization token to all requests
apiClient.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${API_TOKEN}`;
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Helper function to add delay between API calls
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

const getCacheKey = (jobId: string, startDate: string, endDate: string, status: number) => {
    return `${jobId}-${startDate}-${endDate}-${status}`;
};

async function fetchStageData(jobId: string, startDate: string, endDate: string, status: number): Promise<ApiResponse | null> {
    try {
        const cacheKey = getCacheKey(jobId, startDate, endDate, status);

        // Check cache first
        const cachedData = cache.get(cacheKey);
        if (cachedData && cachedData.timestamp > Date.now() - CACHE_DURATION) {
            return cachedData.data;
        }

        const payload = {
            SortByV2: {
                Key: "CalibrationScore",
                Order: 2
            },
            Keyword: "",
            AdvanceKeyword: "",
            OwnerIds: [],
            Sources: {
                Value: null,
                FilterType: 0
            },
            ParsedData: {
                Value: null,
                FilterType: 0
            },
            StageCategory: {
                Value: null,
                FilterType: 0
            },
            Experience: null,
            SkillSet: {
                Value: null,
                FilterType: 0
            },
            Location: {
                Value: null,
                FilterType: 0
            },
            JobIds: {
                Value: [jobId],
                FilterType: "EQUALS"
            },
            BankIds: {
                Value: null,
                FilterType: 0
            },
            UploadedDate: {
                Value: null,
                FilterType: 0
            },
            UpdatedDate: {
                Value: null,
                FilterType: 0
            },
            InstituteName: {
                Value: null,
                FilterType: 0
            },
            IdealCandidate: {
                Value: null,
                FilterType: 0
            },
            Qualification: {
                Value: null,
                FilterType: 0
            },
            Quality: {
                Value: null,
                FilterType: 0
            },
            Domain: {
                Value: null,
                FilterType: 0
            },
            CompanyName: {
                Value: null,
                FilterType: 0
            },
            CompanySize: {
                Value: null,
                FilterType: 0
            },
            IndustryType: {
                Value: null,
                FilterType: 0
            },
            CandidateResume: {
                Value: null,
                FilterType: "NONE"
            },
            ResumeUpdateStatus: null,
            Tags: {
                Value: null,
                FilterType: 0
            },
            CalibrationScore: {
                Start: 0,
                End: 100
            },
            EnquiryFilter: null,
            EvaluationFilter: null,
            InterviewFilter: null,
            AssessmentFilter: null,
            EngagementCategory: null,
            OnewayInterviewFilter: null,
            CTCCategory: null,
            CandidateAvailabilityCategory: null,
            Columns: [],
            View: 1,
            ScorecardSubmitter: null,
            InterviewStatus: null,
            InterviewerEmail: null,
            InterviewType: null,
            Date: null,
            Time: null,
            OrganizerEmail: null,
            InterviewLocation: null,
            CandidateListShare: null,
            CandidateListShareDate: null,
            StageEvaluationFilter: null,
            StageChangedDate: {
                Value: {
                    StartDate: startDate,
                    EndDate: endDate
                },
                FilterType: "IS_BETWEEN"
            },
            StageChangedBy: {
                Value: null,
                FilterType: 0
            },
            StageValue: status,
            FetchOnlyActiveCandidates: status === -1
        };

        const response = await apiClient.post(
            `v3/job/${jobId}/filteredcount`,
            payload
        );

        // Cache the response
        cache.set(cacheKey, {
            data: response.data,
            timestamp: Date.now()
        });

        return response.data;
    } catch {
        // Return empty response instead of throwing
        return { TotalFilteredCount: 0, StagesCount: {} };
    }
}

async function fetchSourceData(jobId: string, startDate: string, endDate: string, sourceCategory: string, sourceName: string, status: number = -1): Promise<number> {
    try {
        const cacheKey = `source-${jobId}-${startDate}-${endDate}-${sourceCategory}-${sourceName}-${status}`;

        // Check cache first
        const cachedData = cache.get(cacheKey);
        if (cachedData && cachedData.timestamp > Date.now() - CACHE_DURATION) {
            return cachedData.data;
        }

        const payload = {
            Columns: [],
            Index: 0,
            CurrentParentIds: [],
            RetargetIds: null,
            OwnerIds: [],
            Offices: {
                FilterType: "NONE",
                Value: null
            },
            Keyword: null,
            ParsedData: null,
            AdvanceKeyword: null,
            BankIds: null,
            JobIds: null,
            Tags: null,
            Location: null,
            StageCategory: null,
            SkillSet: null,
            IdealCandidate: null,
            CandidateResume: null,
            ResumeUpdateStatus: null,
            Experience: null,
            Score: null,
            EvaluationScore: null,
            UploadedDate: null,
            LastActivityDate: null,
            UpdatedDate: null,
            InstituteName: null,
            Qualification: null,
            CompanyName: null,
            SourceV2: {
                Value: {
                    SourceCategory: [sourceCategory],
                    SourceName:  sourceName ? [sourceName] : null
                },
                FilterType: "EQUALS"
            },
            CustomFields: null,
            Quality: null,
            Domain: null,
            IndustryType: null,
            EnquiryFilter: null,
            AssessmentFilter: null,
            EvaluationFilter: null,
            StageEvaluationFilter: null,
            InterviewFilter: null,
            CalibrationScore: null,
            StageNames: null,
            UploadedDateV2: null,
            ResumeLink: null,
            UploadedDateNew: null,
            SortByV2: {
                Order: "DSC",
                Key: "CalibrationScore"
            },
            SortBy: "Newest",
            JobRole: null,
            EngagementCategory: null,
            CTCCategory: null,
            CandidateAvailabilityCategory: null,
            CandidateName: {
                FilterType: "NONE",
                Value: null
            },
            ExportEmail: "",
            ScorecardSubmitter: null,
            InterviewerEmail: null,
            InterviewType: null,
            Time: {
                FilterType: "NONE",
                Value: null
            },
            OrganizerEmail: null,
            InterviewLocation: null,
            InterviewStatus: null,
            OneWayInterviewFilter: null,
            StageChangedBy: null,
            CandidateListShareDate: null,
            CandidateListShare: null,
            Date: {
                Value: {
                    StartDate: startDate,
                    EndDate: endDate
                },
                FilterType: "IS_BETWEEN"
            },
            StageValue: status,
            FetchOnlyActiveCandidates: status === -1
        };
        const response = await apiClient.post(
            `v3/job/${jobId}/filteredcount`,
            payload
        );

        const count = response.data.TotalFilteredCount;

        // Cache the response
        cache.set(cacheKey, {
            data: count,
            timestamp: Date.now()
        });

        return count;
    } catch {
        // Return 0 instead of throwing
        return 0;
    }
}

function aggregateStageData(activeData: ApiResponse | null, rejectedData: ApiResponse | null): {
    active: { [key: string]: number };
    rejected: { [key: string]: number };
} {
    const result = {
        active: {} as { [key: string]: number },
        rejected: {} as { [key: string]: number }
    };

    if (activeData?.StagesCount) {
        Object.entries(activeData.StagesCount).forEach(([stage, count]) => {
            const stageName = stageMapping[stage] || stage;
            result.active[stageName] = (result.active[stageName] || 0) + count;
        });
    }

    if (rejectedData?.StagesCount) {
        Object.entries(rejectedData.StagesCount).forEach(([stage, count]) => {
            const stageName = stageMapping[stage] || stage;
            result.rejected[stageName] = (result.rejected[stageName] || 0) + count;
        });
    }

    return result;
}

// Add ESLint disable comments for unused variables
/* eslint-disable @typescript-eslint/no-unused-vars */
const handleApiError = (error: unknown, context: string) => {
    if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
            console.error('Authentication failed. Please check your API token.');
        } else if (error.response?.status === 403) {
            console.error('Access forbidden. Please check your permissions.');
        }
        console.error(`${context}:`, {
            status: error.response?.status,
            message: error.message
        });
    }
};

// Helper function to calculate percentage and handle NaN
const calculatePercentage = (numerator: number, denominator: number): string => {
    const percentage = Math.round((numerator / (denominator || 1)) * 100);
    return `${percentage || 0}%`;
};

// Modify the API client to handle token refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        // If the error is 401 and we haven't tried to refresh the token yet
        if (error.response?.status === 401 && !error.config._retry) {
            console.log("401 detected, attempting token refresh");
            
            // Mark this request as retried to prevent infinite loops
            error.config._retry = true;
            
            try {
                // Get refresh token directly from storage
                
                
                // Make direct API call to refresh token
                const response = await axios({
                    method: 'post',
                    url: 'https://identity.turbohire.co/connect/token',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'isdesktop': 'true',
                        'Origin': 'https://app.turbohire.co',
                        'Referer': 'https://app.turbohire.co/',
                        "Authorization": `Bearer ${API_TOKEN}`
                    },
                    data: new URLSearchParams({
                        'client_id': 'TH.Mvc.Api',
                        'client_secret': 'a4dc1f627af9400084b56d8b68d8d910',
                        'refresh_token': "0F13791F3EE871E428403A486155470392321E766E2E2C3F45B55C0DFCA20B5E-1",
                        'grant_type': 'refresh_token'
                    }).toString()
                });
                
                // Save the new tokens
                const newToken = response.data.access_token;
                const newRefreshToken = response.data.refresh_token;                
                API_TOKEN = newToken;
                
                // Update the original request and retry
                error.config.headers.Authorization = `Bearer ${newToken}`;
                return axios(error.config);
            } catch (refreshError) {
                console.error("Error refreshing token:", refreshError);
                return Promise.reject(error);
            }
        }
        
        return Promise.reject(error);
    }
);

// Update the testApiToken function to handle token refresh
export async function testApiToken(token: string): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await axios.get('https://api.turbohire.co/api/jobs', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      return { success: true };
    }
    
    return { success: false, message: 'Invalid API token' };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Try to refresh the token
      const newToken = await refreshToken(token);
      
      if (newToken) {
        // Test the new token
        return testApiToken(newToken);
      }
      
      return { success: false, message: 'Token expired and refresh failed' };
    }
    
    return { success: false, message: 'Error testing API token' };
  }
}

// Add a job-specific cache
const jobDataCache = new Map<string, {
  data: { [month: string]: MonthlyData };
  timestamp: number;
}>();

// Add a function to get job data from cache
export function getJobDataFromCache(jobId: string): { [month: string]: MonthlyData } | null {
  const cachedData = jobDataCache.get(jobId);
  if (cachedData && cachedData.timestamp > Date.now() - CACHE_DURATION) {
    return cachedData.data;
  }
  return null;
}

// Modify the generateMonthlyData function to cache per job
export async function generateMonthlyData(jobs: Job[], token: string): Promise<{ data: MonthlyData[], error?: { status: number, message: string } }> {
    try {
        if (!token) {
            return { 
                data: [],
                error: { status: 401, message: 'API token is required' }
            };
        }

        if (!jobs || jobs.length === 0) {
            return { data: [] };
        }
        API_TOKEN = token;
        // Test token validity first
        const isTokenValid = await testApiToken(token);
        if (!isTokenValid.success) {
            return { 
                data: [],
                error: { status: 401, message: 'Invalid API token' }
            };
        }

        // Check if we already have data for all jobs in cache
        const cachedJobsData: { [jobId: string]: { [month: string]: MonthlyData } } = {};
        let allJobsCached = true;
        
        for (const job of jobs) {
            const jobData = getJobDataFromCache(job.JobId);
            if (jobData) {
                cachedJobsData[job.JobId] = jobData;
            } else {
                allJobsCached = false;
                break;
            }
        }
        
        // If all jobs are cached, return combined data from cache
        if (allJobsCached && Object.keys(cachedJobsData).length > 0) {
            // We'll let the page.tsx combine the data
            return { data: [] };
        }

        const monthlyData: MonthlyData[] = [];
        const batchSize = 3; // Process 3 jobs at a time

        const currentDate = new Date();
        const months = Array.from(
            { length: currentDate.getMonth() + 1 },
            (_, index) => {
                const date = new Date(currentDate);
                date.setMonth(date.getMonth() - index);

                return {
                    month: date.toLocaleString('default', { month: 'short' }),
                    startDate: new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0)).toISOString(),
                    endDate: new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)).toISOString()
                };
            }
        );

        // Process each job individually and store in cache
        for (const job of jobs) {
            // Skip if already cached
            if (cachedJobsData[job.JobId]) continue;
            
            const jobMonthlyData: { [month: string]: MonthlyData } = {};
            
            for (const monthData of months) {
                let stageTotals = {
                    active: {} as { [key: string]: number },
                    rejected: {} as { [key: string]: number }
                };

                try {
                    // Fetch data for this job and month
                    const [activeData, rejectedData] = await Promise.all([
                        fetchStageData(job.JobId, monthData.startDate, monthData.endDate, -1),
                        fetchStageData(job.JobId, monthData.startDate, monthData.endDate, 1)
                    ]);

                    stageTotals = aggregateStageData(activeData, rejectedData);
                    
                    // Fetch source data for this job
                    const channelData: ChannelData[] = [];
                    for (const source of sourceTypes) {
                        // Fetch active candidates
                        const activeSourceCount = await fetchSourceData(
                            job.JobId,
                            monthData.startDate,
                            monthData.endDate,
                            source.SourceCategory,
                            source.SourceName,
                            -1
                        );

                        // Fetch rejected candidates
                        const rejectedSourceCount = await fetchSourceData(
                            job.JobId,
                            monthData.startDate,
                            monthData.endDate,
                            source.SourceCategory,
                            source.SourceName,
                            1
                        );

                        channelData.push({
                            name: source.SourceName.charAt(0).toUpperCase() + source.SourceName.slice(1),
                            value: activeSourceCount + rejectedSourceCount,
                            active: activeSourceCount,
                            rejected: rejectedSourceCount,
                            percentage: "0%" // Will be calculated in UI
                        });
                    }

                    // Create pipeline stages array
                    const pipelineStages: PipelineStage[] = Object.entries(stageMapping).map(([_, stageName]) => ({
                        stage: stageName,
                        active: stageTotals.active[stageName] || 0,
                        rejected: stageTotals.rejected[stageName] || 0
                    }));

                    // Calculate metrics for this job
                    const totalApplicants = allStages.reduce((sum, stage) => 
                        sum + (stageTotals.active[stage] || 0) + (stageTotals.rejected[stage] || 0), 0);
                    
                    const l1toHireActive = l1ScheduleStages.reduce((sum, stage) => 
                        sum + (stageTotals.active[stage] || 0), 0);
                    const l1toHireRejected = l1ScheduleStages.reduce((sum, stage) => 
                        sum + (stageTotals.rejected[stage] || 0), 0);
                    
                    const l1Reject = stageTotals.rejected[EStage.L1_Interview] || 0;
                    const l2Rejected = stageTotals.rejected[EStage.L2_Interview] || 0;

                    const processed = (stageTotals.active[EStage.Pool] || 0) + 
                        (stageTotals.active[EStage.HR_Screening] || 0) + 
                        (stageTotals.rejected[EStage.Pool] || 0) + 
                        (stageTotals.rejected[EStage.HR_Screening] || 0);
                    
                    const scheduled = l1toHireActive + l1toHireRejected;
                    const attended = scheduled - (stageTotals.active[EStage.L1_Interview] || 0);
                    const noShow = scheduled - attended;

                    const l2Selected = l2SelectStages.reduce((sum, stage) => 
                        sum + (stageTotals.active[stage] || 0), 0);
                    
                    const l1Select = l2Selected + 
                        (stageTotals.active[EStage.L2_Interview] || 0) + 
                        (stageTotals.rejected[EStage.L2_Interview] || 0);
                    
                    const l2Scheduled = l1Select;

                    const totalRejected = allStages.reduce((sum, stage) => 
                        sum + (stageTotals.rejected[stage] || 0), 0);
                    
                    const offer = (stageTotals.active[EStage.Offer] || 0);
                    const totalOffers = (stageTotals.active[EStage.Offer] || 0) + 
                        (stageTotals.active[EStage.Nurturing_Campaign] || 0) + 
                        (stageTotals.active[EStage.Hired] || 0);
                    
                    const activePipeline = Math.abs(allStages.reduce((sum, stage) => 
                        sum + (stageTotals.active[stage] || 0), 0) - totalOffers);

                    // Calculate rates
                    const processedToScheduled = calculatePercentage(scheduled, totalApplicants);
                    const l1NoShowRate = calculatePercentage(noShow, scheduled);
                    const l1RejectionRate = calculatePercentage(l1Reject, scheduled);
                    const l2RejectionRate = calculatePercentage(l2Rejected, l2Scheduled);
                    const offerPercentage = calculatePercentage(offer, scheduled);
                    
                    // Calculate stage-wise conversion rates
                    const stageConversionRates: StageConversionRates = {};
                    
                    allStages.forEach((stage) => {
                        const selection = allStages.slice(allStages.indexOf(stage) + 1).reduce((sum, nextStage) => 
                            sum + (stageTotals.active[nextStage] || 0) + (stageTotals.rejected[nextStage] || 0), 0);
                        
                        const rejection = stageTotals.rejected[stage] || 0;
                        const total = selection + rejection;
                        
                        stageConversionRates[stage] = {
                            selectionRate: calculatePercentage(selection, total),
                            rejectionRate: calculatePercentage(rejection, total),
                        };
                    });

                    // Store the monthly data for this job
                    jobMonthlyData[monthData.month] = {
                        month: monthData.month,
                        totalApplicants,
                        processed,
                        scheduled,
                        attended,
                        l1Select,
                        l1Reject,
                        noShow,
                        l2Scheduled,
                        l2Selected,
                        l2Rejected,
                        offer,
                        processedToScheduled,
                        l1NoShowRate,
                        l1RejectionRate,
                        l2RejectionRate,
                        offerPercentage,
                        channelData,
                        pipelineStages,
                        totalRejected,
                        activePipeline,
                        totalOffers,
                        stageConversionRates
                    };

                } catch (error) {
                    console.error(`Error fetching data for job ${job.JobId} and month ${monthData.month}:`, error);
                }
                
                // Add delay between months to prevent rate limiting
                await delay(500);
            }
            
            // Cache the job data
            jobDataCache.set(job.JobId, {
                data: jobMonthlyData,
                timestamp: Date.now()
            });
            
            // Add delay between jobs to prevent rate limiting
            await delay(1000);
        }
        
        // Return empty data array - the page will get data from cache
        return { data: [] };
    } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
            const status = error.response?.status || 500;
            const message = error.message || 'Unknown error occurred';
            
            if (status === 401) {
                sessionStorage.removeItem('apiToken');
            }
            
            return { 
                data: [],
                error: { status, message }
            };
        }
        
        return { 
            data: [],
            error: { status: 500, message: 'Unknown error occurred' }
        };
    }
}

// Add a function to combine data from multiple jobs
export function combineJobsData(jobIds: string[]): MonthlyData[] {
    const monthlyData: MonthlyData[] = [];
    const monthsMap: { [month: string]: MonthlyData[] } = {};
    
    // Collect data for each job by month
    for (const jobId of jobIds) {
        const jobData = getJobDataFromCache(jobId);
        if (!jobData) continue;
        
        Object.entries(jobData).forEach(([month, data]) => {
            if (!monthsMap[month]) {
                monthsMap[month] = [];
            }
            monthsMap[month].push(data);
        });
    }
    
    // Combine data for each month
    Object.entries(monthsMap).forEach(([month, jobsData]) => {
        if (jobsData.length === 0) return;
        
        // Use the first job's data as a base
        const baseData = { ...jobsData[0] };
        
        if (jobsData.length === 1) {
            monthlyData.push(baseData);
            return;
        }
        
        // Combine data from all jobs
        const combinedData: MonthlyData = {
            ...baseData,
            totalApplicants: jobsData.reduce((sum, job) => sum + job.totalApplicants, 0),
            processed: jobsData.reduce((sum, job) => sum + job.processed, 0),
            scheduled: jobsData.reduce((sum, job) => sum + job.scheduled, 0),
            attended: jobsData.reduce((sum, job) => sum + job.attended, 0),
            l1Select: jobsData.reduce((sum, job) => sum + job.l1Select, 0),
            l1Reject: jobsData.reduce((sum, job) => sum + job.l1Reject, 0),
            noShow: jobsData.reduce((sum, job) => sum + job.noShow, 0),
            l2Scheduled: jobsData.reduce((sum, job) => sum + job.l2Scheduled, 0),
            l2Selected: jobsData.reduce((sum, job) => sum + job.l2Selected, 0),
            l2Rejected: jobsData.reduce((sum, job) => sum + job.l2Rejected, 0),
            offer: jobsData.reduce((sum, job) => sum + job.offer, 0),
            totalRejected: jobsData.reduce((sum, job) => sum + job.totalRejected, 0),
            totalOffers: jobsData.reduce((sum, job) => sum + job.totalOffers, 0),
            activePipeline: jobsData.reduce((sum, job) => sum + job.activePipeline, 0),
            
            // Combine pipeline stages
            pipelineStages: baseData.pipelineStages.map((stage, index) => ({
                ...stage,
                active: jobsData.reduce((sum, job) => sum + (job.pipelineStages[index]?.active || 0), 0),
                rejected: jobsData.reduce((sum, job) => sum + (job.pipelineStages[index]?.rejected || 0), 0),
            })),
            
            // Combine channel data
            channelData: baseData.channelData.map((channel, index) => {
                const totalValue = jobsData.reduce((sum, job) => sum + (job.channelData[index]?.value || 0), 0);
                const totalActive = jobsData.reduce((sum, job) => sum + (job.channelData[index]?.active || 0), 0);
                const totalRejected = jobsData.reduce((sum, job) => sum + (job.channelData[index]?.rejected || 0), 0);
                const totalApplicants = jobsData.reduce((sum, job) => sum + job.totalApplicants, 0);
                
                return {
                    ...channel,
                    value: totalValue,
                    active: totalActive,
                    rejected: totalRejected,
                    percentage: calculatePercentage(totalValue, totalApplicants)
                };
            }),
            
            // Recalculate rates
            processedToScheduled: calculatePercentage(
                jobsData.reduce((sum, job) => sum + job.scheduled, 0),
                jobsData.reduce((sum, job) => sum + job.totalApplicants, 0)
            ),
            l1NoShowRate: calculatePercentage(
                jobsData.reduce((sum, job) => sum + job.noShow, 0),
                jobsData.reduce((sum, job) => sum + job.scheduled, 0)
            ),
            l1RejectionRate: calculatePercentage(
                jobsData.reduce((sum, job) => sum + job.l1Reject, 0),
                jobsData.reduce((sum, job) => sum + job.scheduled, 0)
            ),
            l2RejectionRate: calculatePercentage(
                jobsData.reduce((sum, job) => sum + job.l2Rejected, 0),
                jobsData.reduce((sum, job) => sum + job.l2Scheduled, 0)
            ),
            offerPercentage: calculatePercentage(
                jobsData.reduce((sum, job) => sum + job.offer, 0),
                jobsData.reduce((sum, job) => sum + job.scheduled, 0)
            ),
            
            // Combine stage conversion rates
            stageConversionRates: combineStageConversionRates(jobsData)
        };
        
        monthlyData.push(combinedData);
    });
    
    // Sort by month (most recent first)
    return monthlyData.sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(b.month) - months.indexOf(a.month);
    });
}

// Helper function to combine stage conversion rates
function combineStageConversionRates(jobsData: MonthlyData[]): StageConversionRates {
    const combinedRates: StageConversionRates = {};
    
    allStages.forEach(stage => {
        // Calculate combined selection rate
        const selectionRates = jobsData
            .map(job => job.stageConversionRates[stage]?.selectionRate || '0%')
            .map(rate => parseInt(rate) || 0);
        
        const avgSelection = selectionRates.reduce((sum, rate) => sum + rate, 0) / selectionRates.length;
        
        // Calculate combined rejection rate
        const rejectionRates = jobsData
            .map(job => job.stageConversionRates[stage]?.rejectionRate || '0%')
            .map(rate => parseInt(rate) || 0);
        
        const avgRejection = rejectionRates.reduce((sum, rate) => sum + rate, 0) / rejectionRates.length;
        
        combinedRates[stage] = {
            selectionRate: `${Math.round(avgSelection)}%`,
            rejectionRate: `${Math.round(avgRejection)}%`
        };
    });
    
    return combinedRates;
}

// Add new interfaces for candidate data
interface CandidateEducation {
  InstituteName: string;
  UniversityName: string;
  Degree: string;
  EndYear: number;
  Percent: string;
  Cgpa: string;
}

interface CandidateWorkExperience {
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
  Duration: number;
}

interface CandidateSource {
  SourceCategory: string;
  SourceDrillDown1: string;
  SourceDrillDown2: string;
}

interface CandidateParent {
  ParentId: string;
  Type: string;
  Name: string;
  JobCode: string;
}

interface CandidateData {
  UserData: {
    Name: string;
    EmailId: string;
    EmailIds: string[];
    PhoneNumber: string;
    PhoneNumbers: string[];
    EducationList: CandidateEducation[];
  };
  WorkData: {
    WorkDataList: CandidateWorkExperience[];
    TotalExperience: number;
    isCurrentlyWorking: boolean;
  };
  Source: CandidateSource;
  ResumeStage: {
    Name: string;
    Value: number;
    Category: string;
    previousStatus: number;
  };
  Parent: CandidateParent;
  ResumeId: string;
  ResumeUrl: string;
  UploadDateTime: string;
}

// Add interface for referral data
interface ReferralSummary {
  month: string;
  totalReferrals: number;
  referrers: {
    name: string;
    count: number;
    percentage: string;
    candidates: string[]; // ResumeIds for drill-down
  }[];
  stages: {
    stage: string;
    count: number;
    percentage: string;
    candidates: string[]; // ResumeIds for drill-down
  }[];
  conversionRate: string;
}

// Add interface for dashboard data with drill-down capabilities
interface DashboardData {
  monthlyData: MonthlyData[];
  jobData: { [jobId: string]: { name: string, code: string } };
  candidatesByStage: { 
    [month: string]: {
      [stage: string]: string[] // ResumeIds for drill-down
    } 
  };
  candidatesByChannel: {
    [month: string]: {
      [channel: string]: string[] // ResumeIds for drill-down
    }
  };
  referralData: {
    summary: ReferralSummary[];
    topReferrers: {
      name: string;
      count: number;
      percentage: string;
      candidates: string[]; // ResumeIds for drill-down
    }[];
  };
  candidateData: { [resumeId: string]: CandidateData };
}

// Function to fetch resume IDs for a date range
async function fetchResumeIds(startDate: string, endDate: string): Promise<string[]> {
  try {
    const cacheKey = `resumeIds-${startDate}-${endDate}`;
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - CACHE_DURATION) {
      return cachedData.data;
    }
    
    const payload = {
      Columns: [],
      Index: 0,
      CurrentParentIds: [],
      RetargetIds: [],
      OwnerIds: [],
      Offices: {
        FilterType: "NONE",
        Value: null
      },
      UploadedDate: {
        FilterType: "IS_BETWEEN",
        Value: {
          StartDate: "2025-01-01",
          EndDate: endDate
        }
      },
      ShowActive: true
    };
    
    // First request to get initial batch and total count
    const initialResponse = await apiClient.post(
      'resumes/ids?skip=0&top=1000&fetchUnique=true',
      payload
    );
    
    let resumeIds = initialResponse.data?.OrderedResumeIds || [];
    const totalCount = initialResponse.data?.FilteredCount || 0;
    
    // If there are more IDs to fetch
    if (resumeIds.length < totalCount) {
      const batchSize = 1000; // Increase batch size for subsequent requests
      const remainingBatches = Math.ceil((totalCount - resumeIds.length) / batchSize);
      
      for (let i = 0; i < remainingBatches; i++) {
        const skip = resumeIds.length;
        const response = await apiClient.post(
          `resumes/ids?skip=${skip}&top=${batchSize}&fetchUnique=true`,
          payload
        );

        if (response.data && Array.isArray(response.data?.OrderedResumeIds)) {
          resumeIds = [...resumeIds, ...response.data?.OrderedResumeIds || []];
        }
        
        // Add delay between batches to prevent rate limiting
        if (i < remainingBatches - 1) {
          await delay(500);
        }
      }
    }
    
    // Cache the response
    cache.set(cacheKey, {
      data: resumeIds,
      timestamp: Date.now()
    });
    console.log(resumeIds.length);
    return resumeIds;
  } catch (error) {
    console.error('Error fetching resume IDs:', error);
    return [];
  }
}

// Function to fetch candidate data for resume IDs
async function fetchCandidateData(resumeIds: string[]): Promise<{ [id: string]: CandidateData }> {
  try {
    if (resumeIds.length === 0) return {};
    
    const cacheKey = `candidates-${resumeIds.join('-')}`;
    
    // Check cache first
    const cachedData = candidateCache.get(cacheKey);
    if (cachedData && cachedData.timestamp > Date.now() - CACHE_DURATION) {
      return cachedData.data;
    }
    
    // Split into batches to avoid request size limits
    const batchSize = 50;
    let allCandidates: { [id: string]: CandidateData } = {};
    
    for (let i = 0; i < resumeIds.length; i += batchSize) {
      const batchIds = resumeIds.slice(i, i + batchSize);
      
      const response = await apiClient.post(
        'resumes/data',
        { ResumeIds: batchIds }
      );
      
      if (response.data && Array.isArray(response.data)) {
        // Convert array to object with ResumeId as key for easier lookup
        response.data.forEach((candidate: CandidateData) => {
          if (candidate.ResumeId) {
            allCandidates[candidate.ResumeId] = candidate;
          }
        });
      }
      
      // Add delay between batches
      if (i + batchSize < resumeIds.length) {
        await delay(500);
      }
    }
    
    // Cache the response
    candidateCache.set(cacheKey, {
      data: allCandidates,
      timestamp: Date.now()
    });
    
    return allCandidates;
  } catch (error) {
    console.error('Error fetching candidate data:', error);
    return {};
  }
}

// Update the refresh token function with the correct payload format
async function refreshToken(currentToken: string): Promise<string | null> {
  try {
    // Create form data with the correct parameters
    const formData = new URLSearchParams();
    formData.append('client_id', 'TH.Mvc.Api');
    formData.append('client_secret', 'a4dc1f627af9400084b56d8b68d8d910');
    formData.append('refresh_token', "0F13791F3EE871E428403A486155470392321E766E2E2C3F45B55C0DFCA20B5E-1");
    formData.append('grant_type', 'refresh_token');

    const response = await axios.post('https://identity.turbohire.co/connect/token', 
      formData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    if (response.data && response.data.access_token) {
      // Save the new token to localStorage
      localStorage.setItem('turbohire_api_token', response.data.access_token);
      return response.data.access_token;
    }
    
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

// Simplified function to fetch and display dashboard data
async function generateDashboardData(token: string) {
  try {    
    // Set up API client with token
    const apiClient = axios.create({
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Step 1: Verify token with a simple API call
    await apiClient.get('https://api.turbohire.co/api/jobs');
    
    // Step 2: Get current year's date range
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const yearStartDate = new Date(currentYear, 0, 1).toISOString();
    const yearEndDate = new Date(currentYear, 11, 31, 23, 59, 59, 999).toISOString();
    
    // Step 3: Fetch resume IDs for the current year
    const resumeIdsPayload = {
      Columns: [],
      Index: 0,
      CurrentParentIds: [],
      RetargetIds: [],
      OwnerIds: [],
      Offices: { FilterType: "NONE", Value: null },
      UploadedDate: {
        Value: {
          StartDate: yearStartDate,
          EndDate: yearEndDate
        },
        FilterType: "IS_BETWEEN"
      },
    };
    
   const resumeIds = await fetchResumeIds(yearStartDate, yearEndDate);
    
    if (!resumeIds) {
      return { 
        data: {
          monthlyData: [],
          jobData: {},
          candidatesByStage: {},
          candidatesByChannel: {},
          referralData: { summary: [], topReferrers: [] },
          candidateData: {}
        }
      };
    }
    
    console.log(`Found ${resumeIds.length} resumes`);
    
    // Step 4: Fetch resume data in batches
    const batchSize = 300;
    const allResumes = [];
    let allStatusChanges = {};

    for (let i = 0; i < resumeIds.length; i += batchSize) {
      const batchIds = resumeIds.slice(i, Math.min(i + batchSize, resumeIds.length));
      
      try {
        const resumeDataResponse = await apiClient.post(
          'https://api.turbohire.co/api/resumes/resumedata',
          batchIds
        );
        
        if (resumeDataResponse.data) {
          allResumes.push(...resumeDataResponse.data);
        }
      } catch (error) {
        console.error(`Error fetching batch ${Math.floor(i/batchSize) + 1}:`, error);
      }
    }

    for (let i = 0; i < resumeIds.length; i += batchSize) {
      const batchIds = resumeIds.slice(i, Math.min(i + batchSize, resumeIds.length));
      
      try {
        const resumeDataResponse = await apiClient.post(
          'https://api.turbohire.co/api/resumes/statuschangedata',
          batchIds
        );
        
        if (resumeDataResponse.data) {
          allStatusChanges = {...allStatusChanges, ...resumeDataResponse.data};
        }
      } catch (error) {
        console.error(`Error fetching batch ${Math.floor(i/batchSize) + 1}:`, error);
      }
    }
        
    // Step 5: Process data for dashboard
    // const candidateData = {};
    // const jobData = {};
    // const monthlyDataMap = {};
    // const candidatesByStage = {};
    // const candidatesByChannel = {};    
    // // Process each resume
    // allResumes.forEach(resume => {
    //   // Store job info
    //   if (resume.Parent && resume.Parent.ParentId) {
    //     jobData[resume.Parent.ParentId] = {
    //       name: resume.Parent.Name,
    //       code: resume.Parent.JobCode || ''
    //     };
    //   }
      
    //   // Store candidate data
    //   candidateData[resume.ResumeId] = {
    //     UserData: {
    //       Name: resume.UserData.Name || '',
    //       EmailId: resume.UserData.EmailId || '',
    //       PhoneNumber: resume.UserData.PhoneNumber || '',
    //       EducationList: resume.UserData.EducationList || []
    //     },
    //     WorkData: {
    //       WorkDataList: resume?.WorkData?.WorkDataList || [],
    //       TotalExperience: resume?.WorkData?.TotalExperience || 0,
    //       isCurrentlyWorking: resume?.WorkData?.IsCurrentlyWorking || false
    //     },
    //     Source: resume.Source || {},
    //     ResumeStage: {
    //       Name: stageMapping[resume.Status] || 'Unknown',
    //       Value: resume.Status,
    //       previousStatus: resume.PreviousStatus
    //     },
    //     Parent: {
    //       ParentId: resume.Parent.ParentId,
    //       Type: "Job",
    //       Name: resume.Parent.ParentName || '',
    //       JobCode: resume.Parent.JobCode || ''
    //     },
    //     ResumeId: resume.ResumeId,
    //     ResumeUrl: resume.ResumeUrl || '',
    //     UploadDateTime: resume.UploadDateTime || ''
    //   };
      
    //   // Get month from upload date
    //   const uploadDate = new Date(resume.UploadDateTime);
    //   const month = uploadDate.toLocaleString('en-US', { month: 'short' });
      
    //   // Initialize monthly data if not exists
    //   if (!monthlyDataMap[month]) {
    //     monthlyDataMap[month] = {
    //       month,
    //       totalApplicants: 0,
    //       processed: 0,
    //       scheduled: 0,
    //       attended: 0,
    //       l1Select: 0,
    //       l1Reject: 0,
    //       noShow: 0,
    //       l2Scheduled: 0,
    //       l2Selected: 0,
    //       l2Rejected: 0,
    //       offer: 0,
    //       totalRejected: 0,
    //       totalOffers: 0,
    //       activePipeline: 0,
    //       channelData: [],
    //       pipelineStages: []
    //     };
    //   }
      
    //   // Initialize stage tracking
    //   if (!candidatesByStage[month]) {
    //     candidatesByStage[month] = {};
    //   }
      
    //   // Initialize channel tracking
    //   if (!candidatesByChannel[month]) {
    //     candidatesByChannel[month] = {};
    //   }
      
    //   // Update monthly counts
    //   monthlyDataMap[month].totalApplicants++;
      
    //   // Track by stage
    //   const stageName = stageMapping[resume.Status] || 'Unknown';
    //   if (!candidatesByStage[month][stageName]) {
    //     candidatesByStage[month][stageName] = [];
    //   }
    //   candidatesByStage[month][stageName].push(resume.ResumeId);
      
    //   // Track by channel
    //   // const sourceCategory = resume.Source?.SourceCategory || 'Unknown';
    //   const source = resume.Source?.SourceDrillDown1;
    //   const sourceName = resume.Source?.SourceCategory === "RecruitmentPartners" ? "Recriutment Partners" : (channelCategories.includes(source) ?  source : "Others");

    //   if (!candidatesByChannel[month][sourceName]) {
    //     candidatesByChannel[month][sourceName] = [];   
    //   }
    //   candidatesByChannel[month][sourceName].push(resume.ResumeId);
    //   const status = stageMapping[resume.Status];
    //   // Update counts based on stage
    //   if (resume.Status === 1) {
    //     monthlyDataMap[month].totalRejected++;
    //   } else if (status === 'Offer' || status === 'Nurturing Campaign' || status === 'Hired') {
    //     monthlyDataMap[month].totalOffers++;
    //     monthlyDataMap[month].offer++;
    //   } else {
    //     monthlyDataMap[month].activePipeline++;
    //   }
      
    //   // Update other metrics based on stage
    //   if (status === 'HR Screening' || status === 'Pool') {
    //     monthlyDataMap[month].processed++;
    //   } else if (status === 'L1 Interview') {
    //     monthlyDataMap[month].scheduled++;
    //   } else if (status === 'L2 Interview') {
    //     monthlyDataMap[month].attended++;
    //     monthlyDataMap[month].l1Select++;
    //     monthlyDataMap[month].l2Scheduled++;
    //   } else if (status === 'Rejected' && sourceName === 'L1 Interview') {
    //     monthlyDataMap[month].l1Reject++;
    //   } else if (status === 'Rejected' && sourceName === 'L2 Interview') {
    //     monthlyDataMap[month].l2Rejected++;
    //   }
    // });
    //     // Calculate percentages and format data
    // const monthlyData = Object.values(monthlyDataMap).map(monthData => {
    //   // Calculate channel data
    //   if (candidatesByChannel[monthData.month]) {
    //     monthData.channelData = Object.entries(candidatesByChannel[monthData.month]).map(([name, candidates]) => {
    //       const active = candidates.filter(id => {
    //         const candidate = candidateData[id];
    //         return candidate && candidate.ResumeStage.Value !== 1; // Not rejected
    //       }).length;
          
    //       const rejected = candidates.length - active;
          
    //       return {
    //         name,
    //         value: candidates.length,
    //         active,
    //         rejected,
    //         percentage: `${Math.round((candidates.length / monthData.totalApplicants) * 100) || 0}%`
    //       };
    //     });
    //   }
      
    //   // Calculate pipeline stages
    //   if (candidatesByStage[monthData.month]) {
    //     monthData.pipelineStages = Object.entries(candidatesByStage[monthData.month]).map(([stage, candidates]) => {
    //       const active = candidates.filter(id => {
    //         const candidate = candidateData[id];
    //         return candidate && candidate.ResumeStage.Value !== 1; // Not rejected
    //       }).length;
          
    //       const rejected = candidates.length - active;
          
    //       return {
    //         stage,
    //         active,
    //         rejected
    //       };
    //     });
    //   }
      
    //   // Calculate percentages
    //   monthData.processedToScheduled = monthData.totalApplicants > 0 
    //     ? `${Math.round((monthData.scheduled / monthData.totalApplicants) * 100)}%` 
    //     : '0%';
      
    //   monthData.l1NoShowRate = monthData.scheduled > 0 
    //     ? `${Math.round((monthData.noShow / monthData.scheduled) * 100)}%` 
    //     : '0%';
      
    //   monthData.l1RejectionRate = monthData.scheduled > 0 
    //     ? `${Math.round((monthData.l1Reject / monthData.scheduled) * 100)}%` 
    //     : '0%';
      
    //   monthData.offerPercentage = monthData.scheduled > 0 
    //     ? `${Math.round((monthData.offer / monthData.scheduled) * 100)}%` 
    //     : '0%';
      
    //   monthData.l2RejectionRate = monthData.l2Scheduled > 0 
    //     ? `${Math.round((monthData.l2Rejected / monthData.l2Scheduled) * 100)}%` 
    //     : '0%';
      
    //   // Calculate stage conversion rates
    //   const stageConversionRates = {};
      
    //   if (candidatesByStage[monthData.month]) {
    //     Object.entries(candidatesByStage[monthData.month]).forEach(([stage, candidates]) => {
    //       const total = candidates.length;
    //       if (total === 0) return;
          
    //       const rejected = candidates.filter(id => {
    //         const candidate = candidateData[id];
    //         return candidate && candidate.ResumeStage.Value === 1;
    //       }).length;
          
    //       const selected = total - rejected;
          
    //       stageConversionRates[stage] = {
    //         selectionRate: `${Math.round((selected / total) * 100)}%`,
    //         rejectionRate: `${Math.round((rejected / total) * 100)}%`
    //       };
    //     });
    //   }
      
    //   monthData.stageConversionRates = stageConversionRates;
      
    //   return monthData;
    // });
    
    // // Process referral data
    // const referralCandidates = Object.values(candidateData).filter(c => 
    //   c.Source.SourceCategory === "Referral"
    // );
    
    // const referralSummary = [];
    // const referralsByMonth = {};
    
    // // Group referrals by month
    // referralCandidates.forEach(candidate => {
    //   const uploadDate = new Date(candidate.UploadDateTime);
    //   const month = uploadDate.toLocaleString('en-US', { month: 'short' });
      
    //   if (!referralsByMonth[month]) {
    //     referralsByMonth[month] = [];
    //   }
      
    //   referralsByMonth[month].push(candidate);
    // });
    
    // // Process referrals for each month
    // Object.entries(referralsByMonth).forEach(([month, candidates]) => {
    //   const monthReferralSummary = {
    //     month,
    //     totalReferrals: candidates.length,
    //     referrers: [],
    //     stages: [],
    //     conversionRate: '0%'
    //   };
      
    //   // Group by referrer
    //   const referrerMap = {};
    //   candidates.forEach(candidate => {
    //     const referrer = candidate.Source.SourceDrillDown2 || "Unknown";
    //     if (!referrerMap[referrer]) {
    //       referrerMap[referrer] = [];
    //     }
    //     referrerMap[referrer].push(candidate.ResumeId);
    //   });
      
    //   // Create referrers array
    //   monthReferralSummary.referrers = Object.entries(referrerMap).map(([name, ids]) => ({
    //     name,
    //     count: ids.length,
    //     percentage: `${Math.round((ids.length / candidates.length) * 100)}%`,
    //     candidates: ids
    //   }));
      
    //   // Group by stage
    //   const stageMap = {};
    //   candidates.forEach(candidate => {
    //     const stage = candidate.ResumeStage.Name;
    //     if (!stageMap[stage]) {
    //       stageMap[stage] = [];
    //     }
    //     stageMap[stage].push(candidate.ResumeId);
    //   });
      
    //   // Create stages array
    //   monthReferralSummary.stages = Object.entries(stageMap).map(([stage, ids]) => ({
    //     stage,
    //     count: ids.length,
    //     percentage: `${Math.round((ids.length / candidates.length) * 100)}%`,
    //     candidates: ids
    //   }));
      
    //   // Calculate conversion rate
    //   const offerStages = ["Offer", "Nurturing Campaign", "Hired"];
    //   const offersCount = monthReferralSummary.stages
    //     .filter(s => offerStages.includes(s.stage))
    //     .reduce((sum, stage) => sum + stage.count, 0);
      
    //   monthReferralSummary.conversionRate = `${Math.round((offersCount / candidates.length) * 100)}%`;
      
    //   referralSummary.push(monthReferralSummary);
    // });
    
    // // Find top referrers across all months
    // const allReferrers = {};
    // referralCandidates.forEach(candidate => {
    //   const referrer = candidate.Source.SourceDrillDown2 || "Unknown";
    //   if (!allReferrers[referrer]) {
    //     allReferrers[referrer] = [];
    //   }
    //   allReferrers[referrer].push(candidate.ResumeId);
    // });
    
    // const topReferrers = Object.entries(allReferrers)
    //   .map(([name, candidates]) => ({
    //     name,
    //     count: candidates.length,
    //     percentage: `${Math.round((candidates.length / referralCandidates.length || 1) * 100)}%`,
    //     candidates
    //   }))
    //   .sort((a, b) => b.count - a.count)
    //   .slice(0, 10);
    
    // // Sort monthly data by month (most recent first)
    // monthlyData.sort((a, b) => {
    //   const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    //   return months.indexOf(b.month) - months.indexOf(a.month);
    // });
        
    // return { 
    //   data: {
    //     monthlyData,
    //     jobData,
    //     candidatesByStage,
    //     candidatesByChannel,
    //     referralData: {
    //       summary: referralSummary,
    //       topReferrers
    //     },
    //     candidateData
    //   }
    // };


    const candidateData = {};
    const allDatas = {};
    const jobData = {};
    const monthlyDataMap = {};
    const candidatesByStage = {};
    const candidatesByChannel = {};   
    const refferals = {}; 
    const offers = {};
    const allResumesData = {};
    const allStatusChangesData = {};
    // Process each resume

  

    allResumes.forEach(resume => {
      allResumesData[resume.ResumeId] = resume;
  
      if (resume.Parent && resume.Parent.ParentId) {
        jobData[resume.Parent.ParentId] = {
          name: resume.Parent.Name,
          code: resume.Parent.JobCode || ''
        };
      }
      const uploadDate = new Date(allStatusChanges[resume.ResumeId]?.MovedDate || resume.UploadDateTime);
      const month = uploadDate.toLocaleString('en-US', { month: 'short' });

      if(!allDatas[`${month}_${resume.Parent.ParentId}`]) {
        allDatas[`${month}_${resume.Parent.ParentId}`] = {
          totalApplicants: 0,
          totalRejected: 0,
          totalOffers:0,
          activePipeline:0,
          channel: {},
        };
      }

      const allMap = allDatas[`${month}_${resume.Parent.ParentId}`];

      allMap.totalApplicants++;
      const status = stageMapping[resume.Status];

      if (resume.Status === 1) {
        allMap.totalRejected++;
      } else if (status === 'Offer' || status === 'Nurturing Campaign' || status === 'Hired' || status === 'Nuturing Campaign') {
        allMap.totalOffers++;
        allMap.offer++;
        if(!offers[month]){
          offers[month] = 0;
        }
        offers[month]++;

      } else {
        allMap.activePipeline++;
      }

      const source = resume.Source?.SourceDrillDown1;
      const sourceName = resume.Source?.SourceCategory === "RecruitmentPartners" ? "Recriutment Partners" : (channelCategories.includes(source) ?  source : "Others");

      if(!allMap["channel"][sourceName]){
        allMap["channel"][sourceName] = 0;
      }

      allMap["channel"][sourceName]++;

      const userData = {
        UserData: {
          Name: resume.UserData.Name || '',
          EmailId: resume.UserData.EmailId || '',
          PhoneNumber: resume.UserData.PhoneNumber || '',
          EducationList: resume.UserData.EducationList || []
        },
        WorkData: {
          WorkDataList: resume?.WorkData?.WorkDataList || [],
          TotalExperience: resume?.WorkData?.TotalExperience || 0,
          isCurrentlyWorking: resume?.WorkData?.IsCurrentlyWorking || false
        },
        Source: resume.Source || {},
        ResumeStage: {
          Name: stageMapping[resume.Status] || 'Unknown',
          Value: resume.Status,
          previousStatus: resume.PreviousStatus
        },
        Parent: {
          ParentId: resume.Parent.ParentId,
          Type: "Job",
          Name: resume.Parent.ParentName || '',
          JobCode: resume.Parent.JobCode || ''
        },
        ResumeId: resume.ResumeId,
        ResumeUrl: resume.ResumeUrl || '',
        UploadDateTime: resume.UploadDateTime || '',
        DateTime: allStatusChanges[resume.ResumeId]?.MovedDate || ''
      };

      // Store candidate data
      candidateData[`${month}_${resume.Parent.ParentId}_${resume.ResumeId}`] = userData;

      if(sourceName === "Referral") {
        refferals[`${month}_${resume.Parent.ParentId}_${resume.ResumeId}`] = userData;
      }      
    });

     {
     }

    return { 
      data: {
        candidateData,
        jobData,
        refferals,
        allDatas,
        allResumesData
      }
    };
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      const message = error.message || 'Unknown error occurred';
      
      return {
        data: null,
        error: { status, message }
      };
    }
    
    return {
      data: null,
      error: { status: 500, message: 'Unknown error occurred' }
    };
  }
}

// Export the new functions
export { 
  generateDashboardData,
  refreshToken
}; 
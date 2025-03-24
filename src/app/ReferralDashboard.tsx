import React from 'react';
import { Card } from '@/components/ui/card';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveBar } from '@nivo/bar';

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
  onCandidateClick: (candidateIds: string[]) => void;
}

export default function ReferralDashboard({ referralData, onCandidateClick }: ReferralDashboardProps) {
  const currentMonth = referralData.summary[0] || { 
    month: '', 
    totalReferrals: 0, 
    referrers: [], 
    stages: [], 
    conversionRate: '0%' 
  };
  
  // Prepare data for monthly trend chart
  const monthlyTrendData = referralData.summary
    .slice()
    .reverse()
    .map(month => ({
      month: month.month,
      referrals: month.totalReferrals,
      conversionRate: parseFloat(month.conversionRate.replace('%', ''))
    }));
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card 
          className="p-4 bg-white shadow-sm rounded-lg cursor-pointer hover:bg-gray-50"
          onClick={() => onCandidateClick(referralData.summary.flatMap(m => m.referrers.flatMap(r => r.candidates)))}
        >
          <h3 className="text-sm font-medium text-gray-500">Total Referrals</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {referralData.summary.reduce((sum, month) => sum + month.totalReferrals, 0)}
          </p>
        </Card>
        
        <Card className="p-4 bg-white shadow-sm rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Current Month</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{currentMonth.totalReferrals}</p>
        </Card>
        
        <Card className="p-4 bg-white shadow-sm rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Conversion Rate</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{currentMonth.conversionRate}</p>
        </Card>
        
        <Card className="p-4 bg-white shadow-sm rounded-lg">
          <h3 className="text-sm font-medium text-gray-500">Top Referrer</h3>
          <p className="text-2xl font-semibold text-gray-900 mt-2">
            {referralData.topReferrers[0]?.name || 'N/A'}
          </p>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <Card className="p-6 bg-white shadow-sm rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Referrers</h2>
          <div className="space-y-3">
            {referralData.topReferrers.slice(0, 5).map((referrer, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                onClick={() => onCandidateClick(referrer.candidates)}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-3">
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-800">{referrer.name}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600">{referrer.count} referrals</span>
                  <span className="text-blue-600 font-medium">{referrer.percentage}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        
        {/* Stage Distribution */}
        <Card className="p-6 bg-white shadow-sm rounded-lg">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stage Distribution</h2>
          <div className="h-[300px]">
            <ResponsivePie
              data={currentMonth.stages.map(stage => ({
                id: stage.stage,
                label: stage.stage,
                value: stage.count,
                color: `hsl(${Math.random() * 360}, 70%, 50%)`,
                candidates: stage.candidates
              }))}
              margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
              onClick={(data) => onCandidateClick(data.data.candidates as string[])}
              tooltip={({ datum }) => (
                <div style={{
                  background: 'white',
                  padding: '9px 12px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}>
                  <div><strong>{datum.label}</strong></div>
                  <div>Count: {datum.value}</div>
                  <div>Percentage: {currentMonth.stages.find(s => s.stage === datum.label)?.percentage}</div>
                </div>
              )}
            />
          </div>
        </Card>
      </div>
      
      {/* Monthly Trend */}
            {/* Monthly Trend */}
            <Card className="p-6 bg-white shadow-sm rounded-lg">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Referral Trend</h2>
        <div className="h-[300px]">
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
        </div>
      </Card>
    </div>
  );
}
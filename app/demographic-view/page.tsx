"use client";
import { useState, useEffect, useMemo } from "react";
import { fetchMarketingData } from "../../src/lib/api";
import {
  MarketingData,
  Campaign,
  DemographicBreakdown,
} from "../../src/types/marketing";
import { Navbar } from "../../src/components/ui/navbar";
import { Footer } from "../../src/components/ui/footer";
import { CardMetric } from "../../src/components/ui/card-metric";
import { BarChart } from "../../src/components/ui/bar-chart";
import { Table } from "../../src/components/ui/table";
import { Users, MousePointerClick, DollarSign, TrendingUp } from "lucide-react";

interface AggregatedDemographicData {
  maleClicks: number;
  maleSpend: number;
  maleRevenue: number;
  femaleClicks: number;
  femaleSpend: number;
  femaleRevenue: number;
  ageGroupSpend: { [key: string]: number };
  ageGroupRevenue: { [key: string]: number };
  maleAgeGroupPerformance: CampaignAgePerformance[];
  femaleAgeGroupPerformance: CampaignAgePerformance[];
}

interface CampaignAgePerformance {
  campaign: string;
  age_group: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversion_rate: number;
}

export default function DemographicView() {
  const [marketingData, setMarketingData] = useState<MarketingData | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchMarketingData();
        setMarketingData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        console.error("Error loading marketing data:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Aggregate demographic data from all campaigns
  const demographicData = useMemo((): AggregatedDemographicData => {
    if (!marketingData?.campaigns) {
      return {
        maleClicks: 0,
        maleSpend: 0,
        maleRevenue: 0,
        femaleClicks: 0,
        femaleSpend: 0,
        femaleRevenue: 0,
        ageGroupSpend: {},
        ageGroupRevenue: {},
        maleAgeGroupPerformance: [],
        femaleAgeGroupPerformance: [],
      };
    }

    let maleClicks = 0;
    let maleSpend = 0;
    let maleRevenue = 0;
    let femaleClicks = 0;
    let femaleSpend = 0;
    let femaleRevenue = 0;
    const ageGroupSpend: { [key: string]: number } = {};
    const ageGroupRevenue: { [key: string]: number } = {};
    const malePerformance: CampaignAgePerformance[] = [];
    const femalePerformance: CampaignAgePerformance[] = [];

    marketingData.campaigns.forEach((campaign: Campaign) => {
      if (!campaign.demographic_breakdown) return;

      campaign.demographic_breakdown.forEach((demo: DemographicBreakdown) => {
        const percentageMultiplier = demo.percentage_of_audience / 100;
        const demoClicks = demo.performance.clicks;
        const demoSpend = campaign.spend * percentageMultiplier;
        const demoRevenue = campaign.revenue * percentageMultiplier;

        // Aggregate by gender
        if (demo.gender === "Male") {
          maleClicks += demoClicks;
          maleSpend += demoSpend;
          maleRevenue += demoRevenue;

          // Add to male age group performance
          malePerformance.push({
            campaign: campaign.name,
            age_group: demo.age_group,
            impressions: demo.performance.impressions,
            clicks: demo.performance.clicks,
            conversions: demo.performance.conversions,
            ctr: demo.performance.ctr,
            conversion_rate: demo.performance.conversion_rate,
          });
        } else if (demo.gender === "Female") {
          femaleClicks += demoClicks;
          femaleSpend += demoSpend;
          femaleRevenue += demoRevenue;

          // Add to female age group performance
          femalePerformance.push({
            campaign: campaign.name,
            age_group: demo.age_group,
            impressions: demo.performance.impressions,
            clicks: demo.performance.clicks,
            conversions: demo.performance.conversions,
            ctr: demo.performance.ctr,
            conversion_rate: demo.performance.conversion_rate,
          });
        }

        // Aggregate by age group
        if (!ageGroupSpend[demo.age_group]) {
          ageGroupSpend[demo.age_group] = 0;
          ageGroupRevenue[demo.age_group] = 0;
        }
        ageGroupSpend[demo.age_group] += demoSpend;
        ageGroupRevenue[demo.age_group] += demoRevenue;
      });
    });

    return {
      maleClicks,
      maleSpend,
      maleRevenue,
      femaleClicks,
      femaleSpend,
      femaleRevenue,
      ageGroupSpend,
      ageGroupRevenue,
      maleAgeGroupPerformance: malePerformance,
      femaleAgeGroupPerformance: femalePerformance,
    };
  }, [marketingData]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-900">
      <Navbar />

      <div className="flex-1 flex flex-col transition-all duration-300 ease-in-out overflow-hidden">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-gray-800 to-gray-700 text-white py-8 sm:py-12">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              {error ? (
                <div className="bg-red-900 border border-red-700 text-red-200 px-3 sm:px-4 py-3 rounded mb-4 max-w-2xl mx-auto text-sm sm:text-base">
                  Error loading data: {error}
                </div>
              ) : (
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
                  Demographic View
                </h1>
              )}
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto w-full max-w-full">
          {marketingData && (
            <>
              {/* Gender Performance Metrics */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
                  Performance by Gender
                </h2>

                {/* Male Metrics */}
                <div className="mb-6">
                  <h3 className="text-base sm:text-lg font-medium text-blue-400 mb-3">
                    Male Audience Performance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <CardMetric
                      title="Total Clicks by Males"
                      value={demographicData.maleClicks.toLocaleString()}
                      icon={<MousePointerClick className="h-5 w-5" />}
                      className="text-blue-400"
                    />
                    <CardMetric
                      title="Total Spend by Males"
                      value={`$${Math.round(
                        demographicData.maleSpend
                      ).toLocaleString()}`}
                      icon={<DollarSign className="h-5 w-5" />}
                      className="text-blue-400"
                    />
                    <CardMetric
                      title="Total Revenue by Males"
                      value={`$${Math.round(
                        demographicData.maleRevenue
                      ).toLocaleString()}`}
                      icon={<TrendingUp className="h-5 w-5" />}
                      className="text-blue-400"
                    />
                  </div>
                </div>

                {/* Female Metrics */}
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-pink-400 mb-3">
                    Female Audience Performance
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    <CardMetric
                      title="Total Clicks by Females"
                      value={demographicData.femaleClicks.toLocaleString()}
                      icon={<MousePointerClick className="h-5 w-5" />}
                      className="text-pink-400"
                    />
                    <CardMetric
                      title="Total Spend by Females"
                      value={`$${Math.round(
                        demographicData.femaleSpend
                      ).toLocaleString()}`}
                      icon={<DollarSign className="h-5 w-5" />}
                      className="text-pink-400"
                    />
                    <CardMetric
                      title="Total Revenue by Females"
                      value={`$${Math.round(
                        demographicData.femaleRevenue
                      ).toLocaleString()}`}
                      icon={<TrendingUp className="h-5 w-5" />}
                      className="text-pink-400"
                    />
                  </div>
                </div>
              </div>

              {/* Age Group Performance Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <BarChart
                  title="Total Spend by Age Group"
                  data={Object.entries(demographicData.ageGroupSpend)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([ageGroup, spend]) => ({
                      label: ageGroup,
                      value: spend,
                      color: "#F59E0B",
                    }))}
                  formatValue={(value) =>
                    `$${Math.round(value).toLocaleString()}`
                  }
                />

                <BarChart
                  title="Total Revenue by Age Group"
                  data={Object.entries(demographicData.ageGroupRevenue)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([ageGroup, revenue]) => ({
                      label: ageGroup,
                      value: revenue,
                      color: "#10B981",
                    }))}
                  formatValue={(value) =>
                    `$${Math.round(value).toLocaleString()}`
                  }
                />
              </div>

              {/* Campaign Performance Tables */}
              <div className="space-y-6 sm:space-y-8">
                {/* Male Age Group Performance */}
                <div className="overflow-x-auto w-full max-w-full">
                  <Table
                    title="Campaign Performance by Male Age Groups"
                    showIndex={true}
                    maxHeight="500px"
                    columns={[
                      {
                        key: "campaign",
                        header: "Campaign",
                        width: "30%",
                        sortable: true,
                        sortType: "string",
                        render: (value) => (
                          <div className="font-medium text-white text-sm">
                            {value.length > 40
                              ? `${value.substring(0, 40)}...`
                              : value}
                          </div>
                        ),
                      },
                      {
                        key: "age_group",
                        header: "Age Group",
                        width: "12%",
                        align: "center",
                        sortable: true,
                        sortType: "string",
                        render: (value) => (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                            {value}
                          </span>
                        ),
                      },
                      {
                        key: "impressions",
                        header: "Impressions",
                        width: "12%",
                        align: "right",
                        sortable: true,
                        sortType: "number",
                        render: (value) => value.toLocaleString(),
                      },
                      {
                        key: "clicks",
                        header: "Clicks",
                        width: "10%",
                        align: "right",
                        sortable: true,
                        sortType: "number",
                        render: (value) => value.toLocaleString(),
                      },
                      {
                        key: "conversions",
                        header: "Conversions",
                        width: "12%",
                        align: "right",
                        sortable: true,
                        sortType: "number",
                        render: (value) => value.toLocaleString(),
                      },
                      {
                        key: "ctr",
                        header: "CTR",
                        width: "10%",
                        align: "right",
                        sortable: true,
                        sortType: "number",
                        render: (value) => (
                          <span className="text-blue-400 font-medium">
                            {value.toFixed(2)}%
                          </span>
                        ),
                      },
                      {
                        key: "conversion_rate",
                        header: "Conv. Rate",
                        width: "14%",
                        align: "right",
                        sortable: true,
                        sortType: "number",
                        render: (value) => (
                          <span className="text-green-400 font-medium">
                            {value.toFixed(2)}%
                          </span>
                        ),
                      },
                    ]}
                    defaultSort={{ key: "conversions", direction: "desc" }}
                    data={demographicData.maleAgeGroupPerformance}
                    emptyMessage="No male demographic data available"
                  />
                </div>

                {/* Female Age Group Performance */}
                <div className="overflow-x-auto w-full max-w-full">
                  <Table
                    title="Campaign Performance by Female Age Groups"
                    showIndex={true}
                    maxHeight="500px"
                    columns={[
                      {
                        key: "campaign",
                        header: "Campaign",
                        width: "30%",
                        sortable: true,
                        sortType: "string",
                        render: (value) => (
                          <div className="font-medium text-white text-sm">
                            {value.length > 40
                              ? `${value.substring(0, 40)}...`
                              : value}
                          </div>
                        ),
                      },
                      {
                        key: "age_group",
                        header: "Age Group",
                        width: "12%",
                        align: "center",
                        sortable: true,
                        sortType: "string",
                        render: (value) => (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-pink-900 text-pink-300">
                            {value}
                          </span>
                        ),
                      },
                      {
                        key: "impressions",
                        header: "Impressions",
                        width: "12%",
                        align: "right",
                        sortable: true,
                        sortType: "number",
                        render: (value) => value.toLocaleString(),
                      },
                      {
                        key: "clicks",
                        header: "Clicks",
                        width: "10%",
                        align: "right",
                        sortable: true,
                        sortType: "number",
                        render: (value) => value.toLocaleString(),
                      },
                      {
                        key: "conversions",
                        header: "Conversions",
                        width: "12%",
                        align: "right",
                        sortable: true,
                        sortType: "number",
                        render: (value) => value.toLocaleString(),
                      },
                      {
                        key: "ctr",
                        header: "CTR",
                        width: "10%",
                        align: "right",
                        sortable: true,
                        sortType: "number",
                        render: (value) => (
                          <span className="text-pink-400 font-medium">
                            {value.toFixed(2)}%
                          </span>
                        ),
                      },
                      {
                        key: "conversion_rate",
                        header: "Conv. Rate",
                        width: "14%",
                        align: "right",
                        sortable: true,
                        sortType: "number",
                        render: (value) => (
                          <span className="text-green-400 font-medium">
                            {value.toFixed(2)}%
                          </span>
                        ),
                      },
                    ]}
                    defaultSort={{ key: "conversions", direction: "desc" }}
                    data={demographicData.femaleAgeGroupPerformance}
                    emptyMessage="No female demographic data available"
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}

"use client";
import { useState, useEffect, useMemo } from "react";
import { fetchMarketingData } from "../../src/lib/api";
import { MarketingData, RegionalPerformance } from "../../src/types/marketing";
import { Navbar } from "../../src/components/ui/navbar";
import { Footer } from "../../src/components/ui/footer";
import { CardMetric } from "../../src/components/ui/card-metric";
import { BubbleMap } from "../../src/components/ui/bubble-map";
import { BarChart } from "../../src/components/ui/bar-chart";
import { Table } from "../../src/components/ui/table";
import { MapPin, TrendingUp, DollarSign, Target } from "lucide-react";

export default function RegionView() {
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

  // Aggregate regional data from all campaigns
  const regionalData = useMemo(() => {
    if (!marketingData?.campaigns) return [];

    const regionMap = new Map<string, RegionalPerformance>();

    marketingData.campaigns.forEach((campaign) => {
      if (!campaign.regional_performance) return;

      campaign.regional_performance.forEach((region) => {
        const key = region.region;

        if (!regionMap.has(key)) {
          regionMap.set(key, { ...region });
        } else {
          const existing = regionMap.get(key)!;
          existing.impressions += region.impressions;
          existing.clicks += region.clicks;
          existing.conversions += region.conversions;
          existing.spend += region.spend;
          existing.revenue += region.revenue;

          // Recalculate derived metrics
          existing.ctr =
            existing.impressions > 0
              ? (existing.clicks / existing.impressions) * 100
              : 0;
          existing.conversion_rate =
            existing.clicks > 0
              ? (existing.conversions / existing.clicks) * 100
              : 0;
          existing.cpc =
            existing.clicks > 0 ? existing.spend / existing.clicks : 0;
          existing.cpa =
            existing.conversions > 0
              ? existing.spend / existing.conversions
              : 0;
          existing.roas =
            existing.spend > 0 ? existing.revenue / existing.spend : 0;
        }
      });
    });

    return Array.from(regionMap.values()).sort((a, b) => b.revenue - a.revenue);
  }, [marketingData]);

  // Summary metrics
  const summaryMetrics = useMemo(() => {
    if (regionalData.length === 0) {
      return {
        totalRegions: 0,
        totalRevenue: 0,
        totalSpend: 0,
        topRegion: "N/A",
      };
    }

    const totalRevenue = regionalData.reduce(
      (sum, region) => sum + region.revenue,
      0
    );
    const totalSpend = regionalData.reduce(
      (sum, region) => sum + region.spend,
      0
    );
    const topRegion = regionalData[0]?.region || "N/A";

    return {
      totalRegions: regionalData.length,
      totalRevenue,
      totalSpend,
      topRegion,
    };
  }, [regionalData]);

  // Prepare data for bubble maps
  const bubbleMapDataRevenue = useMemo(() => {
    return regionalData.map((region) => ({
      region: region.region,
      country: region.country,
      value: region.revenue,
      secondaryValue: region.spend,
    }));
  }, [regionalData]);

  const bubbleMapDataSpend = useMemo(() => {
    return regionalData.map((region) => ({
      region: region.region,
      country: region.country,
      value: region.spend,
      secondaryValue: region.revenue,
    }));
  }, [regionalData]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-900">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-lg">Loading regional data...</div>
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
                  Regional Performance
                </h1>
              )}
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto w-full max-w-full">
          {marketingData && (
            <>
              {/* Summary Metrics */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
                  Regional Overview
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <CardMetric
                    title="Total Regions"
                    value={summaryMetrics.totalRegions}
                    icon={<MapPin className="h-5 w-5" />}
                  />
                  <CardMetric
                    title="Total Revenue"
                    value={`$${Math.round(
                      summaryMetrics.totalRevenue
                    ).toLocaleString()}`}
                    icon={<TrendingUp className="h-5 w-5" />}
                    className="text-green-400"
                  />
                  <CardMetric
                    title="Total Spend"
                    value={`$${Math.round(
                      summaryMetrics.totalSpend
                    ).toLocaleString()}`}
                    icon={<DollarSign className="h-5 w-5" />}
                  />
                  <CardMetric
                    title="Top Performing Region"
                    value={summaryMetrics.topRegion}
                    icon={<Target className="h-5 w-5" />}
                  />
                </div>
              </div>

              {/* Bubble Maps */}
              <div className="space-y-6 sm:space-y-8 mb-6 sm:mb-8">
                <BubbleMap
                  title="Revenue by Region"
                  data={bubbleMapDataRevenue}
                  metric="Revenue"
                  colorScheme="green"
                  height={450}
                  formatValue={(value) =>
                    `$${Math.round(value).toLocaleString()}`
                  }
                />

                <BubbleMap
                  title="Spend by Region"
                  data={bubbleMapDataSpend}
                  metric="Spend"
                  colorScheme="orange"
                  height={450}
                  formatValue={(value) =>
                    `$${Math.round(value).toLocaleString()}`
                  }
                />
              </div>

              {/* Performance Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <BarChart
                  title="Revenue by Region"
                  data={regionalData.slice(0, 8).map((region) => ({
                    label: region.region,
                    value: region.revenue,
                    color: "#10B981",
                  }))}
                  formatValue={(value) =>
                    `$${Math.round(value).toLocaleString()}`
                  }
                  height={320}
                />

                <BarChart
                  title="ROAS by Region"
                  data={regionalData
                    .slice(0, 8)
                    .sort((a, b) => b.roas - a.roas)
                    .map((region) => ({
                      label: region.region,
                      value: region.roas,
                      color: "#8B5CF6",
                    }))}
                  formatValue={(value) => `${value.toFixed(2)}x`}
                  height={320}
                />

                <BarChart
                  title="Conversions by Region"
                  data={regionalData
                    .slice(0, 8)
                    .sort((a, b) => b.conversions - a.conversions)
                    .map((region) => ({
                      label: region.region,
                      value: region.conversions,
                      color: "#3B82F6",
                    }))}
                  formatValue={(value) => value.toLocaleString()}
                  height={320}
                />

                <BarChart
                  title="CTR by Region"
                  data={regionalData
                    .slice(0, 8)
                    .sort((a, b) => b.ctr - a.ctr)
                    .map((region) => ({
                      label: region.region,
                      value: region.ctr,
                      color: "#F59E0B",
                    }))}
                  formatValue={(value) => `${value.toFixed(2)}%`}
                  height={320}
                />
              </div>

              {/* Regional Performance Table */}
              <div className="overflow-x-auto w-full max-w-full">
                <Table
                  title="Detailed Regional Performance"
                  showIndex={true}
                  maxHeight="600px"
                  columns={[
                    {
                      key: "region",
                      header: "Region",
                      width: "14%",
                      sortable: true,
                      sortType: "string",
                      render: (value) => (
                        <div className="font-medium text-white text-sm flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          <span>{value}</span>
                        </div>
                      ),
                    },
                    {
                      key: "country",
                      header: "Country",
                      width: "10%",
                      align: "center",
                      sortable: true,
                      sortType: "string",
                      render: (value) => (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-700 text-gray-300">
                          {value}
                        </span>
                      ),
                    },
                    {
                      key: "impressions",
                      header: "Impressions",
                      width: "11%",
                      align: "right",
                      sortable: true,
                      sortType: "number",
                      render: (value) => (
                        <span className="text-sm">
                          {value.toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      key: "clicks",
                      header: "Clicks",
                      width: "9%",
                      align: "right",
                      sortable: true,
                      sortType: "number",
                      render: (value) => (
                        <span className="text-sm">
                          {value.toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      key: "conversions",
                      header: "Conversions",
                      width: "11%",
                      align: "right",
                      sortable: true,
                      sortType: "number",
                      render: (value) => (
                        <span className="text-sm">
                          {value.toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      key: "spend",
                      header: "Spend",
                      width: "11%",
                      align: "right",
                      sortable: true,
                      sortType: "number",
                      render: (value) => (
                        <span className="text-orange-400 font-medium text-sm">
                          ${Math.round(value).toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      key: "revenue",
                      header: "Revenue",
                      width: "11%",
                      align: "right",
                      sortable: true,
                      sortType: "number",
                      render: (value) => (
                        <span className="text-green-400 font-medium text-sm">
                          ${Math.round(value).toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      key: "ctr",
                      header: "CTR",
                      width: "8%",
                      align: "right",
                      sortable: true,
                      sortType: "number",
                      render: (value) => (
                        <span className="text-blue-400 font-medium text-sm">
                          {value.toFixed(2)}%
                        </span>
                      ),
                    },
                    {
                      key: "conversion_rate",
                      header: "Conv. Rate",
                      width: "10%",
                      align: "right",
                      sortable: true,
                      sortType: "number",
                      render: (value) => (
                        <span className="text-purple-400 font-medium text-sm">
                          {value.toFixed(2)}%
                        </span>
                      ),
                    },
                    {
                      key: "roas",
                      header: "ROAS",
                      width: "5%",
                      align: "right",
                      sortable: true,
                      sortType: "number",
                      render: (value) => (
                        <span className="text-yellow-400 font-medium text-sm">
                          {value.toFixed(1)}x
                        </span>
                      ),
                    },
                  ]}
                  defaultSort={{ key: "revenue", direction: "desc" }}
                  data={regionalData}
                  emptyMessage="No regional performance data available"
                />
              </div>
            </>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}

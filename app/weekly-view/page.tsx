"use client";
import { useState, useEffect, useMemo } from "react";
import { fetchMarketingData } from "../../src/lib/api";
import { MarketingData, WeeklyPerformance } from "../../src/types/marketing";
import { Navbar } from "../../src/components/ui/navbar";
import { Footer } from "../../src/components/ui/footer";
import { CardMetric } from "../../src/components/ui/card-metric";
import { LineChart } from "../../src/components/ui/line-chart";
import { Table } from "../../src/components/ui/table";
import {
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  MousePointerClick,
} from "lucide-react";

export default function WeeklyView() {
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

  // Aggregate weekly data from all campaigns
  const weeklyData = useMemo(() => {
    if (!marketingData?.campaigns) return [];

    const weekMap = new Map<string, WeeklyPerformance>();

    marketingData.campaigns.forEach((campaign) => {
      if (!campaign.weekly_performance) return;

      campaign.weekly_performance.forEach((week) => {
        const key = week.week_start;

        if (!weekMap.has(key)) {
          weekMap.set(key, { ...week });
        } else {
          const existing = weekMap.get(key)!;
          existing.impressions += week.impressions;
          existing.clicks += week.clicks;
          existing.conversions += week.conversions;
          existing.spend += week.spend;
          existing.revenue += week.revenue;
        }
      });
    });

    return Array.from(weekMap.values()).sort(
      (a, b) =>
        new Date(a.week_start).getTime() - new Date(b.week_start).getTime()
    );
  }, [marketingData]);

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    if (weeklyData.length === 0) {
      return {
        totalRevenue: 0,
        totalSpend: 0,
        totalConversions: 0,
        totalClicks: 0,
        averageWeeklyRevenue: 0,
        averageWeeklySpend: 0,
      };
    }

    const totalRevenue = weeklyData.reduce(
      (sum, week) => sum + week.revenue,
      0
    );
    const totalSpend = weeklyData.reduce((sum, week) => sum + week.spend, 0);
    const totalConversions = weeklyData.reduce(
      (sum, week) => sum + week.conversions,
      0
    );
    const totalClicks = weeklyData.reduce((sum, week) => sum + week.clicks, 0);

    return {
      totalRevenue,
      totalSpend,
      totalConversions,
      totalClicks,
      averageWeeklyRevenue: totalRevenue / weeklyData.length,
      averageWeeklySpend: totalSpend / weeklyData.length,
    };
  }, [weeklyData]);

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

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
                  Weekly Performance
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
                  Overall Performance Summary
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
                    className="text-blue-400"
                  />
                  <CardMetric
                    title="Total Conversions"
                    value={summaryMetrics.totalConversions.toLocaleString()}
                    icon={<Users className="h-5 w-5" />}
                    className="text-purple-400"
                  />
                  <CardMetric
                    title="Total Clicks"
                    value={summaryMetrics.totalClicks.toLocaleString()}
                    icon={<MousePointerClick className="h-5 w-5" />}
                    className="text-orange-400"
                  />
                </div>
              </div>

              {/* Weekly Averages */}
              <div className="mb-6 sm:mb-8">
                <h2 className="text-lg sm:text-xl font-semibold text-white mb-4">
                  Weekly Averages
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <CardMetric
                    title="Average Weekly Revenue"
                    value={`$${Math.round(
                      summaryMetrics.averageWeeklyRevenue
                    ).toLocaleString()}`}
                    icon={<Calendar className="h-5 w-5" />}
                    className="text-green-400"
                  />
                  <CardMetric
                    title="Average Weekly Spend"
                    value={`$${Math.round(
                      summaryMetrics.averageWeeklySpend
                    ).toLocaleString()}`}
                    icon={<Calendar className="h-5 w-5" />}
                    className="text-blue-400"
                  />
                </div>
              </div>

              {/* Line Charts */}
              <div className="grid grid-cols-1 gap-6 sm:gap-8 mb-6 sm:mb-8">
                {/* Revenue by Week */}
                <LineChart
                  title="Revenue by Week"
                  series={[
                    {
                      name: "Revenue",
                      data: weeklyData.map((week) => ({
                        label: formatDate(week.week_start),
                        value: week.revenue,
                      })),
                      color: "#10B981",
                    },
                  ]}
                  height={350}
                  formatValue={(value) =>
                    `$${Math.round(value).toLocaleString()}`
                  }
                />

                {/* Spend by Week */}
                <LineChart
                  title="Spend by Week"
                  series={[
                    {
                      name: "Spend",
                      data: weeklyData.map((week) => ({
                        label: formatDate(week.week_start),
                        value: week.spend,
                      })),
                      color: "#3B82F6",
                    },
                  ]}
                  height={350}
                  formatValue={(value) =>
                    `$${Math.round(value).toLocaleString()}`
                  }
                />

                {/* Combined Revenue & Spend */}
                <LineChart
                  title="Revenue vs Spend by Week"
                  series={[
                    {
                      name: "Revenue",
                      data: weeklyData.map((week) => ({
                        label: formatDate(week.week_start),
                        value: week.revenue,
                      })),
                      color: "#10B981",
                    },
                    {
                      name: "Spend",
                      data: weeklyData.map((week) => ({
                        label: formatDate(week.week_start),
                        value: week.spend,
                      })),
                      color: "#EF4444",
                    },
                  ]}
                  height={350}
                  formatValue={(value) =>
                    `$${Math.round(value).toLocaleString()}`
                  }
                />

                {/* Conversions & Clicks Trend */}
                <LineChart
                  title="Conversions & Clicks by Week"
                  series={[
                    {
                      name: "Conversions",
                      data: weeklyData.map((week) => ({
                        label: formatDate(week.week_start),
                        value: week.conversions,
                      })),
                      color: "#8B5CF6",
                    },
                    {
                      name: "Clicks",
                      data: weeklyData.map((week) => ({
                        label: formatDate(week.week_start),
                        value: week.clicks,
                      })),
                      color: "#F59E0B",
                    },
                  ]}
                  height={350}
                  formatValue={(value) => value.toLocaleString()}
                />
              </div>

              {/* Weekly Performance Table */}
              <div className="overflow-x-auto w-full max-w-full">
                <Table
                  title="Detailed Weekly Performance"
                  showIndex={true}
                  maxHeight="500px"
                  columns={[
                    {
                      key: "week_start",
                      header: "Week Start",
                      width: "12%",
                      sortable: true,
                      sortType: "date",
                      render: (value) => (
                        <span className="font-medium text-white text-sm">
                          {formatDate(value)}
                        </span>
                      ),
                    },
                    {
                      key: "week_end",
                      header: "Week End",
                      width: "12%",
                      sortable: true,
                      sortType: "date",
                      render: (value) => (
                        <span className="text-sm text-gray-300">
                          {formatDate(value)}
                        </span>
                      ),
                    },
                    {
                      key: "impressions",
                      header: "Impressions",
                      width: "13%",
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
                      width: "13%",
                      align: "right",
                      sortable: true,
                      sortType: "number",
                      render: (value) => value.toLocaleString(),
                    },
                    {
                      key: "spend",
                      header: "Spend",
                      width: "13%",
                      align: "right",
                      sortable: true,
                      sortType: "number",
                      render: (value) => (
                        <span className="text-blue-400 font-medium text-sm">
                          ${Math.round(value).toLocaleString()}
                        </span>
                      ),
                    },
                    {
                      key: "revenue",
                      header: "Revenue",
                      width: "13%",
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
                      key: "roas",
                      header: "ROAS",
                      width: "14%",
                      align: "right",
                      sortable: true,
                      sortType: "number",
                      render: (value, row) => {
                        const roas =
                          row.spend > 0 ? row.revenue / row.spend : 0;
                        return (
                          <span className="text-purple-400 font-medium text-sm">
                            {roas.toFixed(2)}x
                          </span>
                        );
                      },
                    },
                  ]}
                  defaultSort={{ key: "week_start", direction: "desc" }}
                  data={weeklyData}
                  emptyMessage="No weekly performance data available"
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

"use client";
import { useState, useEffect, useMemo } from "react";
import { fetchMarketingData } from "../../src/lib/api";
import { MarketingData, DevicePerformance } from "../../src/types/marketing";
import { Navbar } from "../../src/components/ui/navbar";
import { Footer } from "../../src/components/ui/footer";
import { BarChart } from "../../src/components/ui/bar-chart";
import { Table } from "../../src/components/ui/table";
import {
  Smartphone,
  Monitor,
} from "lucide-react";

interface AggregatedDeviceData {
  mobileData: DevicePerformance;
  desktopData: DevicePerformance;
  campaignDeviceBreakdown: CampaignDeviceBreakdown[];
}

interface CampaignDeviceBreakdown {
  campaign: string;
  device: string;
  impressions: number;
  clicks: number;
  conversions: number;
  spend: number;
  revenue: number;
  ctr: number;
  conversion_rate: number;
  roas: number;
}

export default function DeviceView() {
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

  // Aggregate device data from all campaigns
  const deviceData = useMemo((): AggregatedDeviceData => {
    if (!marketingData?.campaigns) {
      return {
        mobileData: {
          device: "Mobile",
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
          revenue: 0,
          ctr: 0,
          conversion_rate: 0,
          percentage_of_traffic: 0,
        },
        desktopData: {
          device: "Desktop",
          impressions: 0,
          clicks: 0,
          conversions: 0,
          spend: 0,
          revenue: 0,
          ctr: 0,
          conversion_rate: 0,
          percentage_of_traffic: 0,
        },
        campaignDeviceBreakdown: [],
      };
    }

    const mobileAgg = {
      device: "Mobile",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0,
      ctr: 0,
      conversion_rate: 0,
      percentage_of_traffic: 0,
    };

    const desktopAgg = {
      device: "Desktop",
      impressions: 0,
      clicks: 0,
      conversions: 0,
      spend: 0,
      revenue: 0,
      ctr: 0,
      conversion_rate: 0,
      percentage_of_traffic: 0,
    };

    const campaignBreakdown: CampaignDeviceBreakdown[] = [];

    marketingData.campaigns.forEach((campaign) => {
      if (!campaign.device_performance) return;

      campaign.device_performance.forEach((device) => {
        if (device.device === "Mobile") {
          mobileAgg.impressions += device.impressions;
          mobileAgg.clicks += device.clicks;
          mobileAgg.conversions += device.conversions;
          mobileAgg.spend += device.spend;
          mobileAgg.revenue += device.revenue;
        } else if (device.device === "Desktop") {
          desktopAgg.impressions += device.impressions;
          desktopAgg.clicks += device.clicks;
          desktopAgg.conversions += device.conversions;
          desktopAgg.spend += device.spend;
          desktopAgg.revenue += device.revenue;
        }

        campaignBreakdown.push({
          campaign: campaign.name,
          device: device.device,
          impressions: device.impressions,
          clicks: device.clicks,
          conversions: device.conversions,
          spend: device.spend,
          revenue: device.revenue,
          ctr: device.ctr,
          conversion_rate: device.conversion_rate,
          roas: device.spend > 0 ? device.revenue / device.spend : 0,
        });
      });
    });

    // Calculate derived metrics
    mobileAgg.ctr =
      mobileAgg.impressions > 0
        ? (mobileAgg.clicks / mobileAgg.impressions) * 100
        : 0;
    mobileAgg.conversion_rate =
      mobileAgg.clicks > 0
        ? (mobileAgg.conversions / mobileAgg.clicks) * 100
        : 0;

    desktopAgg.ctr =
      desktopAgg.impressions > 0
        ? (desktopAgg.clicks / desktopAgg.impressions) * 100
        : 0;
    desktopAgg.conversion_rate =
      desktopAgg.clicks > 0
        ? (desktopAgg.conversions / desktopAgg.clicks) * 100
        : 0;

    // Calculate traffic percentage
    const totalImpressions = mobileAgg.impressions + desktopAgg.impressions;
    mobileAgg.percentage_of_traffic =
      totalImpressions > 0
        ? (mobileAgg.impressions / totalImpressions) * 100
        : 0;
    desktopAgg.percentage_of_traffic =
      totalImpressions > 0
        ? (desktopAgg.impressions / totalImpressions) * 100
        : 0;

    return {
      mobileData: mobileAgg,
      desktopData: desktopAgg,
      campaignDeviceBreakdown: campaignBreakdown,
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

  const { mobileData, desktopData, campaignDeviceBreakdown } = deviceData;
  const mobileROAS =
    mobileData.spend > 0 ? mobileData.revenue / mobileData.spend : 0;
  const desktopROAS =
    desktopData.spend > 0 ? desktopData.revenue / desktopData.spend : 0;

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
                <>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                    Device Performance
                  </h1>
                  <p className="text-base sm:text-lg text-gray-300">
                    Desktop vs Mobile Campaign Comparison
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="flex-1 p-3 sm:p-4 lg:p-6 overflow-y-auto w-full max-w-full">
          {marketingData && (
            <>
              {/* Device Overview Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
                {/* Mobile Performance */}
                <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-lg border border-blue-700/50 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <Smartphone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Mobile Performance
                      </h2>
                      <p className="text-sm text-blue-300">
                        {mobileData.percentage_of_traffic.toFixed(1)}% of
                        traffic
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">
                        Impressions
                      </div>
                      <div className="text-xl font-bold text-white">
                        {mobileData.impressions.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">Clicks</div>
                      <div className="text-xl font-bold text-white">
                        {mobileData.clicks.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">
                        Conversions
                      </div>
                      <div className="text-xl font-bold text-white">
                        {mobileData.conversions.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">CTR</div>
                      <div className="text-xl font-bold text-blue-400">
                        {mobileData.ctr.toFixed(2)}%
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">Spend</div>
                      <div className="text-xl font-bold text-orange-400">
                        ${Math.round(mobileData.spend).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">Revenue</div>
                      <div className="text-xl font-bold text-green-400">
                        ${Math.round(mobileData.revenue).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">
                        Conv. Rate
                      </div>
                      <div className="text-xl font-bold text-purple-400">
                        {mobileData.conversion_rate.toFixed(2)}%
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">ROAS</div>
                      <div className="text-xl font-bold text-yellow-400">
                        {mobileROAS.toFixed(2)}x
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop Performance */}
                <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 rounded-lg border border-purple-700/50 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <Monitor className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-white">
                        Desktop Performance
                      </h2>
                      <p className="text-sm text-purple-300">
                        {desktopData.percentage_of_traffic.toFixed(1)}% of
                        traffic
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">
                        Impressions
                      </div>
                      <div className="text-xl font-bold text-white">
                        {desktopData.impressions.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">Clicks</div>
                      <div className="text-xl font-bold text-white">
                        {desktopData.clicks.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">
                        Conversions
                      </div>
                      <div className="text-xl font-bold text-white">
                        {desktopData.conversions.toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">CTR</div>
                      <div className="text-xl font-bold text-purple-400">
                        {desktopData.ctr.toFixed(2)}%
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">Spend</div>
                      <div className="text-xl font-bold text-orange-400">
                        ${Math.round(desktopData.spend).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">Revenue</div>
                      <div className="text-xl font-bold text-green-400">
                        ${Math.round(desktopData.revenue).toLocaleString()}
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">
                        Conv. Rate
                      </div>
                      <div className="text-xl font-bold text-purple-400">
                        {desktopData.conversion_rate.toFixed(2)}%
                      </div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-4">
                      <div className="text-xs text-gray-400 mb-1">ROAS</div>
                      <div className="text-xl font-bold text-yellow-400">
                        {desktopROAS.toFixed(2)}x
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comparison Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <BarChart
                  title="Revenue Comparison"
                  data={[
                    {
                      label: "Mobile",
                      value: mobileData.revenue,
                      color: "#3B82F6",
                    },
                    {
                      label: "Desktop",
                      value: desktopData.revenue,
                      color: "#8B5CF6",
                    },
                  ]}
                  formatValue={(value) =>
                    `$${Math.round(value).toLocaleString()}`
                  }
                  height={280}
                />

                <BarChart
                  title="Spend Comparison"
                  data={[
                    {
                      label: "Mobile",
                      value: mobileData.spend,
                      color: "#3B82F6",
                    },
                    {
                      label: "Desktop",
                      value: desktopData.spend,
                      color: "#8B5CF6",
                    },
                  ]}
                  formatValue={(value) =>
                    `${Math.round(value).toLocaleString()}`
                  }
                  height={280}
                />

                <BarChart
                  title="Conversions Comparison"
                  data={[
                    {
                      label: "Mobile",
                      value: mobileData.conversions,
                      color: "#3B82F6",
                    },
                    {
                      label: "Desktop",
                      value: desktopData.conversions,
                      color: "#8B5CF6",
                    },
                  ]}
                  formatValue={(value) => value.toLocaleString()}
                  height={280}
                />

                <BarChart
                  title="ROAS Comparison"
                  data={[
                    { label: "Mobile", value: mobileROAS, color: "#3B82F6" },
                    { label: "Desktop", value: desktopROAS, color: "#8B5CF6" },
                  ]}
                  formatValue={(value) => `${value.toFixed(2)}x`}
                  height={280}
                />

                <BarChart
                  title="CTR Comparison"
                  data={[
                    {
                      label: "Mobile",
                      value: mobileData.ctr,
                      color: "#3B82F6",
                    },
                    {
                      label: "Desktop",
                      value: desktopData.ctr,
                      color: "#8B5CF6",
                    },
                  ]}
                  formatValue={(value) => `${value.toFixed(2)}%`}
                  height={280}
                />

                <BarChart
                  title="Conversion Rate Comparison"
                  data={[
                    {
                      label: "Mobile",
                      value: mobileData.conversion_rate,
                      color: "#3B82F6",
                    },
                    {
                      label: "Desktop",
                      value: desktopData.conversion_rate,
                      color: "#8B5CF6",
                    },
                  ]}
                  formatValue={(value) => `${value.toFixed(2)}%`}
                  height={280}
                />
              </div>

              {/* Campaign Device Performance Table */}
              <div className="overflow-x-auto w-full max-w-full">
                <Table
                  title={`Campaign Performance by Device (${campaignDeviceBreakdown.length} records)`}
                  showIndex={true}
                  maxHeight="600px"
                  columns={[
                    {
                      key: "campaign",
                      header: "Campaign",
                      width: "22%",
                      sortable: true,
                      sortType: "string",
                      render: (value) => (
                        <div className="font-medium text-white text-sm">
                          <span className="hidden sm:inline">
                            {value.length > 35
                              ? `${value.substring(0, 35)}...`
                              : value}
                          </span>
                          <span className="sm:hidden">
                            {value.length > 20
                              ? `${value.substring(0, 20)}...`
                              : value}
                          </span>
                        </div>
                      ),
                    },
                    {
                      key: "device",
                      header: "Device",
                      width: "10%",
                      align: "center",
                      sortable: true,
                      sortType: "string",
                      render: (value) => (
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            value === "Mobile"
                              ? "bg-blue-900 text-blue-300"
                              : "bg-purple-900 text-purple-300"
                          }`}
                        >
                          {value}
                        </span>
                      ),
                    },
                    {
                      key: "impressions",
                      header: "Impressions",
                      width: "10%",
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
                      width: "8%",
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
                      width: "10%",
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
                      width: "10%",
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
                      width: "10%",
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
                      width: "7%",
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
                  data={campaignDeviceBreakdown}
                  emptyMessage="No device performance data available"
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

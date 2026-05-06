import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import User from "../models/user.model.js";
import { HTTP_STATUS } from "../config/constants.js";

const clampNumber = (value, min, max, fallback) => {
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
};

const getDateRange = (startDate, endDate, defaultDays = 30) => {
  const now = new Date();
  const end = endDate ? new Date(endDate) : now;
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - defaultDays * 24 * 60 * 60 * 1000);

  const normalizedStart = new Date(start);
  normalizedStart.setHours(0, 0, 0, 0);

  const normalizedEnd = new Date(end);
  normalizedEnd.setHours(23, 59, 59, 999);

  return { start: normalizedStart, end: normalizedEnd };
};

const percentChange = (current, previous) => {
  if (!previous && !current) return 0;
  if (!previous) return 100;
  return Number((((current - previous) / previous) * 100).toFixed(2));
};

const STATE_CODE_MAP = {
  jammukashmir: "JK",
  jammuandkashmir: "JK",
  himachalpradesh: "HP",
  punjab: "PB",
  haryana: "HR",
  uttarpradesh: "UP",
  uttarakhand: "UT",
  delhi: "DL",
  bihar: "BR",
  jharkhand: "JH",
  westbengal: "WB",
  odisha: "OD",
  orissa: "OD",
  madhyapradesh: "MP",
  chhattisgarh: "CG",
  rajasthan: "RJ",
  gujarat: "GJ",
  maharashtra: "MH",
  goa: "GA",
  karnataka: "KA",
  telangana: "TG",
  andhrapradesh: "AP",
  tamilnadu: "TN",
  kerala: "KL",
  assam: "AS",
  meghalaya: "ML",
  manipur: "MN",
  mizoram: "MZ",
  nagaland: "NL",
  tripura: "TR",
  arunachalpradesh: "AR",
  sikkim: "SK",
};

const normalizeStateName = (value = "") => String(value).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]/g, "");

const prettifyStateName = (value = "") => {
  const compact = String(value).replace(/[^a-zA-Z\s]/g, " ").trim();
  if (!compact) return "Unknown";
  return compact
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const aggregateStateMetrics = (orders) => {
  const stateMap = new Map();

  for (const order of orders) {
    const rawState = order?.address?.state || "Unknown";
    const normalized = normalizeStateName(rawState);
    const stateKey = normalized || "unknown";
    const stateCode = STATE_CODE_MAP[stateKey] || "UN";
    const stateName = stateCode === "UN" ? prettifyStateName(rawState) : prettifyStateName(rawState);

    if (!stateMap.has(stateKey)) {
      stateMap.set(stateKey, {
        state: stateName,
        code: stateCode,
        purchases: 0,
        revenue: 0,
        customerSet: new Set(),
      });
    }

    const row = stateMap.get(stateKey);
    row.purchases += 1;
    row.revenue += order.total || 0;
    if (order.user) row.customerSet.add(String(order.user));
  }

  return stateMap;
};

const getKPIs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate, endDate, 30);
    const durationMs = end.getTime() - start.getTime();

    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - durationMs);

    const [
      currentOrders,
      previousOrders,
      totalUsers,
      previousUsers,
      currentUsers,
      todayOrders,
      monthOrders,
    ] = await Promise.all([
      Order.find({ createdAt: { $gte: start, $lte: end } }).select("total").lean(),
      Order.find({ createdAt: { $gte: previousStart, $lte: previousEnd } }).select("total").lean(),
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: previousStart, $lte: previousEnd } }),
      User.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Order.countDocuments({ createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } }),
      Order.countDocuments({ createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }),
    ]);

    const currentRevenue = currentOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.total || 0), 0);

    const totalOrders = currentOrders.length;
    const previousOrderCount = previousOrders.length;

    const avgOrderValue = totalOrders > 0 ? currentRevenue / totalOrders : 0;
    const previousAov = previousOrderCount > 0 ? previousRevenue / previousOrderCount : 0;

    const conversionRate = totalUsers > 0 ? (totalOrders / totalUsers) * 100 : 0;
    const previousConversion = previousUsers > 0 ? (previousOrderCount / previousUsers) * 100 : 0;

    res.json({
      totalRevenue: Math.round(currentRevenue),
      revenueChange: percentChange(currentRevenue, previousRevenue),
      totalOrders,
      ordersChange: percentChange(totalOrders, previousOrderCount),
      totalUsers,
      usersChange: percentChange(currentUsers, previousUsers),
      avgOrderValue: Math.round(avgOrderValue),
      aovChange: percentChange(avgOrderValue, previousAov),
      conversionRate: Number(conversionRate.toFixed(2)),
      conversionChange: percentChange(conversionRate, previousConversion),
      todayOrders,
      monthOrders,
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch KPI analytics",
      error: error.message,
    });
  }
};

const formatLabel = (date, period) => {
  if (period === "monthly") {
    return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
  }
  return date.toLocaleDateString("en-IN", { month: "short", day: "2-digit" });
};

const getRevenueTrend = async (req, res) => {
  try {
    const period = ["daily", "weekly", "monthly"].includes(req.query.period)
      ? req.query.period
      : "daily";
    const days = clampNumber(req.query.days, 7, 365, period === "monthly" ? 365 : 30);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date(end.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    start.setHours(0, 0, 0, 0);

    const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
      .select("total createdAt")
      .lean();

    const bucketMap = new Map();

    for (const order of orders) {
      const date = new Date(order.createdAt);
      let keyDate;

      if (period === "monthly") {
        keyDate = new Date(date.getFullYear(), date.getMonth(), 1);
      } else if (period === "weekly") {
        const day = date.getDay();
        const diff = date.getDate() - day;
        keyDate = new Date(date.getFullYear(), date.getMonth(), diff);
        keyDate.setHours(0, 0, 0, 0);
      } else {
        keyDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      }

      const key = keyDate.toISOString();
      if (!bucketMap.has(key)) {
        bucketMap.set(key, { date: keyDate, revenue: 0, orders: 0 });
      }

      const current = bucketMap.get(key);
      current.revenue += order.total || 0;
      current.orders += 1;
    }

    const data = Array.from(bucketMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((entry) => ({
        date: formatLabel(entry.date, period),
        revenue: Math.round(entry.revenue),
        orders: entry.orders,
      }));

    res.json({ period, days, data });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch revenue trend",
      error: error.message,
    });
  }
};

const getCategoryRevenue = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { start, end } = getDateRange(startDate, endDate, 30);

    const orders = await Order.find({ createdAt: { $gte: start, $lte: end } })
      .populate("items.product", "category")
      .select("items")
      .lean();

    const categoryMap = new Map();

    for (const order of orders) {
      for (const item of order.items || []) {
        const category = item.category || item.product?.category || "Others";
        const lineRevenue = (item.price || 0) * (item.quantity || 0);

        if (!categoryMap.has(category)) {
          categoryMap.set(category, { category, revenue: 0, orders: 0 });
        }

        const current = categoryMap.get(category);
        current.revenue += lineRevenue;
        current.orders += 1;
      }
    }

    if (categoryMap.size === 0) {
      const productCategories = await Product.aggregate([
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      const data = productCategories.map((entry) => ({
        category: entry._id || "Others",
        revenue: 0,
        orders: 0,
        percentage: 0,
      }));

      return res.json({ data });
    }

    const totalRevenue = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.revenue, 0);

    const data = Array.from(categoryMap.values())
      .map((entry) => ({
        ...entry,
        revenue: Math.round(entry.revenue),
        percentage: totalRevenue > 0 ? Number(((entry.revenue / totalRevenue) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    res.json({ data });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch category revenue analytics",
      error: error.message,
    });
  }
};

const getStateWiseSales = async (req, res) => {
  try {
    const days = clampNumber(req.query.days, 7, 365, 30);
    const { start, end } = getDateRange(req.query.startDate, req.query.endDate, days);

    const durationMs = end.getTime() - start.getTime();
    const previousEnd = new Date(start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - durationMs);

    const [currentOrders, previousOrders] = await Promise.all([
      Order.find({ createdAt: { $gte: start, $lte: end } })
        .select("total address.state user paymentMethod")
        .lean(),
      Order.find({ createdAt: { $gte: previousStart, $lte: previousEnd } })
        .select("total address.state user")
        .lean(),
    ]);

    const currentMap = aggregateStateMetrics(currentOrders);
    const previousMap = aggregateStateMetrics(previousOrders);

    const data = Array.from(currentMap.entries())
      .map(([stateKey, row]) => {
        const prev = previousMap.get(stateKey);
        const previousRevenue = prev ? prev.revenue : 0;
        const previousPurchases = prev ? prev.purchases : 0;

        return {
          state: row.state,
          code: row.code,
          purchases: row.purchases,
          revenue: Math.round(row.revenue),
          customers: row.customerSet.size,
          revenue_change: percentChange(row.revenue, previousRevenue),
          purchases_change: percentChange(row.purchases, previousPurchases),
        };
      })
      .sort((a, b) => b.purchases - a.purchases);

    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalPurchases = data.reduce((sum, item) => sum + item.purchases, 0);
    const globalCustomerSet = new Set();
    currentOrders.forEach((order) => {
      if (order.user) globalCustomerSet.add(String(order.user));
    });

    const prevRevenue = previousOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const prevPurchases = previousOrders.length;

    const paymentMap = new Map();
    currentOrders.forEach((order) => {
      const method = String(order.paymentMethod || "unknown").toLowerCase();
      if (!paymentMap.has(method)) {
        paymentMap.set(method, { method, orders: 0, revenue: 0 });
      }
      const item = paymentMap.get(method);
      item.orders += 1;
      item.revenue += order.total || 0;
    });

    const paymentMix = Array.from(paymentMap.values())
      .map((item) => ({
        method: item.method,
        orders: item.orders,
        revenue: Math.round(item.revenue),
        percentage: totalPurchases > 0 ? Number(((item.orders / totalPurchases) * 100).toFixed(2)) : 0,
      }))
      .sort((a, b) => b.orders - a.orders);

    res.json({
      data,
      summary: {
        periodDays: days,
        from: start.toISOString(),
        to: end.toISOString(),
        totalPurchases,
        totalRevenue,
        totalCustomers: globalCustomerSet.size,
        activeStates: data.length,
        revenueChange: percentChange(totalRevenue, prevRevenue),
        purchasesChange: percentChange(totalPurchases, prevPurchases),
        paymentMix,
        topState: data[0] || null,
      },
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: "Failed to fetch state-wise sales analytics",
      error: error.message,
    });
  }
};

export default {
  getKPIs,
  getRevenueTrend,
  getCategoryRevenue,
  getStateWiseSales,
};

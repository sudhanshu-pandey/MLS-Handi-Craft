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

export default {
  getKPIs,
  getRevenueTrend,
  getCategoryRevenue,
};
